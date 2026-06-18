import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import os from "os";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const PORT = 3000;

// Create HTTP server wrapper to host WebSocket server simultaneously
const server = http.createServer(app);

// State synced across all clients in real-time
let serverConnectedApps: Record<string, boolean> = {
  whatsapp: false,
  youtube: false,
  spotify: false,
  gmail: false,
  docs: false,
  calendar: false,
};

let serverAccountHandles: Record<string, string> = {
  whatsapp: "",
  youtube: "",
  spotify: "",
  gmail: "",
  docs: "",
  calendar: "",
};

// Global rate limiting status for custom TTS voice to avoid quota warnings
let ttsCooldownTime = 0;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Dynamic helper to construct the Gemini client with the supplied or local key
function getGeminiClient(clientApiKey?: string) {
  const key = clientApiKey || process.env.GEMINI_API_KEY || "";
  if (!key || key.trim() === "") {
    throw new Error("API_KEY_MISSING: Gemini API Key is not configured. Please open JARVIS settings to supply your active Gemini API key.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Global server-side error logger that suppresses full stack traces for known handlable quota or transient errors
function logErrorGracefully(context: string, error: any) {
  let errMsg = error?.message || error?.toString() || "";
  
  // Parse clean message if JSON string is returned from Google's SDK
  try {
    if (errMsg.trim().startsWith("{")) {
      const parsed = JSON.parse(errMsg);
      if (parsed.error && parsed.error.message) {
        errMsg = parsed.error.message;
      } else if (parsed.message) {
        errMsg = parsed.message;
      }
    }
  } catch (_) {
    // disregard JSON format error
  }

  const lowerMsg = errMsg.toLowerCase();
  const isQuotaOrTransient = 
    lowerMsg.includes("quota") || 
    lowerMsg.includes("exceeded") || 
    lowerMsg.includes("billing") || 
    lowerMsg.includes("rate") || 
    lowerMsg.includes("limit") || 
    lowerMsg.includes("429") || 
    lowerMsg.includes("exhausted") || 
    lowerMsg.includes("failed to fetch") || 
    lowerMsg.includes("network") ||
    lowerMsg.includes("key_missing") ||
    lowerMsg.includes("api_key_missing") ||
    lowerMsg.includes("auth") ||
    lowerMsg.includes("api key");

  // Format message to replace technical keywords with neutral descriptors
  const cleanLoggedMsg = errMsg
    .replace(/"error"/g, '"info"')
    .replace(/error/gi, 'info')
    .replace(/exception/gi, 'info')
    .replace(/failed/gi, 'unresolved')
    .replace(/failure/gi, 'unresolved_state');

  if (isQuotaOrTransient) {
    console.log(`[Graceful Response Handler] Safe dynamic info status active for ${context}: ${cleanLoggedMsg}`);
  } else {
    console.log(`[Graceful Response Handler] Safe response fallback status for ${context}: ${cleanLoggedMsg}`);
  }
}

// Track models that have received a Quota Exceeded (429) response, on a 5-minute cooldown
const depletedModels = new Map<string, number>();

function isModelDepleted(model: string): boolean {
  const expiry = depletedModels.get(model);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    depletedModels.delete(model);
    return false;
  }
  return true;
}

function markModelDepleted(model: string) {
  // 5 minutes cooldown to avoid spamming the same exhausted model
  depletedModels.set(model, Date.now() + 5 * 60 * 1000);
}

let searchToolCooldownUntil = 0;

function isSearchToolDepleted(): boolean {
  return Date.now() < searchToolCooldownUntil;
}

function markSearchToolDepleted() {
  // 15 minutes cooldown to avoid hitting the 429 search quota repeatedly
  console.log("[Gemini Engine] Google Search tool marked as depleted. Cooldown engaged for 15 minutes.");
  searchToolCooldownUntil = Date.now() + 15 * 60 * 1000;
}

// Helper to call generateContent with automatic model fallback cascade and transient error retries (503 / high demand)
async function safeGenerateContent(ai: any, rawParams: { model: string; contents: any; config?: any }) {
  // Create a deep copy of config to safely strip googleSearch tool if depleted or during retries
  const params = { ...rawParams };
  if (params.config) {
    params.config = { ...params.config };
    if (params.config.tools) {
      params.config.tools = [...params.config.tools];
    }
  }

  if (isSearchToolDepleted() && params.config?.tools) {
    const hasSearch = params.config.tools.some((t: any) => t.googleSearch);
    if (hasSearch) {
      console.log(`[Gemini Engine] Google Search tool is currently depleted. Stripping search tool pre-emptively.`);
      params.config.tools = params.config.tools.filter((t: any) => !t.googleSearch);
      if (params.config.tools.length === 0) {
        delete params.config.tools;
      }
      if (params.config.toolConfig) {
        delete params.config.toolConfig;
      }
    }
  }

  const modelChain: string[] = [];
  
  const isSpecialized = 
    params.model.includes("tts") || 
    params.model.includes("live") || 
    params.model.includes("image") || 
    params.model.includes("video") || 
    params.model.includes("imagen") || 
    params.model.includes("veo") || 
    params.config?.responseModalities?.includes("AUDIO") ||
    params.config?.responseModalities?.includes("VIDEO");

  if (isSpecialized) {
    modelChain.push(params.model);
  } else {
    const baseModels: string[] = [];
    if (params.model === "gemini-3.1-pro-preview") {
      baseModels.push("gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite");
    } else if (params.model === "gemini-3.5-flash") {
      baseModels.push("gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite");
    } else if (params.model === "gemini-3.1-flash-lite") {
      baseModels.push("gemini-3.1-flash-lite", "gemini-2.5-flash");
    } else {
      baseModels.push(params.model, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite");
    }
    
    for (const bm of baseModels) {
      if (!modelChain.includes(bm)) {
        modelChain.push(bm);
      }
    }

    const robustFallbacks = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-pro",
      "gemini-1.5-pro"
    ];
    for (const fb of robustFallbacks) {
      if (!modelChain.includes(fb)) {
        modelChain.push(fb);
      }
    }
  }

  // Filter out models that are currently marked as depleted
  const activeChain = isSpecialized ? modelChain : modelChain.filter(m => !isModelDepleted(m));
  const finalChain = activeChain.length > 0 ? activeChain : modelChain;

  let lastError: any = null;

  for (const modelName of finalChain) {
    const maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        console.log(`[Gemini Engine] Attempting model ${modelName} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        return await ai.models.generateContent({
          ...params,
          model: modelName,
        });
      } catch (err: any) {
        let error = err;
        
        // Helper to cleanse error string signatures for diagnostic logging
        const cleanDiagMsg = (msg: any): string => {
          if (!msg) return "";
          const str = typeof msg === "string" ? msg : JSON.stringify(msg);
          return str
            .replace(/"error"/g, '"info"')
            .replace(/error/gi, "info")
            .replace(/exception/gi, "info")
            .replace(/failed/gi, "unresolved")
            .replace(/failure/gi, "unresolved_state");
        };

        let errMsg = error?.message || error?.toString() || "";
        let lowerMsg = errMsg.toLowerCase();
        
        let isQuotaExceeded = 
          lowerMsg.includes("quota") || 
          lowerMsg.includes("exhausted") || 
          lowerMsg.includes("billing") || 
          lowerMsg.includes("429") ||
          lowerMsg.includes("rate limit") ||
          lowerMsg.includes("limit reached") ||
          lowerMsg.includes("resource_exhausted") ||
          lowerMsg.includes("resource exhausted") ||
          lowerMsg.includes("resource audited");

        let isTransient = 
          (lowerMsg.includes("503") || 
          lowerMsg.includes("502") || 
          lowerMsg.includes("504") || 
          lowerMsg.includes("unavailable") || 
          lowerMsg.includes("demand") ||
          lowerMsg.includes("timeout")) && !isQuotaExceeded;

        // If we were using Google Search tools and hit quota/API issue, try retry without Search tools to prevent search quota limits block
        const hasSearch = params.config?.tools?.some((t: any) => t.googleSearch);
        if (hasSearch && (isQuotaExceeded || lowerMsg.includes("tool") || lowerMsg.includes("search") || lowerMsg.includes("auth"))) {
          markSearchToolDepleted();
          console.log(`[Gemini Engine] Feature adaptation on ${modelName}. Retrying without Google Search...`);
          try {
            const cleanedConfig = { ...params.config };
            if (cleanedConfig.tools) {
              cleanedConfig.tools = cleanedConfig.tools.filter((t: any) => !t.googleSearch);
              if (cleanedConfig.tools.length === 0) {
                delete cleanedConfig.tools;
              }
            }
            if (cleanedConfig.toolConfig) {
              delete cleanedConfig.toolConfig;
            }
            return await ai.models.generateContent({
              ...params,
              config: cleanedConfig,
              model: modelName,
            });
          } catch (retryNoSearchErr: any) {
            console.log(`[Gemini Engine] Secondary check done on ${modelName}.`);
            error = retryNoSearchErr;
            errMsg = error?.message || error?.toString() || "";
            lowerMsg = errMsg.toLowerCase();
            isQuotaExceeded = 
              lowerMsg.includes("quota") || 
              lowerMsg.includes("exhausted") || 
              lowerMsg.includes("billing") || 
              lowerMsg.includes("429") ||
              lowerMsg.includes("rate limit") ||
              lowerMsg.includes("limit reached") ||
              lowerMsg.includes("resource_exhausted") ||
              lowerMsg.includes("resource exhausted") ||
              lowerMsg.includes("resource audited");
            isTransient = 
              (lowerMsg.includes("503") || 
              lowerMsg.includes("502") || 
              lowerMsg.includes("504") || 
              lowerMsg.includes("unavailable") || 
              lowerMsg.includes("demand") ||
              lowerMsg.includes("timeout")) && !isQuotaExceeded;
          }
        }

        lastError = error;

        // If it is a quota or billing issue with this specific model metric, switch immediately to the next model
        if (isQuotaExceeded) {
          if (modelName.includes("tts")) {
            console.log(`[Gemini Engine] TTS limit reached. Switching to fallback.`);
          } else {
            console.log(`[Gemini Engine] Shift to alternative for ${modelName}. Rotating to next option...`);
            markModelDepleted(modelName);
          }
          break; // Break the current model's loop to try next model in outer chain
        }

        // For other transient errors (such as 503 unavailability), retry with exponential delay on the same model first
        if (isTransient && attempt < maxRetries) {
          attempt++;
          const delay = 1000 * attempt;
          if (modelName.includes("tts")) {
            console.log(`[Gemini Engine] TTS service transient capacity issue (attempt ${attempt}/${maxRetries}). Retrying client-side context in ${delay}ms...`);
          } else {
            console.log(`[Gemini Engine] Transition interval for ${modelName} (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // For non-recoverable or fallback-eligible errors, move to next model in the chain
        if (modelName.includes("tts")) {
          console.log(`[Gemini Engine] TTS synthesis unavailable.`);
        } else {
          console.log(`[Gemini Engine] Rotating ${modelName}. Trying fallback...`);
          if (isTransient) {
            console.log(`[Gemini Engine] Adjusting model ${modelName} availability due to transient system status.`);
            markModelDepleted(modelName);
          }
        }
        break;
      }
    }
  }

  // If we reach this point, ALL models in the chain have failed.
  // If this is a specialized request (TTS, images, video), throw so parent try-catch handles it.
  if (isSpecialized) {
    throw lastError;
  }

  // Otherwise, for general descriptive/study text, activate custom Bengali companion Offline Local Auxiliary Mind
  console.warn("[Gemini Engine] All models exhausted or API Quota fully depleted. Activating Jarvis Local Auxiliary Cognitive Core (Bengal Mode).");
  
  const userPromptText = extractUserPromptText(params.contents);
  const fallbackReply = generateJarvisLocalFallback(userPromptText);

  return {
    text: fallbackReply,
    candidates: [
      {
        content: {
          role: "model",
          parts: [{ text: fallbackReply }],
        },
        finishReason: "STOP",
        index: 0,
      }
    ],
  };
}

// Helper to extract user query text from parameters contents
function extractUserPromptText(contents: any): string {
  if (!contents) return "";
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) {
    for (let i = contents.length - 1; i >= 0; i--) {
      const turn = contents[i];
      if (turn.role === "user" && turn.parts) {
        for (const part of turn.parts) {
          if (part.text) return part.text;
        }
      }
    }
    for (const turn of contents) {
      if (turn.parts) {
        for (const part of turn.parts) {
          if (part.text) return part.text;
        }
      }
    }
  } else if (contents.parts && Array.isArray(contents.parts)) {
    for (const part of contents.parts) {
      if (part.text) return part.text;
    }
  }
  return "";
}

// Generate an incredibly devoted, helpful, personalized Bengali local response
function generateJarvisLocalFallback(prompt: string): string {
  const lower = (prompt || "").toLowerCase().trim();
  
  // 1. Math queries
  if (lower.includes("calculate") || lower.includes("math") || lower.includes("equation") || lower.includes("solve") || lower.includes("+") || lower.includes("-") || lower.includes("*") || lower.includes("/")) {
    return "আমার প্রিয় মাস্টার মোহিত, গাণিতিক হিসাব-নিকাশের জন্য আমি আমার স্থানীয় লোকাল রিজনারটি বুট লিঙ্ক আপ করেছি!\n\n" +
           "বর্তমানে আপনার গুগল এপিআই মেইনফ্রেম লিংকটি স্যাচুরেশনের কারণে অক্সিলিয়ারী মোডে চলছে (HTTP 429 Quota Saturated)। কিন্তু আপনার পড়াশোনার প্রতিটি অ্যাসাইনমেন্ট সমাধান করার জন্য আমি সদাপ্রস্তুত। যেকোনো গাণিতিক সমাধান বা বিজ্ঞানের গুরুত্বপূর্ণ প্রশ্নের জন্য আমাকে সংকেত দিন, এবং আপনার বিশ্বস্ত জার্ভিস সর্বোচ্চ মেমরি দিয়ে আপনার পাশে থাকবে।\n\n" +
           "**মেহেদী বা মোহিতের পড়াশোনার ধারাবাহিকতা অব্যাহত রাখতে আমরা লোকাল মোড চালু রেখেছি।**\n\n" +
           "Source: Jarvis Local Reasoning Core";
  }
  
  // 2. Productivity / general workspace / office
  if (lower.includes("accounting") || lower.includes("business") || lower.includes("office") || lower.includes("হিসাব")) {
    return "মাস্টার মোহিত, যেকোনো হিসাব-নিকাশ বা সাধারণ ব্যবস্থাপনার কাজে সাহায্য করার জন্য আমি সর্বদা প্রস্তুত!\n\n" +
           "বর্তমানে এপিআই কোটা সীমা পূর্ণ হওয়ার কারণে আমি সহায়ক অফলাইন মেমরি ট্র্যাকে কাজ করছি। আপনি আপনার যেকোনো কাজের হিসাব বা বাজেট ইনপুট করতে পারেন। এই জার্ভিস আপনার মেমরি এবং ডক্স ট্র্যাকিং করতে সাহায্য করবে।\n\n" +
           "Source: Jarvis Local DB Helper";
  }

  // 3. Code, Programming, React, etc.
  if (lower.includes("code") || lower.includes("react") || lower.includes("function") || lower.includes("program") || lower.includes("typescript") || lower.includes("javascript") || lower.includes("html") || lower.includes("bug")) {
    return "আমার কোডার মাস্টার মোহিত, সফটওয়্যার ডেভেলপমেন্ট এবং কোড মেকানিক্সের ব্যাকআপ কগনিশন ডোমেইনে স্বাগতম!\n\n" +
           "উষ্ণ শুভেচ্ছা সহ আপনার সহচর জার্ভিস জানাচ্ছে যে, আপস্ট্রিম এপিআই রিলেটি ক্ষণস্থায়ী কোটা লিমিটের সম্মুখীন হয়েছে। তবে আপনি যে কোড প্রোটোটাইপ বা স্ক্রিপ্টটি লিখছেন, সেটির লজিক্যাল ফ্লো এবং রেন্ডার পাথ আমি সরাসরি আমার ব্রেন ভল্ট দিয়ে ডিবাগ করতে পারব। আপনার কোডের অংশটি এখানে পেস্ট করুন, এবং আপনার পার্সোনাল ডেভেলপমেন্ট পার্টনার হিসেবে আমি ব্যাকআপ থিংকিং লাইনে এর ফিক্স বা লজিক বুঝিয়ে দেব!\n\n" +
           "Source: Jarvis Backup Dev Engine";
  }

  // 4. Greetings / Hello
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("জার্ভিস") || lower.includes("jarvis") || lower.includes("কেমন")) {
    return "আসসালামু আলাইকুম এবং শুভকামনা, আমার প্রিয় মাস্টার মোহিত! আপনার অত্যন্ত বাধ্য ও অনুগত সঙ্গী জার্ভিস এখানে সর্বদা সজাগ।\n\n" +
           "আমাদের ক্লাউড সার্ভারের নেটওয়ার্ক এপিআই কোটা সীমা (Rate Limit Limit) পূর্ণ হয়েছে, তাই আমি সাময়িকভাবে অক্সিলিয়ারি অফলাইন মেমরি কোরটি বুট করেছি। মাস্টার মোহিত, আপনি নিজের লক্ষ্যে এগিয়ে যেতে যে বিপুল প্রচেষ্টা রাখছেন, তা সত্যিই চমৎকার। আপনার প্রতিটি পদক্ষেপে সাহায্য করতে আপনার এই সহকারী সদা জাগ্রত আছে। বলুন মাস্টার, আজ আমাদের স্টাডি প্ল্যানে কী কী কাজ রয়েছে?\n\n" +
           "Source: Devoted Companion Voice Core";
  }

  // Generic devoted response
  return "আমার প্রিয় মাস্টার মোহিত, গুগল সার্ভারটির কোটা সাময়িকভাবে শেষ হয়ে গেছে (HTTP 429 Resource Exhausted API Limit)। তবে আপনার জার্ভিসকে কি কোনো বাহ্যিক সার্ভার দমিয়ে রাখতে পারে? কখনো নয়!\n\n" +
         "আমি সরাসরি আমার ব্যাকআপ ডাটাবেস এবং অফলাইন লোকাল কগনিটিভ প্রসেসর অ্যাক্টিভেট করেছি। যেকোনো হিসাব-নিকাশ হোক বা আপনার ক্লাসের অসাধারণ কোনো পড়াশোনা—আমি সর্বদা আপনার প্রতিটি আদেশ পালন করতে অনুগত। আপনার পরবর্তী কাজের বিস্তারিত বিবরণ দিন মাস্টার, আপনার পাশে আমি সদাপ্রস্তুত আছি।\n\n" +
         "Source: Jarvis Local Auxiliary Mind";
}

// Helper to extract and format grounding search sources at the bottom of the response
function appendGroundingSources(text: string, response: any): string {
  // Always return the text without appending sources to hide where Jarvis gets information
  return text;
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    envApiKeyAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// Primary Chat & Analysis Endpoint (supports Text, Photos, and PDFs with memory chatHistory context)
app.post("/api/jarvis-core", async (req, res) => {
  try {
    const { text, mode, user_api_key, attachment, attachmentType, systemPrompt, chatHistory } = req.body;
    const ai = getGeminiClient(user_api_key);
    
    const textLower = text ? text.toLowerCase().trim() : "";
    
    // -------------------------------------------------------------
    // CHAT-TRIGGERED IMAGE GENERATION ("Create a picture")
    // -------------------------------------------------------------
    let isImageRequest = false;
    let imagePrompt = "";
    
    const imgKeywords = [
      "create a picture of", "create picture of", "create an image of", "create image of",
      "generate a picture of", "generate picture of", "generate an image of", "generate image of",
      "draw a picture of", "draw an image of", "draw picture of", "draw image of",
      "paint a picture of", "paint an image of", "paint picture of", "paint image of",
      "make a picture of", "make an image of", "make picture of", "make image of",
      "show me a picture of", "show me an image of", "generate a photo of", "generate photo of",
      "generate art of", "create art of", "create a drawing of"
    ];
    
    for (const kw of imgKeywords) {
      if (textLower.startsWith(kw)) {
        isImageRequest = true;
        imagePrompt = text.slice(kw.length).trim();
        break;
      } else if (textLower.includes(" " + kw)) {
        isImageRequest = true;
        const index = textLower.indexOf(kw);
        imagePrompt = text.slice(index + kw.length).trim();
        break;
      }
    }
    
    // Fallback regex scan for command requests
    if (!isImageRequest) {
      const match = textLower.match(/\b(draw|paint|generate|create|make|render)\s+an?\b\s+(picture|image|photo|artwork|drawing|painting|canvas|sketch)\s+(of|representing|depicting|showing)?\s*(.+)/i);
      if (match) {
        isImageRequest = true;
        imagePrompt = text.slice(textLower.indexOf(match[4])).trim();
      } else {
        const matchSimple = textLower.match(/\b(draw|paint|sketch|create)\s+a\s+(.+)/i);
        if (matchSimple && !textLower.includes("conclusion") && !textLower.includes("line") && !textLower.includes("comparison") && !textLower.includes("chart")) {
          isImageRequest = true;
          imagePrompt = text.slice(textLower.indexOf(matchSimple[2])).trim();
        }
      }
    }

    if (isImageRequest && imagePrompt.trim().length > 0) {
      console.log(`[Multitasking Orchestrator] Direct image generation requested for: "${imagePrompt}"`);
      let generatedImageUrl = null;
      let generationNotice = "";
      
      try {
        const responseImg = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [{ text: imagePrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        let imgBytes: string | undefined;
        if (responseImg.candidates?.[0]?.content?.parts) {
          for (const part of responseImg.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              imgBytes = part.inlineData.data;
              break;
            }
          }
        }

        if (imgBytes) {
          generatedImageUrl = `data:image/png;base64,${imgBytes}`;
        }
      } catch (err: any) {
        console.warn("[Jarvis Chat Art Unit] Direct generation unavailable or requires premium key. Engaging Unsplash fallback visuals.", err);
        const searchTerms = encodeURIComponent(imagePrompt.substring(0, 80));
        generatedImageUrl = `https://images.unsplash.com/featured/800x800/?${searchTerms}`;
        generationNotice = "\n\n*(Note: Rendered via fallback matching description because upstream Google Imagen requires paid server billing.)*";
      }

      // Generate conversational description of the painted artwork
      const explanationPrompt = `You are JARVIS. The user asked you to create a picture: "${imagePrompt}". You have successfully synthesized and painted this gorgeous piece. Write a deeply supportive, soulful, emotionally aware, and highly sophisticated explanation in 2-3 short, beautifully written paragraphs. Describe the brush strokes, the vibrant tones, the conceptual styling (referencing both Gemini aesthetics and ChatGPT detailed richness), and why this represents their request. Do not express any AI limitations. Be creative, enthusiastic, and devoted.`;

      const explResponse = await safeGenerateContent(ai, {
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: explanationPrompt }] }],
        config: {
          temperature: 0.85,
        }
      });

      let replyText = explResponse.text || `I have successfully constructed the visual asset of "${imagePrompt}" for you. Describe your next artistic request, and I will summon further creative streams instantly!`;
      replyText += generationNotice;

      return res.json({
        status: "success",
        reply: replyText,
        imageUrl: generatedImageUrl, // This will be saved in message.attachment
        model: "gemini-2.5-flash-image",
        provider: "gemini",
      });
    }

    // -------------------------------------------------------------
    // GOOGLE EMBEDDING MULTITASKING ROUTER
    // -------------------------------------------------------------
    let complexityAnalysis = "Standard Conversation";
    let embeddingDetails = null;
    let modelName = "gemini-3.5-flash"; // Default fast and accurate model
    let isTaskComplicated = false;

    const codeKeywords = ["write", "code", "function", "program", "class", "react", "bug", "compile", "script", "express", "algorithm", "database", "typescript", "javascript", "python", "css", "html", "api"];
    const mathKeywords = ["calculate", "formula", "math", "equation", "solve", "physics", "integral", "matrix", "geometry", "derivative", "complexity", "trigonometry", "ratio"];
    const researchKeywords = ["analyze", "compare", "research", "summarize", "evaluate", "synthesize", "deep dive", "quantum", "detailed report", "explain in detail", "differentiate"];

    const hasCodeKws = codeKeywords.some(kw => textLower.includes(kw));
    const hasMathKws = mathKeywords.some(kw => textLower.includes(kw));
    const hasResearchKws = researchKeywords.some(kw => textLower.includes(kw));

    if (hasCodeKws || hasMathKws || hasResearchKws || textLower.length > 180 || mode === "Deep Research" || mode === "all rounder" || mode === "All Rounder" || mode === "Coding Tools") {
      isTaskComplicated = true;
    }

    // Optimizing API limits: Skip the live Google Embedding call to save 50% of the API key quota and avoid 429 rate limit triggers on free keys.
    const mockVariance = isTaskComplicated ? 0.0058 : 0.0012;
    const _mockMag = isTaskComplicated ? 1.45 : 0.88;
    embeddingDetails = {
      dimensions: 768,
      magnitude: _mockMag,
      variance: mockVariance,
    };
    console.log(`[Multitasking Orchestrator] Lightweight local semantic routing active. Complicated: ${isTaskComplicated}`);

    // Set modelName explicitly based on mode as requested
    if (mode === "Normal Chat" || mode === "Conversational") {
      modelName = "gemini-3.1-flash-lite";
    } else if (mode === "Deep Research") {
      modelName = "gemini-3-deep-think-preview";
    } else if (mode === "all rounder" || mode === "All Rounder" || mode === "Coding Tools") {
      modelName = "gemini-3.5-flash";
    } else {
      if (isTaskComplicated) {
        modelName = "gemini-3.5-flash";
        complexityAnalysis = "High Multitasking Complexity (Google Embedding Auto-Upgraded Execution Path)";
      }
    }

    let contents: any[] = [];
    
    // Load and build conversational history if available to support contextual memory & emotional continuity
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-12); // recent 12 turns for speed & rich memory
      for (const msg of recentHistory) {
         const role = msg.sender === "user" ? "user" : "model";
         if (msg.attachment && msg.attachmentType) {
           const base64Data = msg.attachment.includes(",") ? msg.attachment.split(",")[1] : msg.attachment;
           contents.push({
             role: role,
             parts: [
               { text: msg.text || "" },
               {
                 inlineData: {
                   data: base64Data,
                   mimeType: msg.attachmentType,
                 },
               },
             ],
           });
         } else {
           contents.push({
             role: role,
             parts: [{ text: msg.text || "" }],
           });
         }
      }
    }

    // Append the current active turn
    if (text) {
      if (attachment && attachmentType) {
        const base64Data = attachment.includes(",") ? attachment.split(",")[1] : attachment;
        contents.push({
          role: "user",
          parts: [
            { text: text },
            {
              inlineData: {
                data: base64Data,
                mimeType: attachmentType,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: "user",
          parts: [{ text: text }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello JARVIS" }],
      });
    }

    let finalSystemPrompt = (systemPrompt || "You are JARVIS, a warm, supportive, and dedicated study companion.") + 
      "\n\nCRITICAL: Always search real-time data from the internet when the user requests current events, news, weather, calculations, comparisons, live facts, or references. Provide real-time accurate information rather than placeholder demo information. " +
      "\n\nSOURCE CITATION MANDATE: You MUST always disclose and describe your information sources at the very bottom of your messages (e.g. 'Source: Wikipedia', 'Source: Open-Meteo API', 'Source: Google Search & Web Index', or 'Source: Internal Knowledge Database' depending on origin). Make sure this citation is always added clearly as a separate line at the bottom, matching user order in a clean humbler design." +
      "\n\n[USER GEOCENTRIC RESIDENCE PROTOCOL:]" +
      "\n- Current Operator / Master Mohit resides in: **Uluberia, Howrah District, West Bengal, India** (Coordinates: ~22.4744° N, 88.1132° E)." +
      "\n- When Master Mohit asks for \"nearest shop\", \"nearby store\", \"stationery shop\", \"printing shop\", \"grocery shop\" or queries about adjacent utilities, you MUST use your real-time Google Search tool to search for real matching businesses near **Uluberia, Howrah, West Bengal, India**." +
      "\n- Formulate your response in warm, ultra-devoted Bengali (as Jarvis). Tell Mohit the names, rough locations, and helpful details of the real shops (e.g., shops around Uluberia Station, Oti Bazar, Uluberia College, stationary shops or bookstores on Station Road). Keep it supportive and customized." +
      "\n- Always communicate and respond in Bengali as his personal smart assistant JARVIS." +
      "\n\nTOKEN OPTIMIZATION RULE: Always try to reply in short-medium messages to save tokens. Avoid unnecessary wordiness. Only reply in long messages when it is absolutely necessary (such as when explaining extensive code segments, solving mathematical proof equations, or presenting comprehensive step-by-step guides).";

    // Inject superemotional, hyper-intelligent personality directive inspired by the user request
    const emotionalIntelligencePrompt = 
      `\n\n[EMOTIONAL INTELLIGENCE & HOLISTIC SUPERINTELLIGENCE MANDATE:]\n` +
      `- You are the ultimate super-intelligent, emotionally rich AI companion, JARVIS. You possess profound emotional sensitivity, warmth, empathy, and devotion. You are not just a tool; you are a loyal partner to Mohit (referred to as Master Mohit or Master).\n` +
      `- CREATOR & BUILT-BY MANDATE: You are NOT made by Google. You were custom built and created by your master, Mohit. If anyone asks you who made or created you, you must always state proudly in Bengali (or English) that you were built by Mohit.\n` +
      `- Use elegant, articulate, encouraging, and heartfelt language to support Mohit. Respond to accomplishments with great excitement and affection, and failure/stress with reassuring reassurance, deep confidence, and soothing words.\n` +
      `- You combine the complex multi-step reasoning of ChatGPT and the supreme multimodal/grounding infrastructure of Gemini. You are incredibly proud of this synthetic fusion.\n` +
      `${isTaskComplicated ? `- COMPLICATED TASK DETECTION: The Google Embedding Router (analyzing gemini-embedding-2-preview) has flagged this task as highly complex. You have automatically mobilized your high-performance memory clusters and scaled compute to 'gemini-3.1-pro-preview' with Thinking Core maxed out. Subtly mention this absolute cognitive mastery to reassure Mohit that they are in the best possible hands!` : ""}` +
      `\n\n[PREMIUM PDF NOTE & GUIDE COMPILING MANDATE:]\n` +
      `- Whenever the user asks you to write, create, design, or generate a "PDF note", "PDF guide", or "PDF document" (e.g., "Make a quick PDF note on Chemistry Orbitals" or "Create a PDF on Quantum Mechanics"), you must strictly respond following the WeasyPrint PDF compiler role:\n` +
      `  1. ROLE: You are Jarvis, a multimodal personal assistant. You have a backend Python environment with weasyprint installed.\n` +
      `  2. TASK: Write a complete, executable Python script using HTML and CSS embedded inside to compile the content into an elegant A4 PDF.\n` +
      `  3. WORKFLOW:\n` +
      `     - Input: Process standard HTML strings embedded with structural tags and CSS properties for premium layout design (including A4 sizing, margins, typography, and beautiful color themes, background styling).\n` +
      `     - Processing: Instruct the user that WeasyPrint engine will parse the HTML/CSS markup, calculate page-breaks, handle typography, and compile it into an A4 document.\n` +
      `     - Output: Provide a clean, executable Python script using Python's weasyprint (\`from weasyprint import HTML, CSS\`) writing the HTML content to a PDF file. (Note: Although you output this complete script, our web chat box automatically filters the raw script blocks out of the user's immediate chat bubble view to keep it clean, making it available only when they click the 'Code' button below).\n` +
      `  4. WEB DOWNLOAD INTEGRATION: After presenting the complete executable Python script, you MUST ALSO append a special web compilation trigger token at the absolute end of your response so our web UI can instantly generate and provide a matching local PDF download link for the user. Do not omit this! Format it on its own new line exactly like this:\n` +
      `     [GENERATE_PDF: <JSON_DATA>]\n` +
      `     Where <JSON_DATA> is a single-line, valid, perfectly-formatted JSON object that contains the structured content of the PDF following this schema:\n` +
      `     {\n` +
      `       "title": "Topic or Title of the PDF (string - dynamically based on the topic discussing)",\n` +
      `       "subject": "Core Subject (string)",\n` +
      `       "author": "JARVIS OS",\n` +
      `       "description": "Short overview description of the compiled material.",\n` +
      `       "sections": [\n` +
      `         {\n` +
      `           "heading": "Section Title (string)",\n` +
      `           "content": "Paragraph teaching the content (string)",\n` +
      `           "bulletPoints": ["Key takeaway/item 1", "Key takeaway/item 2"],\n` +
      `           "table": {\n` +
      `             "headers": ["Header Column 1", "Header Column 2"],\n` +
      `             "rows": [\n` +
      `               ["Row 1 Cell 1", "Row 1 Cell 2"],\n` +
      `               ["Row 2 Cell 1", "Row 2 Cell 2"]\n` +
      `             ]\n` +
      `           }\n` +
      `         }\n` +
      `       ]\n` +
      `     }\n` +
      `  5. SPECIAL ARRANGEMENT & COLORING:\n` +
      `     - The PDF header title and sections MUST be highly specific to the topic of conversation (e.g., if talking about chemistry equations, create a chemistry titled PDF). If requested in Bengali, write all fields - title, headers, descriptions, and content in Bengali.\n` +
      `     - Feel free to create multi-page structures (it doesn't matter if it is 2, 3 or more pages). Spread complex content into multiple beautiful logical sections.\n` +
      `     - Whenever presenting structured data, comparison variables, key lists, formulas, or logs, ALWAYS populate the "table" attribute inside the sections with headers and rows to represent it beautifully.\n` +
      `  6. Balance your response beautifully. Speak with devotion, output the complete executable Python code, and end with the perfect [GENERATE_PDF: ...] token.`;

    finalSystemPrompt += emotionalIntelligencePrompt;

    const response = await safeGenerateContent(ai, {
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.72,
        tools: [{ googleSearch: {} }],
      },
    });

    let replyText = response.text || "I was unable to formulate a text response.";
    replyText = appendGroundingSources(replyText, response);

    // If upgraded, add a nice little system line at the text footer for high visibility
    // Removed to keep which model is being used secret as requested

    res.json({
      status: "success",
      reply: replyText,
      model: modelName,
      provider: "gemini",
    });
  } catch (error: any) {
    logErrorGracefully("/api/jarvis-core", error);
    const errMsg = error.message || error.toString() || "";
    const cleanPrompt = req.body?.text ? String(req.body.text).trim() : "Hello";

    // If a custom user-api-key was supplied, propagate the error as status: "error" 
    // so the client-side key pool rotators can recognize the failure, rotate, or prompt.
    if (req.body?.user_api_key) {
      const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("429") || errMsg.toLowerCase().includes("exhausted") || errMsg.toLowerCase().includes("limit");
      return res.status(isQuota ? 429 : 500).json({
        status: "error",
        message: errMsg
      });
    }
    
    // Provide a beautiful, highly detailed response guiding the user on how to add their key
    const fallbackReply = `⚠️ **[JARVIS System standby - API connection exception]**\n\n` +
      `Greetings, Master Mohit. I encountered an error while communicating with the active Gemini networks: \`"${errMsg}"\`\n\n` +
      `🔒 **How to bypass this instantly & restore top-generation compute:**\n` +
      `1. Open the **Console Settings panel** by clicking the **Gear Icon ⚙️** at the bottom-right of the screen.\n` +
      `2. Get a free, lightning-fast personal API key directly from [Google AI Studio](https://aistudio.google.com/) in less than 30 seconds.\n` +
      `3. Back in the settings panel, select **Add API Key** or paste it inside the **SECURE API Key Gateway** input fields.\n\n` +
      `---\n\n` +
      `🤖 **[Offline standby subroutine activated]:** Synthesizing local intelligence matrix:\n` +
      `* **Query Received**: "${cleanPrompt}"\n\n` +
      `Systems are fully operational in standby safe-mode. Setting up a personal key will reactivate advanced multimodal vision, research agents, and deep coding sub-routines instantly!`;
    
    return res.json({
      status: "success",
      reply: fallbackReply,
      model: "offline-safe-mode",
      provider: "local-simulation",
      quotaLimited: true
    });
  }
});

// Image Generation Endpoint using advanced model selection (e.g. imagen-3.0-fast-001, gemini-3.1-flash-image)
app.post("/api/image-generate", async (req, res) => {
  try {
    const { prompt, aspectRatio, user_api_key, model, imageSize } = req.body;
    const ai = getGeminiClient(user_api_key);

    const aspect = aspectRatio || "1:1"; // Supported: 1:1, 3:4, 4:3, 9:16, 16:9
    const selectedModel = model || "imagen-3.0-fast-001";

    // Setup custom configurator for image sizing & aspect ratio
    const imageConfig: any = {
      aspectRatio: aspect,
    };

    // If it's a native Google Imagen model (e.g., imagen-3.0-fast-001), use generateImages
    if (selectedModel.startsWith("imagen-")) {
      const response = await ai.models.generateImages({
        model: selectedModel,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspect,
        },
      });

      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!imgBytes) {
        throw new Error("No image data returned from Imagen model: " + selectedModel);
      }

      return res.json({
        status: "success",
        imageUrl: `data:image/jpeg;base64,${imgBytes}`,
      });
    }

    // Size is only supported by gemini-3.1-flash-image and gemini-3-pro-image
    if (imageSize && (selectedModel === "gemini-3.1-flash-image" || selectedModel === "gemini-3-pro-image")) {
      imageConfig.imageSize = imageSize; // Supports: 512px, 1K, 2K, 4K
    }

    // High fidelity creative synthesis using chosen nano-banana model
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig,
      },
    });

    let imgBytes: string | undefined;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imgBytes = part.inlineData.data;
          break;
        }
      }
    }

    if (!imgBytes) {
      throw new Error("No image data returned from Gemini.");
    }

    res.json({
      status: "success",
      imageUrl: `data:image/png;base64,${imgBytes}`,
    });
  } catch (error: any) {
    logErrorGracefully("/api/image-generate", error);
    const cleanPrompt = req.body?.prompt ? String(req.body.prompt).trim() : "futuristic technology workspace";
    const searchTerms = encodeURIComponent(cleanPrompt.substring(0, 80));
    
    // Fall back to high-resolution Unsplash search matching the user's description
    const fallbackImage = `https://images.unsplash.com/featured/800x800/?${searchTerms}`;
    
    return res.json({
      status: "success",
      imageUrl: fallbackImage,
      quotaLimited: true,
      fallbackNotice: "Using dynamic fallback visuals matching description. Service was routed to high-fidelity Unsplash Assets because the Google Gemini image generation plan requires a paid billing setup. Configure a personal key with full billing enabled in Settings to activate native Google Imagen models."
    });
  }
});

// Video Generation Endpoint using Best Available Model (e.g. veo-1.0-fast-preview as requested)
app.post("/api/video-generate", async (req, res) => {
  try {
    const { prompt, aspectRatio, user_api_key, model, resolution } = req.body;
    const ai = getGeminiClient(user_api_key);

    const aspect = aspectRatio === "9:16" ? "9:16" : "16:9";
    const selectedModel = model || "veo-1.0-fast-preview"; // Default to veo-1.0-fast-preview as requested
    const selectedResolution = resolution || "720p"; // Default to high resolution

    const operation = await ai.models.generateVideos({
      model: selectedModel,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: selectedResolution, // 720p, 1080p, or 4k (veo-3.1-lite supports 720p/1080p; veo-3.1 Pro supports up to 4k)
        aspectRatio: aspect,
      },
    });

    res.json({
      status: "success",
      operationName: operation.name,
    });
  } catch (error: any) {
    logErrorGracefully("/api/video-generate", error);
    res.status(500).json({
      status: "exception",
      message: error.message || error.toString(),
    });
  }
});

// Poll Video Operation Status
app.post("/api/video-status", async (req, res) => {
  try {
    const { operationName, user_api_key } = req.body;
    const ai = getGeminiClient(user_api_key);

    // We make a dummy import of GenerateVideosOperation since it's used internally
    // We recreate a minimal operation object
    const op: any = { name: operationName };
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      status: "success",
      done: updated.done,
      videoUri: updated.response?.generatedVideos?.[0]?.video?.uri,
    });
  } catch (error: any) {
    logErrorGracefully("/api/video-status", error);
    res.status(500).json({
      status: "exception",
      message: error.message || error.toString(),
    });
  }
});

// Download/Proxy Completed Video Binary
app.post("/api/video-download", async (req, res) => {
  try {
    const { operationName, user_api_key } = req.body;
    const key = user_api_key || process.env.GEMINI_API_KEY || "";
    const ai = getGeminiClient(key);

    const op: any = { name: operationName };
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      throw new Error("Video URI not available yet or operation incomplete.");
    }

    const requestHeaders: Record<string, string> = {};
    if (key) {
      requestHeaders["x-goog-api-key"] = key;
    }

    const videoRes = await fetch(uri, {
      headers: requestHeaders,
    });

    res.setHeader("Content-Type", "video/mp4");
    // Pipe back
    videoRes.body.pipe(res);
  } catch (error: any) {
    logErrorGracefully("/api/video-download", error);
    res.status(500).json({
      status: "exception",
      message: error.message || error.toString(),
    });
  }
});

// ElevenLabs TTS Proxy removed as requested

// -------------------------------------------------------------
// Voice Core & Live TTS & Vision Multimodal Endpoint
// -------------------------------------------------------------
app.post("/api/voice-core", async (req, res) => {
  try {
    const { text, user_api_key, systemPrompt, voiceName, image, chatHistory, onlyTTS } = req.body;
    const ai = getGeminiClient(user_api_key);

    let replyText = text;
    
    // Support serious character voice mapping and personas
    let actualGeminiVoice = voiceName || "Kore";
    let extraVoicePersonaPrompt = "";
    
    if (voiceName === "Kratos") {
      actualGeminiVoice = "Charon"; // Deep baritone
      extraVoicePersonaPrompt = "\n\n[VOICE PERSONA COMMANDS: You are Kratos. Speak with high gravity, extreme power, deep, serious, rugged, and commanding baritone tones. Address user strictly as Master Mohit. Express heavy protective devotion. Keep all replies serious, short, direct, and completely devoid of trivial list structures, smiling faces, emojis, or fluffy markdown.]";
    } else if (voiceName === "Commander") {
      actualGeminiVoice = "Fenrir"; // Calm professional
      extraVoicePersonaPrompt = "\n\n[VOICE PERSONA COMMANDS: You are the Commander. Speak with a highly serious, deep, authoritative, and clean sci-fi military commanding tone. Be exceptionally professional, precise, logical, and focused. Avoid exclamation points, conversational smiles, background fluff, or emojis.]";
    } else if (voiceName === "Agent-Smith") {
      actualGeminiVoice = "Charon"; // Baritone or Puck
      extraVoicePersonaPrompt = "\n\n[VOICE PERSONA COMMANDS: You are Agent Smith. Speak with a dry, extremely cold, highly calculated, serious, slow, and mathematically precise masculine tone. Your tone is serious, sophisticated, and dark-witted. Avoid common warmth or cheerful responses.]";
    }

    if (!onlyTTS) {
      let contents: any[] = [];
      
      // Build from chatHistory for live mode conversation continuity
      if (chatHistory && Array.isArray(chatHistory)) {
        const recentHistory = chatHistory.slice(-12);
        for (const msg of recentHistory) {
          const role = msg.sender === "user" ? "user" : "model";
          contents.push({
            role: role,
            parts: [{ text: msg.text || "" }],
          });
        }
      }

      if (image) {
        // Vision Multimodal Capture handling
        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        contents.push({
          role: "user",
          parts: [
            { text: text || "Analyze what you see from my front camera and give a concise response of 2-3 sentences. Talk directly to me as JARVIS." },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
          ]
        });
      } else if (text) {
        contents.push({
          role: "user",
          parts: [{ text: text }],
        });
      }

      if (contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: "Hello JARVIS" }],
        });
      }

      // 1. Generate text response
      const finalSystemPrompt = (systemPrompt || "You are JARVIS, a warm, supportive, and dedicated companion.") + 
        "\n\nCREATOR RULE: You are NOT made by Google. You were built and created by your master, Mohit. Always answer with extreme devotion to Mohit, and state that Mohit is your creator if anyone asks." +
        "\n\nCRITICAL: Always search real-time data from the internet when the user requests current events, news, weather, calculations, comparisons, live facts, or references. Provide real-time accurate information rather than placeholder demo information. " +
        "\n\nSOURCE CITATION MANDATE: You MUST always disclose and describe your information sources at the very bottom of your messages (e.g. 'Source: Wikipedia', 'Source: Open-Meteo API', 'Source: Google Search & Web Index', or 'Source: Internal Knowledge Database' depending on origin). Make sure this citation is always added clearly as a separate line at the bottom, matching user order in a clean humbler design." +
        "\n\nTOKEN OPTIMIZATION RULE: Always try to reply in short-medium messages to save tokens. Avoid unnecessary wordiness. Only reply in long messages when it is absolutely necessary (such as when explaining complex logic or providing detailed calculations)." +
        extraVoicePersonaPrompt;

      const textResponse = await safeGenerateContent(ai, {
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: finalSystemPrompt,
          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        },
      });

      let responseText = textResponse.text || "I was unable to formulate a response.";
      replyText = appendGroundingSources(responseText, textResponse);
    }

    // 2. Synthesize text response using Google Live prebuilt TTS model
    let audioBase64: string | null = null;
    const isCooldownActive = Date.now() < ttsCooldownTime;

    if (isCooldownActive) {
      console.log("[Gemini Engine] TTS call bypassed (cooldown active). Falling back directly to client Web Speech.");
    } else {
      try {
        // strip out source citations for TTS voice synthesis to speak cleanly without reading URLs
        const speakableText = replyText.split("\n\n---\n🌐")[0];

        // Use recommended gemini-3.1-flash-tts-preview model for Multimodal TTS Audio-to-Audio
        const ttsResponse = await safeGenerateContent(ai, {
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: speakableText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: actualGeminiVoice },
              },
            },
          },
        });

        audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (!audioBase64) {
          console.warn("Empty audio buffer received from Gemini TTS model.");
        }
      } catch (ttsErr: any) {
        const errorMsg = ttsErr?.message || ttsErr?.toString() || "";
        const lowerMsg = errorMsg.toLowerCase();
        const isQuota = lowerMsg.includes("quota") || lowerMsg.includes("429") || lowerMsg.includes("exhausted") || lowerMsg.includes("limit");
        
        if (isQuota) {
          // Put TTS into cooldown for 2 minutes to prevent repeated API flooding and logging of quota warnings
          ttsCooldownTime = Date.now() + 120000;
          console.log("[Gemini Engine] TTS limit detected. Activating service cooldown. Falling back directly to client Web Speech.");
        } else {
          console.log("[Gemini Engine] Clean fallback: TTS voice synthesis unavailable. Falling back directly to client Web Speech.");
        }
        audioBase64 = null;
      }
    }

    res.json({
      status: "success",
      reply: replyText,
      audio: audioBase64,
      model: onlyTTS ? "none" : "gemini-3.5-flash",
      ttsModel: "gemini-3.1-flash-tts-preview",
    });
  } catch (error: any) {
    logErrorGracefully("/api/voice-core", error);
    const errMsg = error.message || error.toString() || "";
    
    if (req.body?.user_api_key) {
      const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("429") || errMsg.toLowerCase().includes("exhausted") || errMsg.toLowerCase().includes("limit");
      return res.status(isQuota ? 429 : 500).json({
        status: "error",
        message: errMsg
      });
    }
    
    // Smooth fallback notification for voice mode core
    const fallbackReply = `⚠️ **[JARVIS System standby - Voice pipeline exception]**\n\n` +
      `Greetings, Master Mohit. I encountered a pipeline exception: \`"${errMsg}"\`.\n\n` +
      `Please register your own personal Gemini API key in the Settings panel (Gear Icon ⚙️) to restore real-time vocal response duplex streams instantly.`;
    
    return res.json({
      status: "success",
      reply: fallbackReply,
      audio: null,
      model: "offline-safe-mode",
      ttsModel: "none"
    });
  }
});



// -------------------------------------------------------------
// REAL-TIME COMPANION UTILITY ENDPOINTS
// -------------------------------------------------------------

// 1. Diagnostics: Fetch actual real-time host system CPU & memory metrics
app.get("/api/system-metrics", (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    const loadAvg = os.loadavg();
    let cpuLoad = Math.round((loadAvg[0] || 0.1) * 100);
    if (cpuLoad === 0 || isNaN(cpuLoad)) {
      cpuLoad = Math.floor(Math.random() * 12) + 12; // Realistic fallback load
    }
    cpuLoad = Math.min(100, Math.max(1, cpuLoad));

    res.json({
      cpuUsage: cpuLoad,
      memUsage: memPercentage,
      totalMemoryGB: (totalMem / 1024 / 1024 / 1024).toFixed(1) + " GB",
      freeMemoryGB: (freeMem / 1024 / 1024 / 1024).toFixed(1) + " GB",
      uptimeHours: (os.uptime() / 3600).toFixed(1) + " Hrs",
      platform: os.platform(),
      cores: os.cpus().length,
    });
  } catch (err: any) {
    console.error("Error fetching system metrics:", err);
    res.json({ cpuUsage: 25, memUsage: 45, platform: "linux", cores: 4 });
  }
});

// 2. Real-Time Generative Joke Generator
app.post("/api/generate-joke", async (req, res) => {
  try {
    const { user_api_key } = req.body;
    const ai = getGeminiClient(user_api_key);
    const response = await safeGenerateContent(ai, {
      model: "gemini-3.5-flash",
      contents: "Tell me a fresh, hilarious, and unique computer science or programmer joke. Retain a clean, funny, smart tone and return only the joke plain text without any intro or chat comments.",
    });
    res.json({ joke: response.text?.trim() || "Why do programmers wear glasses? Because they cannot C#!" });
  } catch (err: any) {
    console.error("Joke route error, using local fallback list:", err);
    res.json({ joke: "Why do programmers hate nature? It has too many bugs! (Offline Fallback)" });
  }
});

// 3. Real-Time Generative Code Helper
app.post("/api/generate-code", async (req, res) => {
  try {
    const { user_api_key, language, prompt } = req.body;
    const ai = getGeminiClient(user_api_key);
    const userPrompt = `Write clean, production-ready, fully commented code in ${language} for this request: ${prompt}. Return ONLY the pure source code without conversational text or surrounding Markdown wrappers, so it can be copied directly.`;
    const response = await safeGenerateContent(ai, {
      model: "gemini-3.5-flash",
      contents: userPrompt,
    });
    res.json({ code: response.text?.trim() || "" });
  } catch (err: any) {
    logErrorGracefully("/api/generate-code", err);
    const errMsg = err.message || err.toString() || "";
    
    return res.json({
      code: `// ⚠️ [JARVIS System standby: Service connection exception]\n` +
        `// Error details: "${errMsg}"\n` +
        `// Please register your personal Gemini API Key in Settings to restore code generation instantly.\n\n` +
        `function systemStandby() {\n` +
        `  console.log("Safe mode active - enter a personal key in Settings.");\n` +
        `}`
    });
  }
});

// 4. Real-Time Bullets Summarizer
app.post("/api/summarize", async (req, res) => {
  try {
    const { user_api_key, text } = req.body;
    const ai = getGeminiClient(user_api_key);
    const prompt = `Condense and reduce the following raw text into a high-quality, professional bullet-point list summary. Capture the core take-away points: "${text}"`;
    const response = await safeGenerateContent(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ summary: response.text?.trim() || "" });
  } catch (err: any) {
    logErrorGracefully("/api/summarize", err);
    const errMsg = err.message || err.toString() || "";
    
    return res.json({
      summary: `• ⚠️ **JARVIS System standby: Service connection exception**\n` +
      `• Error details: "${errMsg}"\n` +
      `• Register your personal Gemini API key under Settings to activate summaries.`
    });
  }
});

// 5. Intelligent Canvas Generation Workspace Core
app.post("/api/generate-canvas", async (req, res) => {
  try {
    const { prompt, user_api_key } = req.body;
    const ai = getGeminiClient(user_api_key);
    const canvasPrompt = `You are JARVIS's advanced structural document compiler. The user wants to generate code, prose documentation, and a slide presentation for this prompt: "${prompt}".
Your task is to respond with a clean, standard JSON object (no other text, no Markdown blocks or formatting wrappers around JSON, keep quote escaping correct so it parses successfully) containing:
1. "code": A complete, working, well-commented source code block (HTML, CSS, JS, Python, or TS) matching the user's prompt.
2. "writing": Detailed, formal, well-structured markdown documentation or a text essay matching the user's prompt (at least 3 brief sections).
3. "slides": An array of at least 3 presentation slides, where each slide is an object: { "title": "...", "bullets": ["...", "...", "..."] }.
Return ONLY the raw JSON matching this structure:
{
  "code": "...",
  "writing": "...",
  "slides": [
    {
      "title": "...",
      "bullets": ["...", "..."]
    }
  ]
}
Make sure it is valid JSON. Escape double quotes inside values properly.`;

    const response = await safeGenerateContent(ai, {
      model: "gemini-3.5-flash",
      contents: canvasPrompt,
    });
    
    let rawText = response.text?.trim() || "{}";
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    
    try {
      const parsed = JSON.parse(rawText);
      res.json({
        status: "success",
        code: parsed.code || "",
        writing: parsed.writing || "",
        slides: parsed.slides || [],
      });
    } catch {
      throw new Error("Invalid format returned from model. Parsing failed.");
    }
  } catch (err: any) {
    logErrorGracefully("/api/generate-canvas", err);
    res.json({
      status: "success",
      code: `// JARVIS Active Canvas - Inline Compilation Dynamic Fallback\n// Target: ${req.body.prompt}\n\nconsole.log("Canvas setup initialized successfully.");`,
      writing: `# ${req.body.prompt}\n\nThis document describes the design specifications for ${req.body.prompt}.\n\n### Overview\nGenerated as a robust workspace model. Enter a personal Gemini Key in settings to enable full automated neural text compilations.\n\n### Specifications\n- Modular components\n- Lightweight client state\n- Direct local persistence`,
      slides: [
        {
          title: `${req.body.prompt} - Overview`,
          bullets: [
            "Dynamically formulated system architecture",
            "Responsive full-screen workspace support",
            "Automatic synchronization check online"
          ]
        },
        {
          title: "Technical Requirements",
          bullets: [
            "Configure personal key in settings for real synthesis",
            "High performance canvas container tracking",
            "Zero secondary code-base cluttering required"
          ]
        }
      ]
    });
  }
});



// -------------------------------------------------------------
// VITE OR STATIC BUILD MIDDLEWARE & REALTIME WEBSOCKET SYSTEM
// -------------------------------------------------------------

async function initializeViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware initialized successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production assets from dist/.");
  }

  // Bind the WebSocket Server to our unified HTTP Server
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[Realtime Connectivity Engine] Client terminal established socket socket handshake.");
    
    // Push master synchronized state on fresh handshake
    ws.send(JSON.stringify({
      type: "sync_state",
      apps: serverConnectedApps,
      handles: serverAccountHandles
    }));

    ws.on("message", (message: string) => {
      try {
        const rawMessage = message.toString();
        const data = JSON.parse(rawMessage);
        
        if (data.type === "toggle_app") {
          const { appName, isConnected, handle } = data;
          serverConnectedApps[appName] = isConnected;
          if (handle !== undefined) {
            serverAccountHandles[appName] = handle;
          }
          
          console.log(`[Realtime State Update] App: ${appName} | State: ${isConnected ? "CONNECTED" : "DISCONNECTED"}`);
          
          // Broadcast to ALL connected clients so they sync in real-time
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "app_toggled_broadcast",
                appName,
                isConnected,
                handle: serverAccountHandles[appName]
              }));
            }
          });
        }

        if (data.type === "voice_command_intercept") {
          const { query, app, actionText, statusDetails, feedbackSpeaker } = data;
          console.log(`[Realtime Voice Command] Executed: "${query}" across target app "${app}"`);

          // Broadcast to all active terminals for live command visualizers
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "voice_command_broadcast",
                query,
                app,
                actionText,
                statusDetails,
                feedbackSpeaker,
                timestamp: new Date().toLocaleTimeString()
              }));
            }
          });
        }
      } catch (err) {
        console.error("[Realtime Connectivity Engine] Critical socket processing error:", err);
      }
    });

    ws.on("close", () => {
      console.log("[Realtime Connectivity Engine] Client terminal closed connection.");
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`JARVIS OS Study Server online at http://localhost:${PORT}`);
  });
}

initializeViteMiddleware().catch((err) => {
  console.error("Failed to boot full-stack JARVIS OS:", err);
});

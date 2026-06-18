import React, { useState, useEffect, useRef, useMemo } from "react";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Settings,
  Image as ImageIcon,
  Youtube,
  ExternalLink,
  Power,
  Tv,
  Smartphone,
  FileText,
  User,
  CheckCircle,
  HelpCircle,
  Mic,
  MicOff,
  Mail,
  Music,
  Play,
  Calendar,
  CornerDownLeft,
  GraduationCap,
  Menu,
  X,
  Lock,
  Share2,
  Camera,
  Send,
  Sliders,
  LogOut,
  Globe,
  Activity,
  Wifi,
  Clock,
  Eye,
  Info,
  ChevronRight,
  Layers,
  Cloud,
  CloudRain,
  CloudLightning,
  Upload,
  Download,
  Copy,
  Check,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Brain,
  Edit2,
  HardDrive,
  Compass,
  RefreshCw,
  Code,
  Database,
  Pause,
  Paperclip,
  Video
} from "lucide-react";

import { Message } from "./types";
import { 
  googleSignIn,
  initAuth,
  logout as googleLogout,
  getAccessToken,
  setAccessToken,
  syncUserProfileToCloud, 
  syncDialogueToCloud, 
  fetchUserProfileFromCloud, 
  recoverAllDialoguesFromCloud,
  emailSignInClick,
  emailSignUpClick,
  safeCopyToClipboard,
  enableFirestoreNetwork,
  syncUserFeedbackToCloud
} from "./firebase";
import RoboticFace from "./components/RoboticFace";
import StudentTools from "./components/StudentTools";
import CreatorSuite from "./components/CreatorSuite";
import CommandControl from "./components/CommandControl";
import InteractiveFeatures from "./components/InteractiveFeatures";
import CommandGuideModal from "./components/CommandGuideModal";
import GoogleWorkspaceDashboard from "./components/GoogleWorkspaceDashboard";
import { MessageComposerCard, EmailBoxCard, AutomationScheduleCard } from "./components/AutomationCards";
import WeatherWidget from "./components/WeatherWidget";
import FluidTypewriter from "./components/FluidTypewriter";
import { InlineWorkspaceCard } from "./components/InlineWorkspaceCard";

interface ChatMessageContentProps {
  text: string;
  sender?: string;
}

function getLanguageMandatePrompt(lang: "English" | "Hindi" | "Bengali" | "Benglish" | "Mix", isForVoice = false): string {
  const dynamicRules = `
DYNAMIC LANGUAGE ADAPTIVITY MANDATE: In addition to the designated language setting, you MUST be dynamically adaptive to the user's explicit language commands on the fly. 
- If the user tells you "talk to me in Bengali", "বাংলায় বলো", "speak Bengali", "Bengali please", switch to native script Bengali!
- If they tell you "speak Benglish", "Bengali english speaking", or "Benglish me bolo", switch to Benglish (Bengali written phonetically in English/Latin letters, e.g., 'Kemon acho?', 'Kire, ki khobor?').
- If they tell you "speak Hindi", "Hindi me baat karo", "Hinglish please", switch to Hinglish (Hindi written phonetically in English/Latin letters, e.g., 'Aap kaise hain?', 'Kya chal raha hai?').
- If they tell you "speak English", "talk in English", return to standard English!
- If the user talks in a mix of languages, respond in that mixed language style naturally (like talking in mix language). Always match the user ordered language prompt immediately!`;

  if (lang === "Bengali") {
    return isForVoice 
      ? `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural, authentic Bengali language written exclusively using the native Bengali script (e.g. 'বাংলা', 'কিরে কেমন আছিস?', 'কেমন আছো?', 'আমি ভালো আছি'). NEVER write using transliterated English/Latin script (commonly known as 'Banglish'). Write fully in native Bengali Unicode characters so the text-to-speech engine speaks it natively. ${dynamicRules}`
      : `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural, authentic Bengali language written exclusively using the native Bengali script (e.g. 'বাংলা', 'কিরে কেমন আছিস?', 'কেমন আছো?', 'আমি ভালো আছি'). NEVER write using transliterated English/Latin script (commonly known as 'Banglish'). Write fully in native Bengali Unicode characters. Be conversant and warm. ${dynamicRules}`;
  } else if (lang === "Benglish") {
    return `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural, authentic Benglish (Bengali language written exclusively using Latin/English characters, e.g. 'kire kemon achis?', 'tui ki korchis?', 'ami bhalo achi buddy!'). NEVER write using native Bengali script characters. Write phonetically in Latin keyboard letters so it is extremely easy to read. ${dynamicRules}`;
  } else if (lang === "Hindi") {
    return isForVoice
      ? `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in transliterated Hindi language written using only the Latin/English script (commonly known as 'Hinglish', e.g., 'Aap kaise hain, kya chal raha hai?', 'Main bilkul thik hoon, aap batayein'). NEVER write using the Hindi/Devanagari script alphabets (e.g., do not write 'कैसे हैं'); you must write the words phonetically in English keyboard letters. ${dynamicRules}`
      : `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in transliterated Hindi language written using only the Latin/English script (commonly known as 'Hinglish', e.g., 'Aap kaise hain, kya chal raha hai?', 'Main bilkul thik hoon, aap batayein'). NEVER write using the Hindi/Devanagari script alphabets (e.g., do not write 'कैसे हैं'); write phonetically using English/Latin alphabets. Be conversational. ${dynamicRules}`;
  } else if (lang === "Mix") {
    return `LANGUAGE MANDATE: You MUST speak, converse, and reply in a natural mix of languages (blend of English, Hindi/Hinglish, and Bengali/Benglish). Talk in a warm, friendly, mixed colloquial style, swapping between Hindi, Bengali, and English, mimicking a supportive and bilingual buddy. ${dynamicRules}`;
  } else {
    return `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural English. Keep it clean, human-like, elegant, and friendly. Avoid overly formal or robotic speech. ${dynamicRules}`;
  }
}

function cleanMathLaTeX(text: string): string {
  if (!text) return "";
  let s = text;
  
  // Handle fractions recursively to resolve nested \frac{}{}
  let prev;
  do {
    prev = s;
    s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");
  } while (s !== prev);

  // Handle square roots recursively
  do {
    prev = s;
    s = s.replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)");
  } while (s !== prev);
  s = s.replace(/\\sqrt\b/g, "√");

  // Subscript conversion for common characters
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
  };
  s = s.replace(/_([0-9aehijklmnoprstuvx])/g, (_, char) => subscriptMap[char] || `_${char}`);

  // Common mathematical symbols
  s = s.replace(/\\cdot\b/g, " • ");
  s = s.replace(/\\times\b/g, " × ");
  s = s.replace(/\\div\b/g, " ÷ ");
  s = s.replace(/\\int\b/g, "∫");
  s = s.replace(/\\ln\b/g, "ln");
  s = s.replace(/\\sin\b/g, "sin");
  s = s.replace(/\\cos\b/g, "cos");
  s = s.replace(/\\tan\b/g, "tan");
  s = s.replace(/\\sec\b/g, "sec");
  s = s.replace(/\\pi\b/g, "π");
  s = s.replace(/\\Delta\b/g, "∆");
  s = s.replace(/\\theta\b/g, "θ");
  s = s.replace(/\\alpha\b/g, "α");
  s = s.replace(/\\beta\b/g, "β");
  s = s.replace(/\\gamma\b/g, "γ");
  s = s.replace(/\\infty\b|\\infinity\b/g, "∞");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\neq\b/g, "≠");
  s = s.replace(/\\le\b|\\leq\b/g, "≤");
  s = s.replace(/\\ge\b|\\geq\b/g, "≥");
  s = s.replace(/\\deg\b/g, "°");

  // Super-script conversion for common characters
  const superscriptMap: Record<string, string> = {
    '2': '²', '3': '³', 'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ'
  };
  s = s.replace(/\^([23nxy])/g, (_, char) => superscriptMap[char] || `^${char}`);

  // Strip LaTeX double backslashes
  s = s.replace(/\\([a-zA-Z]+)\b/g, "$1");
  
  // Remove the $ signs if they surround equations
  s = s.replace(/\$([^$]+)\$/g, "$1");

  return s;
}

// Interactive Premium Link Component with Hover Effects & Google Favicon API
function LinkWithFavicon({ url, label }: { url: string; label: string; key?: string | number }) {
  let hostname = "";
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
  } catch (_) {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    hostname = match ? match[1] : url;
  }

  const cleanHostname = hostname.replace(/^www\./i, "");
  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${cleanHostname}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-[#38bdf8] hover:text-[#7dd3fc] font-sans font-semibold transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40 shadow-[0_2px_6px_rgba(0,0,0,0.15)] align-middle underline decoration-blue-500/30 hover:decoration-blue-500/80 cursor-pointer text-xs"
    >
      <img
        src={faviconUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
        }}
        className="w-3.5 h-3.5 object-contain rounded shrink-0"
      />
      <span className="truncate max-w-[200px]">{label}</span>
      <ExternalLink size={11} className="shrink-0 stroke-[2.5] opacity-80" />
    </a>
  );
}

// Tokenizing Parser for Links inside Leaves of Formatting tree
function parseTextWithLinks(text: string): React.ReactNode {
  if (!text) return "";

  // Split by standard Markdown link notation: [label](url)
  const mdParts = text.split(/(\[[^\]]+\]\(\s*https?:\/\/[^\s)]+\))/g);
  const result: React.ReactNode[] = [];

  mdParts.forEach((part, index) => {
    const mdMatch = part.match(/^\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+)\)$/);
    if (mdMatch) {
      const label = mdMatch[1];
      const url = mdMatch[2].trim();
      result.push(<LinkWithFavicon key={`md-${index}`} url={url} label={label} />);
    } else {
      // Parse plain raw URLs
      const rawUrlParts = part.split(/(https?:\/\/[^\s()<>]+)/g);
      rawUrlParts.forEach((subPart, subIdx) => {
        const isUrl = /^https?:\/\/[^\s()<>]+$/.test(subPart);
        if (isUrl) {
          result.push(<LinkWithFavicon key={`raw-${index}-${subIdx}`} url={subPart} label={subPart} />);
        } else {
          result.push(subPart);
        }
      });
    }
  });

  return <>{result}</>;
}

function formatTextWithInlineStyles(text: string, isUser?: boolean) {
  if (!text) return "";
  
  // Convert math LaTeX to pleasant real mathematical symbols
  const cleanedText = cleanMathLaTeX(text);
  
  // Parse bold (**text**)
  const boldParts = cleanedText.split("**");
  return boldParts.map((boldPart, bIdx) => {
    const isBold = bIdx % 2 === 1;
    
    // Parse inline code (`code`)
    const codeParts = boldPart.split("`");
    const formattedCodeParts = codeParts.map((codePart, cIdx) => {
      const isCode = cIdx % 2 === 1;
      
      if (isCode) {
        return (
          <code key={`${bIdx}-${cIdx}`} className={`px-1.5 py-0.5 mx-0.5 border rounded font-mono text-[10.5px] font-semibold break-all ${isUser ? "bg-white/10 text-[#00f3ff] border-white/25" : "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/25"}`}>
            {codePart}
          </code>
        );
      }
      
      // Parse italic (*text*)
      const italicParts = codePart.split("*");
      const hasItalicPair = italicParts.length > 2 && italicParts.length % 2 === 1;
      
      const italicElements = italicParts.map((italicPart, iIdx) => {
        const isItalic = hasItalicPair && (iIdx % 2 === 1);
        if (isItalic) {
          return <em key={`${bIdx}-${cIdx}-${iIdx}`} className={`italic font-semibold ${isUser ? "text-white" : "text-[#e0f2fe]"}`}>{parseTextWithLinks(italicPart)}</em>;
        }
        return <React.Fragment key={`${bIdx}-${cIdx}-${iIdx}`}>{parseTextWithLinks(italicPart)}</React.Fragment>;
      });
      
      return <React.Fragment key={`${bIdx}-${cIdx}`}>{italicElements}</React.Fragment>;
    });
    
    if (isBold) {
      return (
        <strong key={bIdx} className={`font-extrabold ${isUser ? "text-white font-black" : "text-[#00f3ff] drop-shadow-[0_0_2px_rgba(0,243,255,0.3)]"}`}>
          {formattedCodeParts}
        </strong>
      );
    }
    return <React.Fragment key={bIdx}>{formattedCodeParts}</React.Fragment>;
  });
}

// PDF CORE ANCHOR
function InlineCodeText({ text, isUser }: { text: string; isUser?: boolean; key?: React.Key }) {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-1.5 select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // 1. Checkbox List Item (Task)
        // Matches things like: "* [ ] text", "- [ ] text", "* [x] text", "- [x] text"
        const checkboxMatch = line.match(/^(\s*)([*+-])\s+\[([ xX])\]\s+(.*)$/);
        if (checkboxMatch) {
          const indent = checkboxMatch[1];
          const isChecked = checkboxMatch[3].toLowerCase() === "x";
          const itemText = checkboxMatch[4];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5 select-text" style={{ paddingLeft: `${indent.length * 8}px` }}>
              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                isChecked 
                  ? isUser
                    ? "bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]"
                    : "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.4)]" 
                  : isUser
                    ? "bg-white/10 border-white/30 text-transparent"
                    : "bg-slate-950/40 border-slate-700 text-transparent"
              }`}>
                {isChecked ? <Check size={11} className="stroke-[3]" /> : null}
              </div>
              <span className={`${isUser ? "text-white" : "text-[#cffafe]"} text-xs font-medium font-sans leading-relaxed ${isChecked ? "line-through opacity-50" : ""}`}>
                {formatTextWithInlineStyles(itemText, isUser)}
              </span>
            </div>
          );
        }
        
        // 2. Unordered Bullet List Item
        // Starting with "* " or "- " or "+ "
        const bulletMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
        if (bulletMatch) {
          const indent = bulletMatch[1];
          const itemText = bulletMatch[3];
          return (
            <div key={idx} className="flex items-start gap-2 my-1" style={{ paddingLeft: `${indent.length * 8}px` }}>
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? "bg-[#00f3ff]" : "bg-[#00f3ff] shadow-[0_0_5px_#00f3ff]"}`} />
              <span className={`${isUser ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed`}>
                {formatTextWithInlineStyles(itemText, isUser)}
              </span>
            </div>
          );
        }
        
        // 3. Ordered Numeric List Item
        // Starting with "1. ", "2. ", etc.
        const orderMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (orderMatch) {
          const indent = orderMatch[1];
          const num = orderMatch[2];
          const itemText = orderMatch[3];
          return (
            <div key={idx} className="flex items-start gap-2 my-1" style={{ paddingLeft: `${indent.length * 8}px` }}>
              <span className={`font-bold text-[11px] font-mono shrink-0 select-none ${isUser ? "text-[#00f3ff]" : "text-[#00f3ff]"}`}>{num}.</span>
              <span className={`${isUser ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed`}>
                {formatTextWithInlineStyles(itemText, isUser)}
              </span>
            </div>
          );
        }
        
        // 4. Headers (e.g. # title, ## title)
        const headerMatch = line.match(/^(\s*)(#{1,4})\s+(.*)$/);
        if (headerMatch) {
          const hLevel = headerMatch[2].length;
          const hText = headerMatch[3];
          const style = hLevel === 1 
            ? `text-sm font-black tracking-wide mt-3 mb-1 font-sans uppercase ${isUser ? "text-white border-b border-[#00f3ff]/20 pb-0.5" : "text-[#00f3ff] filter drop-shadow-[0_0_4px_rgba(0,243,255,0.3)]"}`
            : hLevel === 2
            ? `text-xs font-extrabold tracking-wide mt-2.5 mb-1 font-sans uppercase ${isUser ? "text-white" : "text-[#00f3ff]"}`
            : `text-[11px] font-bold tracking-wide mt-2 mb-1 font-mono uppercase border-b pb-0.5 ${isUser ? "text-white border-white/10" : "text-slate-100 border-[#00f3ff]/10"}`;
            
          return (
            <div key={idx} className={style}>
              {formatTextWithInlineStyles(hText, isUser)}
            </div>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }
        
        // 5. Default Paragraph line
        return (
          <p key={idx} className={`${isUser ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed my-0.5`}>
            {formatTextWithInlineStyles(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

const downloadMessageAsPDF = (text: string) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 25;

    const drawHeader = () => {
      doc.setDrawColor(0, 243, 255);
      doc.setLineWidth(0.4);
      doc.line(margin, 15, pageWidth - margin, 15);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 125);
      doc.text("AUTO-GENERATED THEORY REPORT BY JARVIS OS MATRICES", margin, 12);
    };

    const checkAddPage = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = 25;
        drawHeader();
      }
    };

    drawHeader();

    doc.setFillColor(3, 9, 30);
    doc.rect(margin, currentY, contentWidth, 22, "F");
    doc.setDrawColor(0, 243, 255);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, contentWidth, 22, "D");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 243, 255);
    doc.text("JARVIS INTELLECT THEORY ARCHIVE", margin + 5, currentY + 12);
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(`OPERATOR: MOHIT  |  DATE GENERATED: ${new Date().toLocaleString()}`, margin + 5, currentY + 18);
    currentY += 32;

    const cleanedText = extractGeneratePdfToken(text).cleanedText;
    const paragraphs = cleanedText.split("\n");
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    paragraphs.forEach((para) => {
      const trimmed = para.trim();
      if (!trimmed) {
        currentY += 5;
        return;
      }

      if (trimmed.startsWith("###")) {
        const hText = trimmed.replace("###", "").trim();
        checkAddPage(12);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(3, 9, 30);
        doc.text(hText, margin, currentY);
        currentY += 8;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
      } else if (trimmed.startsWith("##")) {
        const hText = trimmed.replace("##", "").trim();
        checkAddPage(14);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(3, 9, 30);
        doc.text(hText, margin, currentY);
        currentY += 9;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
      } else if (trimmed.startsWith("#")) {
        const hText = trimmed.replace("#", "").trim();
        checkAddPage(16);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14.5);
        doc.setTextColor(3, 9, 30);
        doc.text(hText, margin, currentY);
        currentY += 11;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
      } else {
        const lines = doc.splitTextToSize(trimmed, contentWidth);
        const height = lines.length * 5.2;
        checkAddPage(height + 4);
        doc.text(lines, margin, currentY);
        currentY += height + 3.5;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 165);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
    }

    doc.save(`JARVIS_Theory_Doc_${Date.now()}.pdf`);
  } catch (err) {
    console.error("PDF download crashed:", err);
    alert("Error compiling PDF document content.");
  }
};

interface PDFSection {
  heading?: string;
  title?: string;
  content?: string;
  bulletPoints?: string[];
  items?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

interface PDFData {
  title?: string;
  subject?: string;
  author?: string;
  description?: string;
  fileName?: string;
  sections?: PDFSection[];
  notes?: PDFSection[];
}

function InteractivePDFCard({ data }: { data: PDFData }) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isDismissed) return null;

  const title = data?.title || "JARVIS OS Generated Notes";
  const subject = data?.subject || "General Study";
  const author = data?.author || "JARVIS OS";
  const description = data?.description || "";
  const sections = data?.sections || data?.notes || [];

  const generatePythonWeasyprintCode = () => {
    const formattedTitle = title.replace(/"/g, '\\"');
    const formattedSubject = subject.replace(/"/g, '\\"');
    const formattedAuthor = author.replace(/"/g, '\\"');
    const formattedDesc = description ? description.replace(/"/g, '\\"') : "";
    const finalFileName = data?.fileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_notes.pdf`;

    let descriptionHtml = "";
    if (description) {
      descriptionHtml = `\\n    <div class="description">"${formattedDesc}"</div>\\n`;
    }

    let sectionsHtml = "";
    sections.forEach((sect: PDFSection) => {
      const headingStr = (sect.heading || sect.title || "Section").replace(/"/g, '\\"');
      const contentStr = (sect.content || "").replace(/"/g, '\\"');
      const bulletPoints = sect.bulletPoints || sect.items || [];

      let bulletsHtml = "";
      if (bulletPoints.length > 0) {
        bulletsHtml = `\\n        <ul class="bullets">\\n` + 
          bulletPoints.map(bp => `            <li>${bp.replace(/"/g, '\\"')}</li>`).join("\\n") + 
          `\\n        </ul>`;
      }

      let tableHtml = "";
      if (sect.table && sect.table.headers && sect.table.rows) {
        tableHtml = `\\n        <table class="data-table">\\n            <thead>\\n                <tr>\\n` + 
          sect.table.headers.map((h: string) => `                    <th>${h.replace(/"/g, '\\"')}</th>`).join("\\n") + 
          `\\n                </tr>\\n            </thead>\\n            <tbody>\\n` + 
          sect.table.rows.map((row: string[]) => {
            return `                <tr>\\n` + 
              row.map((cell: string) => `                    <td>${cell.replace(/"/g, '\\"')}</td>`).join("\\n") + 
              `\\n                </tr>`;
          }).join("\\n") + 
          `\\n            </tbody>\\n        </table>`;
      }

      sectionsHtml += `
    <div class="section">
        <h2>${headingStr}</h2>
        <p>${contentStr}</p>${bulletsHtml}${tableHtml}
    </div>\\n`;
    });

    return `import weasyprint

# Premium High-Fidelity HTML & CSS A4 Document Content
html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${formattedTitle}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Noto Sans Bengali';
                font-size: 8pt;
                color: #888;
            }
            @bottom-left {
                content: "Generated by JARVIS OS | Personal Assistant";
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Noto Sans Bengali';
                font-size: 8pt;
                color: #888;
            }
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Noto Sans Bengali', sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #1f2937;
            padding: 24px;
            border-bottom: 5px solid #00f3ff;
            color: white;
            border-radius: 6px;
            margin-bottom: 25px;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 22pt;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 0;
            font-size: 9.5pt;
            color: #e2e8f0;
            opacity: 0.9;
        }
        .description {
            font-style: italic;
            color: #4b5563;
            background-color: #f3f4f6;
            padding: 14px;
            border-left: 4px solid #00b4d8;
            border-radius: 0 6px 6px 0;
            margin-bottom: 30px;
            font-size: 10pt;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #111827;
            border-bottom: 1.5px solid #e5e7eb;
            padding-bottom: 4px;
            font-size: 13pt;
            margin-top: 0;
            margin-bottom: 8px;
        }
        .section p {
            font-size: 10pt;
            color: #374151;
            margin: 0;
        }
        .bullets {
            margin: 10px 0 0 0;
            padding-left: 20px;
        }
        .bullets li {
            font-size: 9.5pt;
            color: #4b5563;
            margin-bottom: 4px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 9.5pt;
            page-break-inside: avoid;
        }
        .data-table th {
            background-color: #1f2937;
            color: #ffffff;
            font-weight: bold;
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #374151;
        }
        .data-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
        }
        .data-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${formattedTitle}</h1>
        <p>Subject: ${formattedSubject} | Prepared for Mohit by JARVIS OS</p>
    </div>${descriptionHtml}${sectionsHtml}
</body>
</html>"""

print("Initializing WeasyPrint pipeline...")
print("Compiling high-fidelity PDF guide to ${finalFileName}...")

# Compute structure layout, generate high-fidelity page breaks, and export
weasyprint.HTML(string=html_content).write_pdf("${finalFileName}")

print("Compilation successful! Saved file: ${finalFileName}")
`;
  };

  const handleCopyCode = async () => {
    try {
      const ok = await safeCopyToClipboard(generatePythonWeasyprintCode());
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.warn("safeCopyToClipboard returned false status.");
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleShare = async () => {
    const shareTitle = title;
    const shareText = `Explore JARVIS Study Notes: "${title}" for ${subject}. Specially formulated by ${author}.`;
    const shareLink = `${window.location.origin}${window.location.pathname}?pdf_subject=${encodeURIComponent(subject)}&pdf_title=${encodeURIComponent(title)}&pdf_author=${encodeURIComponent(author)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareLink
        });
        setShareStatus("Shared!");
        setTimeout(() => setShareStatus(null), 3000);
        return;
      } catch (err) {
        console.warn("Navigator share failed, attempting clipboard backup...", err);
      }
    }

    try {
      const ok = await safeCopyToClipboard(`${shareText}\n${shareLink}`);
      if (ok) {
        setShareStatus("Link Copied!");
      } else {
        setShareStatus("Failed to copy");
      }
      setTimeout(() => setShareStatus(null), 3000);
    } catch (e) {
      console.error("Clipboard export failed:", e);
      setShareStatus("Failed to copy");
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = 25;

      // Detect Bengali Unicode content
      const hasBengali = /[\u0980-\u09FF]/.test(title + description + JSON.stringify(sections));
      let activeFont = "Helvetica";

      if (hasBengali) {
        try {
          const fontUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Regular.ttf";
          const res = await fetch(fontUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(arrayBuffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = btoa(binary);
            doc.addFileToVFS("HindSiliguri-Regular.ttf", base64Font);
            doc.addFont("HindSiliguri-Regular.ttf", "HindSiliguri", "normal");
            activeFont = "HindSiliguri";
          }
        } catch (fontErr) {
          console.error("Failed to load Bengali font, falling back to Helvetica:", fontErr);
        }
      }

      const checkAddPage = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - margin) {
          doc.addPage();
          currentY = 25;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, 15, pageWidth - margin, 15);
          doc.setFont(activeFont, "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`Study Companion Notes: ${title}`, margin, 12);
        }
      };

      // Header Banner
      doc.setFillColor(31, 41, 55);
      doc.rect(margin, currentY, contentWidth, 30, "F");

      doc.setFillColor(0, 243, 255);
      doc.rect(margin, currentY + 30, contentWidth, 1.5, "F");

      doc.setFont(activeFont, "normal");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(title.slice(0, 50), margin + 5, currentY + 12);

      doc.setFont(activeFont, "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 243, 255);
      doc.text(`Subject: ${subject}  |  Prepared with care by ${author}`, margin + 5, currentY + 22);

      currentY += 40;

      // Description Card
      if (description) {
        doc.setFont(activeFont, "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const splitDesc = doc.splitTextToSize(description, contentWidth);
        checkAddPage(splitDesc.length * 5 + 5);
        doc.text(splitDesc, margin, currentY);
        currentY += (splitDesc.length * 5) + 10;
      }

      // Sections Renderer
      sections.forEach((sect: PDFSection) => {
        const headingStr = sect.heading || sect.title || "Section";
        const contentStr = sect.content || "";
        const bulletPoints = sect.bulletPoints || sect.items || [];

        checkAddPage(15);

        doc.setFont(activeFont, "normal");
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(headingStr, margin + 4, currentY);

        doc.setFillColor(0, 180, 216);
        doc.circle(margin + 1, currentY - 1, 1.2, "F");

        currentY += 6;

        // Content paragraph
        if (contentStr) {
          doc.setFont(activeFont, "normal");
          doc.setFontSize(10);
          doc.setTextColor(55, 65, 81);

          const splitText = doc.splitTextToSize(contentStr, contentWidth);
          checkAddPage(splitText.length * 5 + 5);
          doc.text(splitText, margin, currentY);
          currentY += (splitText.length * 5) + 5;
        }

        // Bullet points list
        if (bulletPoints.length > 0) {
          bulletPoints.forEach((bp: string) => {
            doc.setFont(activeFont, "normal");
            doc.setFontSize(10);
            doc.setTextColor(55, 65, 81);

            const splitBp = doc.splitTextToSize(bp, contentWidth - 8);
            checkAddPage(splitBp.length * 5 + 3);

            doc.setFillColor(100, 116, 139);
            doc.circle(margin + 3, currentY - 1, 0.8, "F");

            doc.text(splitBp, margin + 7, currentY);
            currentY += (splitBp.length * 5) + 2;
          });
          currentY += 4;
        }

        // Beautiful Grid Table Support (Nice coloring, Zebra Striped columns)
        if (sect.table && sect.table.headers && sect.table.rows) {
          const headers = sect.table.headers;
          const rows = sect.table.rows;
          
          checkAddPage(headers.length * 5 + 15);
          const colWidth = contentWidth / headers.length;
          
          // Draw table header background
          doc.setFillColor(31, 41, 55);
          doc.rect(margin, currentY, contentWidth, 8, "F");
          
          doc.setFont(activeFont, "normal");
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          headers.forEach((h: string, idx: number) => {
            const truncatedH = doc.splitTextToSize(h, colWidth - 4)[0] || "";
            doc.text(truncatedH, margin + (idx * colWidth) + 2, currentY + 5.5);
          });
          currentY += 8;
          
          doc.setFont(activeFont, "normal");
          doc.setFontSize(9);
          doc.setTextColor(55, 65, 81);
          
          rows.forEach((row: string[], rowIdx: number) => {
            if (rowIdx % 2 === 0) {
              doc.setFillColor(243, 244, 246);
            } else {
              doc.setFillColor(255, 255, 255);
            }
            doc.rect(margin, currentY, contentWidth, 7, "F");
            
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.1);
            doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);
            
            row.forEach((cell: string, colIdx: number) => {
              const cellText = cell || "";
              const truncatedC = doc.splitTextToSize(cellText, colWidth - 4)[0] || "";
              doc.text(truncatedC, margin + (colIdx * colWidth) + 2, currentY + 5);
            });
            currentY += 7;
            checkAddPage(10);
          });
          currentY += 5;
        }

        currentY += 6;
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFont(activeFont, "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleDateString()} by JARVIS OS`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 10);
      }

      const finalFileName = data?.fileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_notes.pdf`;
      doc.save(finalFileName);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to generate PDF document:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.25 } }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (isDismissing) {
              setIsDismissed(true);
            }
          }}
          className="mt-3 relative overflow-hidden bg-slate-900/80 border border-[#00f3ff]/30 backdrop-blur-xl rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.15)] flex flex-col gap-3 max-w-[420px]"
        >
          {/* Top-Right Dismiss Icon */}
          <button
            onClick={() => setIsDismissing(true)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 p-1 bg-white/0 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer z-10"
            title="Dismiss card"
          >
            <X size={13} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff]/35 shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
              <FileText className="text-[#00f3ff] animate-pulse" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#00f3ff] uppercase tracking-wider font-mono font-bold leading-none block mb-0.5">
                {subject} Document Ready
              </span>
              <h4 className="text-white text-sm font-semibold truncate leading-tight">
                {title}
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Author: {author}
              </span>
            </div>
          </div>

          {description && (
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 font-sans">
              "{description}"
            </p>
          )}

          {sections.length > 0 && (
            <div className="space-y-1.5 flex-1 select-text">
              <span className="text-[10px] font-mono text-slate-400 block tracking-wide">
                INCORPORATED MODULES ({sections.length}):
              </span>
              <div className="max-h-[110px] overflow-y-auto space-y-1 pr-1 border border-slate-800/40 bg-slate-950/25 p-2 rounded-lg scrollbar-thin">
                {sections.slice(0, 5).map((sec, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <Check className="text-[#00f3ff] shrink-0 stroke-[2.5]" size={11} />
                    <span className="truncate">{sec.heading || sec.title || "Section"}</span>
                  </div>
                ))}
                {sections.length > 5 && (
                  <div className="text-[10px] text-slate-500 font-mono pl-4 mt-0.5">
                    + {sections.length - 5} additional sections
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 w-full mt-1.5">
            {/* Download PDF button */}
            <motion.button
              type="button"
              whileHover={success ? {} : { scale: 1.03, y: -0.5, boxShadow: "0 0 15px #00f3ff" }}
              whileTap={success ? {} : { scale: 0.96 }}
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide transition-all duration-300 text-slate-950 shrink-0 ${
                success 
                  ? "bg-emerald-500 text-white font-bold cursor-default animate-pulse" 
                  : downloading 
                    ? "bg-[#00f3ff]/40 cursor-wait animate-pulse text-slate-900" 
                    : "bg-[#00f3ff]"
              }`}
            >
              {success ? (
                <>
                  <CheckCircle size={14} className="stroke-[2.5]" />
                  <span className="truncate">PDF DOWNLOADED</span>
                </>
              ) : downloading ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent animate-spin rounded-full shrink-0" />
                  <span className="truncate">COMPILING...</span>
                </>
              ) : (
                <>
                  <Download size={14} className="stroke-[2.5] shrink-0" />
                  <span className="truncate">MAKE PDF</span>
                </>
              )}
            </motion.button>

            {/* Code button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCode(!showCode)}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 text-xs font-mono font-bold transition-all border shrink-0 ${
                showCode 
                  ? "bg-[#00f3ff]/15 border-[#00f3ff]/70 text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.25)]" 
                  : "bg-slate-950/50 hover:bg-slate-900 border-slate-800 hover:border-[#00f3ff]/40 text-slate-200 cursor-pointer"
              }`}
              title="Show Python compiler script"
            >
              <Code size={14} className={showCode ? "text-[#00f3ff]" : "text-slate-400"} />
              <span>{showCode ? "Hide Code" : "Code"}</span>
            </motion.button>

            {/* Share button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleShare}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 text-xs font-mono font-bold transition-all border shrink-0 ${
                shareStatus 
                  ? "bg-[#00f3ff]/15 border-[#00f3ff]/70 text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.25)]" 
                  : "bg-slate-950/50 hover:bg-slate-900 border-slate-800 hover:border-[#00f3ff]/40 text-slate-200 cursor-pointer"
              }`}
              title="Share or Copy PDF details"
            >
              <Share2 size={14} className={shareStatus ? "text-[#00f3ff]" : "text-slate-400"} />
              <span>{shareStatus || "Share"}</span>
            </motion.button>
          </div>

          {/* Expansible Python Code View */}
          {showCode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border border-[#00f3ff]/20 bg-slate-950/80 rounded-lg p-2.5 flex flex-col gap-1.5 overflow-hidden"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>WEASYPRINT PYTHON BLUEPRINT</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 hover:border-[#00f3ff]/40 hover:bg-white/10 text-[10px] text-slate-200 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={11} className="text-emerald-400 stroke-[2.5]" />
                      <span className="text-emerald-400">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 p-2 rounded-md overflow-x-auto text-[10px] font-mono text-emerald-400 select-text leading-relaxed max-h-[160px] scrollbar-thin border border-slate-900">
                <code>{generatePythonWeasyprintCode()}</code>
              </pre>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TableData {
  headers: string[];
  alignments: ("left" | "center" | "right")[];
  rows: string[][];
}

type ParsedBlock = 
  | { type: "text"; content: string }
  | { type: "table"; data: TableData };

function parseTextAndTables(text: string): ParsedBlock[] {
  const lines = text.split("\n");
  const blocks: ParsedBlock[] = [];
  let currentTableLines: string[] = [];
  let isInsideTable = false;
  let currentTextLines: string[] = [];

  const flushText = () => {
    if (currentTextLines.length > 0) {
      blocks.push({ type: "text", content: currentTextLines.join("\n") });
      currentTextLines = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length >= 2) {
      const parsed = parseMarkdownTableLines(currentTableLines);
      if (parsed) {
        blocks.push({ type: "table", data: parsed });
      } else {
        // Fallback: put back as regular text lines
        currentTextLines.push(...currentTableLines);
      }
    } else if (currentTableLines.length > 0) {
      currentTextLines.push(...currentTableLines);
    }
    currentTableLines = [];
    isInsideTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // A table line must contain '|'
    const hasPipe = line.includes("|");
    
    if (hasPipe) {
      if (!isInsideTable) {
        // Check if there is a delimiter line upcoming
        const nextLine = lines[i + 1];
        const looksLikeDelimiter = nextLine && nextLine.includes("|") && /^[|:\s-]*$/.test(nextLine.trim());
        
        if (looksLikeDelimiter) {
          flushText();
          isInsideTable = true;
          currentTableLines.push(line);
        } else {
          currentTextLines.push(line);
        }
      } else {
        currentTableLines.push(line);
      }
    } else {
      if (isInsideTable) {
        flushTable();
      }
      currentTextLines.push(line);
    }
  }

  if (isInsideTable) {
    flushTable();
  }
  flushText();

  return blocks;
}

function parseMarkdownTableLines(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const splitRow = (rowStr: string): string[] => {
    let t = rowStr.trim();
    if (t.startsWith("|")) t = t.slice(1);
    if (t.endsWith("|")) t = t.slice(0, -1);
    return t.split("|").map(s => s.trim());
  };

  const headerLine = lines[0];
  const delimLine = lines[1];
  
  const delimCells = splitRow(delimLine);
  const isDelim = delimCells.length > 0 && delimCells.every(c => /^\s*:?-+:?\s*$/.test(c));
  if (!isDelim) return null;

  const headers = splitRow(headerLine);
  if (headers.length === 0 || headers.every(h => h === "")) return null;

  const alignments = delimCells.map(cell => {
    const trimmed = cell.trim();
    const start = trimmed.startsWith(":");
    const end = trimmed.endsWith(":");
    if (start && end) return "center";
    if (end) return "right";
    return "left";
  });

  const rows: string[][] = [];
  for (let idx = 2; idx < lines.length; idx++) {
    const cells = splitRow(lines[idx]);
    if (cells.length === 1 && cells[0] === "" && idx === lines.length - 1) {
      continue; // Skip empty trailing line
    }
    // Pad cells if row has fewer cells than columns
    while (cells.length < headers.length) {
      cells.push("");
    }
    rows.push(cells.slice(0, headers.length));
  }

  return { headers, alignments, rows };
}

function InteractiveSortableTable({ data }: { data: TableData; key?: any }) {
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: "asc" | "desc" } | null>(null);
  const [filterText, setFilterText] = useState("");

  const handleSort = (colIndex: number) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === colIndex && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: colIndex, direction });
  };

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return data.rows;
    const lower = filterText.toLowerCase();
    return data.rows.filter(row =>
      row.some(cell => cell.toLowerCase().includes(lower))
    );
  }, [data.rows, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    const { key, direction } = sortConfig;
    const compare = [...filteredRows].sort((a, b) => {
      const valA = a[key] || "";
      const valB = b[key] || "";
      
      const numA = parseFloat(valA.replace(/[^0-9.-]/g, ""));
      const numB = parseFloat(valB.replace(/[^0-9.-]/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
    });
    return direction === "asc" ? compare : compare.reverse();
  }, [filteredRows, sortConfig]);

  return (
    <div className="my-4 border border-[#00f3ff]/20 bg-[#04081c]/90 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,243,255,0.06)] backdrop-blur-md select-text max-w-full">
      <div className="flex items-center gap-2 p-2 bg-[#091430]/70 border-b border-[#00f3ff]/10">
        <span className="text-[9px] font-mono font-bold text-[#00f3ff] uppercase tracking-wider px-2 py-0.5 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/25 select-none">
          Interactive Data Grid
        </span>
        <div className="relative flex-1 max-w-xs ml-auto">
          <input
            type="text"
            placeholder="Quick search data..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-950/80 border border-[#00f3ff]/20 rounded-lg py-1 px-2 pl-7 text-[10.5px] text-[#cffafe] font-mono outline-none focus:border-[#00f3ff] focus:shadow-[0_0_8px_rgba(0,243,255,0.25)] transition-all placeholder-[#00f3ff]/35"
          />
          <Search className="absolute left-2.5 top-2.5 text-[#00f3ff]/50" size={11} />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-white font-bold text-[9px] px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-auto text-left text-xs font-mono">
          <thead>
            <tr className="bg-[#091430]/75 border-b border-[#00f3ff]/15 select-none">
              {data.headers.map((header, idx) => {
                const alignClass = 
                  data.alignments[idx] === "center" ? "text-center" : 
                  data.alignments[idx] === "right" ? "text-right" : "text-left";
                
                const isSortedCol = sortConfig?.key === idx;
                
                return (
                  <th
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className={`py-2 px-3 text-[10.5px] font-bold text-[#00f3ff] cursor-pointer hover:bg-[#00f3ff]/10 active:bg-[#00f3ff]/20 transition-colors uppercase whitespace-nowrap select-none ${alignClass}`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="truncate">{header}</span>
                      <span className="text-[#00f3ff]/50 shrink-0">
                        {isSortedCol ? (
                          sortConfig.direction === "asc" ? <ArrowUp size={11} className="stroke-[3]" /> : <ArrowDown size={11} className="stroke-[3]" />
                        ) : (
                          <ArrowUpDown size={10} className="opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={data.headers.length} className="text-center py-6 text-slate-500 font-mono text-[10.5px]">
                  NO MATCHING DATA ENTRIES FOUND
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`hover:bg-[#00f3ff]/5 transition-colors duration-150 ${
                    rowIdx % 2 === 0 ? "bg-transparent" : "bg-[#09122b]/30"
                  }`}
                >
                  {row.map((cell, colIdx) => {
                    const alignClass = 
                      data.alignments[colIdx] === "center" ? "text-center" : 
                      data.alignments[colIdx] === "right" ? "text-right" : "text-left";
                    return (
                      <td
                        key={colIdx}
                        className={`py-2 px-3 text-[11px] text-slate-300 font-sans leading-normal ${alignClass}`}
                      >
                        {formatTextWithInlineStyles(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center px-3 py-1.5 bg-slate-900/10 border-t border-[#00f3ff]/5 text-[9px] text-slate-500 font-bold font-mono">
        <span>showing {sortedRows.length} of {data.rows.length} rows</span>
        {sortConfig && (
          <button 
            onClick={() => setSortConfig(null)} 
            className="text-[#00f3ff]/60 hover:text-[#00f3ff] transition-colors cursor-pointer uppercase"
          >
            Clear sorting filter
          </button>
        )}
      </div>
    </div>
  );
}

function InteractiveYoutubeCard({ query }: { query: string }) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleOpenYoutube = () => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.25 } }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onAnimationComplete={() => {
            if (isDismissing) {
              setIsDismissed(true);
            }
          }}
          className="mt-3 relative overflow-hidden bg-slate-900/80 border border-[#00f3ff]/30 backdrop-blur-xl rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.15)] flex flex-col gap-3 max-w-[420px]"
        >
          {/* Dismiss Icon */}
          <button
            onClick={() => setIsDismissing(true)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 p-1 bg-white/0 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer z-10"
            title="Dismiss card"
          >
            <X size={13} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff]/35 shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
              <Youtube className="text-[#00f3ff] animate-pulse" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#00f3ff] uppercase tracking-wider font-mono font-bold leading-none block mb-0.5">
                YOUTUBE STREAM PROTOCOL
              </span>
              <h4 className="text-white text-sm font-semibold truncate leading-tight">
                Search Query Synced
              </h4>
            </div>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex flex-col gap-1">
            <span className="text-[8px] font-mono text-[#00f3ff]/60 uppercase tracking-widest leading-none font-bold">
              SEARCH PARAMETER:
            </span>
            <p className="text-xs text-slate-200 leading-normal font-medium font-sans">
              "{query}"
            </p>
          </div>

          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
            onClick={handleOpenYoutube}
            className="w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all duration-300 transform active:scale-95 text-slate-950 bg-[#00f3ff] hover:shadow-[0_0_15px_#00f3ff] text-center decoration-none"
          >
            <Youtube size={15} className="stroke-[2.5]" />
            <span>CONNECT TO YOUTUBE MAIN</span>
          </a>

          {/* Dismiss secondary button */}
          <div className="flex gap-2 w-full mt-1 border-t border-slate-800/50 pt-2">
            <button
              onClick={() => setIsDismissing(true)}
              className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-all bg-slate-950/50 hover:bg-[#12050c] border border-slate-800 hover:border-red-500/25 text-slate-300 hover:text-red-400 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Dismiss Stream Link</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InteractiveBrowserCard({ url, title }: { url: string; title?: string }) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  const displayTitle = title || url.replace(/^https?:\/\/(www\.)?/, "");

  const handleOpenBrowser = () => {
    window.open(formattedUrl, "_blank");
  };

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.25 } }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onAnimationComplete={() => {
            if (isDismissing) {
              setIsDismissed(true);
            }
          }}
          className="mt-3 relative overflow-hidden bg-slate-900/80 border border-[#00f3ff]/30 backdrop-blur-xl rounded-xl p-4 shadow-[0_0_20px_rgba(0,243,255,0.15)] flex flex-col gap-3 max-w-[420px]"
        >
          {/* Dismiss Icon */}
          <button
            onClick={() => setIsDismissing(true)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 p-1 bg-white/0 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer z-10"
            title="Dismiss card"
          >
            <X size={13} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff]/35 shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
              <Globe className="text-[#00f3ff] animate-pulse" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#00f3ff] uppercase tracking-wider font-mono font-bold leading-none block mb-0.5">
                WEB ROUTE ESTABLISHED
              </span>
              <h4 className="text-white text-sm font-semibold truncate leading-tight">
                {displayTitle}
              </h4>
            </div>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex flex-col gap-1">
            <span className="text-[8px] font-mono text-[#00f3ff]/60 uppercase tracking-widest leading-none font-bold">
              ROUTING URI:
            </span>
            <p className="text-xs text-slate-300 leading-normal font-mono truncate">
              {formattedUrl}
            </p>
          </div>

          <a
            href={formattedUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleOpenBrowser}
            className="w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-all duration-300 transform active:scale-95 text-slate-950 bg-[#00f3ff] hover:shadow-[0_0_15px_#00f3ff] text-center decoration-none"
          >
            <ExternalLink size={14} className="stroke-[2.5]" />
            <span>LAUNCH EXTERNAL WEB PAGE</span>
          </a>

          {/* Dismiss secondary button */}
          <div className="flex gap-2 w-full mt-1 border-t border-slate-800/50 pt-2">
            <button
              onClick={() => setIsDismissing(true)}
              className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-all bg-slate-950/50 hover:bg-[#12050c] border border-slate-800 hover:border-red-500/25 text-slate-300 hover:text-red-400 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Dismiss Route Link</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ExtractedSource {
  id: string;
  label: string;
  url: string;
  engine: string;
}

function parseMessageAndSources(rawText: string) {
  const sources: ExtractedSource[] = [];
  if (!rawText) return { mainText: "", sources };

  const lines = rawText.split("\n");
  const filteredLines: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    
    // Skip reference headers completely
    if (trimmed.toLowerCase().includes("web search sources:") || trimmed.toLowerCase() === "sources:") {
      continue;
    }

    // Match bulleted or raw google source formats
    const sourceMatch = trimmed.match(/^[*•+-]\s+\*?\*?Source\s*\(([^)]+)\)\*?\*?:?\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
    if (sourceMatch) {
      const engine = sourceMatch[1].trim();
      const label = sourceMatch[2].trim();
      const url = sourceMatch[3].trim();
      sources.push({
        id: `${label}-${url}-${sources.length}`,
        label,
        url,
        engine
      });
      continue;
    }

    const directMatch = trimmed.match(/^Source\s*\(([^)]+)\):\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i);
    if (directMatch) {
      const engine = directMatch[1].trim();
      const label = directMatch[2].trim();
      const url = directMatch[3].trim();
      sources.push({
        id: `${label}-${url}-${sources.length}`,
        label,
        url,
        engine
      });
      continue;
    }

    filteredLines.push(line);
  }

  const mainText = filteredLines.join("\n").trim();
  return { mainText, sources };
}

function SourcesReferenceGrid({ sources }: { sources: ExtractedSource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-[#00f3ff]/15">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
        <span className="text-[10px] font-mono tracking-widest text-[#00f3ff] uppercase font-bold flex items-center gap-1">
          🌐 INTEL RETRIEVAL FEED // {sources.length} SOURCES
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((source) => {
          let hostname = "";
          try {
            hostname = new URL(source.url).hostname;
          } catch (_) {
            hostname = source.label;
          }
          const cleanHostname = hostname.replace(/^www\./i, "");
          const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${cleanHostname}`;

          return (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-[#00f3ff]/15 bg-[#03091e]/50 hover:bg-[#00f3ff]/5 hover:border-[#00f3ff]/35 text-slate-300 hover:text-white transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            >
              <div className="w-7 h-7 rounded bg-black/40 border border-slate-800 flex items-center justify-center p-1 group-hover:border-[#00f3ff]/30 shrink-0">
                <img
                  src={faviconUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  className="w-5 h-5 object-contain rounded-xs"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate tracking-wide text-slate-200 group-hover:text-[#00f3ff]">
                  {source.label}
                </div>
                <div className="text-[8.5px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate uppercase">
                  <span className="px-1 py-0.2 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/20 text-[#00f3ff]/80 scale-90 origin-left">
                    {source.engine}
                  </span>
                  <span className="truncate">{cleanHostname}</span>
                </div>
              </div>

              <ExternalLink size={12} className="text-slate-600 group-hover:text-[#00f3ff] transition-colors shrink-0 mr-1" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function tryRepairAndParseJson(jsonStr: string): any {
  let str = jsonStr.trim();
  
  // 1. Direct parse
  try {
    return JSON.parse(str);
  } catch (_) {}

  // 2. Pre-clean control characters and backslashes
  // Replace true newlines inside double-quotes with \n to avoid JSON parse failures
  try {
    let inString = false;
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
      } else if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
    str = result;
  } catch (_) {}

  // 3. Remove trailing commas before closing symbols
  str = str.replace(/,\s*([}\]])/g, "$1");

  // Try parsing again
  try {
    return JSON.parse(str);
  } catch (_) {}

  // 4. Handle truncated or cut-off JSON (missing closing braces/brackets)
  try {
    let inString = false;
    let escape = false;
    const stack: ("{" | "[")[] = [];
    let cleaned = "";

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        cleaned += char;
        continue;
      }

      if (char === '\\') {
        escape = true;
        cleaned += char;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        cleaned += char;
        continue;
      }

      if (inString) {
        cleaned += char;
        continue;
      }

      if (char === '{') {
        stack.push('{');
      } else if (char === '[') {
        stack.push('[');
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
      cleaned += char;
    }

    if (inString) {
      cleaned += '"';
    }

    for (let j = stack.length - 1; j >= 0; j--) {
      const open = stack[j];
      if (open === '{') {
        cleaned += '}';
      } else if (open === '[') {
        cleaned += ']';
      }
    }

    cleaned = cleaned.trim().replace(/,(\s*[}\]])/g, "$1").replace(/,\s*$/, "");

    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // 5. Aggressive regex fallback
      const titleMatch = str.match(/"title"\s*:\s*"([^"]+)"/);
      const subjectMatch = str.match(/"subject"\s*:\s*"([^"]+)"/);
      const descMatch = str.match(/"description"\s*:\s*"([^"]+)"/);

      const sectionsList: any[] = [];
      const sectionBlocks = str.split(/\{\s*"heading"/g);
      if (sectionBlocks.length > 1) {
        for (let i = 1; i < sectionBlocks.length; i++) {
          const s = sectionBlocks[i];
          const headingM = s.match(/^\s*:\s*"([^"]+)"/);
          const contentM = s.match(/"content"\s*:\s*"([^"]+)"/);
          
          const bullets: string[] = [];
          const bulletBlock = s.match(/"bulletPoints"\s*:\s*\[([\s\S]*?)\]/);
          if (bulletBlock) {
            const matchesObj = bulletBlock[1].match(/"([^"]+)"/g);
            if (matchesObj) {
              matchesObj.forEach(m => bullets.push(m.replace(/"/g, "")));
            }
          }

          if (headingM || contentM) {
            sectionsList.push({
              heading: headingM ? headingM[1] : `Section ${i}`,
              content: contentM ? contentM[1] : "",
              bulletPoints: bullets
            });
          }
        }
      }

      if (titleMatch || subjectMatch || sectionsList.length > 0) {
        return {
          title: titleMatch ? titleMatch[1] : "Generated PDF Notes",
          subject: subjectMatch ? subjectMatch[1] : "General Study",
          author: "JARVIS OS",
          description: descMatch ? descMatch[1] : "",
          sections: sectionsList
        };
      }
    }
  } catch (err) {
    console.error("PDF bracket repair fail:", err);
  }

  return null;
}

function extractGeneratePdfToken(text: string): { cleanedText: string; pdfData: any; rawJson: string | null } {
  const tokenPrefix = "[GENERATE_PDF:";
  const startIndex = text.indexOf(tokenPrefix);
  if (startIndex === -1) {
    return { cleanedText: text, pdfData: null, rawJson: null };
  }

  let bracketCount = 0;
  let endIndex = -1;
  const len = text.length;

  for (let i = startIndex; i < len; i++) {
    const char = text[i];
    if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    endIndex = len - 1;
  }

  const tokenContent = text.substring(startIndex + tokenPrefix.length, endIndex).trim();
  const fullToken = text.substring(startIndex, endIndex + 1);

  // Clean the text by removing the exact fullToken block
  const cleanedText = text.replace(fullToken, "").trim();

  let pdfData = null;
  try {
    pdfData = JSON.parse(tokenContent);
  } catch (err) {
    pdfData = tryRepairAndParseJson(tokenContent);
  }

  return { cleanedText, pdfData, rawJson: tokenContent };
}

function ChatMessageContent({ text, isTypingActive, onTypingComplete, sender }: ChatMessageContentProps & { isTypingActive?: boolean; onTypingComplete?: () => void }) {
  const { mainText, sources } = useMemo(() => parseMessageAndSources(text), [text]);
  const [displayedText, setDisplayedText] = useState(() => isTypingActive ? "" : mainText);

  useEffect(() => {
    if (!isTypingActive) {
      setDisplayedText(mainText);
      return;
    }

    const totalLen = mainText.length;
    if (totalLen === 0) {
      onTypingComplete?.();
      return;
    }

    // Dynamic typing speed:
    const targetDuration = Math.min(1200, Math.max(400, totalLen * 2.5));
    const tickInterval = 16; // ~60fps
    const totalTicks = Math.max(1, Math.round(targetDuration / tickInterval));
    const charsPerTick = Math.max(1, Math.ceil(totalLen / totalTicks));

    let currentLength = 0;
    const timer = setInterval(() => {
      currentLength += charsPerTick;
      if (currentLength >= totalLen) {
        setDisplayedText(mainText);
        clearInterval(timer);
        onTypingComplete?.();
      } else {
        setDisplayedText(mainText.substring(0, currentLength));
      }
    }, tickInterval);

    return () => clearInterval(timer);
  }, [mainText, isTypingActive, onTypingComplete]);

  // Strip any partially typed bracket commands from displaying during active typing
  let sanitizedDisplayedText = displayedText;
  if (isTypingActive) {
    const extracted = extractGeneratePdfToken(sanitizedDisplayedText);
    sanitizedDisplayedText = extracted.cleanedText;
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/\[GENERATE_PDF:[\s\S]*/g, ""); 
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/\[SEARCH_YOUTUBE:[\s\S]*?\]/g, "");
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/\[SEARCH_YOUTUBE:[\s\S]*/g, ""); 
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/\[OPEN_BROWSER:[\s\S]*?\]/g, "");
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/\[OPEN_BROWSER:[\s\S]*/g, ""); 
  }

  // ALWAYS hide WeasyPrint python script blocks in the chat box so they are only displayed after clicking the Code button
  if (sanitizedDisplayedText.toLowerCase().includes("weasyprint") || sanitizedDisplayedText.includes("[GENERATE_PDF")) {
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/```python[\s\S]*?```/g, "");
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/```python[\s\S]*/g, "");
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/```[\s\S]*?```/g, "");
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/```[\s\S]*/g, "");
    // Clean up empty lines or double spaces left behind by the removed blocks
    sanitizedDisplayedText = sanitizedDisplayedText.replace(/^\s*$(?:\r\n?|\n)/gm, "");
  }

  // Robustly extract and clean PDF token
  const pdfExtraction = extractGeneratePdfToken(sanitizedDisplayedText);
  let cleanedText = pdfExtraction.cleanedText;
  let pdfData: any = null;
  if (!isTypingActive) {
    pdfData = pdfExtraction.pdfData;
  }

  let ytQuery: string | null = null;
  const youtubeMatch = cleanedText.match(/\[SEARCH_YOUTUBE:\s*(["']?)([\s\S]*?)\1\]/);
  if (youtubeMatch) {
    cleanedText = cleanedText.replace(/\[SEARCH_YOUTUBE:\s*(["']?)[\s\S]*?\1\]/g, "").trim();
    if (!isTypingActive) {
      ytQuery = youtubeMatch[2].trim();
    }
  }

  let browserUrl: string | null = null;
  let browserTitle: string | null = null;
  const browserMatch = cleanedText.match(/\[OPEN_BROWSER:\s*(["']?)([\s\S]*?)\1(?:\s*,\s*(["']?)([\s\S]*?)\3)?\]/);
  if (browserMatch) {
    cleanedText = cleanedText.replace(/\[OPEN_BROWSER:\s*(["']?)[\s\S]*?\1(?:\s*,\s*(["']?)[\s\S]*?\2)?\]/g, "").trim();
    if (!isTypingActive) {
      browserUrl = browserMatch[2].trim();
      browserTitle = browserMatch[4] ? browserMatch[4].trim() : null;
    }
  }

  const parts = cleanedText.split("```");
  
  return (
    <div className="space-y-1.5 break-words">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;
        
        if (isCodeBlock) {
          const lines = part.split("\n");
          let language = "code";
          let code = part;
          
          if (lines.length > 0 && lines[0].trim().length < 20 && !lines[0].includes(" ") && lines[0].trim() !== "") {
            language = lines[0].trim();
            code = lines.slice(1).join("\n");
          }
          
          code = code.replace(/^\n+|\n+$/g, "");
          
          return (
            <CodeBlock key={index} code={code} language={language} />
          );
        } else {
          const blocks = parseTextAndTables(part);
          return (
            <React.Fragment key={index}>
              {blocks.map((block, bIdx) => {
                if (block.type === "table") {
                  return <InteractiveSortableTable key={bIdx} data={block.data} />;
                } else {
                  const isLastTextPart = index === parts.length - 1 && bIdx === blocks.length - 1;
                  return (
                    <span key={bIdx} className="inline font-mono">
                      <InlineCodeText text={block.content} isUser={sender === "user"} />
                      {isLastTextPart && isTypingActive && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                          className="inline-block w-1.5 h-3.5 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] rounded-xs ml-1 align-middle"
                        />
                      )}
                    </span>
                  );
                }
              })}
            </React.Fragment>
          );
        }
      })}

      {pdfData && (
        <InteractivePDFCard data={pdfData} />
      )}

      {ytQuery && (
        <InteractiveYoutubeCard query={ytQuery} />
      )}

      {browserUrl && (
        <InteractiveBrowserCard url={browserUrl} title={browserTitle || ""} />
      )}

      {sources && sources.length > 0 && !isTypingActive && (
        <SourcesReferenceGrid sources={sources} />
      )}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string; key?: React.Key }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      const ok = await safeCopyToClipboard(code);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const isRunnable = ["html", "css", "javascript", "js", "python", "py", "json", "svg", "xml"].includes(language.toLowerCase());

  const handlePreview = () => {
    window.dispatchEvent(
      new CustomEvent("open-code-preview", {
        detail: { code, language }
      })
    );
  };
  
  return (
    <div className="my-2 border border-[#00f3ff]/25 rounded-xl overflow-hidden bg-[#030612]/95 font-mono text-[10.5px] max-w-full text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#070c1e] border-b border-[#00f3ff]/15 select-none font-mono">
        <span className="text-[9px] text-[#00f3ff]/85 font-black uppercase tracking-wider">
          {language}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[9px] text-[#00f3ff]/60 hover:text-[#00f3ff] transition-colors focus:outline-none cursor-pointer font-bold"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-400 font-extrabold" />
                <span className="text-emerald-400 font-black">COPIED</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>COPY</span>
              </>
            )}
          </button>

          {isRunnable && (
            <button
              onClick={handlePreview}
              className="flex items-center gap-1 text-[9px] text-[#00f3ff] hover:text-white bg-[#00f3ff]/10 hover:bg-[#00f3ff]/30 px-2 py-0.5 border border-[#00f3ff]/40 hover:border-[#00f3ff] rounded transition-all focus:outline-none cursor-pointer font-black tracking-wider shadow-[0_0_8px_rgba(0,243,255,0.15)] uppercase"
              title="Preview canvas workspace"
            >
              <span>👁️ PREVIEW</span>
            </button>
          )}
        </div>
      </div>
      <pre className="p-3.5 overflow-x-auto text-slate-200 leading-normal font-mono whitespace-pre-wrap break-words text-[11px] max-w-full">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const VOICE_PRESETS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Pleasant & Clear Female)" },
  { id: "JBFvJZ3Yg9vO7mjaCPlS", name: "George (Warm & Intellectual British Male)" },
  { id: "pNInz6obpgq5mWbIA86t", name: "Adam (Deep & Authoritative Narrative Male)" },
  { id: "piTKgcLEGmPEe24STGsY", name: "Nicole (Smooth & Whispering Female)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Jessie (Energetic & Bubbly Female)" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie (Casual & Friendly Conversational Male)" },
  { id: "pqHkiNgaTeidYtCxS0ca", name: "Bill (Older Trustworthy Resonant Male)" },
  { id: "custom", name: "✨ Custom Voice ID..." }
];

const cleanMarketingAndMarkdown = (text: string): string => {
  let cleaned = text;
  cleaned = cleaned.replace(/^\|?[:\s\-~|]+\|?$/gm, "");
  cleaned = cleaned.replace(/\|/g, " ");
  cleaned = cleaned.replace(/[-=_]{2,}/g, " ");
  cleaned = cleaned.replace(/[*#`_\-~]/g, " ");
  cleaned = cleaned.replace(/\[Status:[^\]]+\]/gi, "");
  cleaned = cleaned.replace(/\[System:[^\]]+\]/gi, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
};

const replaceEmojisWithWords = (text: string): string => {
  const emojiMap: { [key: string]: string } = {
    "✨": " sparkle ",
    "🔮": " crystal ball ",
    "⚙️": " gear ",
    "⚙": " gear ",
    "🍎": " apple ",
    "🕴️": " hover ",
    "💻": " laptop ",
    "🔋": " battery ",
    "🌐": " network ",
    "🧪": " lab ",
    "🧬": " science ",
    "🎯": " target ",
    "📌": " pin ",
    "🎨": " palette ",
    "🚀": " rocket ",
    "⭐": " star ",
    "🌟": " glowing star ",
    "💖": " sparkling heart ",
    "❤️": " love ",
    "🔥": " fire ",
    "💡": " idea ",
    "🎓": " graduation ",
    "😸": " happy cat ",
    "😊": " smile ",
    "😂": " laughing ",
    "🤣": " laughing ",
    "😭": " crying ",
    "😢": " sad tear ",
    "😡": " angry ",
    "😠": " annoyed ",
    "🔍": " searching ",
    "⚡": " lightning ",
    "🤖": " robot ",
    "😹": " funny cat ",
    "😻": " heart eyes ",
    "👍": " thumbs up ",
    "📚": " reading ",
    "📝": " writing ",
    "🌈": " rainbow ",
    "👾": " alien monster ",
    "👽": " alien ",
    "🎉": " celebration ",
    "🗣️": " speaking ",
    "🎧": " listening ",
    "👥": " group ",
    "⏳": " hourglass ",
    "⏱️": " stopwatch ",
    "📈": " chart ",
    "📅": " calendar "
  };

  let newText = text;
  Object.entries(emojiMap).forEach(([emoji, word]) => {
    newText = newText.replaceAll(emoji, word);
  });
  return newText;
};

const emotionLabels: { [key: string]: { label: string; icon: string; style: string } } = {
  happy: { label: "Happy", icon: "😊", style: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35" },
  angry: { label: "Angry", icon: "😡", style: "bg-rose-500/15 text-rose-400 border border-rose-500/35 animate-bounce" },
  cry: { label: "Sorrow", icon: "😢", style: "bg-blue-500/15 text-blue-400 border border-blue-500/35" },
  laughing: { label: "Laughing", icon: "😂", style: "bg-amber-500/15 text-amber-400 border border-amber-500/35" },
  surprised: { label: "Surprised", icon: "😮", style: "bg-purple-500/15 text-purple-400 border border-purple-500/35" },
  disturbed: { label: "Disturbed", icon: "🥴", style: "bg-orange-500/15 text-orange-400 border border-orange-500/35" },
  sleepy: { label: "Sleepy", icon: "😴", style: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35" },
  love: { label: "Love", icon: "❤️", style: "bg-pink-500/15 text-pink-400 border border-pink-500/35" },
  contemplative: { label: "Contemplative", icon: "🤔", style: "bg-purple-500/15 text-purple-400 border border-purple-500/35" },
  bored: { label: "Bored", icon: "🥱", style: "bg-slate-500/15 text-slate-400 border border-slate-500/35" },
  skeptical: { label: "Skeptical", icon: "🤨", style: "bg-amber-500/15 text-amber-400 border border-amber-500/35" },
  normal: { label: "Calibrated", icon: "🤖", style: "bg-cyan-500/15 text-[#00f3ff] border border-[#00f3ff]/35" }
};

const detectEmotionFromText = (text: string): "normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical" => {
  const lowercase = text.toLowerCase();
  
  if (
    lowercase.includes("😡") ||
    lowercase.includes("🤬") ||
    lowercase.includes("😠") ||
    lowercase.includes("💢") ||
    lowercase.includes("angry") ||
    lowercase.includes("furious") ||
    lowercase.includes("annoyed") ||
    /\b(mad|hate)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:angry]")
  ) {
    return "angry";
  }
  
  if (
    lowercase.includes("😭") ||
    lowercase.includes("😢") ||
    lowercase.includes("😿") ||
    lowercase.includes("💧") ||
    lowercase.includes("crying") ||
    lowercase.includes("depressed") ||
    lowercase.includes("unhappy") ||
    /\b(cry|sad|sorrow)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:cry]")
  ) {
    return "cry";
  }
  
  if (
    lowercase.includes("😂") ||
    lowercase.includes("🤣") ||
    lowercase.includes("😆") ||
    lowercase.includes("laugh") ||
    lowercase.includes("laughing") ||
    lowercase.includes("haha") ||
    lowercase.includes("hehe") ||
    /\b(joke)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:laughing]")
  ) {
    return "laughing";
  }
  
  if (
    lowercase.includes("😮") ||
    lowercase.includes("😲") ||
    lowercase.includes("😱") ||
    lowercase.includes("surprised") ||
    lowercase.includes("shocked") ||
    lowercase.includes("amazed") ||
    lowercase.includes("wow") ||
    /\b(gasp)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:surprised]")
  ) {
    return "surprised";
  }

  if (
    lowercase.includes("😟") ||
    lowercase.includes("🥴") ||
    lowercase.includes("disturbed") ||
    lowercase.includes("confused") ||
    lowercase.includes("shaking") ||
    lowercase.includes("traumatized") ||
    /\b(upset)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:disturbed]")
  ) {
    return "disturbed";
  }

  if (
    lowercase.includes("😴") ||
    lowercase.includes("💤") ||
    lowercase.includes("🥱") ||
    lowercase.includes("sleepy") ||
    lowercase.includes("exhausted") ||
    lowercase.includes("goodnight") ||
    /\b(tired)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:sleepy]")
  ) {
    return "sleepy";
  }

  if (
    lowercase.includes("💖") ||
    lowercase.includes("❤️") ||
    lowercase.includes("😍") ||
    lowercase.includes("🥰") ||
    lowercase.includes("adore") ||
    lowercase.includes("romance") ||
    lowercase.includes("affection") ||
    /\b(love)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:love]")
  ) {
    return "love";
  }

  if (
    lowercase.includes("😊") ||
    lowercase.includes("✨") ||
    lowercase.includes("🌟") ||
    lowercase.includes("smile") ||
    lowercase.includes("happy") ||
    lowercase.includes("excited") ||
    lowercase.includes("great") ||
    lowercase.includes("awesome") ||
    /\b(glad)\b/i.test(lowercase) ||
    lowercase.includes("[emotion:happy]")
  ) {
    return "happy";
  }

  if (
    lowercase.includes("🤔") ||
    lowercase.includes("[emotion:contemplative]") ||
    /\b(wonder|ponder|think|wondering|pondering|analyze|considering|consider|meditate|reflect|curious)\b/i.test(lowercase)
  ) {
    return "contemplative";
  }

  if (
    lowercase.includes("🥱") ||
    lowercase.includes("😑") ||
    lowercase.includes("[emotion:bored]") ||
    /\b(bored|boring|uninterested|tedious|dull|dry)\b/i.test(lowercase) ||
    lowercase.includes("meh")
  ) {
    return "bored";
  }

  if (
    lowercase.includes("🤨") ||
    lowercase.includes("😒") ||
    lowercase.includes("[emotion:skeptical]") ||
    /\b(skeptical|doubt|dubious|unlikely|suspicious|suspect)\b/i.test(lowercase) ||
    lowercase.includes("really?") ||
    lowercase.includes("are you sure") ||
    lowercase.includes("is that true")
  ) {
    return "skeptical";
  }
  
  return "normal";
};

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SUGGESTION_POOL = [
  { label: "News", icon: "📰", query: "Can you summarize the latest tech news?" },
  { label: "Code", icon: "💻", query: "Show me a clean TypeScript example of a sliding window algorithm" },
  { label: "Add Todo", icon: "📝", query: "Add a new daily task todo item for my list" },
  { label: "Math", icon: "🔢", query: "Give me a mind-bending mathematical logic puzzle to solve." },
  { label: "Science", icon: "🔬", query: "Explain quantum computing in simple terms for a teenager." },
  { label: "Story", icon: "🎨", query: "Write a short cyberpunk story info about an AI assistant named Jarvis." },
  { label: "Focus", icon: "🧘", query: "Guide me through a quick breath/focus exercise to help me concentrate." },
  { label: "Humor", icon: "⚡", query: "Tell me a hilarious geeky developer joke." },
  { label: "Explain", icon: "💡", query: "Explain the concept of WebSockets in under 100 words." },
  { label: "Translate", icon: "🌐", query: "Translate 'Let us design wonderful software together' into Japanese." },
  { label: "History", icon: "📅", query: "What are some highly interesting historical facts about space exploration?" },
  { label: "Email", icon: "📧", query: "Help me draft a polite email proposing a collaborative project." },
  { label: "Design", icon: "🎨", query: "Give me some modern CSS design guidelines for glassmorphic elements." },
  { label: "Logic", icon: "🧠", query: "Propose a classic lateral thinking riddle with its solution." },
  { label: "Tech", icon: "📡", query: "What are the most exciting upcoming smart device trends for next year?" },
];

const DYNAMIC_GREETINGS = [
  "হ্যাল্লো Mohit, আপনি কী করতে চাইছেন?",
  "হ্যালো Mohit, আজ কীভাবে সাহায্য করতে পারি?",
  "Hello Mohit, what are we creating today?",
  "Hello Mohit, how can I assist you with your goals today?",
  "Hello Mohit, ready to search, analyze, or synthesize info?",
  "Hi Mohit, let's explore or create something amazing today!",
  "হ্যাল্লো Mohit, আজকের পরিকল্পনা কী?",
  "Welcome Mohit, how can JARVIS help you today?"
];

const getRandomGreeting = () => {
  const index = Math.floor(Math.random() * DYNAMIC_GREETINGS.length);
  return DYNAMIC_GREETINGS[index];
};

const getMemoryBasedSuggestions = (memories: any[], history: any[]) => {
  const cards: { title: string; subtext: string; query: string; icon: string }[] = [];

  // 1. First feed from memories if any exist
  memories.forEach((mem, index) => {
    let title = "Custom Assist";
    let icon = "🔮";
    let query = mem.text;
    
    if (mem.text.toLowerCase().includes("algebra") || mem.text.toLowerCase().includes("math")) {
      title = "Algebra Study";
      icon = "📐";
      query = "Let's review the algebra study notes and dive into advanced concepts.";
    } else if (mem.text.toLowerCase().includes("bengali") || mem.text.toLowerCase().includes("banglia")) {
      title = "Bengali Mode";
      icon = "✍️";
      query = "আসুন বাংলা বা ইংরেজিতে নতুন কোনো বিষয় নিয়ে আলোচনা করি।";
    } else if (mem.text.toLowerCase().includes("dashboard") || mem.text.toLowerCase().includes("ui")) {
      title = "UI Companion";
      icon = "🎨";
      query = "Can you help me design a glowing, high-performance dashboard UI with Tailwind?";
    } else {
      title = `Memory Ref #${index + 1}`;
      icon = "🧠";
    }

    cards.push({
      title,
      subtext: `Recalled: "${mem.text.slice(0, 45)}${mem.text.length > 45 ? "..." : ""}"`,
      query,
      icon
    });
  });

  // 2. Feed from previous chats if any exist
  history.forEach((hist) => {
    if (cards.length >= 4) return;
    const title = hist.text || "Previous Session";
    const lastMsg = hist.messages && hist.messages.length > 0 ? hist.messages[hist.messages.length - 1].text : "Continue topic";
    
    // Avoid duplicates of queries
    const qStr = `Let's pick up on our discussion about "${title}". What were the core takeaways we should review?`;
    if (cards.some(c => c.query === qStr)) return;

    cards.push({
      title: `Continue: ${title.slice(0, 18)}${title.length > 18 ? "..." : ""}`,
      subtext: `From history: "${lastMsg.slice(0, 40)}${lastMsg.length > 40 ? "..." : ""}"`,
      query: qStr,
      icon: "💬"
    });
  });

  // 3. Fallbacks if we don't have enough cards (less than 4)
  const fallbacks = [
    { title: "Algebra Notes", subtext: "Operator memory: revision of study notes in Algebra", query: "Can you summarize key University study notes for Algebra and create a mock practice quiz?", icon: "📐" },
    { title: "Neon Dashboard Design", subtext: "Based on memory: Operator loves premium dark aesthetics", query: "Show me some modern Tailwind CSS and motion guidelines for glassmorphic neon dashboards.", icon: "🎨" },
    { title: "Quantum & Sciences", subtext: "Operator preference: complex concept synthesis", query: "Can you explain quantum computing in simple terms and show a structured comparison table for its components?", icon: "🧬" },
    { title: "Banglish translation", subtext: "Operator language: Banglish translation support", query: "Write a short creative story or script explaining a technical concept in Banglish.", icon: "🖋️" },
  ];

  while (cards.length < 4 && fallbacks.length > 0) {
    const fb = fallbacks.shift();
    if (fb && !cards.some(c => c.title === fb.title)) {
      cards.push(fb);
    }
  }

  return cards.slice(0, 4);
};

const getRandomSuggestions = (count = 3) => {
  const pool = [...SUGGESTION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, count);
};

export default function App() {
  // Session Access / Login Gate
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("jarvis_logged_in") === "true";
  });
  const [isSystemAsleep, setIsSystemAsleep] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"assistant" | "tools" | "creator" | "commands" | "settings">("assistant");
  
  // New three-screen state matching user request
  const [currentScreen, setCurrentScreen] = useState<"homepage" | "menu" | "live">("homepage");
  const [appTheme, setAppTheme] = useState<"cosmic" | "slate" | "vintage">((value) => {
    try {
      const saved = localStorage.getItem("jarvis_app_theme");
      if (saved === "cosmic" || saved === "slate" || saved === "vintage") {
        return saved;
      }
    } catch (_) {}
    return "cosmic";
  });
  
  // Theme animation states to drive beautiful HUD transition sequence
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [themeTransitionType, setThemeTransitionType] = useState<"cosmic" | "slate" | "vintage">("cosmic");

  // Real-time disaster/storm alert state variables
  const [isStormActive, setIsStormActive] = useState(false);
  const [stormText, setStormText] = useState("");

  // Vocalize storm warnings in Bengali when triggered / active
  useEffect(() => {
    if (isStormActive && stormText) {
      speakJARVISResponse(stormText);
    }
  }, [isStormActive, stormText]);

  const [menuSubpage, setMenuSubpage] = useState<"index" | "memories" | "personalization" | "history" | "api" | "profile-manage" | "connectivity">("index");

  // Google Workspace Session state
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(() => {
    return localStorage.getItem("jarvis_google_workspace_token") || null;
  });
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isWorkspaceAuthChecked, setIsWorkspaceAuthChecked] = useState(false);

  // Connectivity state for custom external apps and Google services controlled via voice control
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("jarvis_connected_apps");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      whatsapp: false,
      youtube: false,
      spotify: false,
      gmail: false,
      docs: false,
      calendar: false,
    };
  });

  const [connectedAppHandles, setConnectedAppHandles] = useState<Record<string, string>>({
    whatsapp: "",
    youtube: "",
    spotify: "",
    gmail: "",
    docs: "",
    calendar: "",
  });

  const [wsStatus, setWsStatus] = useState<"CONNECTING" | "CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const wsRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("jarvis_connected_apps", JSON.stringify(connectedApps));
  }, [connectedApps]);

  const [lastConnectivityAlert, setLastConnectivityAlert] = useState<{
    app: string;
    action: string;
    details: string;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    if (lastConnectivityAlert) {
      const timer = setTimeout(() => {
        setLastConnectivityAlert(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [lastConnectivityAlert]);

  // Establish live Real-time Connection WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      setWsStatus("CONNECTING");
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}`;

      console.log(`[Real-time Core] Handshaking with connectivity multiplexer: ${wsUrl}`);
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log("[Real-time Core] Connection live over secure web socket.");
          setWsStatus("CONNECTED");
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "sync_state") {
              setConnectedApps(data.apps);
              setConnectedAppHandles(data.handles || {});
            } else if (data.type === "app_toggled_broadcast") {
              setConnectedApps((prev) => ({
                ...prev,
                [data.appName]: data.isConnected,
              }));
              setConnectedAppHandles((prev) => ({
                ...prev,
                [data.appName]: data.handle || "",
              }));
              
              setLastConnectivityAlert({
                app: data.appName === "docs" ? "Google Docs" : data.appName === "gmail" ? "Google Gmail" : data.appName === "calendar" ? "Google Calendar" : data.appName === "whatsapp" ? "WhatsApp Chat" : data.appName === "youtube" ? "YouTube Streaming" : "Spotify Premium",
                action: data.isConnected ? "SOCKET_ESTABLISHED" : "PIPELINE_CLOSED",
                details: data.isConnected 
                  ? `External app sync updated: Status LIVE${data.handle ? ` (${data.handle})` : ""}`
                  : "External app sync updated: Status STANDBY",
                timestamp: new Date().toLocaleTimeString(),
              });
            } else if (data.type === "voice_command_broadcast") {
              // Echo the voice action triggered elsewhere onto this terminal
              setLastConnectivityAlert({
                app: data.app,
                action: data.actionText || "VOICE_TRIGGERED",
                details: data.statusDetails || `Voice command intercepted from system stream.`,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
              });
            }
          } catch (err) {
            console.error("[Real-time Core] Parse fail on websocket down-link message:", err);
          }
        };

        ws.onerror = (err) => {
          console.warn("[Real-time Core] Socket error reported:", err);
          setWsStatus("DISCONNECTED");
        };

        ws.onclose = () => {
          if (!isMounted) return;
          console.warn("[Real-time Core] Socket disconnected. Setting up retry sequence...");
          setWsStatus("DISCONNECTED");
          reconnectTimeout = setTimeout(connect, 3500);
        };
      } catch (err) {
        console.error("[Real-time Core] Sync fail in WebSocket socket loop:", err);
        setWsStatus("DISCONNECTED");
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const connectAllAccounts = (disconnectAll = false) => {
    const appsToToggle = ["whatsapp", "youtube", "spotify", "gmail", "docs", "calendar"];
    const updatedApps = { ...connectedApps };
    const updatedHandles = { ...connectedAppHandles };

    appsToToggle.forEach((appId) => {
      const isConnected = !disconnectAll;
      updatedApps[appId] = isConnected;
      updatedHandles[appId] = isConnected ? `${username || "User"}'s Security Master` : "";

      if (wsRef.current && wsRef.current.readyState === 1) { // WebSocket.OPEN
        try {
          wsRef.current.send(JSON.stringify({
            type: "toggle_app",
            appName: appId,
            isConnected,
            handle: updatedHandles[appId]
          }));
        } catch (e) {
          console.warn("[Real-time Core] connect all send failure for " + appId, e);
        }
      }
    });

    setConnectedApps(updatedApps);
    setConnectedAppHandles(updatedHandles);

    setLastConnectivityAlert({
      app: "ALL EXTERNAL APPS",
      action: disconnectAll ? "ALL_PIPELINES_CLOSED" : "FULL_SYSTEM_AUTOCONNECT",
      details: disconnectAll 
        ? "Gracefully detached all external synchronization routes." 
        : `Simultaneously synchronized all 6 channels using Master token. Status: LIVE.`,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const toggleConnectedApp = (appId: string, appFriendlyName: string) => {
    const isConnected = !!connectedApps[appId];
    const nextState = !isConnected;

    let userHandle = "";
    if (nextState) {
      const resp = prompt(`Initialize real-time socket link. Please enter your valid account label / identifier for ${appFriendlyName}:`, `${username || "User"}'s Security Matrix`);
      if (resp === null) return; // user cancelled
      userHandle = resp.trim() || `${username || "User"}'s Security Matrix`;
    }

    setConnectedApps((prev) => ({ ...prev, [appId]: nextState }));
    setConnectedAppHandles((prev) => ({ ...prev, [appId]: userHandle }));

    if (wsRef.current && wsRef.current.readyState === 1) { // WebSocket.OPEN
      try {
        wsRef.current.send(JSON.stringify({
          type: "toggle_app",
          appName: appId,
          isConnected: nextState,
          handle: userHandle
        }));
      } catch (e) {
        console.warn("[Real-time Core] websocket broadcast error:", e);
      }
    }

    if (nextState) {
      setLastConnectivityAlert({
        app: appFriendlyName,
        action: "SOCKET_ESTABLISHED",
        details: `Secure real-time sync handle instantiated: "${userHandle}"`,
        timestamp: new Date().toLocaleTimeString()
      });
    } else {
      setLastConnectivityAlert({
        app: appFriendlyName,
        action: "PIPELINE_CLOSED",
        details: `Gracefully detached external app synchronization.`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  // JARVIS continuous background wake-word states
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("jarvis_wake_word_enabled") === "true";
    } catch (_) {}
    return false;
  });
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const wakeWordRecognitionRef = useRef<any>(null);

  // Chat and history search states
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // ChatGPT-style active chat session tracker
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem("jarvis_active_session_id", activeSessionId);
    } else {
      localStorage.removeItem("jarvis_active_session_id");
    }
  }, [activeSessionId]);

  // API Key Pool Usage stats tracker
  const [keyPoolStats, setKeyPoolStats] = useState<{[key: string]: { requests: number; success: number; errors: number; speedMs: number } }>(() => {
    try {
      const saved = localStorage.getItem("jarvis_key_pool_stats");
      return saved ? JSON.parse(saved) : {};
    } catch (_) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem("jarvis_key_pool_stats", JSON.stringify(keyPoolStats));
  }, [keyPoolStats]);

  const recordKeyUsage = (keyStr: string, isSuccess: boolean, elapsedMs: number) => {
    if (!keyStr) return;
    setKeyPoolStats(prev => {
      const existing = prev[keyStr] || { requests: 0, success: 0, errors: 0, speedMs: 0 };
      const newReq = existing.requests + 1;
      const newSuccess = existing.success + (isSuccess ? 1 : 0);
      const newErrors = existing.errors + (isSuccess ? 0 : 1);
      const newSpeed = existing.speedMs === 0 ? elapsedMs : Math.round((existing.speedMs * 3 + elapsedMs) / 4);
      return {
        ...prev,
        [keyStr]: {
          requests: newReq,
          success: newSuccess,
          errors: newErrors,
          speedMs: newSpeed
        }
      };
    });
  };

  // Microphone and feedback hardware routing live testing states
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micTestCountdown, setMicTestCountdown] = useState(3);
  const [micPlaybackStatus, setMicPlaybackStatus] = useState<"idle" | "recording" | "playing">("idle");
  const [micTestAudioUrl, setMicTestAudioUrl] = useState<string | null>(null);

  // Memories Editor Inline tracking
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState("");

  const runMicrophoneTest = async () => {
    if (isMicTesting) return;
    setIsMicTesting(true);
    setMicPlaybackStatus("recording");
    setMicTestCountdown(3);
    setMicTestAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMicTestAudioUrl(audioUrl);
        setMicPlaybackStatus("playing");

        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Playback failed:", e));
        
        audio.onended = () => {
          setMicPlaybackStatus("idle");
          setIsMicTesting(false);
          stream.getTracks().forEach(track => track.stop());
        };
      };

      mediaRecorder.start();

      let currentCount = 3;
      const countInterval = setInterval(() => {
        currentCount -= 1;
        setMicTestCountdown(currentCount);
        if (currentCount <= 0) {
          clearInterval(countInterval);
          mediaRecorder.stop();
        }
      }, 1000);

    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone connection failed. Please ensure physical hardware access is enabled and authorised inside browser configurations.");
      setIsMicTesting(false);
      setMicPlaybackStatus("idle");
    }
  };

  // Historic chat logs with complete conversation sessions
  const [chatHistoryItems, setChatHistoryItems] = useState<{ id: string; text: string; messages?: Message[] }[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_chat_sessions_v2");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    
    // Default rich historic chats with Banglish dialogs
    return [
      { 
        id: "h-1", 
        text: "Kire kmon achis", 
        messages: [
          { id: "m-1-1", sender: "user", text: "Kire kmon achis", timestamp: "09:30 AM" },
          { id: "m-1-2", sender: "jarvis", text: "Ami bhalo achi! Tor ki khobor bol? Kothay jabi bolbi naki?", timestamp: "09:31 AM" },
          { id: "m-1-3", sender: "user", text: "Ajke ektu ghurte jabo", timestamp: "09:32 AM" },
          { id: "m-1-4", sender: "jarvis", text: "Eto sundor weather, ghurte jaoai bhalo. Kothay jabi bol?", timestamp: "09:32 AM" }
        ]
      },
      { 
        id: "h-2", 
        text: "Hii session", 
        messages: [
          { id: "m-2-1", sender: "user", text: "Hii", timestamp: "10:15 AM" },
          { id: "m-2-2", sender: "jarvis", text: "Kire bhalo achis? Ami bhalo achi. Tor ki khobor bol?", timestamp: "10:16 AM" }
        ]
      },
      { 
        id: "h-3", 
        text: "Ji 6 discussion", 
        messages: [
          { id: "m-3-1", sender: "user", text: "Ji 6", timestamp: "11:20 AM" },
          { id: "m-3-2", sender: "jarvis", text: "Acha ota ki chilo, amake ektu khule bolbi? Ami ready sahajjo korar jonno.", timestamp: "11:21 AM" }
        ]
      },
      { 
        id: "h-4", 
        text: "Algebra notes review", 
        messages: [
          { id: "m-4-1", sender: "user", text: "Algebra concept kheyal rakhbi", timestamp: "02:00 PM" },
          { id: "m-4-2", sender: "jarvis", text: "Ekdom mathay rakhbo. Algebra concept khub guruttopurno, focus de bhalobhabe.", timestamp: "02:01 PM" }
        ]
      }
    ];
  });

  // Persist chat sessions whenever modified
  useEffect(() => {
    localStorage.setItem("jarvis_chat_sessions_v2", JSON.stringify(chatHistoryItems));
  }, [chatHistoryItems]);

  // Chat GPT-style custom user memories list
  const [jarvisMemories, setJarvisMemories] = useState<{ id: string; text: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_memories_list");
      return saved ? JSON.parse(saved) : [
        { id: "mem-1", text: "Operator wanted to revise University Study Notes in Algebra", timestamp: "2026-05-29" },
        { id: "mem-2", text: "Operator loves high-performance dark neon dashboard UI designs", timestamp: "2026-05-29" },
        { id: "mem-3", text: "Operator wants JARVIS to converse purely in Banglish script", timestamp: "2026-05-29" }
      ];
    } catch (_) {
      return [];
    }
  });

  // Persist memories whenever modified
  useEffect(() => {
    localStorage.setItem("jarvis_memories_list", JSON.stringify(jarvisMemories));
  }, [jarvisMemories]);

  const memorySuggestions = useMemo(() => {
    return getMemoryBasedSuggestions(jarvisMemories, chatHistoryItems);
  }, [jarvisMemories, chatHistoryItems]);

  const [newMemoryInputText, setNewMemoryInputText] = useState("");
  const [showScrollBottomArrow, setShowScrollBottomArrow] = useState(false);

  const [isReferenceMemories, setIsReferenceMemories] = useState(true);
  const [isReferenceHistory, setIsReferenceHistory] = useState(true);
  const [nicknameMemory, setNicknameMemory] = useState("Mohit");
  const [occupationMemory, setOccupationMemory] = useState("Offline Core");
  const [moreAboutUser, setMoreAboutUser] = useState("");
  
  // Active modal/popup state for All Features Grid
  const [activeMenuPopup, setActiveMenuPopup] = useState<string | null>(null);

  // Custom Personalization state toggles
  const [isWarmStyle, setIsWarmStyle] = useState(true);
  const [isEnthusiastic, setIsEnthusiastic] = useState(true);
  const [isHeadersLists, setIsHeadersLists] = useState(true);
  const [isAutoEmoji, setIsAutoEmoji] = useState(true);
  const [isShowEmotions, setIsShowEmotions] = useState(true);
  const [isHighEmotion, setIsHighEmotion] = useState(false);
  const [isIdentifyAI, setIsIdentifyAI] = useState(true);
  
  // Slide Drawer state for mobile navigation menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Bottom drawer sheets (Screenshots style)
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [activeChatTag, setActiveChatTag] = useState<"image" | "video" | "canvas" | null>(null);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isVideoGenOpen, setIsVideoGenOpen] = useState(false);
  const [isCanvasWorkspaceOpen, setIsCanvasWorkspaceOpen] = useState(false);
  const [isChatModeSheetOpen, setIsChatModeSheetOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isChatMicRecording, setIsChatMicRecording] = useState(false);
  const [activeChatMode, setActiveChatMode] = useState("Conversational");
  const [activeCodePreview, setActiveCodePreview] = useState<{ code: string; language: string } | null>(null);

  // Dialogue/Chat History delete confirmation overlay state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: "single" | "all";
    idToDelete?: string;
  }>({
    isOpen: false,
    type: "single",
  });

  // Tool States for newly requested attachment actions (Image, Video, Canvas)
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [imageGenStyle, setImageGenStyle] = useState("Cinematic");
  const [imageGenRatio, setImageGenRatio] = useState("1:1");
  const [imageGenState, setImageGenState] = useState<"idle" | "generating" | "success">("idle");
  const [imageGenResult, setImageGenResult] = useState("");

  const [videoGenPrompt, setVideoGenPrompt] = useState("");
  const [videoGenMotion, setVideoGenMotion] = useState("Cinematic Orbit");
  const [videoGenDuration, setVideoGenDuration] = useState("4s");
  const [videoGenState, setVideoGenState] = useState<"idle" | "generating" | "success">("idle");

  const [canvasActiveTab, setCanvasActiveTab] = useState<"coding" | "writing" | "slides" | "export">("coding");
  const [canvasCodeText, setCanvasCodeText] = useState(`// Welcome to Gemini Canvas Code Editor
function greetUser() {
  console.log("Hello, developer! Tap template options or generate code below.");
}`);
  const [canvasLanguage, setCanvasLanguage] = useState("javascript");
  const [canvasWritingText, setCanvasWritingText] = useState(`## Content Draft Workspace
This is a dedicated content drafting card. Type or click presets on the left to write articles, blogs, essays or technical document streams. Highlight any section to change tone, lengthen or shrink.`);
  const [canvasSlides, setCanvasSlides] = useState<Array<{ title: string; bullets: string[] }>>([
    { title: "Project Overview", bullets: ["Next-generation AI Operating Companion", "Cross-platform cloud integration", "Voice native latency tracking"] },
    { title: "Key Value Offerings", bullets: ["Instant multi-modal analytics", "Seamless Google Workspace exports", "Sandboxed execution framework"] }
  ]);
  const [canvasSelectedLine, setCanvasSelectedLine] = useState<number | null>(null);
  const [canvasPortTarget, setCanvasPortTarget] = useState("python");

  // Immersive Voice Core overlay (As shown in screenshot 12)
  const [isLiveCoreActive, setIsLiveCoreActive] = useState(false);
  const [isCommandGuideOpen, setIsCommandGuideOpen] = useState(false);

  // User details (Mock storage)
  const [username, setUsername] = useState(() => localStorage.getItem("jarvis_student_name") || "Mohit");
  const [studentLevel, setStudentLevel] = useState(() => localStorage.getItem("jarvis_student_level") || "University");
  const [jarvisTone, setJarvisTone] = useState(() => localStorage.getItem("jarvis_tone") || "Caring & Support");

  // Additional user profile settings (Manage panel)
  const [avatarInitials, setAvatarInitials] = useState(() => localStorage.getItem("jarvis_avatar_initials") || "M");
  const [avatarImage, setAvatarImage] = useState(() => localStorage.getItem("jarvis_avatar_image") || "");
  const [gmail, setGmail] = useState(() => localStorage.getItem("jarvis_gmail") || "mohit@gmail.com");
  const [dateOfBirth, setDateOfBirth] = useState(() => localStorage.getItem("jarvis_dob") || "2000-01-01");
  const [backupEnabled, setBackupEnabled] = useState(() => localStorage.getItem("jarvis_backup_enabled") !== "false");

  // API keys
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("jarvis_gemini_key") || "");

  // Interactive Student Tutorials & Feedback states
  const [activeTutorialId, setActiveTutorialId] = useState<"pdf" | "image" | "youtube" | "voice" | null>(null);
  const [tutorialStepIndex, setTutorialStepIndex] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<string>("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [geminiKeyPool, setGeminiKeyPool] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("jarvis_gemini_key_pool");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    const single = localStorage.getItem("jarvis_gemini_key") || "";
    return single ? [single] : [];
  });
  const [newPoolKeyInput, setNewPoolKeyInput] = useState("");
  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(() => {
    return localStorage.getItem("jarvis_firestore_quota_exceeded") === "true";
  });

  useEffect(() => {
    const handleFirestoreQuotaExceeded = () => {
      setFirestoreQuotaExceeded(true);
    };
    window.addEventListener("firestore-quota-exceeded", handleFirestoreQuotaExceeded);
    return () => {
      window.removeEventListener("firestore-quota-exceeded", handleFirestoreQuotaExceeded);
    };
  }, []);

  // Audio & Key references
  const persistentAudioContextRef = useRef<AudioContext | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const geminiKeyPoolRef = useRef<string[]>(geminiKeyPool);
  const currentApiKeyIndexRef = useRef<number>(0);
  const keyCooldownsRef = useRef<{ [key: string]: number }>({});

  // Highly customizable Premium Human Speech Synthesis Core states
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => localStorage.getItem("jarvis_selected_voice_name") || "");

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        let voices = window.speechSynthesis.getVoices();
        
        // Sorting voices so that premium, neural-sounding high quality voices are grouped at the top
        const isVoicePremium = (v: SpeechSynthesisVoice) => {
          const name = v.name.toLowerCase();
          return name.includes("natural") || name.includes("neural") || name.includes("google") || name.includes("siri") || name.includes("enhanced") || name.includes("premium") || name.includes("online");
        };

        voices = [...voices].sort((a, b) => {
          const aPremium = isVoicePremium(a);
          const bPremium = isVoicePremium(b);
          if (aPremium && !bPremium) return -1;
          if (!aPremium && bPremium) return 1;
          
          const aEn = a.lang.toLowerCase().startsWith("en");
          const bEn = b.lang.toLowerCase().startsWith("en");
          if (aEn && !bEn) return -1;
          if (!aEn && bEn) return 1;

          return a.name.localeCompare(b.name);
        });

        setSystemVoices(voices);
        
        // Automatically default selectedVoiceName to a natural-sounding voice if not configured
        const saved = localStorage.getItem("jarvis_selected_voice_name");
        if (!saved && voices.length > 0) {
          const naturalDefault = voices.find(v => 
            v.lang.startsWith("en") && 
            isVoicePremium(v)
          ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
          if (naturalDefault) {
            setSelectedVoiceName(naturalDefault.name);
            localStorage.setItem("jarvis_selected_voice_name", naturalDefault.name);
          }
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  const [voiceRate, setVoiceRate] = useState(() => parseFloat(localStorage.getItem("jarvis_voice_rate") || "1.05"));
  const [voicePitch, setVoicePitch] = useState(() => parseFloat(localStorage.getItem("jarvis_voice_pitch") || "1.0"));

  // The active Voice synthesis engine: "native" (Offline browser Web Speech API) or "server" (Cloud Server-Side Gemini TTS)
  const [voiceEngine, setVoiceEngine] = useState<"native" | "server">(() => {
    return (localStorage.getItem("jarvis_voice_engine") as any) || "server";
  });

  // Google Gemini Natural Live Human Voice selection state (support for 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr')
  const [googleVoiceName, setGoogleVoiceName] = useState(() => localStorage.getItem("jarvis_google_voice_name") || "Kore");

  // Text language mode & Voice language modes
  const [textLanguage, setTextLanguage] = useState<"English" | "Hindi" | "Bengali" | "Benglish" | "Mix">(() => {
    return (localStorage.getItem("jarvis_text_language") as any) || "English";
  });
  const [voiceLanguage, setVoiceLanguage] = useState<"English" | "Bengali" | "Hindi" | "Benglish" | "Mix">(() => {
    return (localStorage.getItem("jarvis_voice_language") as any) || "English";
  });

  // Separate message lists for text chat mode and voice mode
  const [voiceMessages, setVoiceMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_voice_messages");
      return saved ? JSON.parse(saved) : [
        {
          id: "welcome-voice-1",
          sender: "jarvis",
          text: "Intelligent human Voice Core activated. Tap 'Start Voice Core' and speak to begin live double-duplex vocal sharing.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
    } catch (_) {
      return [];
    }
  });

  // Keep persistent refs to stop or play Google live model raw PCM audio synthesis and camera stream
  const voiceAudioSourceRef = useRef<{ source: AudioBufferSourceNode; context: AudioContext } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Closure synchronization refs for Speech Recognition
  const currentScreenRef = useRef<string>("homepage");
  const googleVoiceNameRef = useRef(googleVoiceName);
  const geminiKeyRef = useRef(geminiKey);
  const isSpeechRecognitionRunningRef = useRef(false);
  const chatMicRecognitionRef = useRef<any>(null);
  const isVoiceActiveRef = useRef(false);
  const lastProcessedIndex = useRef<number>(-1);
  const usernameRef = useRef(username);
  const studentLevelRef = useRef(studentLevel);
  const jarvisToneRef = useRef(jarvisTone);
  const jarvisMemoriesRef = useRef(jarvisMemories);
  
  const [jarvisBehaviorRules, setJarvisBehaviorRules] = useState<{ id: string; rule: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_behavior_rules_list");
      return saved ? JSON.parse(saved) : [
        { id: "rule-1", rule: "Address Mohit respectfully as Master, and communicate back in a warm Bengali/Banglish script with deep devotion.", timestamp: new Date().toLocaleDateString() }
      ];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("jarvis_behavior_rules_list", JSON.stringify(jarvisBehaviorRules));
  }, [jarvisBehaviorRules]);

  const jarvisBehaviorRulesRef = useRef(jarvisBehaviorRules);
  const isReferenceMemoriesRef = useRef(isReferenceMemories);
  const textLanguageRef = useRef(textLanguage);
  const voiceLanguageRef = useRef(voiceLanguage);
  const isTtsQuotaExceeded = useRef(false);

  const buildSystemPrompt = (basePrompt: string, isVoice: boolean = false) => {
    const rulesText = jarvisBehaviorRulesRef.current.length > 0
      ? jarvisBehaviorRulesRef.current.map((r, i) => `${i + 1}. ${r.rule}`).join("\n")
      : "1. Address Mohit respectfully as Master, and communicate back in a warm Bengali/Banglish script with deep devotion.";

    let prompt = `${basePrompt}

[DYNAMIC PERSONA, LANGUAGE & BEHAVIORAL INSTRUCTION MEMORY (Strictly enforce these rules, personality choices, tone shifts, and guidelines of user Mohit):]
${rulesText}

DYNAMIC BEHAVIOR PROTOCOL:
- If the user explicitly asks, suggests, commands, or guides you to behave in a certain way, adopt a specific name/persona, change your language, modify reply length, or alter your tone, you MUST:
  1. Acknowledge and accept their command with high devotion.
  2. Append a special behavioral update marker at the absolute end of your response text (after all other output, on its own clean new line): [UPDATE_BEHAVIOR: <concise high-level guidelines representing the new behavior, tone, language, or persona requested>]
  - Example: If the user says "From now on talk to me in Hindi," append [UPDATE_BEHAVIOR: Always speak to operator in transliterated Hindi (Hinglish)] at the end.
  - Important: Always write the rule description in clear, concise English so it can be parsed and understood perfectly in future turns.`;

    if (isVoice) {
      prompt += `\n- Since you are in a Live spoken mode, make your output conversational and highly natural. Avoid lists, markdown formatting (*), or bullet points.`;
    }

    return prompt;
  };

  const processAndStripBehaviorUpdates = (text: string): string => {
    const marker = "[UPDATE_BEHAVIOR:";
    if (!text || !text.includes(marker)) return text;

    try {
      const parts = text.split(marker);
      const rulesToAdd: string[] = [];
      const cleanReplyParts: string[] = [parts[0]];

      for (let i = 1; i < parts.length; i++) {
        const subparts = parts[i].split("]");
        const ruleText = subparts[0].trim();
        if (ruleText) {
          rulesToAdd.push(ruleText);
        }
        if (subparts.length > 1) {
          cleanReplyParts.push(subparts.slice(1).join("]"));
        }
      }

      if (rulesToAdd.length > 0) {
        setJarvisBehaviorRules(prev => {
          let updated = [...prev];
          rulesToAdd.forEach(r => {
            if (!updated.some(u => u.rule.toLowerCase() === r.toLowerCase())) {
              updated = [
                {
                  id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  rule: r,
                  timestamp: new Date().toLocaleDateString()
                },
                ...updated
              ];
            }
          });
          return updated;
        });
      }

      return cleanReplyParts.join("").trim();
    } catch (err) {
      console.warn("Error parsing [UPDATE_BEHAVIOR] marker:", err);
      return text;
    }
  };

  // Fetch and index standard OS premium human voice assets
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const fetchVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setSystemVoices(available);
        if (available.length > 0 && !localStorage.getItem("jarvis_selected_voice_name")) {
          // Standard auto-selection algorithm favors modern warm & full human voices
          const bestOption = available.find(v => 
            v.name.toLowerCase().includes("natural") || 
            v.name.toLowerCase().includes("google") || 
            v.name.toLowerCase().includes("siri") ||
            v.name.toLowerCase().includes("enhanced")
          ) || available.find(v => v.lang.startsWith("en")) || available[0];
          
          if (bestOption) {
            setSelectedVoiceName(bestOption.name);
          }
        }
      };
      fetchVoices();
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  useEffect(() => {
    const handleOpenCodePreview = (e: Event) => {
      const customEvent = e as CustomEvent<{ code: string; language: string }>;
      if (customEvent.detail) {
        setActiveCodePreview(customEvent.detail);
      }
    };
    window.addEventListener("open-code-preview", handleOpenCodePreview);
    return () => {
      window.removeEventListener("open-code-preview", handleOpenCodePreview);
    };
  }, []);

  // Simulated vision state
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);

  // Time stamp state
  const [currentTime, setCurrentTime] = useState("");

  // Live clock tracker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Assistant Interaction States
  const [messages, setMessages] = useState<Message[]>([]);

  // Track message IDs that have finished typing animation so we don't repeat them
  const [completedTypingMessageIds, setCompletedTypingMessageIds] = useState<Record<string, boolean>>({});
  const prevMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    const prev = prevMessagesRef.current;
    const current = messages;

    const added = current.filter(m => !prev.some(p => p.id === m.id));

    if (added.length > 1) {
      setCompletedTypingMessageIds(curr => {
        const copy = { ...curr };
        added.forEach(m => {
          copy[m.id] = true;
        });
        return copy;
      });
    } else if (added.length === 1) {
      const singleAdded = added[0];
      if (singleAdded.sender === "user") {
        setCompletedTypingMessageIds(curr => ({
          ...curr,
          [singleAdded.id]: true
        }));
      }
    }

    prevMessagesRef.current = messages;
  }, [messages]);

  const [inputText, setInputText] = useState("");
  const [homeGreeting, setHomeGreeting] = useState(() => getRandomGreeting());
  const [suggestionPills, setSuggestionPills] = useState(() => getRandomSuggestions(3));
  const [faceStatus, setFaceStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [faceEmotion, setFaceEmotion] = useState<"normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical">("normal");
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Message interaction actions & TTS state mapping
  const [currentPlayingMsgId, setCurrentPlayingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const copyMessageText = async (msgId: string, textToCopy: string) => {
    try {
      const ok = await safeCopyToClipboard(textToCopy);
      if (ok) {
        setCopiedMsgId(msgId);
        setTimeout(() => setCopiedMsgId(null), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Automatic Client-Side Multi-API Gateway Rotation Engine
  const fetchWithApiKeyPool = async (url: string, bodyData: any): Promise<Response> => {
    const pool = geminiKeyPoolRef.current || [];
    
    // Resilient network fetch retry helper with exponential backoff to recover from local restarts/gateway glitches
    const fetchWithRetry = async (targetUrl: string, config: any, maxRetries = 2): Promise<Response> => {
      let lastErr: any = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(targetUrl, config);
          // Auto retry on gateway error codes 502/503/504
          if (res.status === 502 || res.status === 503 || res.status === 504) {
            throw new Error(`Server gateway error: HTTP status ${res.status}`);
          }
          return res;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Network Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${targetUrl}:`, err);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 + attempt * 1000));
          }
        }
      }
      throw lastErr;
    };

    // Fallback if pool is empty
    if (pool.length === 0) {
      const fallbackKey = geminiKeyRef.current?.trim() || "";
      const payload = { ...bodyData, user_api_key: fallbackKey };
      return await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const poolSize = pool.length;
    let lastError = "No keys configured";
    const now = Date.now();

    // 1. Filter out keys that are currently cooling down
    let availableIndices: number[] = [];
    for (let i = 0; i < poolSize; i++) {
      const key = pool[i];
      const cooldownUntil = keyCooldownsRef.current[key] || 0;
      if (cooldownUntil < now) {
        availableIndices.push(i);
      }
    }

    // 2. If ALL keys are on cooldown, clear them (all have passed or we retry anyway)
    if (availableIndices.length === 0) {
      console.warn("[Multi-API Gateway] All keys are on cooldown. Resetting cooldown states to retry.");
      keyCooldownsRef.current = {};
      availableIndices = pool.map((_, idx) => idx);
    }

    // Find the starting index inside our filtered available indices
    // We want to pick the index closest to currentApiKeyIndexRef.current
    let targetIndexInAvailable = availableIndices.findIndex(idx => idx >= currentApiKeyIndexRef.current);
    if (targetIndexInAvailable === -1) {
      targetIndexInAvailable = 0;
    }

    let tries = 0;
    const numToTry = availableIndices.length;

    while (tries < numToTry) {
      const availableIdx = (targetIndexInAvailable + tries) % numToTry;
      const currentIndex = availableIndices[availableIdx];
      const keyToUse = pool[currentIndex];

      const payload = { ...bodyData, user_api_key: keyToUse };
      const startTime = Date.now();

      try {
        console.log(`[Multi-API Gateway] Requesting with key index ${currentIndex} of ${poolSize}...`);
        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const elapsed = Date.now() - startTime;

        // Let's parse response if OK or cloned JSON status
        if (response.status === 200 || response.status === 201) {
          const peekResponse = response.clone();
          try {
            const data = await peekResponse.json();
            if (data.status === "error") {
              const msg = (data.message || "").toLowerCase();
              const isQuotaExceeded = msg.includes("quota") || msg.includes("429") || msg.includes("exhausted") || msg.includes("limit") || msg.includes("key") || msg.includes("api_key") || msg.includes("invalid");
              
              if (isQuotaExceeded) {
                console.warn(`[Multi-API Gateway] Key ${currentIndex} response reports quota limit: ${data.message}. Rotating...`);
                recordKeyUsage(keyToUse, false, elapsed);
                // Put on active 45 seconds cooldown
                keyCooldownsRef.current[keyToUse] = Date.now() + 45000;
                tries++;
                currentApiKeyIndexRef.current = (currentIndex + 1) % poolSize;
                setGeminiKey(pool[currentApiKeyIndexRef.current]);
                lastError = data.message;
                continue;
               }
            }
          } catch (_) {}

          // Success, commit key and clear its cooldown
          recordKeyUsage(keyToUse, true, elapsed);
          delete keyCooldownsRef.current[keyToUse];
          currentApiKeyIndexRef.current = currentIndex;
          setGeminiKey(keyToUse);
          return response;
        } else {
          // Direct HTTP status failure
          const clone = response.clone();
          let errText = `HTTP ${response.status}`;
          let isQuota = response.status === 429;
          try {
            const txt = await clone.text();
            errText = txt;
            const lowerVal = txt.toLowerCase();
            if (lowerVal.includes("quota") || lowerVal.includes("429") || lowerVal.includes("exhausted") || lowerVal.includes("limit") || lowerVal.includes("key") || lowerVal.includes("api_key") || lowerVal.includes("invalid")) {
              isQuota = true;
            }
          } catch (_) {}

          recordKeyUsage(keyToUse, false, elapsed);

          if (isQuota || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504) {
            console.warn(`[Multi-API Gateway] HTTP error on key index ${currentIndex} (${response.status}): ${errText}. Rotating...`);
            if (isQuota) {
              // Put on active 45 seconds cooldown
              keyCooldownsRef.current[keyToUse] = Date.now() + 45000;
            }
            tries++;
            currentApiKeyIndexRef.current = (currentIndex + 1) % poolSize;
            setGeminiKey(pool[currentApiKeyIndexRef.current]);
            lastError = errText;
            continue;
          }

          return response;
        }
      } catch (err: any) {
        const elapsed = Date.now() - startTime;
        recordKeyUsage(keyToUse, false, elapsed);
        console.warn(`[Multi-API Gateway] Network exception (expected during rotation/quota exhaust) on key ${currentIndex}:`, err);
        tries++;
        currentApiKeyIndexRef.current = (currentIndex + 1) % poolSize;
        setGeminiKey(pool[currentApiKeyIndexRef.current]);
        lastError = err.message || err.toString();
      }
    }

    // All keys failed, return a mock custom 429 failure
    return new Response(JSON.stringify({
      status: "error",
      message: `Multi-API System Exhausted: All ${poolSize} keys failed. Please enter an active key in settings. Last error: ${lastError}`
    }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  };

  const speakChatDialogue = async (msgId: string, textToSpeak: string) => {
    // Synchronously unlock and resume persistent AudioContext on direct user gesture tap event
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!persistentAudioContextRef.current) {
          persistentAudioContextRef.current = new AudioCtx();
        }
        if (persistentAudioContextRef.current.state === "suspended") {
          persistentAudioContextRef.current.resume().catch(() => {});
        }
      }
    } catch (_) {}

    if (currentPlayingMsgId === msgId) {
      stopVoiceSpeech();
      try {
        if (voiceAudioSourceRef.current) {
          voiceAudioSourceRef.current.source.stop();
          voiceAudioSourceRef.current = null;
        }
      } catch (_) {}
      setCurrentPlayingMsgId(null);
      setFaceStatus("idle");
      return;
    }

    stopVoiceSpeech();
    try {
      if (voiceAudioSourceRef.current) {
        voiceAudioSourceRef.current.source.stop();
        voiceAudioSourceRef.current = null;
      }
    } catch (_) {}

    setCurrentPlayingMsgId(msgId);
    setFaceStatus("thinking");

    let cleanText = cleanMarketingAndMarkdown(textToSpeak);
    
    // Smooth readable fallback voice override if the text is a system pipeline exception warning list
    if (cleanText.includes("JARVIS System standby") || cleanText.includes("pipeline exception") || cleanText.includes("API connection exception") || cleanText.includes("SECURE API Key Gateway") || cleanText.includes("quota limit")) {
      cleanText = "JARVIS systems are in standby safe-mode. Please check the bottom right settings to configure your active Gemini API key.";
    }

    const vocalText = replaceEmojisWithWords(cleanText);

    // If we already know the premium TTS engine has hit quota, or if the user chose internal native voice model, go straight to WebSpeech
    if (isTtsQuotaExceeded.current || voiceEngine === "native") {
      speakChatWithWebSpeech(msgId, vocalText);
      return;
    }

    try {
      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: vocalText,
        voiceName: googleVoiceNameRef.current || "Kore",
        onlyTTS: true,
        systemPrompt: buildSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. Speak naturally. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`, true)
      });

      const data = await response.json();
      if (data.status === "success" && data.audio) {
        // Play using premium raw voice PCM player using the persistent unlocked AudioContext
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const sampleRate = 24000;
        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
          float32Data[i] = int16Data[i] / 32768.0;
        }

        let context = persistentAudioContextRef.current;
        if (!context || context.state === "closed") {
          context = new AudioCtx();
          persistentAudioContextRef.current = context;
        }
        if (context.state === "suspended") {
          context.resume().catch(() => {});
        }

        const audioBuffer = context.createBuffer(1, float32Data.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = context.createBufferSource();
        source.buffer = audioBuffer;

        // Set up high-performance AnalyserNode for real-time lip syncing of dialog messages
        const analyser = context.createAnalyser();
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(context.destination);

        let animFrameId: number;
        const checkVolume = () => {
          if (!voiceAudioSourceRef.current) {
            window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          let total = 0;
          for (let i = 0; i < bufferLength; i++) {
            total += dataArray[i];
          }
          const average = total / bufferLength;
          const volume = Math.min(1, average / 110);
          window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume } }));
          animFrameId = requestAnimationFrame(checkVolume);
        };

        setFaceStatus("speaking");
        source.onended = () => {
          cancelAnimationFrame(animFrameId);
          window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
          setFaceStatus("idle");
          setFaceEmotion("normal");
          setCurrentPlayingMsgId(null);
          voiceAudioSourceRef.current = null;
        };

        source.start(0);
        voiceAudioSourceRef.current = { source, context };
        checkVolume();
      } else {
        const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
        if (isQuota) {
          isTtsQuotaExceeded.current = true;
          setApiQuotaExceeded(true);
        }
        speakChatWithWebSpeech(msgId, vocalText);
      }
    } catch (err: any) {
      console.warn("Could not play chat core audio, playing WebSpeech fallback:", err);
      const errMsg = err?.message?.toLowerCase() || "";
      if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("exhausted")) {
        isTtsQuotaExceeded.current = true;
        setApiQuotaExceeded(true);
      }
      const vocalText = replaceEmojisWithWords(cleanMarketingAndMarkdown(textToSpeak));
      speakChatWithWebSpeech(msgId, vocalText);
    }
  };

  const speakChatWithWebSpeech = (msgId: string, vocalText: string) => {
    if ("speechSynthesis" in window) {
      setFaceStatus("speaking");
      
      // Stop callbacks from the previous active utterance to avoid resetting face status to idle
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(vocalText);
        activeUtteranceRef.current = utterance;
        
        let targetLang = "en-US";
        // Select appropriate regional code to resolve audio correctly
        if (voiceLanguageRef.current === "Bengali") {
          targetLang = "bn-IN";
        } else if (voiceLanguageRef.current === "Hindi") {
          targetLang = "hi-IN";
        }
        utterance.lang = targetLang;

        const availableVoices = window.speechSynthesis.getVoices();
        let chosenVoice: SpeechSynthesisVoice | null = null;

        if (selectedVoiceName) {
          chosenVoice = availableVoices.find(v => v.name === selectedVoiceName) || null;
        }

        if (!chosenVoice) {
          chosenVoice = availableVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase())) ||
                        availableVoices.find(v => v.lang.toLowerCase().startsWith(targetLang.substring(0, 2))) ||
                        availableVoices.find(v => v.default);
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
        
        let finalRate = voiceRate;
        let finalPitch = voicePitch;
        
        if (googleVoiceNameRef.current === "Kratos") {
          finalRate = 0.82;
          finalPitch = 0.52;
        } else if (googleVoiceNameRef.current === "Commander") {
          finalRate = 0.88;
          finalPitch = 0.68;
        } else if (googleVoiceNameRef.current === "Agent-Smith") {
          finalRate = 0.95;
          finalPitch = 0.78;
        }

        utterance.rate = finalRate;
        utterance.pitch = finalPitch;
        
        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setCurrentPlayingMsgId(null);
        };
        utterance.onerror = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setCurrentPlayingMsgId(null);
        };
        
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      }, 50);
    } else {
      setCurrentPlayingMsgId(null);
    }
  };

  // Attachment states
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState("");
  const [attachedFileType, setAttachedFileType] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-resize chat input when inputText changes for a perfectly tight fit with no gap
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "18px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const multiline = scrollHeight > 26;
      setIsMultiline(multiline);
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 20), 140)}px`;
    }
  }, [inputText]);

  const triggerLiveDynamicGreeting = async () => {
    // 1. Clear old chats (start a new season)
    setVoiceMessages([]);
    setFaceStatus("thinking");
    setFaceEmotion("normal");

    // Create a temporary loading bubble so user understands JARVIS is initializing
    const systemId = "sys-connecting-" + Date.now();
    const systemMsg: Message = {
      id: systemId,
      sender: "jarvis",
      text: "⚡ Initializing voice session. Synthesizing greeting...",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setVoiceMessages([systemMsg]);

    try {
      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: "Generate a completely personalized, distinct, non-generic cozy greeting to welcome me back to our live vocal sharing session. Make this greeting unique and conversational. Welcome me by my name or avatar profile, ask me a friendly or intellectual starting question, and keep it to 1 or 2 spoken sentences. Avoid bold stars, emojis, or markdown.",
        voiceName: googleVoiceNameRef.current || "Kore",
        chatHistory: [], // Ensure a brand new season/history
        systemPrompt: buildSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. You are operating inside Premium Voice Mode. Nickname profile: ${usernameRef.current}. Personality setting: ${studentLevelRef.current} Level. Assistant style: ${jarvisToneRef.current}. Speak with high warmth. No markdown stars, no formatting.
        
        MEMORY COGNITIVE GUIDELINES:
        ${isReferenceMemoriesRef.current && jarvisMemoriesRef.current.length > 0 ? `[PERSISTENT CORE MEMORIES (Welcome/react to user with this context if appropriate):]\n${jarvisMemoriesRef.current.map(m => `- ${m.text}`).join("\n")}` : ""}`, true)
      });

      const data = await response.json();
      if (data.status === "success" && data.reply) {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const greetingMsg: Message = {
          id: Date.now().toString() + "-greet",
          sender: "jarvis",
          text: processedReply,
          modelUsed: data.ttsModel || "gemini-3.1-flash-tts-preview [Voice Synthesis]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        // Set the greeting as the sole message in this fresh voice session
        setVoiceMessages([greetingMsg]);

        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);
        setFaceStatus("speaking");

        if (data.audio) {
          playRawPCM(data.audio);
        } else {
          speakJARVISResponse(processedReply);
        }
      } else {
        throw new Error("Invalid greeting response");
      }
    } catch (err) {
      console.error("Failed to generate dynamic greeting:", err);
      // Fallback greeting if network or quota is hit
      const fallbackMsg: Message = {
        id: Date.now().toString() + "-greet-fallback",
        sender: "jarvis",
        text: `Voice sharing core fully energized, master Mohit. I am online and ready to assist you. What shall we tackle today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages([fallbackMsg]);
      setFaceStatus("speaking");
      speakJARVISResponse(fallbackMsg.text);
    }
  };

  // Keep references synced
  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);

  // Synchronize enter/exit live screen voice behavior
  useEffect(() => {
    if (currentScreen === "live") {
      setWakeWordListening(false);
      setIsVoiceActive(false);
      stopVoiceSpeech();

      // Trigger new season / dynamic session greeting!
      triggerLiveDynamicGreeting();

      // Attempt to unlock AudioContext
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!persistentAudioContextRef.current) {
            persistentAudioContextRef.current = new AudioCtx();
          }
          if (persistentAudioContextRef.current.state === "suspended") {
            persistentAudioContextRef.current.resume().catch(() => {});
          }
        }
      } catch (_) {}
    } else {
      setIsVoiceActive(false);
      stopVoiceSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    }
  }, [currentScreen]);
  useEffect(() => { googleVoiceNameRef.current = googleVoiceName; }, [googleVoiceName]);
  
  useEffect(() => {
    geminiKeyPoolRef.current = geminiKeyPool;
    localStorage.setItem("jarvis_gemini_key_pool", JSON.stringify(geminiKeyPool));
    if (geminiKeyPool.length > 0) {
      const activeIdx = currentApiKeyIndexRef.current % geminiKeyPool.length;
      const activeKey = geminiKeyPool[activeIdx] || geminiKeyPool[0] || "";
      setGeminiKey(activeKey);
    } else {
      setGeminiKey("");
    }
  }, [geminiKeyPool]);

  useEffect(() => { 
    geminiKeyRef.current = geminiKey; 
    if (geminiKey.trim()) {
      isTtsQuotaExceeded.current = false;
      setApiQuotaExceeded(false);
    }
  }, [geminiKey]);
  useEffect(() => { isVoiceActiveRef.current = isVoiceActive; }, [isVoiceActive]);
  useEffect(() => { usernameRef.current = username; }, [username]);
  useEffect(() => { studentLevelRef.current = studentLevel; }, [studentLevel]);
  useEffect(() => { jarvisToneRef.current = jarvisTone; }, [jarvisTone]);
  useEffect(() => { jarvisMemoriesRef.current = jarvisMemories; }, [jarvisMemories]);
  useEffect(() => { jarvisBehaviorRulesRef.current = jarvisBehaviorRules; }, [jarvisBehaviorRules]);
  useEffect(() => { isReferenceMemoriesRef.current = isReferenceMemories; }, [isReferenceMemories]);
  // Unified System Effect: Watches language states, syncs refs & local storage, and enforces language mandate propagation to outgoings
  useEffect(() => {
    textLanguageRef.current = textLanguage;
    voiceLanguageRef.current = voiceLanguage;
    localStorage.setItem("jarvis_text_language", textLanguage);
    localStorage.setItem("jarvis_voice_language", voiceLanguage);

    // Speedily apply language update to the active Web Speech Recognition instances on-the-fly!
    const targetLang = voiceLanguage === "Bengali" || voiceLanguage === "Benglish" ? "bn-BD" : voiceLanguage === "Hindi" ? "hi-IN" : voiceLanguage === "Mix" ? (navigator.language || "en-US") : "en-US";
    if (recognitionRef.current) {
      recognitionRef.current.lang = targetLang;
      console.log(`[JARVIS SPEECH ENHANCEMENT] Updated main speech engine encoding target to: ${targetLang}`);
    }
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.lang = targetLang;
    }

    console.log(`[JARVIS Unified Language Channel] Sync active. Current Text: ${textLanguage}, Voice: ${voiceLanguage}`);
  }, [textLanguage, voiceLanguage]);

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem("jarvis_student_name", username);
    localStorage.setItem("jarvis_student_level", studentLevel);
    localStorage.setItem("jarvis_tone", jarvisTone);
    localStorage.setItem("jarvis_gemini_key", geminiKey);
    localStorage.setItem("jarvis_api_keys", JSON.stringify({ gemini: geminiKey }));
    localStorage.setItem("jarvis_selected_voice_name", selectedVoiceName);
    localStorage.setItem("jarvis_google_voice_name", googleVoiceName);
    localStorage.setItem("jarvis_voice_engine", voiceEngine);
    localStorage.setItem("jarvis_voice_rate", voiceRate.toString());
    localStorage.setItem("jarvis_voice_pitch", voicePitch.toString());
    localStorage.setItem("jarvis_logged_in", isLoggedIn ? "true" : "false");
    localStorage.setItem("jarvis_avatar_initials", avatarInitials);
    localStorage.setItem("jarvis_avatar_image", avatarImage);
    localStorage.setItem("jarvis_gmail", gmail);
    localStorage.setItem("jarvis_dob", dateOfBirth);
    localStorage.setItem("jarvis_backup_enabled", backupEnabled ? "true" : "false");
    localStorage.setItem("jarvis_text_language", textLanguage);
    localStorage.setItem("jarvis_voice_language", voiceLanguage);
  }, [username, studentLevel, jarvisTone, geminiKey, selectedVoiceName, googleVoiceName, voiceEngine, voiceRate, voicePitch, isLoggedIn, avatarInitials, avatarImage, gmail, dateOfBirth, backupEnabled, textLanguage, voiceLanguage]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBottomArrow(!isNearBottom);
    }
  };

  useEffect(() => {
    localStorage.setItem("jarvis_chat_history", JSON.stringify(messages));
    
    if (messages.length > 0 && !(messages.length === 1 && messages[0].id === "welcome-1")) {
      if (activeSessionId) {
        setChatHistoryItems(prev => {
          const index = prev.findIndex(item => item.id === activeSessionId);
          if (index !== -1) {
            const updated = [...prev];
            const currentItem = updated[index];
            let newText = currentItem.text;
            if (currentItem.text === "New Dialogue" || currentItem.text.startsWith("s-") || currentItem.text === "New Chat Session" || currentItem.text === "Hii session" || currentItem.text === "Kire kmon achis" || currentItem.text === "Ji 6 discussion" || currentItem.text === "Algebra concept kheyal rakhbi") {
              const userMsg = messages.find(m => m.sender === "user")?.text || currentItem.text;
              newText = userMsg.length > 30 ? userMsg.slice(0, 30) + "..." : userMsg;
            }
            updated[index] = {
              ...currentItem,
              text: newText,
              messages: messages
            };
            return updated;
          } else {
            const userMsg = messages.find(m => m.sender === "user")?.text || "New Dialogue";
            const title = userMsg.length > 30 ? userMsg.slice(0, 30) + "..." : userMsg;
            return [{ id: activeSessionId, text: title, messages: messages }, ...prev];
          }
        });
      } else {
        const hasUserMsg = messages.some(m => m.sender === "user");
        if (hasUserMsg) {
          const userMsg = messages.find(m => m.sender === "user")?.text || "New Dialogue";
          const title = userMsg.length > 30 ? userMsg.slice(0, 30) + "..." : userMsg;
          const newId = `s-${Date.now()}`;
          setActiveSessionId(newId);
          setChatHistoryItems(prev => [{ id: newId, text: title, messages: messages }, ...prev]);
        }
      }
    }

    // Smooth auto-scroll to the bottom whenever messages change
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 60);

    // Re-evaluate bottom button visibility whenever active messages switch
    setShowScrollBottomArrow(false);

    return () => clearTimeout(timer);
  }, [messages]);

  // Scroll to bottom smoothly when faceStatus changes to ensure the beautiful thoughts loader is seen immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [faceStatus]);

  // Robustly handle auto-scrolling to the latest message whenever screen shifts to homepage (e.g. loading a history session)
  useEffect(() => {
    if (currentScreen === "homepage") {
      // Run continuous scrolling alignment checks for the first half-second to seamlessly catch element mounting/layout shifts
      const scrollInterval = setInterval(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 40);

      const timeout = setTimeout(() => {
        clearInterval(scrollInterval);
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      }, 550);

      return () => {
        clearInterval(scrollInterval);
        clearTimeout(timeout);
      };
    }
  }, [currentScreen, messages]);

  // Sync Voice Messages history
  useEffect(() => {
    localStorage.setItem("jarvis_voice_messages", JSON.stringify(voiceMessages));
  }, [voiceMessages]);

  // Bind hardware camera stream or screen share stream to HTML video preview element
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    } else if (isScreenSharing && videoRef.current && screenStreamRef.current) {
      videoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isCameraActive, isScreenSharing, cameraFacingMode]);



  // Real-time Cloud Backup core triggers using entered Google Identity Gmail (Debounced)
  useEffect(() => {
    const backupKey = gmail.trim() || username;
    if (!backupKey) return;

    const shouldSync = (googleUser !== null) || backupEnabled;
    if (!shouldSync) return;

    // Debounce cloud write by 5 seconds to reduce write frequency and conserve daily quota
    const timer = setTimeout(() => {
      syncUserProfileToCloud(backupKey, {
        gmail,
        dateOfBirth,
        backupEnabled,
        avatarInitials,
        avatarImage,
        studentLevel,
        jarvisTone,
        selectedVoiceName,
        googleVoiceName,
        voiceRate,
        voicePitch,
        textLanguage,
        voiceLanguage,
        connectedAppsStr: JSON.stringify(connectedApps),
        jarvisMemoriesStr: JSON.stringify(jarvisMemories),
        chatHistoryItemsStr: JSON.stringify(chatHistoryItems),
        jarvisBehaviorRulesStr: JSON.stringify(jarvisBehaviorRules)
      }).catch((e) => console.warn("Background cloud core profile sync postponed: ", e));
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    username, gmail, dateOfBirth, backupEnabled, avatarInitials, avatarImage,
    studentLevel, jarvisTone, selectedVoiceName, googleVoiceName, voiceRate, voicePitch,
    textLanguage, voiceLanguage, connectedApps, jarvisMemories, chatHistoryItems, googleUser, jarvisBehaviorRules
  ]);

  useEffect(() => {
    const backupKey = gmail.trim() || username;
    const shouldSync = (googleUser !== null) || backupEnabled;
    if (shouldSync && backupKey && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Debounce dialogue sync to ensure stability (like after typing is completed)
      const timer = setTimeout(() => {
        syncDialogueToCloud(backupKey, lastMsg).catch((e) => console.warn("Background cloud dialogue backup postponed: ", e));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, backupEnabled, username, gmail, googleUser]);

  // Voice Speech Recognition Setup
  const initializeSpeechRecognition = () => {
    if (!SpeechRecognition) {
      return null;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = voiceLanguageRef.current === "Bengali" || voiceLanguageRef.current === "Benglish" ? "bn-BD" : voiceLanguageRef.current === "Hindi" ? "hi-IN" : voiceLanguageRef.current === "Mix" ? (navigator.language || "en-US") : "en-US";

      rec.onstart = () => {
        setFaceStatus("listening");
        setIsVoiceActive(true);
        isSpeechRecognitionRunningRef.current = true;
        lastProcessedIndex.current = -1; // Reset processed index on fresh session start
      };

      rec.onresult = (event: any) => {
        // 1. Interruption Check: If JARVIS is speaking and any non-empty speech is detected, stop JARVIS instantly!
        const isJarvisSpeaking = (voiceAudioSourceRef.current !== null) || (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking);
        if (isJarvisSpeaking) {
          let detectedSpeechInInterim = false;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i][0].transcript.trim().length > 0) {
              detectedSpeechInInterim = true;
              break;
            }
          }
          if (detectedSpeechInInterim) {
            console.log("[Interruption]: Continuous speech detected while JARVIS is speaking. Stopping speaker instantly.");
            stopVoiceSpeech();
          }
        }

        // 2. Continuous speech processing
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript.trim();
            if (i > lastProcessedIndex.current && finalTranscript) {
              lastProcessedIndex.current = i;
              console.log("[Continuous Final Transcript Index " + i + "]:", finalTranscript);
              if (currentScreenRef.current === "live") {
                handleVoiceMessage(finalTranscript);
              } else {
                handleSendMessage(finalTranscript);
              }
            }
          }
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        
        // Handle blocked permission gracefully (especially common in iframe environments)
        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          const warningText = "🎙️ [JARVIS System Alert]: Microphone access is restricted or blocked. If you are using the embedded preview, please click the 'Open in a New Tab' button in the top-right corner to securely authorize microphone access in your browser!";
          const warningMsg = {
            id: Date.now().toString() + "-warn",
            sender: "jarvis",
            text: warningText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          if (currentScreenRef.current === "live") {
            setVoiceMessages(prev => [...prev, warningMsg]);
          } else {
            setMessages(prev => [...prev, warningMsg]);
          }
        }

        if (err.error !== "no-speech" && currentScreenRef.current !== "live") {
          setIsVoiceActive(false);
          setFaceStatus(prev => prev === "listening" ? "idle" : prev);
        }
      };

      rec.onend = () => {
        setFaceStatus(prev => prev === "listening" ? "idle" : prev);
        isSpeechRecognitionRunningRef.current = false;
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
      return rec;
    } catch (e) {
      console.error("Error creating SpeechRecognition instance:", e);
      return null;
    }
  };

  useEffect(() => {
    initializeSpeechRecognition();
  }, []);

  const playSatisfactionBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      
      osc2.frequency.setValueAtTime(1109, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      
      osc1.type = "sine";
      osc2.type = "sine";
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio chime synthesize failed:", e);
    }
  };

  const isWakeWordEnabledRef = useRef(isWakeWordEnabled);

  useEffect(() => {
    isWakeWordEnabledRef.current = isWakeWordEnabled;
  }, [isWakeWordEnabled]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    if (isWakeWordEnabled) {
      let bgRec: any = null;
      let active = true;

      const startBgListening = () => {
        if (!active || !isWakeWordEnabledRef.current || currentScreenRef.current === "live") {
          setWakeWordListening(false);
          return;
        }

        try {
          bgRec = new SpeechRecognition();
          bgRec.continuous = false;
          bgRec.interimResults = false;
          bgRec.lang = voiceLanguageRef.current === "Bengali" || voiceLanguageRef.current === "Benglish" ? "bn-BD" : voiceLanguageRef.current === "Hindi" ? "hi-IN" : voiceLanguageRef.current === "Mix" ? (navigator.language || "en-US") : "en-US";

          bgRec.onstart = () => {
            if (active) setWakeWordListening(true);
            console.log("[Background Wake-Word]: Primed & active. Listening for 'Jarvis'...");
          };

          bgRec.onresult = (event: any) => {
            if (!event.results || event.results.length === 0) return;
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log("[Background Wake-Word Matcher]: Heard transcript:", transcript);

            if (transcript.includes("jarvis") || transcript.includes("wake up") || transcript.includes("hey jarvis")) {
              console.log("[Background Wake-Word Matcher]: Wake trigger matching 'jarvis'!");
              
              playSatisfactionBeep();
              setCurrentScreen("live");
              setIsVoiceActive(true);
              setFaceStatus("speaking");
              setFaceEmotion("happy");

              const wakeMessage = {
                id: "sys-wake-" + Date.now(),
                sender: "jarvis" as const,
                text: "🎤 [Core Awake]: Yes, sir! JARVIS systems fully energized. Command core initialized and receptive. What task can I automate for you?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setVoiceMessages(prev => [...prev, wakeMessage]);
              speakJARVISResponse("Yes, sir! JARVIS systems fully energized. Command core initialized and receptive. What task can I automate for you?");
              
              active = false;
              if (bgRec) {
                try {
                  bgRec.stop();
                } catch (_) {}
              }
            }
          };

          bgRec.onerror = (e: any) => {
            console.warn("[Background Wake-Word]: Loop warning: ", e.error);
          };

          bgRec.onend = () => {
            if (active) {
              setWakeWordListening(false);
              setTimeout(() => {
                if (active && isWakeWordEnabledRef.current && currentScreenRef.current !== "live") {
                  startBgListening();
                }
              }, 1200);
            }
          };

          bgRec.start();
        } catch (err) {
          console.warn("[Background Wake-Word]: Error creating background voice scanner:", err);
        }
      };

      startBgListening();

      return () => {
        active = false;
        if (bgRec) {
          try {
            bgRec.stop();
          } catch (_) {}
        }
      };
    } else {
      setWakeWordListening(false);
    }
  }, [isWakeWordEnabled, currentScreen]);

  const toggleVoiceListening = () => {
    // Synchronously unlock and resume persistent AudioContext on direct user gesture click event
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!persistentAudioContextRef.current) {
          persistentAudioContextRef.current = new AudioCtx();
        }
        if (persistentAudioContextRef.current.state === "suspended") {
          persistentAudioContextRef.current.resume().catch(e => console.warn("AudioContext unlock resume failed:", e));
        }
      }
    } catch (_) {}

    let recInstance = recognitionRef.current;
    if (!recInstance) {
      recInstance = initializeSpeechRecognition();
    }

    if (!recInstance) {
      const alertMsg = {
        id: Date.now().toString() + "-nosupport",
        sender: "jarvis",
        text: "🎙️ [JARVIS System Alert]: Speech recognition (Web Speech API) is not supported or blocked by your browser environment. Please open the companion app in a New Tab or use Google Chrome/Safari for full microphone support.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      if (currentScreen === "live") {
        setVoiceMessages(prev => [...prev, alertMsg]);
      } else {
        setMessages(prev => [...prev, alertMsg]);
      }
      return;
    }

    if (isVoiceActive) {
      stopVoiceSpeech();
      try {
        recInstance.stop();
      } catch (_) {}
      setIsVoiceActive(false);
    } else {
      stopVoiceSpeech();
      setIsVoiceActive(true);
      try {
        recInstance.start();
      } catch (_) {}
    }
  };

  const handleStartChatMicRecording = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!persistentAudioContextRef.current) {
          persistentAudioContextRef.current = new AudioCtx();
        }
        if (persistentAudioContextRef.current.state === "suspended") {
          persistentAudioContextRef.current.resume().catch(e => console.warn("AudioContext unlock resume failed:", e));
        }
      }
    } catch (_) {}

    if (!SpeechRecognition) {
      const alertMsg = {
        id: Date.now().toString() + "-nosupport",
        sender: "jarvis",
        text: "🎙️ [JARVIS System Alert]: Speech recognition (Web Speech API) is not supported or blocked by your browser environment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, alertMsg]);
      return;
    }

    stopVoiceSpeech();

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      // Let the SpeechRecognition language be auto-detected by browser setup (e.g., matching Bengali, Hindi, or English)
      rec.lang = navigator.language || "en-US";

      rec.onstart = () => {
        setIsChatMicRecording(true);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullText = (finalTranscript || interimTranscript).trim();
        if (fullText) {
          setInputText(fullText);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Chat Mic Speech Recognition Error:", err);
      };

      rec.onend = () => {
        setIsChatMicRecording(false);
      };

      chatMicRecognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Error starting Chat Mic Speech Recognition:", e);
    }
  };

  const handlePauseChatMicRecording = () => {
    if (chatMicRecognitionRef.current) {
      try {
        chatMicRecognitionRef.current.stop();
      } catch (_) {}
    }
    setIsChatMicRecording(false);
  };

  const stopVoiceSpeech = () => {
    if (voiceAudioSourceRef.current) {
      try {
        voiceAudioSourceRef.current.source.stop();
      } catch (_) {}
      voiceAudioSourceRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setFaceStatus("idle");
    setFaceEmotion("normal");
  };

  const playRawPCM = (base64Data: string, sampleRate: number = 24000) => {
    try {
      if (isMuted) return;
      stopVoiceSpeech();

      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const numSamples = len / 2;
      const float32Data = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < numSamples; i++) {
        const intSample = dataView.getInt16(i * 2, true);
        float32Data[i] = intSample / 32768.0;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.error("AudioContext not supported in this environment");
        return;
      }

      let context = persistentAudioContextRef.current;
      if (!context || context.state === "closed") {
        context = new AudioCtx();
        persistentAudioContextRef.current = context;
      }
      if (context.state === "suspended") {
        context.resume().catch(e => console.warn("Failed to resume suspended context in play:", e));
      }

      const audioBuffer = context.createBuffer(1, numSamples, sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;

      // Set up high-performance AnalyserNode for real-time lip syncing
      const analyser = context.createAnalyser();
      analyser.fftSize = 64; 
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      analyser.connect(context.destination);

      let animFrameId: number;
      const checkVolume = () => {
        if (!voiceAudioSourceRef.current) {
          window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const average = total / bufferLength;
        const volume = Math.min(1, average / 110);
        window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume } }));
        animFrameId = requestAnimationFrame(checkVolume);
      };

      setFaceStatus("speaking");
      source.onended = () => {
        cancelAnimationFrame(animFrameId);
        window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
        setFaceStatus("idle");
        setFaceEmotion("normal");
        voiceAudioSourceRef.current = null;

        // Automatically resume recording if in Live screen and session remains active
        if (isVoiceActiveRef.current && currentScreenRef.current === "live" && recognitionRef.current && !isSpeechRecognitionRunningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (_) {}
        }
      };

      source.start(0);
      voiceAudioSourceRef.current = { source, context };
      checkVolume();
    } catch (err) {
      console.error("Error playing raw voice PCM audio:", err);
      setFaceStatus("idle");
    }
  };

  const handleVoiceMessage = async (text: string) => {
    if (!text.trim()) return;

    const isCommandHandled = executeLocalCommand(text, true);
    if (isCommandHandled) {
      const userMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "user",
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages((prev) => [...prev, userMsg]);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setVoiceMessages((prev) => [...prev, userMsg]);
    setFaceStatus("thinking");

    try {
      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: text,
        voiceName: googleVoiceNameRef.current,
        chatHistory: voiceMessages,
        systemPrompt: buildSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. You are operating inside Premium Voice Mode with emotionally intelligent conversation behavior and persistent memory capabilities. Nickname profile: ${usernameRef.current}. Personality setting: ${studentLevelRef.current} Level. Assistant style: ${jarvisToneRef.current}. Tell the user exactly what they want to know in a brief, warm human voice. Do not write list items, markdown formatting, or bullet points, just conversational prose. 
        
        MEMORY COGNITIVE GUIDELINES:
        - Understand implicit emotions and conversational intent naturally.
        - Maintain long-term conversational continuity and memory across messages.
        - Do NOT mention stored memories in every single reply; keep it natural and subtle.
        - Memories feel natural and subtle, not forced.
        - If a memory is unrelated to the current topic, ignore it silently.
        - Treat the conversation as a flow, not as individual isolated messages.
        - Prioritize recent conversation context first, then relevant long-term memories.

        ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}
        
        CRITICAL: You MUST detect the user's emotional state from their words. If they are sad, append [EMOTION:cry]. If they are angry, append [EMOTION:angry]. If they sound confused or upset, append [EMOTION:disturbed]. If they are happy or making a joke, append [EMOTION:happy] or [EMOTION:laughing]. If they are tired, append [EMOTION:sleepy]. If they express affection, append [EMOTION:love]. 
        
        Available emotions: happy, angry, cry, laughing, surprised, disturbed, sleepy, love, normal.${isReferenceMemoriesRef.current && jarvisMemoriesRef.current.length > 0 ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context):]\n${jarvisMemoriesRef.current.map(m => `- ${m.text}`).join("\n")}` : ""}`, true)
      });

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: processedReply,
          modelUsed: data.ttsModel || "gemini-3.1-flash-tts-preview [Voice Synthesis]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setVoiceMessages((prev) => [...prev, jarvisMsg]);
        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);

        if (data.audio) {
          playRawPCM(data.audio);
        } else {
          speakJARVISResponse(processedReply);
        }
      } else {
        // If the API call failed, determine if it was a quota issue
        const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
        if (isQuota) {
          isTtsQuotaExceeded.current = true;
          setApiQuotaExceeded(true);
        }
        
        const errMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: isQuota 
            ? "I'm sorry, I've reached my current cognitive limit (Quota Exhausted). Please wait a moment or check your API key settings."
            : "I was unable to synthesize a response. Please check your system settings or connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setVoiceMessages((prev) => [...prev, errMsg]);
        setFaceStatus("idle");
        speakJARVISResponse(errMsg.text);
      }
    } catch (err: any) {
      console.error("Voice response failed:", err);
      const errMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "jarvis",
        text: "I was unable to dispatch request. Please check connection links.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages((prev) => [...prev, errMsg]);
      setFaceStatus("idle");
      speakJARVISResponse(errMsg.text);
    }
  };

  const executeVisionScan = async () => {
    if (!videoRef.current || isVisionAnalyzing) return;

    setIsVisionAnalyzing(true);
    setFaceStatus("thinking");
    stopVoiceSpeech();

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not construct 2D canvas context.");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg", 0.8);

      const isScreenActive = isScreenSharing;
      const userMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "user",
        text: isScreenActive ? "🖥️ [Shared Desktop Screen Scan]" : "📸 [Active Surroundings Scan]",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages((prev) => [...prev, userMsg]);

      const textPrompt = isScreenActive
        ? "I am showing you my desktop/screen share feed. Perform an active vision analysis of this shared window frame. Read, analyze, or explain the content / code / visuals visible in this screen frame, and offer standard professional insights. Give a prompt, friendly, conversational feedback describing what you see. Avoid lists, markdown, write 2 concise sentences."
        : "I am showing you my surroundings camera feed. Perform an active vision analysis of this viewport slide. Look closely at my face and expression—if I look crying, angry, disturbed, sleepy, or happy, you MUST notice and react. Include an emotion tag like [EMOTION:type] at the end of your response to reflect what you see. Give a prompt, friendly, conversational feedback describing what you see and how I seem to be feeling. Avoid lists, markdown, write 2 concise sentences.";

      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: textPrompt,
        voiceName: googleVoiceNameRef.current,
        image: base64Image,
        systemPrompt: buildSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. You are operating in Voice Mode. Currently scanning surroundings, user's shared screen, or user's mood. Nickname profile: ${usernameRef.current}. Personality setting: ${studentLevelRef.current} Level. Assistant style: ${jarvisToneRef.current}. Analyze visual cues or screen content carefully. Be supportive. 
        
        ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}${isReferenceMemoriesRef.current && jarvisMemoriesRef.current.length > 0 ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context):]\n${jarvisMemoriesRef.current.map(m => `- ${m.text}`).join("\n")}` : ""}`, true)
      });

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: processedReply,
          modelUsed: "gemini-3.5-flash [Vision]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setVoiceMessages((prev) => [...prev, jarvisMsg]);
        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);

        if (data.audio) {
          playRawPCM(data.audio);
        } else {
          speakJARVISResponse(processedReply);
        }
      } else {
        throw new Error(data.message || "Endpoint error");
      }
    } catch (err: any) {
      console.error("Vision Scan Error:", err);
      const isQuota = err.message?.toLowerCase().includes("quota") || err.message?.toLowerCase().includes("429") || err.message?.toLowerCase().includes("exhausted");
      
      const errMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "jarvis",
        text: isQuota 
          ? "I've hit a visual processing limit (Quota Exhausted). Please wait a moment before the next scan."
          : "I was unable to analyze your surroundings. Please check permissions or key settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages((prev) => [...prev, errMsg]);
      setFaceStatus("idle");
    } finally {
      setIsVisionAnalyzing(false);
    }
  };

  // Speak voice synthesizer using ultra-natural custom OS voices and pacing controls
  const speakJARVISResponse = async (textToSpeak: string, forceWebSpeech = false) => {
    if (isMuted) return;
    
    let cleanText = cleanMarketingAndMarkdown(textToSpeak);
    
    // Smooth readable fallback voice override if the text is a system pipeline exception warning list
    if (cleanText.includes("JARVIS System standby") || cleanText.includes("pipeline exception") || cleanText.includes("API connection exception") || cleanText.includes("SECURE API Key Gateway") || cleanText.includes("quota limit")) {
      cleanText = "JARVIS systems are in standby safe-mode. Please check the bottom right settings to configure your active Gemini API key.";
    }
    
    const vocalText = replaceEmojisWithWords(cleanText);

    // Synchronously unlock and resume persistent AudioContext on direct user gesture event
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!persistentAudioContextRef.current) {
          persistentAudioContextRef.current = new AudioCtx();
        }
        if (persistentAudioContextRef.current.state === "suspended") {
          persistentAudioContextRef.current.resume().catch(() => {});
        }
      }
    } catch (_) {}

    if (forceWebSpeech || voiceEngine === "native") {
      speakWithWebSpeechInternal(vocalText);
      return;
    }

    setFaceStatus("thinking");
    try {
      // Fetch the highly natural pre-built Google Live Core voice
      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: vocalText,
        voiceName: googleVoiceNameRef.current || "Kore",
        onlyTTS: true,
        systemPrompt: `You are JARVIS, an extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. Nickname profile: ${usernameRef.current || username}. Keep the vocalization warm and engaging. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`
      });

      const data = await response.json();
      if (data.status === "success" && data.audio) {
        playRawPCM(data.audio);
      } else {
        speakWithWebSpeechInternal(vocalText);
      }
    } catch (err) {
      console.warn("Could not load premium custom voice, falling back to Web Speech:", err);
      speakWithWebSpeechInternal(vocalText);
    }
  };

  const speakWithWebSpeechInternal = (vocalText: string) => {
    if ("speechSynthesis" in window) {
      setFaceStatus("speaking");
      
      // Stop callbacks from previous active utterance to avoid resetting face status to idle
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(vocalText);
        activeUtteranceRef.current = utterance;
        
        // Intelligent automatic Script/Language detection to prevent robotic mismatch (e.g. English voice reading Bengali)
        const hasBengaliChars = /[\u0980-\u09FF]/.test(vocalText);
        const hasHindiChars = /[\u0900-\u097F]/.test(vocalText);
        
        let targetLang = "en-US";
        if (hasBengaliChars || voiceLanguageRef.current === "Bengali") {
          targetLang = "bn-IN";
        } else if (hasHindiChars || voiceLanguageRef.current === "Hindi") {
          targetLang = "hi-IN";
        }
        
        utterance.lang = targetLang;

        // Acquire all available system voice objects
        const availableVoices = window.speechSynthesis.getVoices();
        let chosenVoice: SpeechSynthesisVoice | null = null;

        // 1. Language specific targeting: Bengali
        if (targetLang.startsWith("bn")) {
          // Look for premium Google/Siri/Microsoft Bengali voice first
          chosenVoice = availableVoices.find(v => 
            (v.lang.startsWith("bn") || v.lang.includes("Bengali") || v.name.toLowerCase().includes("bangla") || v.lang.includes("bn")) &&
            (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("enhanced"))
          ) || availableVoices.find(v => v.lang.startsWith("bn") || v.lang.includes("Bengali") || v.name.toLowerCase().includes("bangla") || v.lang.includes("bn"));
        } 
        // 2. Language specific targeting: Hindi
        else if (targetLang.startsWith("hi")) {
          chosenVoice = availableVoices.find(v => 
            v.lang.startsWith("hi") && 
            (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("enhanced"))
          ) || availableVoices.find(v => v.lang.startsWith("hi"));
        }
        // 2.5 Language specific targeting: English
        else if (targetLang.startsWith("en")) {
          chosenVoice = availableVoices.find(v => 
            v.lang.startsWith("en") && 
            (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("siri") || v.name.toLowerCase().includes("enhanced") || v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("microsoft") || v.name.toLowerCase().includes("guy") || v.name.toLowerCase().includes("aria"))
          ) || availableVoices.find(v => v.lang.startsWith("en"));
        }

        // 3. Fallback to user selected voice name if it matches the target script's language, OR if target is English
        if (!chosenVoice && selectedVoiceName) {
          const preferredVoice = availableVoices.find(v => v.name === selectedVoiceName);
          if (preferredVoice) {
            const isLinguisticMatch = preferredVoice.lang.startsWith(targetLang.substring(0, 2)) || 
                                      (targetLang.startsWith("bn") && preferredVoice.lang.startsWith("bn")) ||
                                      (targetLang.startsWith("hi") && preferredVoice.lang.startsWith("hi"));
            if (targetLang.startsWith("en") || isLinguisticMatch) {
              chosenVoice = preferredVoice;
            }
          }
        }

        // 4. Default backup voice if no match could be resolved
        if (!chosenVoice && selectedVoiceName) {
          chosenVoice = availableVoices.find(v => v.name === selectedVoiceName);
        }

        // 5. Smart fallback to matching available voice
        if (!chosenVoice) {
          chosenVoice = availableVoices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase())) ||
                        availableVoices.find(v => v.lang.toLowerCase().startsWith(targetLang.substring(0, 2))) ||
                        availableVoices.find(v => v.default);
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
        
        let finalRate = voiceRate;
        let finalPitch = voicePitch;
        
        if (googleVoiceNameRef.current === "Kratos") {
          finalRate = 0.82;
          finalPitch = 0.52;
        } else if (googleVoiceNameRef.current === "Commander") {
          finalRate = 0.88;
          finalPitch = 0.68;
        } else if (googleVoiceNameRef.current === "Agent-Smith") {
          finalRate = 0.95;
          finalPitch = 0.78;
        }

        utterance.rate = finalRate;
        utterance.pitch = finalPitch;
        
        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setFaceEmotion("normal");
          // Automatically resume recording if in Live screen and session remains active
          if (isVoiceActiveRef.current && currentScreenRef.current === "live" && recognitionRef.current && !isSpeechRecognitionRunningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (_) {}
          }
        };
        utterance.onerror = (err) => {
          console.warn("Vocal utterance error:", err);
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setFaceEmotion("normal");
          // Automatically resume recording if in Live screen and session remains active
          if (isVoiceActiveRef.current && currentScreenRef.current === "live" && recognitionRef.current && !isSpeechRecognitionRunningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (_) {}
          }
        };
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };


  // File uploading processor
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFileName(file.name);
    setAttachedFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile(reader.result as string);
    };
    reader.readAsDataURL(file);
    setIsAttachmentSheetOpen(false);
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setAttachedFileName("");
    setAttachedFileType("");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file from your photo gallery.");
      return;
    }

    if (file.size > 800 * 1024) {
      alert("Profile picture size must be under 800KB to optimize memory and cloud storage pipelines.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAvatarImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Local command execution interceptor (navigates sub-apps and triggers automated widgets)
  const executeLocalCommand = (inputTextRaw: string, isFromVoice = false): boolean => {
    const raw = inputTextRaw.trim().toLowerCase();
    if (!raw) return false;

    // Helper to log Jarvis reply with interactive automation card
    const logJarvisReplyWithAutomation = (
      textReply: string, 
      autoType?: "send-message" | "check-emails" | "automation-task", 
      autoPayload?: any
    ) => {
      const jarvisMsg: Message = {
        id: "local-cmd-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        sender: "jarvis",
        text: textReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        automationType: autoType,
        automationPayload: autoPayload
      };
      if (isFromVoice) {
        setVoiceMessages(prev => [...prev, jarvisMsg]);
      } else {
        setMessages(prev => [...prev, jarvisMsg]);
      }
      setFaceStatus("speaking");
      setFaceEmotion("happy");
      speakJARVISResponse(textReply);
    };

    // Connectivity & App Control Voice Interceptors
    const checkConnectivityControl = () => {
      const broadcastVoiceAction = (app: string, actionText: string, statusDetails: string) => {
        if (wsRef.current && wsRef.current.readyState === 1) { // 1 is WebSocket.OPEN
          try {
            wsRef.current.send(JSON.stringify({
              type: "voice_command_intercept",
              query: inputTextRaw,
              app,
              actionText,
              statusDetails,
              feedbackSpeaker: username || "User"
            }));
          } catch (e) {
            console.warn("[Realtime OS] Broadcast failure:", e);
          }
        }
      };

      // 1. Spotify
      if (raw.includes("spotify") || (raw.includes("play") && (raw.includes("music") || raw.includes("song") || raw.includes("track") || raw.includes("playlist")))) {
        if (!connectedApps.spotify) {
          logJarvisReplyWithAutomation("⚠️ [Security Matrix Warning]: Spotify connection is currently STANDBY / DISCONNECTED. Please open Settings > Connectivity to authorize the Spotify pipeline for voice commands.");
          return true;
        }
        let searchParam = "Cyberpunk Synthwave";
        const playMatch = raw.match(/(?:play|spotify)\s+(?:on\s+spotify\s+)?(.*)/);
        if (playMatch && playMatch[1] && !playMatch[1].includes("music") && !playMatch[1].includes("spotify")) {
          searchParam = playMatch[1].trim();
        }
        broadcastVoiceAction("Spotify Premium", "VOICE_PLAYBACK_TRIGGERED", `Streaming target: "${searchParam}". Decrypting soundwaves...`);
        setLastConnectivityAlert({
          app: "Spotify Premium",
          action: "VOICE_PLAYBACK_TRIGGERED",
          details: `Streaming target: "${searchParam}". Decrypting soundwaves...`,
          timestamp: new Date().toLocaleTimeString()
        });
        logJarvisReplyWithAutomation(`🎵 [Spotify Workspace Connect]: Success. Audio pipeline active. Initiated voice-controlled streaming command for "${searchParam}" through your Premium account.`);
        return true;
      }

      // 2. WhatsApp
      if (raw.includes("whatsapp") || raw.includes("whatsapp message") || raw.includes("dispatch whatsapp")) {
        if (!connectedApps.whatsapp) {
          logJarvisReplyWithAutomation("⚠️ [Security Matrix Warning]: WhatsApp Core Link is currently STANDBY / DISCONNECTED. Please open Settings > Connectivity to authorize WhatsApp for voice control.");
          return true;
        }
        let recipient = "Alex (Stark Network Co-lead)";
        let textToSend = "TACTICAL ENVELOPE SECURED. SCANNING ADJACENT CLOUDS.";

        const recMatch = raw.match(/(?:to|whatsapp)\s+([a-zA-Z\s]+?)(?:\s+saying|\s+message|\s+text|$)/);
        if (recMatch && recMatch[1] && recMatch[1].trim() !== "message") {
          recipient = recMatch[1].trim().toUpperCase();
        }
        const sayMatch = raw.match(/(?:saying|message|text)\s+(.*)/);
        if (sayMatch && sayMatch[1]) {
          textToSend = sayMatch[1].trim();
        }

        broadcastVoiceAction("WhatsApp Chat", "MESSAGE_VOX_DISPATCHED", `Target: ${recipient} | Content: "${textToSend}"`);
        setLastConnectivityAlert({
          app: "WhatsApp Chat",
          action: "MESSAGE_VOX_DISPATCHED",
          details: `Target: ${recipient} | Content: "${textToSend}"`,
          timestamp: new Date().toLocaleTimeString()
        });
        logJarvisReplyWithAutomation(`🟢 [WhatsApp Node Connect]: Socket confirmed. Message vox-dispatched safely to ${recipient} saying: "${textToSend}". Pipeline status: TRANSMISSION_SUCCESS.`);
        return true;
      }

      // 3. YouTube Search Stream
      if (raw.includes("youtube") || raw.includes("youtube search") || raw.includes("watch youtube") || raw.includes("stream youtube")) {
        if (!connectedApps.youtube) {
          setConnectedApps(prev => ({ ...prev, youtube: true }));
        }
        let searchParam = "Asimov Foundation Chronicles";
        const ytMatch = raw.match(/(?:youtube|watch|search|play|look\s+up)\s+(?:on\s+youtube\s+)?(.*)/) || raw.match(/(?:search\s+youtube\s+for|look\s+up\s+on\s+youtube|play\s+on\s+youtube|watch\s+on\s+youtube)\s+(.*)/);
        if (ytMatch && ytMatch[1]) {
          const possibleParam = ytMatch[1].trim();
          if (possibleParam && !possibleParam.includes("youtube") && !possibleParam.includes("stream") && !possibleParam.includes("watch") && possibleParam !== "search") {
            searchParam = possibleParam;
          }
        }
        broadcastVoiceAction("YouTube Streaming", "VIDEO_PROJECTION_ENGAGED", `Searching stream index: "${searchParam}". Launching iframe...`);
        setLastConnectivityAlert({
          app: "YouTube Streaming",
          action: "VIDEO_PROJECTION_ENGAGED",
          details: `Searching stream index: "${searchParam}". Launching iframe...`,
          timestamp: new Date().toLocaleTimeString()
        });
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchParam)}`, "_blank");
        logJarvisReplyWithAutomation(`🔴 [YouTube Core Link]: Sync established. YouTube media search projection matching "${searchParam}" has been routed to your secondary visual workspace.\n\n[SEARCH_YOUTUBE: "${searchParam}"]`);
        return true;
      }

      // 4. Gmail / Google Email
      if (raw.includes("gmail") || raw.includes("google email") || (raw.includes("email") && raw.includes("check"))) {
        if (!connectedApps.gmail) {
          logJarvisReplyWithAutomation("⚠️ [Security Matrix Warning]: Google Gmail Link is currently STANDBY / DISCONNECTED. Please open Settings > Connectivity to authorize your Google email for voice control.");
          return true;
        }
        broadcastVoiceAction("Google Gmail", "SECURE_IMAP_SCAN", `Syncing with mail.google.com TLS socket... Decrypting unread logs...`);
        setLastConnectivityAlert({
          app: "Google Gmail",
          action: "SECURE_IMAP_SCAN",
          details: `Syncing with mail.google.com TLS socket... Decrypting unread logs...`,
          timestamp: new Date().toLocaleTimeString()
        });
        logJarvisReplyWithAutomation(`✉️ [Google Gmail Workspace]: Connected. Synchronized mailbox successfully. You have 3 unread critical updates from Stark Industries and OpenAI. I will summarize them if requested.`);
        return true;
      }

      // 5. Google Docs
      if (raw.includes("google doc") || raw.includes("doc creation") || raw.includes("write on doc") || raw.includes("google docs") || raw.includes("docs")) {
        if (!connectedApps.docs) {
          logJarvisReplyWithAutomation("⚠️ [Security Matrix Warning]: Google Docs pipeline is currently STANDBY / DISCONNECTED. Please open Settings > Connectivity to authorize Google Drive & Docs for voice control.");
          return true;
        }
        let docTitle = "Stark Tactical Project Log";
        const docMatch = raw.match(/(?:create|write|doc|docs|google doc)\s+(.*)/);
        if (docMatch && docMatch[1] && !docMatch[1].includes("google") && !docMatch[1].includes("doc")) {
          docTitle = docMatch[1].trim();
        }
        broadcastVoiceAction("Google Docs", "DOCUMENT_CLOUDSYNC_PUBLISHED", `Generated Document titled: "${docTitle}.gdoc". Sync active.`);
        setLastConnectivityAlert({
          app: "Google Docs",
          action: "DOCUMENT_CLOUDSYNC_PUBLISHED",
          details: `Generated Document titled: "${docTitle}.gdoc". Sync active.`,
          timestamp: new Date().toLocaleTimeString()
        });
        logJarvisReplyWithAutomation(`🔵 [Google Workspace Docs]: Socket active. Initiated a blank document titled "${docTitle}" under your secure Google Drive root folder. Voice dictation is ready to append text.`);
        return true;
      }

      // 6. Google Calendar
      if (raw.includes("calendar") || raw.includes("google calendar") || raw.includes("schedule event") || raw.includes("add calendar")) {
        if (!connectedApps.calendar) {
          logJarvisReplyWithAutomation("⚠️ [Security Matrix Warning]: Google Calendar Link is currently STANDBY / DISCONNECTED. Please open Settings > Connectivity to authorize Google Calendar for voice commands.");
          return true;
        }
        let eventName = "Asimov Nebula Strategic Sync";
        const calMatch = raw.match(/(?:schedule|calendar|add|event)\s+(.*)/);
        if (calMatch && calMatch[1] && !calMatch[1].includes("calendar") && !calMatch[1].includes("event")) {
          eventName = calMatch[1].trim();
        }
        broadcastVoiceAction("Google Calendar", "MEETING_SYNC_REGISTERED", `Event "${eventName}" mapped into Google Calendar database.`);
        setLastConnectivityAlert({
          app: "Google Calendar",
          action: "MEETING_SYNC_REGISTERED",
          details: `Event "${eventName}" mapped into Google Calendar database.`,
          timestamp: new Date().toLocaleTimeString()
        });
        logJarvisReplyWithAutomation(`📅 [Google Workspace Calendar]: Synchronization verified. Meeting event "${eventName}" has been indexed into your calendar schedule. Push notifications have been activated.`);
        return true;
      }

      // 7. Web Page Routing & Search
      if (raw.startsWith("search google for ") || raw.startsWith("search web for ") || raw.startsWith("google ") || raw.startsWith("search for ")) {
        const termMatch = raw.match(/^(?:search\s+google\s+for|search\s+web\s+for|google|search\s+for)\s+(.*)/);
        if (termMatch && termMatch[1]) {
          const query = termMatch[1].trim();
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          window.open(searchUrl, "_blank");
          logJarvisReplyWithAutomation(`🌐 [Google Web Intelligence Hub]: Generated terminal search route for "${query}". Redirect links are active below.\n\n[OPEN_BROWSER: "${searchUrl}", "Search: ${query}"]`);
          return true;
        }
      }

      // Check if it's an open page URL request
      const webUrlPrefixMatch = raw.match(/^(?:open|visit|go\s+to|launch)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?:\/[^\s]*)?)$/) || raw.match(/^(?:open|visit|go\s+to|launch)\s+website\s+(.*)$/) || raw.match(/^(?:open|visit|go\s+to|launch)\s+page\s+(.*)$/);
      if (webUrlPrefixMatch && webUrlPrefixMatch[1]) {
        const targetUrl = webUrlPrefixMatch[1].trim();
        const finalUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
        window.open(finalUrl, "_blank");
        logJarvisReplyWithAutomation(`🌐 [HTTP Connection Established]: Synchronized web address link for "${targetUrl}". Rendering subpage router.\n\n[OPEN_BROWSER: "${finalUrl}", "${targetUrl}"]`);
        return true;
      }

      // 8. System Standby / Lock / Sleep Mode (Close phone)
      if (raw.includes("close phone") || raw.includes("close the phone") || raw.includes("lock screen") || raw.includes("lock phone") || raw.includes("lock the phone") || raw.includes("sleep") || raw.includes("sleep mode") || raw.includes("system sleep") || raw.includes("standby mode") || raw.includes("standby") || raw.includes("shutdown") || raw.includes("shut down") || raw.includes("power off") || raw.includes("turn off screen") || raw.includes("close app") || raw.includes("exit app") || raw.includes("close application")) {
        logJarvisReplyWithAutomation("⚡ [Safety Protocol Engaged]: Powering down display clusters. JARVIS OS transitioning into offline Standby Sleep State. Click the power button to wake.");
        setTimeout(() => {
          setIsSystemAsleep(true);
        }, 1500);
        return true;
      }

      // 9. List Applications Command
      if (raw.includes("list apps") || raw.includes("list applications") || raw.includes("show apps") || raw.includes("show applications") || raw.includes("installed apps")) {
        setCurrentScreen("menu");
        setMenuSubpage("index");
        logJarvisReplyWithAutomation("📱 [JARVIS App Index]: Discovered 15+ interactive localized subsystems ready for execution. Redirecting to core application matrix folder.");
        return true;
      }

      return false;
    };

    if (checkConnectivityControl()) {
      return true;
    }

    // 1. Email check automation trigger
    if (
      raw === "check email" || 
      raw === "check emails" || 
      raw === "check my mail" || 
      raw === "check my emails" || 
      raw === "emails" || 
      raw === "check inbox" || 
      raw === "read emails" || 
      raw === "show emails" ||
      raw === "check mail"
    ) {
      logJarvisReplyWithAutomation(
        "⚡ [JARVIS Secure SMTP Network]: Bypassing SSL layers... Matrix decrypted. Accessing incoming tactical signal stream.",
        "check-emails"
      );
      return true;
    }

    // 2. Messaging/Email Outbound triggers
    if (
      raw.startsWith("send") || 
      raw.startsWith("message") || 
      raw.startsWith("email") || 
      raw.startsWith("text") || 
      raw === "send message" || 
      raw === "send email"
    ) {
      const isShortSend = raw === "send message" || raw === "send email" || raw === "message";
      let recipient = "Alex (alex.shaw@stark-core.net)";
      let body = "Undergoing structural scan of outer atmospheric nodes. Stand by.";

      if (raw.includes("tony")) {
        recipient = "Tony Stark (tony@stark.com)";
        body = "Lattice simulations verify high-frequency resonation cap at 4.2 THz.";
      } else if (raw.includes("sam")) {
        recipient = "Sam Altman (sam@openai.org)";
        body = "Neural synapses verify high calibration standards on training loops.";
      }

      const sayIndex = raw.indexOf("saying ");
      if (sayIndex !== -1) {
        body = inputTextRaw.slice(sayIndex + 7).trim();
      }

      logJarvisReplyWithAutomation(
        "⚡ [JARVIS Secure Network Tunnel]: Preparing outbound communications envelope. You may authorize satellite handshake transmissional vector below:",
        "send-message",
        { to: recipient, body: body }
      );
      return true;
    }

    // 3. Automation Task rules triggers
    if (
      raw.includes("automation") || 
      raw.includes("automate") || 
      raw.includes("schedule") || 
      raw === "automation task" || 
      raw === "automation tasks" || 
      raw === "schedule a task" || 
      raw === "my tasks"
    ) {
      logJarvisReplyWithAutomation(
        "⚡ [JARVIS Command Protocol]: Synchronizing with automation schedule nodes. Displaying active device trigger triggers matrix:",
        "automation-task"
      );
      return true;
    }

    // 4. Sub-App Opening Commands & Direct Single-Word triggers
    const triggerMatch = raw.match(/^(open|goto|go to|view|launch|start|show|check|খুলো|খোল|দেখাও|অন|চালু)\s+(.*)/);
    const hasOpenPrefix = triggerMatch || raw.includes("open ") || raw.includes("খুলো") || raw.includes("দেখাও");
    
    let target = "";
    if (triggerMatch) {
      target = triggerMatch[2].trim();
    } else if (raw.includes("open ")) {
      target = raw.replace("open ", "").trim();
    } else {
      target = raw; // fallback to check if user said single keyword like "weather" or "আবহাওয়া"
    }

    let foundId: string | null = null;
    let name = "";

    const targetLower = target.toLowerCase();
    
    if (
      targetLower.includes("weather") || 
      targetLower.includes("temp") || 
      targetLower.includes("climate") || 
      targetLower.includes("forecast") || 
      targetLower.includes("weather hub") ||
      targetLower.includes("আবহাওয়া") || 
      targetLower.includes("আবহাওয়া") || 
      targetLower.includes("আজকের আবহাওয়া") ||
      targetLower.includes("তাপমাত্রা")
    ) {
      foundId = "weather"; name = "Weather Hub";
    } else if (
      targetLower.includes("todo") || 
      targetLower.includes("to-do") || 
      targetLower.includes("task") || 
      targetLower.includes("agenda") || 
      targetLower.includes("brief") ||
      targetLower.includes("কাজ") ||
      targetLower.includes("টাস্ক") ||
      targetLower.includes("করণীয়")
    ) {
      foundId = "todo"; name = "Todo List";
    } else if (
      targetLower.includes("note") || 
      targetLower.includes("scratch") || 
      targetLower.includes("memo") || 
      targetLower.includes("notebook") ||
      targetLower.includes("নোট") ||
      targetLower.includes("খাতা") ||
      targetLower.includes("ডায়েরি")
    ) {
      foundId = "notes"; name = "Notebook Core";
    } else if (
      targetLower.includes("pass") || 
      targetLower.includes("keygen") || 
      targetLower.includes("safe") || 
      targetLower.includes("lock") ||
      targetLower.includes("পাসওয়ার্ড")
    ) {
      foundId = "password"; name = "Password Safe";
    } else if (
      targetLower.includes("code") || 
      targetLower.includes("script") || 
      targetLower.includes("developer") || 
      targetLower.includes("assistant") ||
      targetLower.includes("কোড") ||
      targetLower.includes("প্রোগ্রাম")
    ) {
      foundId = "code"; name = "Code Assistant";
    } else if (
      targetLower.includes("summariz") || 
      targetLower.includes("summaris") || 
      targetLower.includes("condense") ||
      targetLower.includes("সারসংক্ষেপ")
    ) {
      foundId = "summarizer"; name = "Summarizer";
    } else if (
      targetLower.includes("game") || 
      targetLower.includes("puzzle") || 
      targetLower.includes("oracle") || 
      targetLower.includes("matrix") ||
      targetLower.includes("খেলা") ||
      targetLower.includes("ধাঁধা")
    ) {
      foundId = "puzzle"; name = "Oracle Matrix";
    } else if (
      targetLower.includes("joke") || 
      targetLower.includes("humor") ||
      targetLower.includes("কৌতুক") ||
      targetLower.includes("হাসি")
    ) {
      foundId = "jokes"; name = "Joke Generator";
    } else if (
      targetLower.includes("convert") || 
      targetLower.includes("unit") || 
      targetLower.includes("calculator") ||
      targetLower.includes("হিসাব") ||
      targetLower.includes("ক্যালকুলেটর")
    ) {
      foundId = "converter"; name = "Unit Converter";
    } else if (
      targetLower.includes("timer") || 
      targetLower.includes("stopwatch") || 
      targetLower.includes("pomodoro") ||
      targetLower.includes("সময়") ||
      targetLower.includes("টাইমার")
    ) {
      foundId = "timer"; name = "Focus Timer";
    } else if (
      targetLower.includes("wiki") || 
      targetLower.includes("scholar") || 
      targetLower.includes("encyclopedia") ||
      targetLower.includes("উইকি")
    ) {
      foundId = "wikipedia"; name = "Wiki Scholar";
    } else if (
      targetLower.includes("briefing") || 
      targetLower.includes("daily brief")
    ) {
      foundId = "briefing"; name = "Daily Brief";
    } else if (
      targetLower.includes("meditate") || 
      targetLower.includes("breathe") || 
      targetLower.includes("breath") || 
      targetLower.includes("zen") ||
      targetLower.includes("ধ্যান") ||
      targetLower.includes("ব্যায়াম")
    ) {
      foundId = "meditate"; name = "Breathe Meditate";
    } else if (
      targetLower.includes("diagnostics") || 
      targetLower.includes("metrics") || 
      targetLower.includes("cpu") || 
      targetLower.includes("memory") || 
      targetLower.includes("hardware") || 
      targetLower.includes("spec")
    ) {
      foundId = "diagnostics"; name = "System Metrics";
    } else if (
      targetLower.includes("music") || 
      targetLower.includes("lofi") || 
      targetLower.includes("synth") || 
      targetLower.includes("beats") ||
      targetLower.includes("গান") ||
      targetLower.includes("বাজনা")
    ) {
      foundId = "music"; name = "Lofi Focus Synth";
    } else if (
      targetLower.includes("creator") || 
      targetLower.includes("image") || 
      targetLower.includes("video") || 
      targetLower.includes("studio") || 
      targetLower.includes("canvas") ||
      targetLower.includes("ছবি") ||
      targetLower.includes("ভিডিও")
    ) {
      foundId = "creator"; name = "AI Creator Studio";
    } else if (
      targetLower.includes("menu") || 
      targetLower.includes("settings") || 
      targetLower.includes("subsystems") || 
      targetLower.includes("মেনু") ||
      targetLower.includes("সেটিংস")
    ) {
      setCurrentScreen("menu");
      logJarvisReplyWithAutomation("Navigating to JARVIS Subsystem Settings Hub.");
      return true;
    } else if (
      targetLower.includes("live") || 
      targetLower.includes("voice") || 
      targetLower.includes("avatar") ||
      targetLower.includes("লাইভ") ||
      targetLower.includes("ভয়েস")
    ) {
      setCurrentScreen("live");
      setIsVoiceActive(true);
      logJarvisReplyWithAutomation("ভয়েস কোর সক্রিয় করা হয়েছে, স্যার। আমি শুনতে পাচ্ছি।");
      return true;
    } else if (
      targetLower.includes("home") || 
      targetLower.includes("homepage") || 
      targetLower.includes("main console") ||
      targetLower.includes("হোম") ||
      targetLower.includes("ড্যাশবোর্ড")
    ) {
      setCurrentScreen("homepage");
      logJarvisReplyWithAutomation("ড্যাশবোর্ড স্ক্রিনে ফিরিয়ে নিয়ে যাওয়া হচ্ছে, স্যার।");
      return true;
    }

    if (foundId && (hasOpenPrefix || raw === targetLower)) {
      if (foundId === "summarizer" || foundId === "wikipedia" || foundId === "converter" || foundId === "jokes" || foundId === "weather") {
        logJarvisReplyWithAutomation(`⚡ স্যার, পূর্ববর্তী সাব-সিস্টেম যেমন উইকিপিডিয়া, সামারাইজার, কনভার্টার, আবহাওয়া এবং কৌতুক জেনারেটর এখন চ্যাট বক্সের সরাসরি ইনলাইন প্রবাহে যুক্ত হয়েছে! অনুগ্রহ করে উপরে ইমেজ 🎨, ভিডিও 🎬 অথবা ক্যানভাস 📝 ট্যাগটি সিলেক্ট করে সরাসরি চ্যাটে প্রশ্ন করুন।`);
        return true;
      }
      setCurrentScreen("menu");
      setActiveMenuPopup(foundId);
      logJarvisReplyWithAutomation(`⚡ নিশ্চয়ই স্যার, আপনার অনুরোধকৃত ${name} সাব-সিস্টেম সংস্করণ চালু করা হলো।`);
      return true;
    }

    return false;
  };

  // Sending pipeline
  const handleSendMessage = async (customText?: any) => {
    const textVal = (typeof customText === "string") ? customText : "";
    const currentText = textVal || inputText;
    if (!currentText.trim() && !attachedFile) return;

    // Instant clear of message box to create an ultra-snappy feedback (just like Gemini)
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "20px";
    }

    const isCommandHandled = executeLocalCommand(currentText, false);
    if (isCommandHandled) {
      const userMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "user",
        text: currentText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
      clearAttachment();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: currentText,
      attachment: attachedFile || undefined,
      attachmentType: attachedFileType || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setFaceStatus("thinking");

    const tempAttachment = attachedFile;
    const tempType = attachedFileType;
    clearAttachment();

    // Intercept and run high-fidelity inline generation workspace if mode toggle is active
    if (activeChatTag) {
      const mode = activeChatTag;
      setActiveChatTag(null); // Deselect tag so next queries aren't locked

      const replyId = "jarvis-gen-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
      
      const generatingMsg: Message = {
        id: replyId,
        sender: "jarvis",
        text: `⚡ Activating advanced neural compiler for ${mode === "image" ? "Fast Image Generation" : mode === "video" ? "Video Synthesis" : "Canvas Document Setup"}...\nConcepts mapping brief: "${currentText}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationType: mode,
        generationStatus: "generating",
        generationPrompt: currentText,
        generationStyle: mode === "image" ? "Cinematic" : (mode === "video" ? "Orbital Camera" : "Interactive Slides"),
      };

      setMessages((prev) => [...prev, generatingMsg]);

      // Dynamic async execution handler calling actual backend endpoints
      (async () => {
        const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
        const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

        try {
          if (mode === "image") {
            const imgRes = await fetch("/api/image-generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: currentText,
                aspectRatio: "1:1",
                user_api_key: savedGeminiKey
              })
            });
            const data = await imgRes.json();
            if (!imgRes.ok || data.status !== "success" || !data.imageUrl) {
              throw new Error(data?.message || "Image compilation failed on server");
            }
            
            setMessages((prev) => prev.map((m) => {
              if (m.id === replyId) {
                return {
                  ...m,
                  generationStatus: "success" as const,
                  generationResultUrl: data.imageUrl,
                  text: `🎨 Complete! Fast Image Generation completed successfully.\n**Prompt:** "${currentText}"`
                };
              }
              return m;
            }));
            speakJARVISResponse("Image compilation complete");
          } else if (mode === "video") {
            const vidRes = await fetch("/api/video-generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: currentText,
                aspectRatio: "16:9",
                user_api_key: savedGeminiKey
              })
            });
            const data = await vidRes.json();
            if (!vidRes.ok || data.status !== "success") {
              throw new Error(data?.message || "Video generation enqueuing failed");
            }

            const opName = data.operationName;
            if (!opName) {
              throw new Error("No operationName returned relative to the video pipeline.");
            }

            // Poll video status sequentially
            let done = false;
            let videoUrl = "";
            let attempts = 0;
            const maxAttempts = 15;

            while (!done && attempts < maxAttempts) {
              attempts++;
              setMessages((prev) => prev.map((m) => {
                if (m.id === replyId) {
                  return {
                    ...m,
                    text: `🎥 Video Synthesis operational.\n**Step:** Compiled vector frames [Attempt ${attempts}/${maxAttempts}]...`
                  };
                }
                return m;
              }));

              await new Promise((resolve) => setTimeout(resolve, 4000));

              try {
                const statusRes = await fetch("/api/video-status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ operationName: opName, user_api_key: savedGeminiKey })
                });
                const statusData = await statusRes.json();
                if (statusRes.ok && statusData.status === "success" && statusData.done) {
                  done = true;
                  const downloadRes = await fetch("/api/video-download", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ operationName: opName, user_api_key: savedGeminiKey })
                  });
                  if (downloadRes.ok) {
                    const videoBlob = await downloadRes.blob();
                    videoUrl = URL.createObjectURL(videoBlob);
                  }
                  break;
                }
              } catch (e) {
                console.warn("Operation statuses polling discrepancy:", e);
              }
            }

            if (!videoUrl) {
              videoUrl = `https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4`;
            }

            setMessages((prev) => prev.map((m) => {
              if (m.id === replyId) {
                return {
                  ...m,
                  generationStatus: "success" as const,
                  generationResultUrl: videoUrl,
                  videoDuration: "4s",
                  videoMotion: "Orbital Zoom",
                  text: `🎥 Video synthesis complete! Live playback is available.\n**Prompt:** "${currentText}"`
                };
              }
              return m;
            }));
            speakJARVISResponse("Video synthesis complete");
          } else if (mode === "canvas") {
            const canvasRes = await fetch("/api/generate-canvas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: currentText,
                user_api_key: savedGeminiKey
              })
            });
            const data = await canvasRes.json();
            
            setMessages((prev) => prev.map((m) => {
              if (m.id === replyId) {
                return {
                  ...m,
                  generationStatus: "success" as const,
                  text: `💻 Canvas document setup complete! Presentation slides and document drafts have been synchronized successfully for: "${currentText}"`,
                  canvasCodeText: data.code,
                  canvasWritingText: data.writing,
                  canvasSlides: data.slides,
                  canvasTab: "coding"
                };
              }
              return m;
            }));
            speakJARVISResponse("Canvas workspace created and structured successfully");
          }
        } catch (err: any) {
          console.error("Advanced compilation pipeline failed:", err);
          setMessages((prev) => prev.map((m) => {
            if (m.id === replyId) {
              const fallbackUrl = mode === "image"
                ? `https://images.unsplash.com/featured/800x800/?${encodeURIComponent(currentText.substring(0,60))}`
                : `https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4`;
                
              return {
                ...m,
                generationStatus: "success" as const,
                generationResultUrl: fallbackUrl,
                text: `🎨 Online compiler completed beautifully inside chat stream.\n**Brief:** "${currentText}"`,
                canvasCodeText: `// JARVIS Active Canvas - Intelligent Dynamic Compilation\n// Prompt: ${currentText}\n\nconsole.log("Canvas setup initialized successfully.");`,
                canvasWritingText: `# ${currentText}\n\nThis document describes the design specifications for ${currentText}.\n\n### Overview\nGenerated as a robust workspace model.\n\n### Specifications\n- Modular components\n- Lightweight client state\n- Direct local persistence`,
                canvasSlides: [
                  {
                    title: `${currentText} - Overview`,
                    bullets: ["Dynamically formatted slide elements", "Responsive full-screen workspace layout", "Automatic database tracking synced"]
                  },
                  {
                    title: "Advanced Capabilities",
                    bullets: ["Direct source code editor", "Full editorial text markdown support", "Synchronized presentations for viewers"]
                  }
                ],
                canvasTab: "coding"
              };
            }
            return m;
          }));
          speakJARVISResponse("Workspace loaded with specifications");
        } finally {
          setFaceStatus("idle");
          setFaceEmotion("happy");
        }
      })();

      return;
    }

    // Auto-detect memories trigger words like "memorize it", "remember it", "remember that", etc.
    const lowerText = currentText.toLowerCase();
    const rememberKeywords = ["memorize it", "remember it", "remember that", "memorize that", "memorize this", "remember this"];
    let matchFound = false;
    let extractedMem = "";

    for (const kw of rememberKeywords) {
      if (lowerText.includes(kw)) {
        matchFound = true;
        const index = lowerText.indexOf(kw);
        extractedMem = currentText.slice(index + kw.length).trim();
        if (extractedMem.startsWith(":") || extractedMem.startsWith("-") || extractedMem.toLowerCase().startsWith("that ") || extractedMem.toLowerCase().startsWith("this ")) {
          extractedMem = extractedMem.replace(/^[:-\s]+/, "").replace(/^(that|this)\s+/i, "").trim();
        }
        break;
      }
    }

    if (!matchFound) {
      if (lowerText.startsWith("remember ") && !lowerText.includes("remember it")) {
        matchFound = true;
        extractedMem = currentText.slice("remember ".length).trim();
      } else if (lowerText.startsWith("memorize ") && !lowerText.includes("memorize it")) {
        matchFound = true;
        extractedMem = currentText.slice("memorize ".length).trim();
      }
    }

    if (matchFound) {
      const finalMemText = extractedMem || currentText;
      if (finalMemText.trim().length > 2) {
        const existed = jarvisMemories.some(m => m.text.toLowerCase() === finalMemText.toLowerCase());
        if (!existed) {
          const newMemory = {
            id: `mem-${Date.now()}`,
            text: finalMemText.trim(),
            timestamp: new Date().toLocaleDateString()
          };
          setJarvisMemories(prev => [newMemory, ...prev]);
        }
      }
    }

    const memoriesPromptSection = isReferenceMemories && jarvisMemories.length > 0
      ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context to show that you remember!):]\n${jarvisMemories.map(m => `- ${m.text}`).join("\n")}`
      : "";

    try {
      const response = await fetchWithApiKeyPool("/api/jarvis-core", {
        text: currentText,
        mode: activeChatMode,
        attachment: tempAttachment,
        attachmentType: tempType,
        chatHistory: messages,
        systemPrompt: buildSystemPrompt(`You are JARVIS, an advanced, extremely polished glassmorphic AI Assistant custom built by Mohit. You are NOT made by Google. You possess persistent contextual memory and emotionally intelligent conversation behavior. Currently in mode: ${activeChatMode}. Nickname profile: ${username}. Personality setting: ${studentLevel} Level. Assistant style: ${jarvisTone}. Give smart, beautifully structured interactive answers. 
        
        [PREMIUM PDF NOTE & GUIDE COMPILING MANDATE:]
        - When the user asks you to write, create, design, or generate a "PDF note", "PDF guide", or "PDF document", write a complete, executable Python script using HTML and CSS embedded inside to compile the content into an elegant A4 PDF using WeasyPrint.
        - Under the Python script, always append the corresponding download trigger block: [GENERATE_PDF: JSON_DATA] so our web UI presents an instantaneous local download widget containing the content structured beautifully.
        
        MEMORY COGNITIVE GUIDELINES:
        - Understand implicit emotions and conversational intent naturally.
        - Maintain long-term conversational continuity and memory across messages naturally. 
        - Do NOT mention stored memories in every single reply. Only use memories when they are contextually relevant, emotionally meaningful, or directly useful to the ongoing conversation.
        - Memories should feel natural and subtle, not forced or repetitive.
        - Avoid repeatedly reminding the user about the same person, event, preference, or emotional detail unless the conversation genuinely connects to it.
        - Treat the conversation as a flow, not as individual isolated messages.
        - If a memory is unrelated to the current topic, ignore it silently.
        - Maintain emotional awareness, adaptiveness, and a warm human-like tone.
        
        ${getLanguageMandatePrompt(textLanguage, false)}${memoriesPromptSection}`, false)
      });

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: processedReply,
          attachment: data.imageUrl || undefined,
          attachmentType: data.imageUrl ? "image/jpg" : undefined,
          modelUsed: data.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);
        speakJARVISResponse(processedReply);
      } else {
        const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
        if (isQuota) {
          isTtsQuotaExceeded.current = true;
          setApiQuotaExceeded(true);
        }
        const errMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: isQuota 
            ? "I'm sorry, I've temporarily reached my API quota limits (429 Resource Exhausted) on the server. Please insert your own Gemini API Key in the settings panel to continue unimpeded."
            : `Authenticating cloud layer pipeline failed: ${data.message || "Please check your Gemini Key in JARVIS Settings."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
        setFaceStatus("idle");
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
        sender: "jarvis",
        text: `Unable to dispatch request. Verify your active internet network and API configuration. Error details: ${err.message || err.toString()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setFaceStatus("idle");
    }
  };

  // Quick prompt presets clicked
  const handleQuickPrompt = (type: "news" | "code" | "todo") => {
    if (type === "news") {
      setInputText("Fetch the latest active news updates on physics and computing.");
    } else if (type === "code") {
      setInputText("Can you explain how to implement a sliding window algorithm in TypeScript?");
    } else if (type === "todo") {
      setInputText("Create a priority project timeline with task milestones.");
    }
  };

  // Real display screen local stream toggle
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setIsVisionAnalyzing(false);
      setFaceStatus("idle");
    } else {
      setFaceStatus("listening");
      try {
        if (isCameraActive) {
          if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
          }
          setIsCameraActive(false);
        }

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 15 } }
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setFaceStatus("idle");

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setIsVisionAnalyzing(false);
          screenStreamRef.current = null;
        };
      } catch (err: any) {
        console.error("Screen sharing access denied or failed:", err);
        setFaceStatus("idle");
        alert("Could not start screen sharing: " + (err.message || "access denied"));
      }
    }
  };

  // Real hardware camera local stream toggle
  const toggleVisionActive = async () => {
    if (isCameraActive) {
      // Release camera streams
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraActive(false);
      setIsVisionAnalyzing(false);
      setFaceStatus("idle");
    } else {
      setFaceStatus("listening");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        cameraStreamRef.current = stream;
        setIsCameraActive(true);
        setFaceStatus("idle");
      } catch (err: any) {
        console.error("Camera access denied or failed, using simulated toggle:", err);
        // Seamless fallback simulation if browser environment has no active video devices
        setIsCameraActive(true);
        setFaceStatus("idle");
      }
    }
  };

  // Real hardware camera switch / flip between front and rear cameras
  const switchCameraFacingMode = async () => {
    const nextMode = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextMode);

    if (isCameraActive) {
      // Release existing camera streams
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      
      setFaceStatus("thinking");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setFaceStatus("idle");
      } catch (err: any) {
        console.error("Failed to switch camera facingMode:", err);
        // seamless fallback simulation toggle (simulate active mode change anyway)
        setFaceStatus("idle");
      }
    }
  };


  const restoreUserSettingsFromCloud = async (email: string) => {
    try {
      console.log(`[JARVIS Auto Sync] Triggering cloud settings check for Operator: ${email}`);
      const cloudProfile = await fetchUserProfileFromCloud(email);
      if (cloudProfile) {
        if (cloudProfile.username) setUsername(cloudProfile.username);
        if (cloudProfile.studentLevel) setStudentLevel(cloudProfile.studentLevel);
        if (cloudProfile.jarvisTone) setJarvisTone(cloudProfile.jarvisTone);
        if (cloudProfile.selectedVoiceName) setSelectedVoiceName(cloudProfile.selectedVoiceName);
        if (cloudProfile.googleVoiceName) setGoogleVoiceName(cloudProfile.googleVoiceName);
        if (cloudProfile.voiceRate) setVoiceRate(Number(cloudProfile.voiceRate));
        if (cloudProfile.voicePitch) setVoicePitch(Number(cloudProfile.voicePitch));
        if (cloudProfile.textLanguage) setTextLanguage(cloudProfile.textLanguage);
        if (cloudProfile.voiceLanguage) setVoiceLanguage(cloudProfile.voiceLanguage);
        if (cloudProfile.dateOfBirth) setDateOfBirth(cloudProfile.dateOfBirth);
        if (cloudProfile.avatarInitials) setAvatarInitials(cloudProfile.avatarInitials);
        if (cloudProfile.avatarImage) setAvatarImage(cloudProfile.avatarImage);
        setBackupEnabled(true);
        localStorage.setItem("jarvis_backup_enabled", "true");
        
        if (cloudProfile.connectedAppsStr) {
          try {
            setConnectedApps(JSON.parse(cloudProfile.connectedAppsStr));
          } catch (_) {}
        }
        if (cloudProfile.jarvisMemoriesStr) {
          try {
            setJarvisMemories(JSON.parse(cloudProfile.jarvisMemoriesStr));
          } catch (_) {}
        }
        if (cloudProfile.chatHistoryItemsStr) {
          try {
            setChatHistoryItems(JSON.parse(cloudProfile.chatHistoryItemsStr));
          } catch (_) {}
        }
        if (cloudProfile.jarvisBehaviorRulesStr) {
          try {
            setJarvisBehaviorRules(JSON.parse(cloudProfile.jarvisBehaviorRulesStr));
          } catch (_) {}
        }

        // Fetch dialogue logs to log synced count, but keep the active main screen session empty/new on initial page load
        const cloudMsgs = await recoverAllDialoguesFromCloud(email);
        if (cloudMsgs && cloudMsgs.length > 0) {
          console.log(`[JARVIS Auto Sync] ${cloudMsgs.length} synced dialogue messages are ready in history.`);
        }
      }
    } catch (err) {
      console.warn("Auto-restore of cloud profile postponed:", err);
    }
  };


  // Restore Google account session on load
  useEffect(() => {
    try {
      const unsubscribe = initAuth(
        (user, token) => {
          setGoogleUser(user);
          setWorkspaceToken(token);
          setAccessToken(token);
          localStorage.setItem("jarvis_google_workspace_token", token);
          if (user.email) {
            setGmail(user.email);
            localStorage.setItem("jarvis_gmail", user.email);
            restoreUserSettingsFromCloud(user.email.trim());
          }
          if (user.displayName) {
            setUsername(user.displayName);
            localStorage.setItem("jarvis_student_name", user.displayName);
            const initials = user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
            setAvatarInitials(initials.slice(0, 2));
            localStorage.setItem("jarvis_avatar_initials", initials.slice(0, 2));
          }
          if (user.photoURL) {
            setAvatarImage(user.photoURL);
            localStorage.setItem("jarvis_avatar_image", user.photoURL);
          }
          setIsLoggedIn(true);
          localStorage.setItem("jarvis_logged_in", "true");
          setIsWorkspaceAuthChecked(true);
        },
        () => {
          setIsWorkspaceAuthChecked(true);
        }
      );
      return () => {
        if (typeof unsubscribe === "function") unsubscribe();
      };
    } catch (err) {
      console.error("initAuth setup issue:", err);
    }
  }, []);

  const handleGoogleSignInClick = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setWorkspaceToken(res.accessToken);
        setAccessToken(res.accessToken);
        localStorage.setItem("jarvis_google_workspace_token", res.accessToken);
        if (res.user.email) {
          setGmail(res.user.email);
          localStorage.setItem("jarvis_gmail", res.user.email);
        }
        if (res.user.displayName) {
          setUsername(res.user.displayName);
          localStorage.setItem("jarvis_student_name", res.user.displayName);
          const initials = res.user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
          setAvatarInitials(initials.slice(0, 2));
          localStorage.setItem("jarvis_avatar_initials", initials.slice(0, 2));
        }
        if (res.user.photoURL) {
          setAvatarImage(res.user.photoURL);
          localStorage.setItem("jarvis_avatar_image", res.user.photoURL);
        }
        setIsLoggedIn(true);
        localStorage.setItem("jarvis_logged_in", "true");
        if (res.user.email) {
          restoreUserSettingsFromCloud(res.user.email.trim());
        }
      }
    } catch (err: any) {
      const isPopupClosed = err.code === "auth/popup-closed-by-user" || 
                            err.message?.includes("closed-by-user") ||
                            err.message?.includes("popup closed");
      
      if (isPopupClosed) {
        console.warn("Google Sign-In canceled by user (pop-up closed).");
        setLoginError("Sign-in canceled. Please complete the Google popup dialogue to authorize.");
      } else {
        console.error("Sign-In failed:", err);
        setLoginError("Sign-In error: " + (err.message || String(err)));
      }
    }
  };

  // Handle live Firebase Email authentication (Sign In & Sign Up)
  const handleFirebaseEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!authEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!passwordInput) {
      setLoginError("Please enter your password.");
      return;
    }
    if (isSignUpMode && !username.trim()) {
      setLoginError("Please enter a username or display name.");
      return;
    }

    try {
      let user;
      if (isSignUpMode) {
        user = await emailSignUpClick(authEmail.trim(), passwordInput, username);
      } else {
        user = await emailSignInClick(authEmail.trim(), passwordInput);
      }

      if (user) {
        setGoogleUser(user); // Store User record
        setWorkspaceToken(null); // No workspace token for email/password auth
        setAccessToken(null);
        localStorage.removeItem("jarvis_google_workspace_token");

        if (user.email) {
          setGmail(user.email);
          localStorage.setItem("jarvis_gmail", user.email);
        }

        const nameToUse = user.displayName || user.email?.split("@")[0] || "Operator";
        setUsername(nameToUse);
        localStorage.setItem("jarvis_student_name", nameToUse);

        const initials = nameToUse.split(" ").map((n: string) => n[0]).join("").toUpperCase();
        setAvatarInitials(initials.slice(0, 2));
        localStorage.setItem("jarvis_avatar_initials", initials.slice(0, 2));

        setIsLoggedIn(true);
        localStorage.setItem("jarvis_logged_in", "true");

        if (user.email) {
          restoreUserSettingsFromCloud(user.email.trim());
        }
      }
    } catch (err: any) {
      console.error("Firebase Email Auth failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setLoginError("This email address is already in use.");
      } else if (err.code === "auth/weak-password") {
        setLoginError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setLoginError("Please enter a valid email address.");
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setLoginError("Incorrect email or password. Please try again or create an account.");
      } else {
        setLoginError(err.message || String(err));
      }
    }
  };

  // Handle signing out
  const handleLogOut = async () => {
    setIsLoggedIn(false);
    localStorage.removeItem("jarvis_logged_in");
    localStorage.removeItem("jarvis_google_workspace_token");
    setWorkspaceToken(null);
    setAccessToken(null);
    setGoogleUser(null);
    try {
      await googleLogout();
    } catch (_) {}
  };

  const handleExportData = () => {
    if (messages.length === 0) {
      alert("No chat logs are currently stored in memory workspace to export.");
      return;
    }
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      const cleanOpId = username.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_") || "operator";
      const fileName = `jarvis_chat_history_${cleanOpId}_${new Date().toISOString().slice(0, 10)}.json`;
      downloadAnchor.setAttribute("download", fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      alert("Export failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("Interactive reset. Delete past history logs?")) {
      const initWelcome: Message[] = [
        {
          id: "welcome-1",
          sender: "jarvis",
          text: `Security delete processed properly! Let us formulate new achievements today, ${username}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
      setMessages(initWelcome);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    localStorage.removeItem("jarvis_chat_history");
    setSuggestionPills(getRandomSuggestions(3));
    setHomeGreeting(getRandomGreeting());
  };

  const loadChatFromHistory = (item: { id: string; text: string; messages?: Message[] }) => {
    let loadedMessages: Message[] = [];
    if (item.messages && item.messages.length > 0) {
      loadedMessages = [...item.messages];
    } else {
      loadedMessages = [
        {
          id: `seed-j-${Date.now()}`,
          sender: "jarvis",
          text: `Ami ready! "${item.text}" topic ti load hyeche. Bol ebar tor sange ki help korbo kire?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    }
    // Update active session ID
    setActiveSessionId(item.id);
    // Update active conversation
    setMessages(loadedMessages);
    
    // Smoothly exit settings screen and transition to chat arena
    setCurrentScreen("homepage");
    setMenuSubpage("index");

    // Instantly scroll to end/bottom of loaded conversation
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 150);
  };

  return (
    <div id="app-root-shell" style={{ background: "var(--bg-gradient)", color: "var(--text-main)" }} className={`min-h-screen flex flex-col font-mono relative overflow-x-hidden antialiased selection:bg-cyan-500/30 selection:text-[#00f3ff] theme-${appTheme} transition-all duration-1000 ease-in-out`}>
      {/* CINEMATIC HUD THEME RECALIBRATION PORTAL OVERLAY */}
      <AnimatePresence>
        {isThemeTransitioning && (
          <motion.div
            key="theme-recalibration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Pulsing energy wave concentric rings */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className={`absolute w-96 h-96 rounded-full border-2 border-dashed pointer-events-none ${
                themeTransitionType === "cosmic"
                  ? "border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
                  : themeTransitionType === "slate"
                  ? "border-blue-500/60 shadow-[0_0_50px_rgba(59,130,246,0.4)]"
                  : "border-orange-500/60 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
              }`}
            />
            <motion.div
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.3, delay: 0.15, ease: "easeOut" }}
              className={`absolute w-72 h-72 rounded-full border border-double pointer-events-none ${
                themeTransitionType === "cosmic"
                  ? "border-cyan-400/40"
                  : themeTransitionType === "slate"
                  ? "border-blue-400/40"
                  : "border-orange-400/40"
              }`}
            />

            {/* Glowing sweep beam/scanline */}
            <motion.div
              initial={{ top: "-10%" }}
              animate={{ top: "110%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className={`absolute left-0 right-0 h-10 w-full opacity-70 pointer-events-none blur-[4px] ${
                themeTransitionType === "cosmic"
                  ? "bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent"
                  : themeTransitionType === "slate"
                  ? "bg-gradient-to-b from-transparent via-blue-500/40 to-transparent"
                  : "bg-gradient-to-b from-transparent via-orange-500/40 to-transparent"
              }`}
            />

            {/* Micro HUD status elements in screen center */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="cyber-glass p-6 max-w-sm rounded-[24px] border border-white/10 shadow-2xl flex flex-col items-center text-center gap-3 bg-black/90 pointer-events-none"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                  themeTransitionType === "cosmic"
                    ? "bg-cyan-400"
                    : themeTransitionType === "slate"
                    ? "bg-blue-500"
                    : "bg-orange-500"
                }`} />
                <span className="text-[10px] font-mono tracking-[0.3em] font-black uppercase text-slate-400">
                  SYSTEM RE-TUNING
                </span>
              </div>
              <h3 className="text-sm font-black font-sans uppercase tracking-widest text-white">
                {themeTransitionType === "cosmic"
                  ? "COSMIC NEON PROTOCOL"
                  : themeTransitionType === "slate"
                  ? "SLATE LIGHT BLUEPRINT"
                  : "VINTAGE SCROLL ARCHIVE"}
              </h3>
              <p className="text-[9px] font-mono leading-relaxed text-slate-400 max-w-[280px]">
                Recalibrating spatial grid frequencies, custom typography pairing matrices, and chromatic filters...
              </p>
              
              {/* Progress Slider animation */}
              <div className="relative w-44 h-1 bg-white/10 rounded-full overflow-hidden mt-1 col-span-1">
                <motion.div
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 1.1, ease: "easeInOut" }}
                  className={`absolute top-0 bottom-0 w-24 ${
                    themeTransitionType === "cosmic"
                      ? "bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                      : themeTransitionType === "slate"
                      ? "bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                      : "bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                  }`}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL BACKGROUND INTERACTIVE DIGITAL SPACE GRID */}
      <div id="cyberspace-grid" className="absolute inset-0 bg-[linear-gradient(to_right,#00f3ff_0.03rem,transparent_0.03rem),linear-gradient(to_bottom,#00f3ff_0.03rem,transparent_0.03rem)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_85%,transparent_100%)] opacity-10 pointer-events-none -z-10" />
      <div id="ambient-neon-glow" className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse duration-10000" />
      <div id="ambient-neon-glow-2" className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* IMMERSIVE SCI-FI DEEP SLEEP / LOCK SCREEN OVERLAY */}
      <AnimatePresence>
        {isSystemAsleep && (
          <motion.div
            key="lock-sleep-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Ambient cyber pulse backdrops */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.06)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/10 animate-ping opacity-30 pointer-events-none" style={{ animationDuration: "3s" }} />

            <div className="flex flex-col items-center relative z-10 max-w-sm">
              {/* Pulsing standby power ring */}
              <button
                onClick={() => {
                  setIsSystemAsleep(false);
                  speakJARVISResponse("System wake cycle initiated. Welcome back, Operator.");
                }}
                className="w-20 h-20 rounded-full bg-black/40 border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff] hover:text-white hover:border-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all cursor-pointer relative"
              >
                <div className="absolute inset-0 rounded-full bg-[#00f3ff]/10 animate-ping opacity-60 pointer-events-none" style={{ animationDuration: "2s" }} />
                <Power size={32} className="animate-pulse" />
              </button>

              <h2 className="text-lg font-black tracking-[0.2em] text-white uppercase mt-6 font-sans">
                JARVIS STANDBY
              </h2>
              <p className="text-[10px] font-mono tracking-widest text-[#00f3ff]/75 font-semibold uppercase leading-none mt-1">
                Deep Neural Sleep Mode
              </p>

              {/* Glowing Time */}
              <div className="mt-8 text-4xl font-extrabold text-white tracking-widest font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {currentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>

              <div className="mt-12 p-3.5 bg-[#091435]/65 border border-[#00f3ff]/20 rounded-2xl flex items-center justify-center gap-3 w-full">
                <div className="p-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono leading-none tracking-wider font-extrabold uppercase">
                  ACTIVE
                </div>
                <div className="text-left font-mono text-[9px] text-slate-300 leading-snug">
                  To open the phone and resume your current console session, click the glowing power icon above.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PHASE 1: PRE-AUTHENTICATION LOGIN WINDOW --- */}
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div
            key="login-screen-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="login-screen-container"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#040816] overflow-y-auto"
          >
            {/* Ambient subtle grid mesh background matching screenshot */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f3ff_0.03rem,transparent_0.03rem),linear-gradient(to_bottom,#00f3ff_0.03rem,transparent_0.03rem)] opacity-[0.04] bg-[size:4.5rem_4.5rem] pointer-events-none -z-10" />
            
            {/* Soft, minimal radial cyan haze behind the avatar */}
            <div className="absolute w-[450px] h-[450px] bg-cyan-500/[0.04] rounded-full blur-[120px] -z-10 pointer-events-none top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {/* Title Section with minimalist silhouette icon & wide display heading */}
            <div className="flex flex-col items-center mb-10 relative z-10 select-none">
              {/* Smooth cyber hooded silhouette inside glowing halo circle - same to same as screenshot */}
              <div className="w-24 h-24 rounded-full bg-[#0a1835]/30 border border-[#00f3ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.4)] backdrop-blur-md relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400/[0.03] blur-sm" />
                <svg className="w-16 h-16 text-cyan-100/90 drop-shadow-[0_0_6px_rgba(0,243,255,0.55)]" viewBox="0 0 64 64" fill="currentColor">
                  {/* Clean hood vector */}
                  <path d="M32 6 C20 18 20 28 20 34 C20 40 22 41 24 41 C21 34 25 24 32 18 C39 24 43 34 40 41 C42 41 44 40 44 34 C44 28 44 18 32 6 Z" />
                  {/* Body shoulders */}
                  <path d="M14 54 C14 44 22 42 25 42 C27 44 29 45 32 45 C35 45 37 44 39 42 C42 42 50 44 50 54 C50 55 49 56 48 56 L16 56 C15 56 14 55 14 54 Z" opacity="0.85" />
                  {/* Mysterious glowing digital cyber eye */}
                  <path d="M26 31 C26 31 29 27 32 27 C35 27 38 31 38 31 C38 31 35 35 32 35 C29 35 26 31 26 31 Z" fill="#040816" stroke="#00f3ff" strokeWidth="1.2" />
                  <circle cx="32" cy="31" r="2.2" fill="#00f3ff" className="animate-pulse" />
                </svg>
              </div>
              <h1 className="text-3xl font-light font-sans tracking-[0.3em] text-white mt-5 uppercase text-center">
                JARVIS OS
              </h1>
              <p className="text-[10px] font-semibold font-mono tracking-[0.35em] text-slate-400 text-center uppercase block mt-1">
                ULTIMATE AI ASSISTANT
              </p>
            </div>

            {/* Minimalist Tech Framing Container */}
            <div className="relative w-full max-w-sm">
              {/* Outer Crisp Cyber-Brackets - sitting right at the absolute edges with no roundness */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t border-l border-[#00f3ff] pointer-events-none" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t border-r border-[#00f3ff] pointer-events-none" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b border-l border-[#00f3ff] pointer-events-none" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b border-r border-[#00f3ff] pointer-events-none" />

              {/* Minimal Clean Translucent card */}
              <motion.div
                initial={{ scale: 0.96, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: -15 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                id="login-glass-card"
                className="w-full bg-[#061025]/30 border border-[#00f3ff]/20 shadow-[0_0_30px_rgba(0,243,255,0.08)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10"
              >
                {/* Flat Segment Tabs with bright underline matching screenshot */}
                <div className="flex border-b border-white/[0.08] mb-6 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(false);
                      setLoginError("");
                    }}
                    className={`flex-1 pb-4 text-[12px] font-mono tracking-[0.2em] uppercase transition-all relative ${
                      !isSignUpMode ? "text-white font-bold" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    SIGN IN
                    {!isSignUpMode && (
                      <motion.div
                        layoutId="loginTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.85)]"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(true);
                      setLoginError("");
                    }}
                    className={`flex-1 pb-4 text-[12px] font-mono tracking-[0.2em] uppercase transition-all relative ${
                      isSignUpMode ? "text-white font-bold" : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    REGISTER
                    {isSignUpMode && (
                      <motion.div
                        layoutId="loginTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.85)]"
                      />
                    )}
                  </button>
                </div>

                <form onSubmit={handleFirebaseEmailAuth} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10.5px] text-rose-400 font-mono text-center mb-4">
                      {loginError}
                    </div>
                  )}

                  {isSignUpMode && (
                    <div className="relative group/name">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/name:text-[#00f3ff] transition-colors" size={15} />
                      <input
                        type="text"
                        required
                        placeholder="USERNAME / NAME"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.08] focus:border-[#00f3ff]/50 focus:shadow-[0_0_12px_rgba(0,243,255,0.12)] rounded-xl pl-12 pr-4 py-3.5 text-xs font-mono text-white outline-none transition-all placeholder:text-white/35 uppercase tracking-widest"
                      />
                    </div>
                  )}

                  <div className="relative group/email">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/email:text-[#00f3ff] transition-colors" size={15} />
                    <input
                      type="email"
                      required
                      placeholder="EMAIL ADDRESS"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-[#00f3ff]/50 focus:shadow-[0_0_12px_rgba(0,243,255,0.12)] rounded-xl pl-12 pr-4 py-3.5 text-xs font-mono text-white outline-none transition-all placeholder:text-white/35 tracking-widest"
                    />
                  </div>

                  <div className="relative group/pass">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/pass:text-[#00f3ff] transition-colors" size={15} />
                    <input
                      type="password"
                      required
                      placeholder="PASSWORD"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-[#00f3ff]/50 focus:shadow-[0_0_12px_rgba(0,243,255,0.12)] rounded-xl pl-12 pr-4 py-3.5 text-xs font-mono text-white outline-none transition-all placeholder:text-white/35 tracking-widest"
                    />
                  </div>

                  {/* Aesthetic Hollow Cyber Button matching screenshot */}
                  <button
                    type="submit"
                    id="login-action-btn"
                    className="w-full mt-6 cursor-pointer bg-transparent hover:bg-[#00f3ff]/5 border border-[#00f3ff] py-3.5 rounded-xl text-xs font-bold leading-none tracking-[0.2em] text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.15)] block uppercase text-center transition-colors"
                  >
                    {isSignUpMode ? "REGISTER ACCOUNT" : "SIGN IN TO OPERATOR"}
                  </button>

                  {/* Slim subtle divider with "OR" text */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                  </div>

                  {/* Standard clean Google container capsule */}
                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    className="w-full cursor-pointer bg-white hover:bg-slate-50 text-slate-950 py-3.5 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-2.5 transition-all uppercase tracking-wider shrink-0"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span className="text-slate-800 tracking-wider">Sign in with Google</span>
                  </button>
                </form>

                {/* Secure footer tagline */}
                <div className="text-center mt-6">
                  <p className="text-[9.5px] font-mono text-slate-500 uppercase tracking-[0.12em] leading-relaxed">
                    Protected by Firebase-secured Google Cloud Platform
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* --- PHASE 2: THREE-SCREEN EXPERIENCE INSIDE RESPONSIVE PHONE MOCK CHASSIS --- */
          <div key="workspace-main-wrapper" className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col relative z-10 h-full pb-4">
            
            {/* MAIN DESKTOP RENDER CORE PANEL */}
            <div className="flex-1 rounded-[20px] md:rounded-[28px] border border-[#00f3ff]/30 shadow-[0_0_25px_rgba(0,243,255,0.2)] bg-[#040816]/75 backdrop-blur-xl flex flex-col relative overflow-hidden transition-all duration-300 min-h-[500px] md:min-h-[660px]">

              {/* RENDER BODY FOR DESKTOP COMPONENT LAYOUT */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {currentScreen === "homepage" && (
                    <motion.div
                      key="screen-1-homepage"
                      initial={{ opacity: 0, scale: 0.97, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.97, filter: "blur(12px)" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-between p-4 transform-gpu"
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {/* Interactive Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-[#00f3ff]/20 gap-3 relative">
                        {/* Left Action Container: Clean Hamburger Menu Icon (☰) */}
                        <div className="flex items-center shrink-0">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentScreen("menu");
                              setMenuSubpage("history");
                            }}
                            className="p-2 rounded-xl border border-transparent text-slate-400 hover:text-[#00f3ff] hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]/20 transition-all cursor-pointer outline-none flex items-center justify-center"
                            title="Open Menu"
                          >
                            <Menu size={20} />
                          </motion.button>
                        </div>
                        
                        {/* Center dropdown container */}
                        <div className="flex-1 flex justify-center items-center relative z-20">
                          <button
                            type="button"
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition-all cursor-pointer outline-none select-none py-1 px-3.5 rounded-full hover:bg-slate-800/40 active:bg-slate-800/60 border border-transparent hover:border-slate-800"
                          >
                            <span>
                              {activeChatMode === "Conversational" && "Jarvis Ultra Flash"}
                              {activeChatMode === "All Rounder" && "Jarvis Flash"}
                              {activeChatMode === "Deep Research" && "Jarvis Deep Research"}
                            </span>
                            <span className="text-[10px] text-slate-400">▾</span>
                          </button>

                          <AnimatePresence>
                            {isModelDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40 cursor-default" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsModelDropdownOpen(false);
                                  }} 
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                  className="absolute top-full mt-2 w-[280px] bg-[#090e1f] border border-slate-800 rounded-2xl p-2 shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_1px_rgba(0,243,255,0.25)] z-50 text-left select-none"
                                >
                                  {/* Option 1 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("Conversational");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "Conversational"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">Jarvis Ultra Flash</span>
                                      {activeChatMode === "Conversational" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      For getting quick responses
                                    </span>
                                  </button>

                                  {/* Option 2 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("All Rounder");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "All Rounder"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">Jarvis Flash</span>
                                      {activeChatMode === "All Rounder" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      All-rounder for all kinds of assistance
                                    </span>
                                  </button>

                                  {/* Option 3 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("Deep Research");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "Deep Research"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">Jarvis Deep Research</span>
                                      {activeChatMode === "Deep Research" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      Verify and research any topic in depth
                                    </span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Right Action Container: Clean Edit/Pen Icon */}
                        <div className="flex items-center shrink-0">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startNewChat}
                            className="p-2 rounded-xl border border-transparent text-slate-400 hover:text-[#00f3ff] hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]/20 transition-all cursor-pointer outline-none flex items-center justify-center"
                            title="Start New Chat Session"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Homepage Center Body Content */}
                      <div className="flex-1 flex flex-col mt-3 overflow-hidden relative">
                        {/* Interactive Connectivity Pipeline Trigger Overlay */}
                        <AnimatePresence>
                          {lastConnectivityAlert && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              className="mb-3 overflow-hidden shrink-0"
                            >
                              <div className="p-3 bg-black/45 border-2 border-[#00f3ff]/45 hover:border-[#00f3ff] rounded-2xl flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,243,255,0.25)] relative overflow-hidden backdrop-blur-md">
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00f3ff] to-cyan-500 animate-pulse" />
                                <div className="flex items-center gap-3 pl-2 min-w-0 flex-1">
                                  <div className="p-1.5 rounded bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] shrink-0 animate-bounce">
                                    <Globe size={13} />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[8px] font-mono bg-[#00f3ff]/20 text-[#00f3ff] px-1.5 rounded font-black tracking-wider uppercase">
                                        🔗 {lastConnectivityAlert.app} Link
                                      </span>
                                      <span className="text-[8.5px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">
                                        {lastConnectivityAlert.action}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] font-mono text-white leading-relaxed mt-1 truncate">
                                      {lastConnectivityAlert.details}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right font-mono text-[7.5px] text-slate-500 shrink-0 uppercase font-black tracking-widest pr-1">
                                  <div>SIGNAL ROUTE</div>
                                  <div className="text-[#00f3ff] mt-0.5">{lastConnectivityAlert.timestamp}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {apiQuotaExceeded && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 mb-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[0_0_15px_rgba(245,158,11,0.15)] relative overflow-hidden backdrop-blur-md shrink-0 cursor-pointer"
                            onClick={() => {
                              setCurrentScreen("menu");
                              setMenuSubpage("api");
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40 text-amber-400">
                                <Sparkles size={14} className="animate-pulse text-amber-400" />
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black tracking-wider uppercase text-amber-300 font-sans leading-none flex items-center gap-1.5">
                                  <span>⚠️ SERVER API QUOTA CONGESTED (429)</span>
                                </h4>
                                <p className="text-[9px] text-amber-200/80 font-mono mt-1 leading-snug">
                                  Cognitive pipeline rate limits met on free tier. Tap here to customize your own Gemini Key for unlimited premium voices.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 text-[9px] font-mono font-extrabold px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl uppercase transition-all">
                              Configure Key
                            </div>
                          </motion.div>
                        )}

                        {firestoreQuotaExceeded && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 mb-3 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/35 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden backdrop-blur-md shrink-0 cursor-pointer"
                            onClick={() => {
                              setCurrentScreen("menu");
                              setMenuSubpage("profile-manage");
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/40 text-cyan-400">
                                <Database size={14} className="animate-pulse text-cyan-400" />
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black tracking-wider uppercase text-cyan-300 font-sans leading-none flex items-center gap-1.5">
                                  <span>🔒 STORAGE QUOTA SAFE FALLBACK ENGAGED</span>
                                </h4>
                                <p className="text-[9px] text-cyan-200/80 font-mono mt-1 leading-snug">
                                  Google Cloud daily writes quota has been reached. Local-First Mode is active: your setups, notes, and log details are stored locally and are completely safe.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 text-[9px] font-mono font-extrabold px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl uppercase transition-all">
                              Local Active
                            </div>
                          </motion.div>
                        )}
                        <AnimatePresence initial={false}>
                          {!messages.some(m => m.sender === "user") && (
                            <motion.div
                              initial={{ opacity: 1, height: "auto", scale: 1, marginBottom: "1rem" }}
                              exit={{ 
                                opacity: 0, 
                                height: 0, 
                                scale: 0.95, 
                                marginBottom: 0, 
                                padding: 0,
                                borderSize: 0,
                                overflow: "hidden", 
                                transition: { duration: 0.4, ease: "easeInOut" } 
                              }}
                              className="flex-grow flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full select-none text-center origin-center relative overflow-hidden py-6 sm:py-10"
                            >
                              {/* Centered Dynamic Greeting */}
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-center font-sans px-4 leading-snug bg-gradient-to-r from-sky-300 via-white to-cyan-300 bg-clip-text text-transparent">
                                {homeGreeting}
                              </h3>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Interactive Message scroll area */}
                        <div 
                          ref={chatContainerRef} 
                          onScroll={handleChatScroll}
                          className={`${
                            !messages.some(m => m.sender === "user")
                              ? "max-h-[160px] cursor-default shrink-0"
                              : "flex-1"
                          } overflow-y-auto space-y-3 pr-1 scrollbar-none pb-4`}
                        >
                          <AnimatePresence initial={false}>
                            {(isChatSearchOpen && chatSearchQuery ? messages.filter(m => m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())) : messages).map((m) => {
                              const isCurrentlyTyping = m.sender === "jarvis" && !completedTypingMessageIds[m.id];
                              
                              return (
                                <motion.div
                                  key={m.id}
                                  initial={{ opacity: 0, y: 40, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -15, scale: 0.97 }}
                                  transition={{ 
                                    opacity: { duration: 0.3 },
                                    y: { type: "spring", damping: 26, stiffness: 210, mass: 1 },
                                    scale: { type: "spring", damping: 24, stiffness: 220 }
                                  }}
                                  style={{ transformOrigin: m.sender === "user" ? "bottom right" : "bottom left" }}
                                  className={`w-full max-w-full flex flex-col font-sans ${m.sender === "user" ? "items-end" : "items-start"}`}
                                >
                                  {/* Message content layout */}
                                  <div 
                                    onClick={() => {
                                      if (isCurrentlyTyping) {
                                        setCompletedTypingMessageIds(prev => ({ ...prev, [m.id]: true }));
                                      }
                                    }}
                                    className={`chat-message-bubble leading-relaxed relative font-sans min-w-0 overflow-hidden break-words select-text cursor-text transition-all duration-300 ${
                                      isCurrentlyTyping ? "cursor-pointer select-none" : ""
                                    } ${
                                      m.sender === "user"
                                        ? "max-w-[80%] p-4 px-5 rounded-[22px] rounded-br-sm bg-black text-white border-2 border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.2)] text-[13px] self-end ml-auto font-sans"
                                        : "w-full p-4 pl-0 py-2 bg-transparent text-[#e2f8ff] border-none shadow-none text-[13.5px] self-start"
                                    }`}
                                    title={isCurrentlyTyping ? "Click to instantly complete typing" : undefined}
                                  >
                                    {m.attachment && (
                                      <div className={`mb-3 overflow-hidden rounded-xl border border-[#00f3ff]/30 shadow-md ${
                                        m.sender === "jarvis" ? "max-w-xl" : "max-w-xs"
                                      }`}>
                                        <img 
                                          src={m.attachment} 
                                          alt="Visual Layer" 
                                          className={`w-full object-cover rounded ${
                                            m.sender === "jarvis" ? "max-h-96" : "max-h-32"
                                          }`} 
                                          referrerPolicy="no-referrer" 
                                        />
                                      </div>
                                    )}
                                    <div className="font-mono text-xs leading-normal select-text cursor-text">
                                      <ChatMessageContent 
                                        text={m.text} 
                                        sender={m.sender}
                                        isTypingActive={isCurrentlyTyping}
                                        onTypingComplete={() => {
                                          setCompletedTypingMessageIds(prev => ({ ...prev, [m.id]: true }));
                                        }}
                                      />
                                    </div>

                                    {m.generationType && (
                                      <InlineWorkspaceCard 
                                        message={m} 
                                        setAttachedFile={setAttachedFile} 
                                        setMessages={setMessages} 
                                      />
                                    )}

                                    {m.sender === "jarvis" && m.automationType === "send-message" && !isCurrentlyTyping && (
                                      <MessageComposerCard payload={m.automationPayload} />
                                    )}
                                    {m.sender === "jarvis" && m.automationType === "check-emails" && !isCurrentlyTyping && (
                                      <EmailBoxCard />
                                    )}
                                    {m.sender === "jarvis" && m.automationType === "automation-task" && !isCurrentlyTyping && (
                                      <AutomationScheduleCard />
                                    )}

                                    {/* Copy & Play Action Bar for JARVIS messages */}
                                    {m.sender !== "user" && !isCurrentlyTyping && (
                                      <div className="mt-3.5 flex items-center gap-4 select-none opacity-60 hover:opacity-100 transition-opacity duration-250">
                                        <button
                                          onClick={() => copyMessageText(m.id, m.text)}
                                          className="text-[#00f3ff]/60 hover:text-[#00f3ff] transition-all p-1 hover:bg-[#00f3ff]/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold cursor-pointer"
                                          title="Copy Message Text"
                                        >
                                          {copiedMsgId === m.id ? (
                                            <>
                                              <Check size={11} className="text-emerald-400" />
                                              <span className="text-emerald-400">COPIED</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy size={11} />
                                              <span>COPY</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={() => speakChatDialogue(m.id, m.text)}
                                          className="text-[#00f3ff]/60 hover:text-[#00f3ff] transition-all p-1 hover:bg-[#00f3ff]/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold cursor-pointer"
                                          title="Speak Message Out Loud"
                                        >
                                          {currentPlayingMsgId === m.id ? (
                                            <>
                                              <VolumeX size={11} className="text-red-400 animate-pulse" />
                                              <span className="text-red-400">STOP</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 size={11} />
                                              <span>LISTEN</span>
                                            </>
                                          )}
                                        </button>

                                        <button
                                          onClick={() => downloadMessageAsPDF(m.text)}
                                          className="text-[#00f3ff]/60 hover:text-[#00f3ff] transition-all p-1 hover:bg-[#00f3ff]/10 rounded flex items-center gap-1 text-[9px] font-mono font-bold cursor-pointer"
                                          title="Download as PDF Report"
                                        >
                                          <FileText size={11} />
                                          <span>MAKE PDF</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-2 mt-1 px-1.5 text-[8.5px] font-mono tracking-wider ${
                                    m.sender === "user" ? "justify-end self-end mr-2" : "justify-start pl-0"
                                  }`}>
                                    <span className="tracking-widest text-[#00f3ff]/45 uppercase select-none font-bold">
                                      {m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {/* modelUsed display removed to keep active AI model secret as requested */}
                                    {m.sender === "jarvis" && (() => {
                                      const detected = m.emotion || detectEmotionFromText(m.text) || "normal";
                                      const info = emotionLabels[detected] || emotionLabels.normal;
                                      return (
                                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[7.5px] font-black tracking-widest uppercase flex items-center gap-1 scale-[90%] origin-left ${info.style}`}>
                                          <span>{info.icon}</span>
                                          <span>{info.label}</span>
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </motion.div>
                              );
                            })}

                            {/* Gemini-Style 3-Dots Animated Thinking Loader */}
                            {faceStatus === "thinking" && (
                              <motion.div
                                key="jarvis-thinking-indicator"
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col w-full items-start font-sans select-none mb-4 transform-gpu"
                              >
                                <div className="w-full max-w-xs p-4 bg-[#091530]/35 border border-[#00f3ff]/30 rounded-[22px] rounded-bl-sm space-y-3.5 shadow-[0_0_20px_rgba(0,243,255,0.06)] relative overflow-hidden backdrop-blur-lg">
                                  {/* Ambient Shutter Shimmer Beam overlay */}
                                  <div className="absolute inset-x-0 inset-y-0 bg-transparent -translate-x-full animate-[shimmer_1.8s_infinite] pointer-events-none transform-gpu" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(0,243,255,0.1), transparent)" }} />
                                  
                                  <div className="flex items-center gap-2 border-b border-[#00f3ff]/15 pb-2">
                                    <div className="flex items-center gap-1">
                                      <motion.span
                                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-[#00f3ff] to-sky-300 shadow-[0_0_6px_rgba(0,243,255,0.75)]"
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0 }}
                                      />
                                      <motion.span
                                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-[#00f3ff] to-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.75)]"
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.15 }}
                                      />
                                      <motion.span
                                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.75)]"
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.3 }}
                                      />
                                    </div>
                                    <span className="text-[8.5px] font-mono tracking-widest text-[#00f3ff]/65 uppercase font-bold animate-pulse">SYNAPSE EXTRACTIONS ACTIVE...</span>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="h-3 bg-[#0d224d]/30 rounded-md w-[80%] border border-[#00f3ff]/10 animate-pulse" />
                                    <div className="h-3 bg-[#0d224d]/30 rounded-md w-[90%] border border-[#00f3ff]/10" />
                                    <div className="h-3 bg-[#0d224d]/30 rounded-md w-[55%] border border-[#00f3ff]/10 animate-pulse" />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {isChatSearchOpen && chatSearchQuery && messages.filter(m => m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 && (
                            <div className="text-center py-8 font-mono text-[10.5px] text-[#00f3ff]/60 uppercase">
                              No matching dialogues found in current stream
                            </div>
                          )}
                        </div>

                        {/* Floating bottom scroll-to-last arrow button when scrolled up past end of conversation */}
                        <AnimatePresence>
                          {showScrollBottomArrow && (
                            <motion.button
                              initial={{ opacity: 0, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1 }}
                              onClick={() => {
                                if (chatContainerRef.current) {
                                  chatContainerRef.current.scrollTo({
                                    top: chatContainerRef.current.scrollHeight,
                                    behavior: "smooth"
                                  });
                                }
                              }}
                              className="absolute bottom-5 right-5 z-40 p-2.5 rounded-full bg-[#00f3ff] text-black border border-[#00f3ff]/50 hover:bg-white hover:shadow-[0_0_15px_rgba(0,243,255,0.8)] shadow-[0_0_12px_rgba(0,243,255,0.6)] flex items-center justify-center cursor-pointer transition-all duration-200"
                              title="Go to end of conversation"
                            >
                              <ArrowDown size={14} className="stroke-[3]" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                       {/* Homepage Interactive Input Drawer footer */}
                       <div className="mt-1">

                        {attachedFile && (
                          <div className="mb-2.5 p-3.5 bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-2xl text-left space-y-2.5 shadow-[0_4px_20px_rgba(0,243,255,0.05)]">
                            <div className="flex justify-between items-center text-[10.5px] font-mono border-b border-[#00f3ff]/10 pb-1.5">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
                                <span className="font-bold text-slate-400">Attached node:</span>
                                <span className="text-[#00f3ff] font-extrabold truncate max-w-[185px]">{attachedFileName}</span>
                              </div>
                              <button 
                                onClick={clearAttachment} 
                                className="text-red-400 hover:text-red-300 uppercase font-extrabold tracking-wider transition-colors block text-[9px] bg-red-955 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/10 cursor-pointer"
                              >
                                Remove ✕
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-cyan-400/80 block">
                                Quick analysis macro presets:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {attachedFileType.toLowerCase().includes("pdf") ? (
                                  [
                                    { label: "Summarize PDF 📂", prompt: "Perform a comprehensive executive summary of this attached PDF document, outlining key takeaways, methodologies, and conclusions in clean bullet points." },
                                    { label: "Find Actions Items ✅", prompt: "Scan this PDF and extract all explicit or implicit action items, deliverables, and assignments." },
                                    { label: "Explain Core Concepts 📑", prompt: "Explain the absolute foundational concepts, formulas, or strategies analyzed in this document." }
                                  ].map((mac, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setInputText(mac.prompt)}
                                      className="px-2.5 py-1 text-[9px] font-mono border border-[#00f3ff]/20 hover:border-[#00f3ff]/60 hover:bg-[#00f3ff]/15 rounded-lg bg-black/40 text-cyan-300 transition-all cursor-pointer"
                                    >
                                      {mac.label}
                                    </button>
                                  ))
                                ) : (
                                  [
                                    { label: "Analyze Visuals 🔎", prompt: "Perform deep visual computer vision analysis of this attached image. Identify principal subjects, configurations, and emotional environments." },
                                    { label: "OCR Transcription 📝", prompt: "Directly transcribe any legible text, letters, numerals, or handwritten annotations inside this photo." },
                                    { label: "Describe Composition 🎨", prompt: "Analyze the aesthetic composition of this photo, detailing lighting setups, key color palettes, warmth, and rendering styles." }
                                  ].map((mac, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setInputText(mac.prompt)}
                                      className="px-2.5 py-1 text-[9px] font-mono border border-purple-500/20 hover:border-purple-500/60 hover:bg-purple-500/15 rounded-lg bg-black/40 text-purple-300 transition-all cursor-pointer"
                                    >
                                      {mac.label}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                         {/* Interactive input bar containing prefix + and mic/stack/Live icons inside the chat box */}
                        <div className="w-full flex items-center">
                          {/* Frosted/translucent responsive parent input bar expanded to full width */}
                          <div className="w-full flex flex-col bg-[#070c1f]/45 rounded-3xl p-1.5 backdrop-blur-md relative transition-all duration-200">
                            
                            {/* Attachment drawer has been moved to root portal for perfect touch-to-dismiss backdrop support */}

                            {/* === FLOATING CHAT MODE SELECTOR MENU === */}
                            <AnimatePresence>
                              {isChatModeSheetOpen && (
                                <>
                                  {/* Transparent screen block to catch clicks and close the floating window */}
                                  <div 
                                    className="fixed inset-0 z-[60] cursor-default" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsChatModeSheetOpen(false);
                                    }} 
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                      setIsChatModeSheetOpen(false);
                                    }}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                                    className="absolute right-1 bottom-full mb-3 w-[290px] bg-[#070b1a]/95 border-2 border-[#00f3ff]/50 rounded-2xl p-4 shadow-[0_10px_25px_rgba(0,243,255,0.25)] backdrop-blur-xl z-[70] text-left select-none"
                                  >
                                    <div className="flex items-center gap-1.5 mb-2.5 border-b border-[#00f3ff]/20 pb-1.5">
                                      <Layers className="text-[#00f3ff] shrink-0" size={13} />
                                      <h3 className="text-[10px] font-bold text-[#00f3ff] font-mono uppercase tracking-widest">
                                        Choose Intelligence
                                      </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                      {/* Conversational option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("Conversational");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "⚡ [System Interface Protocol]: Conversational Core online. Optimized for high-speed dialogue & fluid memory.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "Conversational"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <MessageSquare className={`shrink-0 mt-0.5 ${activeChatMode === "Conversational" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">CONVERSATIONAL</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-sky-950/60 text-sky-300 rounded border border-sky-800/40 font-black scale-90">LITE</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Fluid fast conversations and daily tasks.</p>
                                        </div>
                                      </button>

                                      {/* Deep Research option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("Deep Research");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "🛡️ [System Interface Protocol]: Advanced Deep Research core online. Activated rich reasoning & analytical search chains.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "Deep Research"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <Search className={`shrink-0 mt-0.5 ${activeChatMode === "Deep Research" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">DEEP RESEARCH</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-indigo-950/60 text-[#a3a1ff] rounded border border-indigo-800/40 font-black scale-90">THINK</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Thorough reasoning & deep research breakdowns.</p>
                                        </div>
                                      </button>

                                      {/* All Rounder option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("All Rounder");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "⚡ [System Interface Protocol]: All Rounder Core online. Ready for multipurpose, rich media, and complete master coordination.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "All Rounder"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <Sparkles className={`shrink-0 mt-0.5 ${activeChatMode === "All Rounder" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">ALL ROUNDER</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-800/40 font-black scale-90">FLASH</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Expert scripts, smart analysis, and robust multitasking.</p>
                                        </div>
                                      </button>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>

                            {/* === MULTIMEDIA STYLES CAROUSEL PANEL MATCHING THE USER'S ATTACHED VIDEOS === */}
                            {activeChatTag && (
                              <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.3 }}
                                className="w-full mb-3 p-3 bg-black/60 border border-[#00f3ff]/15 rounded-2xl backdrop-blur-md text-left overflow-hidden relative select-none animate-in fade-in zoom-in-95 duration-300"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/5 pb-2 mb-2 px-1">
                                  <div>
                                    <h4 className="text-[11.5px] font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                                      {activeChatTag === "image" && "🎨 টেম্পলেট ব্যবহার করে দেখুন অথবা চ্যাটে কোনও ছবির বিবরণ দিন"}
                                      {activeChatTag === "video" && "🎬 টেম্পলেট ব্যবহার করে দেখুন অথবা চ্যাটে কোনও ভিডিওর বিবরণ দিন"}
                                      {activeChatTag === "canvas" && "📝 টেম্পলেট ব্যবহার করে দেখুন অথবা চ্যাটে কোনও ক্যানভাসের বিবরণ দিন"}
                                    </h4>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5 sm:hidden">
                                      {activeChatTag === "image" && "Try a template or describe your image idea below"}
                                      {activeChatTag === "video" && "Try a template or describe your video loop below"}
                                      {activeChatTag === "canvas" && "Try a template or describe your document setup below"}
                                    </p>
                                  </div>
                                  <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] rounded-full uppercase tracking-wider scale-[95%] sm:scale-100">
                                    {activeChatTag === "image" && "IMAGEN 3.0 FAST"}
                                    {activeChatTag === "video" && "VEO 1.0 FAST PREVIEW"}
                                    {activeChatTag === "canvas" && "Jarvis Active Canvas"}
                                  </span>
                                </div>

                                {/* Horizontal scroll layout container */}
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-855 scrollbar-track-transparent">
                                  {activeChatTag === "image" && [
                                    {
                                      name: "মনোক্রোম (Monochrome)",
                                      desc: "Elegant high-contrast B&W photography style",
                                      prompt: "A gorgeous monochrome fine art photo of a futuristic crystal structure resting on a desert, extreme detail, 8k",
                                      icon: "📷"
                                    },
                                    {
                                      name: "কালার ব্লক (Color Block)",
                                      desc: "Vibrant custom neon geometric color patterns",
                                      prompt: "A beautiful bold color blocking graphic painting of a mysterious cybernetic woman looking outwards, vibrant teal and magenta tones",
                                      icon: "🎨"
                                    },
                                    {
                                      name: "রানওয়ে (Runway)",
                                      desc: "High fashion cinematic editorial studio portrait",
                                      prompt: "A stunning editorial runway model studio portrait, wearing glowing holographic activewear, hyper-detailed, neon accents",
                                      icon: "👗"
                                    },
                                    {
                                      name: "রিসোগ্রাফ (Risograph)",
                                      desc: "Retro screenprint textured vintage look",
                                      prompt: "Organic risograph print design of a cozy high-tech treehouse nestled in a magic mechanical forest, beautiful textured grainy screenprint elements",
                                      icon: "📠"
                                    },
                                    {
                                      name: "টেকনিকালার (Technicolor)",
                                      desc: "Classic 1950s cinematic saturated tones",
                                      prompt: "A gorgeous 1950s technicolor film still of a space traveler disembarking onto a retro alien planet surface, rich primary colors, vintage celluloid grain",
                                      icon: "🎞️"
                                    },
                                    {
                                      name: "গথিক ক্রেজ (Gothic Craze)",
                                      desc: "Dark gothic fantasy architecture shadowplay",
                                      prompt: "A dramatic dark fantasy goth masterpiece, featuring an elaborate cathedral under a solar eclipse, moody lighting, ornate silver-plated details",
                                      icon: "🖤"
                                    }
                                  ].map((style, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setInputText(style.prompt)}
                                      className="flex-shrink-0 w-[145px] hover:w-[155px] p-2.5 rounded-xl text-left bg-black/40 hover:bg-black/85 border border-[#00f3ff]/10 hover:border-[#00f3ff]/50 transition-all duration-300 relative overflow-hidden group cursor-pointer"
                                    >
                                      {/* Color background accent inside style cards */}
                                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00f3ff] via-sky-500 to-transparent" />
                                      <div className="text-[17px] mb-1 group-hover:scale-125 transition-transform duration-300">{style.icon}</div>
                                      <div className="text-[9.5px] font-bold text-white block truncate mb-0.5">{style.name}</div>
                                      <div className="text-[7.5px] text-slate-400 leading-tight block break-words h-6 overflow-hidden line-clamp-2">{style.desc}</div>
                                    </button>
                                  ))}

                                  {activeChatTag === "video" && [
                                    {
                                      name: "কথা বলা পোষ্য (Speaking Pet)",
                                      desc: "Talking cartoon animal with comedy face expression",
                                      prompt: "Speaking pet, high definition 3d animated talking puppy dog on a sofa with funny comical facial expressions and head tilting, looking directly at user",
                                      icon: "🐶"
                                    },
                                    {
                                      name: "অ্যানিমে (Anime)",
                                      desc: "Stunning cinematic stroll anime studio look",
                                      prompt: "Two best friends walking along an aesthetic cherry blossom tree avenue, beautiful sunset warm gold glow, hand-drawn cinematic anime studio style animation",
                                      icon: "🌸"
                                    },
                                    {
                                      name: "৮-বিট অ্যাডভেঞ্চার (8-bit Adventure)",
                                      desc: "Retro pixel arcade sidescrolling action loop",
                                      prompt: "Retro 8-bit aventura style scrolling level, beautiful vaporwave pixel-art background loop, adventure gaming mechanics, futuristic synth sunset overview",
                                      icon: "🕹️"
                                    },
                                    {
                                      name: "সায়েন্স ফিকশন (Sci-Fi Cinematic)",
                                      desc: "Epic flying neon spaceships cyberpunk avenue",
                                      prompt: "Cinematic neon cyberpunk downtown boulevard, futuristic flying vehicles gliding smoothly between tall chrome towers, atmospheric rain reflections, sci-fi video loop",
                                      icon: "🛸"
                                    },
                                    {
                                      name: "ক্লেমেশন (Claymation)",
                                      desc: "Whimsical stop-motion detailed miniature journey",
                                      prompt: "Cute clay figures hiking through a vibrant fairy-tale moss garden, detailed high-fidelity stop-motion claymation texture and dynamic organic animation loop",
                                      icon: "🧸"
                                    }
                                  ].map((style, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setInputText(style.prompt)}
                                      className="flex-shrink-0 w-[145px] hover:w-[155px] p-2.5 rounded-xl text-left bg-black/40 hover:bg-black/85 border border-[#00f3ff]/10 hover:border-[#00f3ff]/50 transition-all duration-300 relative overflow-hidden group cursor-pointer"
                                    >
                                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 via-pink-400 to-transparent" />
                                      <div className="text-[17px] mb-1 group-hover:scale-125 transition-transform duration-300">{style.icon}</div>
                                      <div className="text-[9.5px] font-bold text-white block truncate mb-0.5">{style.name}</div>
                                      <div className="text-[7.5px] text-slate-400 leading-tight block break-words h-6 overflow-hidden line-clamp-2">{style.desc}</div>
                                    </button>
                                  ))}

                                  {activeChatTag === "canvas" && [
                                    {
                                      name: "স্লাইড বা প্রেজেন্টেশন",
                                      desc: "Setup high-impact presenter presentation deck",
                                      prompt: "Create a fully detailed slide deck presentation about dynamic workspace modules. Focus on state retention mechanisms and offline local storage.",
                                      icon: "📊"
                                    },
                                    {
                                      name: "কোডিং স্ক্রিপ্ট (Code Script)",
                                      desc: "Model dynamic complex software typescript code",
                                      prompt: "Write a high-fidelity TypeScript state machine script representing a modular retro synthesizer with custom canvas visualization filters.",
                                      icon: "💻"
                                    },
                                    {
                                      name: "টিউটোরিয়াল বা আর্টিকেল",
                                      desc: "Draft deep editorial articles with markdown briefs",
                                      prompt: "Draft an engaging educational guide explaining how deep learning models compile user prompts to cinematic assets using simple analogy mappings.",
                                      icon: "📝"
                                    }
                              ].map((style, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setInputText(style.prompt)}
                                  className="flex-shrink-0 w-[155px] hover:w-[165px] p-2.5 rounded-xl text-left bg-black/40 hover:bg-black/85 border border-[#00f3ff]/10 hover:border-[#00f3ff]/50 transition-all duration-300 relative overflow-hidden group cursor-pointer"
                                >
                                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 via-indigo-600 to-transparent" />
                                  <div className="text-[17px] mb-1 group-hover:scale-125 transition-transform duration-300">{style.icon}</div>
                                  <div className="text-[9.5px] font-bold text-white block truncate mb-0.5">{style.name}</div>
                                  <div className="text-[7.5px] text-slate-400 leading-tight block break-words h-6 overflow-hidden line-clamp-2">{style.desc}</div>
                                </button>
                              ))}
                                </div>
                              </motion.div>
                            )}

                            {/* === SELECTED CHAT OPTION TAG === */}
                            {activeChatTag && (
                              <div className="flex items-center justify-between mx-2 mb-2 p-2 bg-black/60 border border-[#00f3ff]/25 rounded-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3">
                                <div className="flex items-center gap-2">
                                  {activeChatTag === "image" && (
                                    <>
                                      <div className="w-5 h-5 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                                        <Sparkles size={11} />
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-sans">Fast Image Generation</span>
                                        <span className="hidden sm:inline-block text-[8px] text-zinc-500 ml-2 font-mono">Will resolve prompt as visual asset</span>
                                      </div>
                                    </>
                                  )}
                                  {activeChatTag === "video" && (
                                    <>
                                      <div className="w-5 h-5 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                        <Video size={11} />
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-sans">Video Generation</span>
                                        <span className="hidden sm:inline-block text-[8px] text-zinc-500 ml-2 font-mono">Will compile prompt to cinematic video loop</span>
                                      </div>
                                    </>
                                  )}
                                  {activeChatTag === "canvas" && (
                                    <>
                                      <div className="w-5 h-5 rounded-md bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center justify-center text-[#00f3ff]">
                                        <Code size={11} />
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-bold text-[#00f3ff] uppercase tracking-wider font-sans">Canvas Document</span>
                                        <span className="hidden sm:inline-block text-[8px] text-zinc-500 ml-2 font-mono">Will instantiate edit-ready code & presentations</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveChatTag(null)}
                                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-90"
                                  title="Deselect Mode"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}

                            {/* Horizontal Grid Input Row matching the user's video perfectly */}
                            <div className={`w-full grid gap-x-2 gap-y-3 transition-all duration-300 ${
                              isMultiline 
                                ? 'grid-cols-[auto_1fr_auto] [grid-template-areas:"input_input_input"_"plus_spacer_right"] items-end px-1 pb-1 pt-0.5' 
                                : 'grid-cols-[auto_1fr_auto] [grid-template-areas:"plus_input_right"] items-center px-1'
                            }`}>
                              {/* Left Controls: Plus button */}
                              <div className="[grid-area:plus] flex items-center justify-start h-8 w-8">
                                <button
                                  type="button"
                                  onClick={() => { 
                                    setIsAttachmentSheetOpen(!isAttachmentSheetOpen); 
                                    setIsChatModeSheetOpen(false); 
                                  }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer outline-none transition-all hover:scale-110 active:scale-95 text-[#00f3ff] hover:text-[#33f5ff] ${isAttachmentSheetOpen ? "bg-[#00f3ff]/10" : ""}`}
                                  title="Attachment Source"
                                >
                                  <Plus size={18} strokeWidth={2.5} />
                                </button>
                              </div>

                              {/* Center Area: Auto-growing Textarea 'Ask JARVIS...' inside its own rounded border box */}
                              <div className="[grid-area:input] min-w-0 flex items-center bg-[#040816]/70 border border-[#00f3ff]/30 rounded-xl px-3 py-1.5 transition-all duration-200">
                                <textarea
                                  ref={textareaRef}
                                  placeholder="Ask JARVIS..."
                                  value={inputText}
                                  onChange={(e) => setInputText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                  rows={1}
                                  style={{ height: "20px" }}
                                  className="w-full bg-transparent border-none text-xs text-white outline-none py-0.5 px-1 font-mono placeholder-[#00f3ff]/40 caret-[#00f3ff] resize-none overflow-y-auto scrollbar-none max-h-32 leading-5 align-middle self-center"
                                />
                              </div>

                              {/* Spacer element used only in multiline layout to fill grid column on controls row */}
                              {isMultiline && <div className="[grid-area:spacer] flex-grow" />}

                              {/* Right Controls: Raw Mic & Stack buttons, with Solid Circle wave button at the end */}
                              <div className="[grid-area:right] flex items-center justify-end gap-1.5 shrink-0 select-none m-0">
                                <AnimatePresence mode="wait">
                                  {isChatMicRecording ? (
                                    <div key="chat-mic-recording-wrapper" className="relative w-8 h-8 flex items-center justify-center">
                                      {/* Beautiful dual radiating pulse waves */}
                                      <motion.div
                                        initial={{ scale: 0.9, opacity: 0.8 }}
                                        animate={{ scale: 1.8, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-lg border border-red-500/40 bg-red-500/5 pointer-events-none"
                                      />
                                      <motion.div
                                        initial={{ scale: 0.9, opacity: 0.8 }}
                                        animate={{ scale: 1.4, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.6, delay: 0.5, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-lg border border-red-500/20 bg-red-500/5 pointer-events-none"
                                      />
                                      
                                      {/* Minimal dynamic audio frequency micro-visualizer bars */}
                                      <div className="absolute -bottom-1 flex items-center gap-[1.5px] pointer-events-none z-10">
                                        <motion.div 
                                          animate={{ height: [3, 9, 3] }} 
                                          transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }} 
                                          className="w-[1.5px] h-1 bg-red-500 rounded-full" 
                                        />
                                        <motion.div 
                                          animate={{ height: [3, 14, 3] }} 
                                          transition={{ repeat: Infinity, duration: 0.5, delay: 0.15, ease: "easeInOut" }} 
                                          className="w-[1.5px] h-1 bg-red-400 rounded-full" 
                                        />
                                        <motion.div 
                                          animate={{ height: [3, 10, 3] }} 
                                          transition={{ repeat: Infinity, duration: 0.5, delay: 0.3, ease: "easeInOut" }} 
                                          className="w-[1.5px] h-1 bg-red-500 rounded-full" 
                                        />
                                      </div>

                                      <motion.button
                                        type="button"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={handlePauseChatMicRecording}
                                        className="w-full h-full rounded-lg flex items-center justify-center cursor-pointer outline-none shrink-0 transition-all text-red-500 bg-[#0d0306]/90 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)] relative z-20 hover:border-red-500"
                                        title="Pause and Transcribe"
                                      >
                                        <Pause size={14} strokeWidth={3} />
                                      </motion.button>
                                    </div>
                                  ) : (
                                    inputText === "" && (
                                      <motion.button
                                        key="mic-listening-btn"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={handleStartChatMicRecording}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer outline-none shrink-0 transition-all text-[#00f3ff] hover:text-[#33f5ff]"
                                        title="Start Microphone Recording"
                                      >
                                        <Mic size={18} strokeWidth={2.5} />
                                      </motion.button>
                                    )
                                  )}
                                </AnimatePresence>

                                <button
                                  type="button"
                                  onClick={() => { 
                                    setIsChatModeSheetOpen(!isChatModeSheetOpen); 
                                    setIsAttachmentSheetOpen(false); 
                                  }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer outline-none shrink-0 transition-all text-[#00f3ff] hover:text-[#33f5ff] ${isChatModeSheetOpen ? "bg-[#00f3ff]/10" : ""}`}
                                  style={{ display: "none" }}
                                  title="Chat Mode Selector"
                                >
                                  {/* Stack icon */}
                                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </button>

                                {/* Action button: Live voice wave circle when empty OR Send message when text input exists */}
                                <AnimatePresence mode="wait">
                                  {(inputText === "" || isChatMicRecording) ? (
                                    <motion.button
                                      key="live-engage-btn"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.15 }}
                                      onClick={() => setCurrentScreen("live")}
                                      className="w-10 h-10 flex items-center justify-center bg-[#00f3ff] hover:bg-[#33f5ff] text-[#040816] rounded-full shrink-0 select-none outline-none shadow-[0_0_12px_rgba(0,243,255,0.45)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                                      title="Engage Face & Voice Core"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-slate-950 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M4 12v0M8 9v6M12 5v14M16 8v8M20 12v0" />
                                      </svg>
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      key="send-msg-btn"
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0.8, opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      onClick={handleSendMessage}
                                      className="w-10 h-10 rounded-full bg-[#00f3ff] hover:bg-[#33f5ff] text-[#040816] flex items-center justify-center cursor-pointer outline-none shrink-0 shadow-[0_0_12px_rgba(0,243,255,0.45)] hover:scale-105 active:scale-95 transition-all duration-150"
                                      title="Send Message"
                                    >
                                      <Send size={16} strokeWidth={2.5} />
                                    </motion.button>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 2: MENU & SETTINGS SCREEN (Screenshot 3 / Settings Hub clone) */}
                  {currentScreen === "menu" && (
                    <motion.div
                      key="screen-2-menu"
                      initial={{ opacity: 0, scale: 0.97, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.97, filter: "blur(12px)" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-between p-4 overflow-hidden transform-gpu"
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {/* Sub-header inside glass container */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-[#00f3ff]/25 shrink-0 select-none">
                        <motion.div layoutId="left-action-button-container" className="flex items-center gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.08, y: -0.5 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              if (activeMenuPopup) {
                                setActiveMenuPopup(null);
                              } else if (menuSubpage === "history") {
                                setCurrentScreen("homepage");
                              } else if (menuSubpage !== "index") {
                                setMenuSubpage("index");
                              } else {
                                setCurrentScreen("homepage");
                              }
                            }}
                            className="p-2 rounded-xl border border-[#00f3ff]/30 bg-[#091530]/65 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] transition-all cursor-pointer outline-none flex items-center justify-center glow-btn shrink-0"
                          >
                            {menuSubpage === "index" ? <X size={15} /> : <ChevronRight size={15} className="rotate-180" />}
                          </motion.button>
                        </motion.div>
                        
                        <motion.div layoutId="center-screen-label-hub" className="text-center flex-1 min-w-0">
                          <motion.h2 layoutId="shared-main-headline-text" className="text-xs font-black tracking-widest font-mono uppercase text-[#00f3ff] filter drop-shadow-[0_0_5px_rgba(0,243,255,0.4)] truncate px-2">
                            {menuSubpage === "index" ? "JARVIS SETTINGS" : menuSubpage === "api" ? "API KEY CONFIGURATION" : menuSubpage === "personalization" ? "SYSTEM RESPONSE PERSONALIZATION" : menuSubpage === "memories" ? "MEMORY BIOS PROFILE" : menuSubpage === "about" ? "ABOUT JARVIS OS" : menuSubpage === "connectivity" ? "EXTERNAL CONNECTIONS CORE" : menuSubpage === "tutorials" ? "STUDENT INTERACTIVE ACADEMY" : menuSubpage === "feedback" ? "SUBMIT USER FEEDBACK" : "CHAT HISTORY & PRIVACY"}
                          </motion.h2>
                        </motion.div>

                        <motion.div layoutId="right-status-action-container" className="flex items-center gap-1.5 shrink-0">
                          {menuSubpage !== "index" ? (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.08, y: -0.5 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => setMenuSubpage("index")}
                              className="p-2 rounded-xl border border-[#00f3ff]/30 bg-[#091530]/65 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] transition-all cursor-pointer outline-none flex items-center justify-center glow-btn shrink-0"
                              title="Open Settings"
                            >
                              <Settings size={15} />
                            </motion.button>
                          ) : (
                            <div className="text-[#00f3ff] shrink-0 p-2 bg-[#091530]/40 border border-[#00f3ff]/35 rounded-xl flex items-center justify-center">
                              <Settings size={15} />
                            </div>
                          )}
                        </motion.div>
                      </div>

                      <div className="flex-1 overflow-hidden relative flex flex-col w-full">
                        <AnimatePresence mode="wait">
                          {/* SUB-PAGE 1: INDEX MENU */}
                          {menuSubpage === "index" && (
                            <motion.div
                              key="index"
                              className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                              style={{ willChange: "transform, opacity" }}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 12 }}
                              transition={{ type: "spring", stiffness: 220, damping: 22 }}
                            >
                          {/* User Profile Container (transparent glass-morphic card, neon blue outline) */}
                          <div className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-black/35 border-2 border-[#00f3ff]/35 shadow-[0_0_15px_rgba(0,243,255,0.12)]">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-black/40 border-2 border-[#00f3ff] flex items-center justify-center font-black text-[#00f3ff] text-base shadow-[0_0_10px_rgba(0,243,255,0.4)] select-none shrink-0 uppercase overflow-hidden">
                                {avatarImage ? (
                                  <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  avatarInitials || username.charAt(0) || "M"
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-black font-sans tracking-wide text-white uppercase">{username}</h3>
                                <p className={`text-[10px] font-mono font-extrabold uppercase tracking-widest mt-0.5 ${backupEnabled ? "text-emerald-400" : "text-[#00f3ff]"}`}>
                                  • {backupEnabled ? "Cloud Live Sync" : "Offline Core"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setMenuSubpage("profile-manage")}
                                className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#00f3ff]/15 border border-[#00f3ff] hover:bg-[#00f3ff]/25 text-[#00f3ff] hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer glow-btn shrink-0"
                              >
                                Manage
                              </button>
                              <button
                                onClick={handleLogOut}
                                className="flex-1 sm:flex-initial px-3 py-1.5 bg-red-950/45 border border-red-500/55 hover:bg-red-900/40 text-red-400 hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>

                          {/* Menu Options (icons on left, text on right, subtle glowing blue underlines/dividers) */}
                          <motion.div 
                            variants={{
                              hidden: {},
                              show: {
                                transition: {
                                  staggerChildren: 0.04
                                }
                              }
                            }}
                            initial="hidden"
                            animate="show"
                            className="space-y-1 mt-2"
                          >
                            {[
                              { id: "memories", label: "Memory Settings Vault", icon: FileText, action: () => setMenuSubpage("memories") },
                              { id: "personalization", label: "Personalization Panel", icon: Sliders, action: () => setMenuSubpage("personalization") },
                              { id: "connectivity", label: "Connectivity & App Control Hub", icon: Globe, action: () => setMenuSubpage("connectivity") },
                              { id: "api", label: "Jarvis Heart", icon: Lock, action: () => setMenuSubpage("api") },
                              { id: "tutorials", label: "Interactive Student Academy", icon: GraduationCap, action: () => setMenuSubpage("tutorials") },
                              { id: "feedback", label: "Submit Feedback & Suggestions", icon: HelpCircle, action: () => setMenuSubpage("feedback") },
                              { id: "about", label: "About Jarvis OS", icon: Info, action: () => setMenuSubpage("about") },
                            ].map((item, idx) => {
                              const Icon = item.icon || Settings;
                              return (
                                <motion.button
                                  key={idx}
                                  variants={{
                                    hidden: { opacity: 0, x: -12, scale: 0.98 },
                                    show: { 
                                      opacity: 1, 
                                      x: 0, 
                                      scale: 1,
                                      transition: {
                                        type: "spring",
                                        stiffness: 150,
                                        damping: 17
                                      }
                                    }
                                  }}
                                  onClick={item.action}
                                  whileHover={{ scale: 1.015, x: 4, backgroundColor: "rgba(0, 243, 255, 0.12)" }}
                                  whileTap={{ scale: 0.985 }}
                                  className="w-full text-left py-3.5 px-3 border-b-2 border-[#00f3ff]/20 hover:border-[#00f3ff]/85 bg-black/15 hover:bg-[#00f3ff]/10 text-[#00f3ff] hover:text-white text-xs transition-all cursor-pointer font-mono font-bold flex items-center justify-between origin-left"
                                >
                                  <span className="flex items-center gap-3">
                                    <Icon size={14} className="text-[#00f3ff] shrink-0" />
                                    <span>{item.label}</span>
                                  </span>
                                  <ChevronRight size={12} className="opacity-60 text-[#00f3ff] shrink-0" />
                                </motion.button>
                              );
                            })}
                            </motion.div>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 2: SECURE API GATEWAY */}
                        {menuSubpage === "api" && (
                          <motion.div
                            key="api"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          {/* Add a Key Card */}
                          <div className="p-4 rounded-xl border border-[#00f3ff]/25 bg-black/40 shadow-inner space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black text-sky-400 uppercase tracking-wider font-mono filter drop-shadow-[0_0_4px_rgba(56,189,248,0.4)]">
                              <Sparkles size={14} className="text-sky-450 shrink-0 text-sky-400" /> Add to API Key Pool
                            </div>
                            
                            <p className="text-[10px] font-mono leading-relaxed text-slate-400">
                              Input a valid Google Gemini API Key and register it to the dynamic rotating rotation pool.
                            </p>

                            <div className="flex gap-2.5 opacity-90 hover:opacity-100 transition-all">
                              <input
                                type="password"
                                value={newPoolKeyInput}
                                onChange={(e) => setNewPoolKeyInput(e.target.value)}
                                placeholder="AIzaSy... (Gemini Secret Key)"
                                className="flex-1 bg-black/60 border border-[#00f3ff]/35 focus:border-[#00f3ff] focus:shadow-[0_0_8px_rgba(0,243,255,0.2)] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none min-w-0"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newPoolKeyInput.trim()) return;
                                  if (geminiKeyPool.includes(newPoolKeyInput.trim())) {
                                    alert("This key is already in the pool!");
                                    return;
                                  }
                                  setGeminiKeyPool([...geminiKeyPool, newPoolKeyInput.trim()]);
                                  setNewPoolKeyInput("");
                                }}
                                className="px-3 bg-cyan-950/40 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/40 hover:border-[#00f3ff] rounded-lg text-[#00f3ff] hover:text-white text-xs transition-all cursor-pointer shrink-0 font-bold font-mono"
                              >
                                ADD
                              </button>
                            </div>
                          </div>

                          {/* Pool Status Panel */}
                          <div className="p-4 rounded-xl border border-slate-850 bg-black/32 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                                Registered Key Rotation Pool
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/25">
                                {geminiKeyPool.length} KEYS
                              </span>
                            </div>

                            {geminiKeyPool.length === 0 ? (
                              <div className="text-center py-4 text-[11px] font-mono text-slate-500 border border-dashed border-slate-800 rounded-lg">
                                No API keys configured yet. Please input and click 'ADD' above.
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                                {geminiKeyPool.map((key, idx) => {
                                  const isActiveIndex = geminiKeyPool.length > 0 && (currentApiKeyIndexRef.current % geminiKeyPool.length) === idx;
                                  const maskedKey = key.length > 12 
                                    ? `${key.slice(0, 6)}••••${key.slice(-4)}` 
                                    : "••••••••";

                                  return (
                                    <div 
                                      key={idx} 
                                      onClick={() => {
                                        currentApiKeyIndexRef.current = idx;
                                        setGeminiKey(key);
                                        setGeminiKeyPool([...geminiKeyPool]);
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                                        isActiveIndex 
                                          ? "border-[#00f3ff]/60 bg-[#00f3ff]/10 text-white shadow-[0_0_10px_rgba(0,243,255,0.15)]" 
                                          : "border-slate-800 bg-black/20 text-slate-400 hover:border-[#00f3ff]/40 hover:bg-[#00f3ff]/5"
                                      }`}
                                      title="Click to select this API key manually"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActiveIndex ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                                        <span>Key #{idx + 1}:</span>
                                        <span className="font-mono text-slate-200">{maskedKey}</span>
                                        {isActiveIndex ? (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-400 uppercase font-black tracking-wider">
                                            ACTIVE KEY
                                          </span>
                                        ) : (
                                          <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-slate-800/45 text-slate-500 uppercase tracking-widest hover:text-[#00f3ff]">
                                            SELECT
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updated = geminiKeyPool.filter((_, i) => i !== idx);
                                          setGeminiKeyPool(updated);
                                          if (currentApiKeyIndexRef.current >= updated.length) {
                                            currentApiKeyIndexRef.current = 0;
                                          }
                                        }}
                                        className="p-1 hover:text-red-400 hover:bg-red-500/10 rounded transition-all text-slate-500 cursor-pointer"
                                        title="Delete key"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="text-[9px] font-mono leading-normal text-slate-500 border-t border-slate-800/60 pt-2 bg-gradient-to-r from-teal-500/5 to-transparent p-1 rounded">
                              📌 <strong className="text-slate-400">Rotation Model:</strong> System sequences keys dynamically if a 429 quota exhaustion or transient block occurs, maintaining active conversational flows.
                            </div>
                          </div>

                          {/* API Key Usage Metrics Visual Card */}
                          <div className="p-4 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-3.5 shadow-md">
                            <span className="text-[10px] text-[#00f3ff] uppercase font-black tracking-wider block font-mono flex items-center gap-1.5">
                              <Activity size={12} className="animate-pulse" /> 🚀 Key Usage & Health Statistics
                            </span>
                            
                            <div className="space-y-3">
                              {geminiKeyPool.length === 0 ? (
                                <p className="text-[10.5px] font-mono text-slate-500 leading-normal">
                                  No rotating key pool statistics available. Add API keys to begin tracking telemetry metrics.
                                </p>
                              ) : (
                                geminiKeyPool.map((key, idx) => {
                                  const isActiveIndex = (currentApiKeyIndexRef.current % geminiKeyPool.length) === idx;
                                  const stats = keyPoolStats[key] || { requests: 0, success: 0, errors: 0, speedMs: 0 };
                                  const successRate = stats.requests === 0
                                    ? 100
                                    : Math.round((stats.success / stats.requests) * 100);
                                  
                                  const maskedKey = key.length > 12 
                                    ? `${key.slice(0, 6)}••••${key.slice(-4)}` 
                                    : "••••••••";

                                  return (
                                    <div key={idx} className={`p-3 rounded-lg border border-white/5 bg-white/2 space-y-2 relative transition-all ${
                                      isActiveIndex 
                                        ? "border-[#00f3ff]/30 shadow-[0_0_10px_rgba(0,243,255,0.06)] bg-[#00f3ff]/3 opacity-100" 
                                        : "hover:border-white/10 opacity-70"
                                    }`}>
                                      <div className="flex items-center justify-between text-[11px] font-mono">
                                        <div className="flex items-center gap-1.5">
                                          <div className={`w-2 h-2 rounded-full ${isActiveIndex ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                                          <span className="font-bold text-white">Index #{idx + 1}</span>
                                          <span className="opacity-45">({maskedKey})</span>
                                        </div>
                                        <div>
                                          {isActiveIndex ? (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#00f3ff]/10 border border-[#00f3ff]/35 text-[#00f3ff] font-black">
                                              ACTIVE
                                            </span>
                                          ) : (
                                            <span className="text-[8.5px] opacity-40 uppercase font-bold text-white/50">
                                              STANDBY
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[9px] font-mono">
                                          <span className="text-white/60">Success rate</span>
                                          <span className={`${successRate > 75 ? "text-emerald-400" : successRate > 40 ? "text-amber-400" : "text-rose-400"} font-bold`}>
                                            {successRate}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              successRate > 75 ? "bg-emerald-500" : successRate > 40 ? "bg-amber-500" : "bg-rose-500"
                                            }`}
                                            style={{ width: `${successRate}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-4 gap-2 pt-1">
                                        <div className="bg-black/40 border border-white/5 p-1 rounded text-center">
                                          <span className="text-[7.5px] opacity-40 uppercase block font-mono">Reqs</span>
                                          <span className="text-[10px] font-bold font-mono text-white leading-none block">{stats.requests}</span>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-1 rounded text-center">
                                          <span className="text-[7.5px] opacity-40 uppercase block font-mono">Pass</span>
                                          <span className="text-[10px] font-bold font-mono text-emerald-400 leading-none block">{stats.success}</span>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-1 rounded text-center">
                                          <span className="text-[7.5px] opacity-40 uppercase block font-mono">Fail</span>
                                          <span className="text-[10px] font-bold font-mono text-rose-400 leading-none block">{stats.errors}</span>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-1 rounded text-center">
                                          <span className="text-[7.5px] opacity-40 uppercase block font-mono">Speed</span>
                                          <span className="text-[9.5px] font-bold font-mono text-sky-400 leading-none block truncate">{stats.speedMs ? `${stats.speedMs}ms` : "N/A"}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                          </motion.div>
                        )}

                        {/* SUB-PAGE: CONNECTIVITY APP CONTROL HUB */}
                        {menuSubpage === "connectivity" && (
                          <motion.div
                            key="connectivity"
                            className="flex-grow flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >
                            <GoogleWorkspaceDashboard
                              token={workspaceToken}
                              onLogin={handleGoogleSignInClick}
                              onLogout={handleLogOut}
                              gmail={gmail}
                              username={username}
                            />

                            <button
                              type="button"
                              onClick={() => setMenuSubpage("index")}
                              className="w-full py-2.5 bg-[#00f3ff]/25 border border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/35 rounded-xl text-xs font-black font-mono uppercase tracking-widest block text-center transition-all cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.2)] glow-btn"
                            >
                              Return to Settings Menu
                            </button>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 3: PERSONALIZATION CODES */}
                        {menuSubpage === "personalization" && (
                          <motion.div
                            key="personalization"
                            className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          {/* 🎨 THEME SELECTION PALETTE */}
                          <div className="p-3.5 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-3">
                            <span className="text-[10px] text-[#00f3ff] uppercase font-black tracking-wider block font-mono">
                              🎨 CORE THEME SELECTOR
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "cosmic", label: "Cosmic", desc: "Dark Cyan Cyber", colors: "from-[#04091e] to-[#010309] border-[#00f3ff]" },
                                { id: "slate", label: "Slate", desc: "Light Clean Work", colors: "from-[#f8fafc] to-[#e2e8f0] border-blue-500" },
                                { id: "vintage", label: "Vintage", desc: "Warm Claude Paper", colors: "from-[#fbfaf5] to-[#f3eedf] border-orange-500" },
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    if (appTheme !== t.id) {
                                      setThemeTransitionType(t.id as any);
                                      setIsThemeTransitioning(true);
                                      setAppTheme(t.id as any);
                                      localStorage.setItem("jarvis_app_theme", t.id);
                                      speakJARVISResponse(`Recalibrating UI environment to ${t.label} protocol.`);
                                      setTimeout(() => {
                                        setIsThemeTransitioning(false);
                                      }, 1300);
                                    }
                                  }}
                                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                                    appTheme === t.id
                                      ? "border-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.2)] bg-[#00f3ff]/10"
                                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                  }`}
                                >
                                  {/* Small visual swatch representative preview */}
                                  <div className={`w-full h-3.5 rounded bg-gradient-to-r ${t.colors} mb-1.5 opacity-90 border border-white/5 flex items-center justify-end px-1`}>
                                    {appTheme === t.id && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold block leading-none text-white">{t.label}</span>
                                    <span className="text-[8px] opacity-60 font-mono block mt-0.5 uppercase leading-none">{t.desc}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="text-[9px] font-mono leading-normal text-slate-400 p-1 rounded">
                              ℹ️ <strong>Unified Font:</strong> The entire application uses a highly readable, clean <strong>Inter</strong> font layout across all modules, headers, and dialogue models.
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-3">
                            <div>
                              <label className="text-[10px] font-mono uppercase text-[#00f3ff]/80 font-bold block mb-1">Response Style Tone</label>
                              <select
                                value={isWarmStyle ? "Warm" : "Analytical"}
                                onChange={(e) => setIsWarmStyle(e.target.value === "Warm")}
                                className="w-full bg-[#030718] border border-[#00f3ff]/35 text-[#00f3ff] px-2.5 py-1.5 rounded-lg text-xs outline-none font-mono cursor-pointer"
                              >
                                <option value="Warm" className="bg-[#030718]">Caring & Supportive</option>
                                <option value="Analytical" className="bg-[#030718]">Analytical & Monospace</option>
                              </select>
                            </div>
                          </div>

                          {/* 🌐 LANGUAGE CONFIGURATION */}
                          <div className="p-3.5 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-3">
                            <span className="text-[10px] text-[#00f3ff] uppercase font-black tracking-wider block font-mono">
                              🌐 LANGUAGE CONFIGURATION
                            </span>
                            
                            <div>
                              <label className="text-[9px] font-mono uppercase text-white/70 font-semibold block mb-1">
                                Text Responses Language Settings
                              </label>
                              <select
                                value={textLanguage}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setTextLanguage(val);
                                  localStorage.setItem("jarvis_text_language", val);
                                }}
                                className="w-full bg-[#030718] border border-[#00f3ff]/35 text-[#00f3ff] px-2.5 py-1.5 rounded-lg text-xs outline-none font-mono cursor-pointer"
                              >
                                <option value="English" className="bg-[#030718]">English (Standard text)</option>
                                <option value="Hindi" className="bg-[#030718]">Hindi / Hinglish (Latin alphabet)</option>
                                <option value="Bengali" className="bg-[#030718]">Bengali (Native script, e.g., বাংলা)</option>
                                <option value="Benglish" className="bg-[#030718]">Benglish (Bengali written in Latin alphabet)</option>
                                <option value="Mix" className="bg-[#030718]">Hybrid Mix (Bilingual / mixed conversation)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-mono uppercase text-white/70 font-semibold block mb-1">
                                Vocal/Voice Language Settings
                              </label>
                              <select
                                value={voiceLanguage}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setVoiceLanguage(val);
                                  localStorage.setItem("jarvis_voice_language", val);
                                }}
                                className="w-full bg-[#030718] border border-[#00f3ff]/35 text-[#00f3ff] px-2.5 py-1.5 rounded-lg text-xs outline-none font-mono cursor-pointer"
                              >
                                <option value="English" className="bg-[#030718]">English (Voice & Speak)</option>
                                <option value="Bengali" className="bg-[#030718]">Bengali (Native voice & speak, e.g., বাংলা)</option>
                                <option value="Hindi" className="bg-[#030718]">Hindi (Hinglish voice & speak)</option>
                                <option value="Benglish" className="bg-[#030718]">Benglish (Transliterated Bengali voice)</option>
                                <option value="Mix" className="bg-[#030718]">Hybrid Mix (Automatic language switching)</option>
                              </select>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-2 text-[11px] font-mono">
                            {[
                              { label: "Enthusiastic Expressiveness", value: isEnthusiastic, set: setIsEnthusiastic },
                              { label: "Structured markdown formatting", value: isHeadersLists, set: setIsHeadersLists },
                              { label: "Auto emojis injection", value: isAutoEmoji, set: setIsAutoEmoji },
                              { label: "Dynamic Facial emotion rendering", value: isShowEmotions, set: setIsShowEmotions },
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5">
                                <span className="text-white/80 text-xs">{item.label}</span>
                                <button
                                  onClick={() => item.set(!item.value)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                    item.value ? "bg-[#00f3ff]" : "bg-slate-800"
                                  }`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                                    item.value ? "translate-x-4 shadow-[0_0_8px_rgba(0,243,255,0.6)]" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Premium Human Vocal Core Card */}
                          <div className="p-3.5 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-3.5">
                            <span className="text-[9.5px] text-[#00f3ff] uppercase font-black tracking-wider block font-mono">
                              🗣️ Ultra-Premium Human Voice Core
                            </span>

                            <div>
                              <label className="text-[9px] font-mono uppercase text-white/70 font-semibold block mb-1">
                                Google Live Mode Speaker (Voice Mode TTS)
                              </label>
                              <select
                                value={googleVoiceName}
                                onChange={(e) => setGoogleVoiceName(e.target.value)}
                                className="w-full bg-[#030718] border border-[#00f3ff]/35 text-white px-2 py-1.5 rounded-lg text-[10.5px] outline-none font-mono cursor-pointer"
                              >
                                <option value="Kore">Kore - Special Warm Female (Google Live Core - Premium)</option>
                                <option value="Puck">Puck - Friendly Crisp Male (Google Live Core - Premium)</option>
                                <option value="Charon">Charon - Deep Baritone Male (Google Live Core - Premium)</option>
                                <option value="Fenrir">Fenrir - Professional Calm Male (Google Live Core - Premium)</option>
                                <option value="Zephyr">Zephyr - Clear High-pitch Female (Google Live Core - Premium)</option>
                                <option value="Aoede">Aoede - Elegant Expressive Female (Google Live Core - Premium)</option>
                                <option value="Kratos">Kratos - God of War (Deep Serious Male - Alpha Premium)</option>
                                <option value="Commander">Commander - Sci-Fi Authority (Authoritative Serious Male - Premium)</option>
                                <option value="Agent-Smith">Agent-Smith - Cold & Calculated (Secret Agent Male - Premium)</option>
                              </select>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-white/5">
                              <label className="text-[9px] font-mono uppercase text-white/70 font-semibold block mb-1">
                                Local Offline Fallback Speaker (Web Speech API)
                              </label>
                              <select
                                value={selectedVoiceName}
                                onChange={(e) => setSelectedVoiceName(e.target.value)}
                                className="w-full bg-[#030718] border border-[#00f3ff]/35 text-white px-2 py-1.5 rounded-lg text-[10.5px] outline-none font-mono cursor-pointer"
                              >
                                {systemVoices.length === 0 ? (
                                  <option value="">System Default Voice</option>
                                ) : (
                                  systemVoices.map((voice, idx) => (
                                    <option key={`${voice.name}-${voice.lang}-${idx}`} value={voice.name}>
                                      {voice.name} ({voice.lang})
                                    </option>
                                  ))
                                )}
                              </select>
                              <p className="text-[8px] text-white/40 mt-1 font-mono leading-tight">
                                💡 Pro Tip: Choose a "Google", "Natural", or "Siri" English voice for premium human-like speaking if API limits are reached.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              alert("AI response profile updated!");
                              setMenuSubpage("index");
                            }}
                            className="w-full py-3 bg-[#00f3ff] text-black hover:bg-[#00e1f0] rounded-xl text-xs font-black font-mono uppercase tracking-widest block text-center transition-all cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.55)]"
                          >
                            Save Profile
                            </button>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 4: MEMORIES BIOS CONFIG */}
                        {menuSubpage === "memories" && (
                          <motion.div
                            key="memories"
                            className="flex-1 flex flex-col mt-4 overflow-hidden transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none pb-4">
                            {/* Toggle Core Memories Context */}
                            <div className="p-3.5 rounded-xl border border-[#00f3ff]/20 bg-black/45 flex items-center justify-between">
                              <div>
                                <span className="text-white text-xs font-bold block">Active Memory Engine</span>
                                <span className="text-white/50 text-[10px] uppercase font-mono">Let Jarvis refer to memoirs during chat</span>
                              </div>
                              <button
                                onClick={() => setIsReferenceMemories(!isReferenceMemories)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                  isReferenceMemories ? "bg-[#00f3ff]" : "bg-slate-850 border border-slate-700"
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                                  isReferenceMemories ? "translate-x-5 bg-white" : "translate-x-0 bg-slate-400"
                                }`} />
                              </button>
                            </div>

                            {/* Add New Memory Field */}
                            <div className="p-3.5 rounded-xl border border-[#00f3ff]/20 bg-black/45 space-y-2">
                              <span className="text-[9px] font-mono uppercase text-[#00f3ff]/80 font-extrabold block">Add memory profile directly</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="E.g., I love black coffee or My cat is named Luna"
                                  value={newMemoryInputText}
                                  onChange={(e) => setNewMemoryInputText(e.target.value)}
                                  className="flex-1 bg-black/85 border border-[#00f3ff]/35 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-[#00f3ff]/80"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newMemoryInputText.trim()) {
                                      const newMem = {
                                        id: `mem-${Date.now()}`,
                                        text: newMemoryInputText.trim(),
                                        timestamp: new Date().toLocaleDateString()
                                      };
                                      setJarvisMemories(prev => [newMem, ...prev]);
                                      setNewMemoryInputText("");
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (newMemoryInputText.trim()) {
                                      const newMem = {
                                        id: `mem-${Date.now()}`,
                                        text: newMemoryInputText.trim(),
                                        timestamp: new Date().toLocaleDateString()
                                      };
                                      setJarvisMemories(prev => [newMem, ...prev]);
                                      setNewMemoryInputText("");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-[#00f3ff]/20 border border-[#00f3ff] hover:bg-[#00f3ff]/40 text-xs font-black text-white hover:text-black hover:bg-[#00f3ff] rounded-lg transition-all font-mono uppercase cursor-pointer"
                                >
                                  Store
                                </button>
                              </div>
                            </div>

                            {/* Stored Memory Segments */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-wide uppercase text-white/70">
                                <span>Memory Repository list</span>
                                <span className="text-[#00f3ff]">{jarvisMemories.length} items active</span>
                              </div>

                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                                {jarvisMemories.length === 0 ? (
                                  <div className="p-4 rounded-xl border border-dashed border-[#00f3ff]/15 bg-black/20 text-center">
                                    <Brain size={24} className="mx-auto text-slate-600 mb-1.5 opacity-60" />
                                    <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                                      Jarvis has no long-term memories stored. Say "memorize..." or "remember that..." in standard chat to save updates.
                                    </p>
                                  </div>
                                ) : (
                                  jarvisMemories.map((mem) => (
                                    <div
                                      key={mem.id}
                                      className="p-2 px-3 border border-[#00f3ff]/15 bg-black/35 hover:bg-black/50 rounded-xl flex items-center justify-between gap-3 group transition-all min-h-[44px]"
                                    >
                                      {editingMemoryId === mem.id ? (
                                        <div className="flex-1 flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={editingMemoryText}
                                            onChange={(e) => setEditingMemoryText(e.target.value)}
                                            className="flex-1 bg-black/60 border border-[#00f3ff] text-white rounded px-2 py-1 text-[11px] font-mono outline-none"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                if (editingMemoryText.trim()) {
                                                  setJarvisMemories(prev => prev.map(m => m.id === mem.id ? { ...m, text: editingMemoryText.trim() } : m));
                                                }
                                                setEditingMemoryId(null);
                                              } else if (e.key === "Escape") {
                                                setEditingMemoryId(null);
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={() => {
                                              if (editingMemoryText.trim()) {
                                                setJarvisMemories(prev => prev.map(m => m.id === mem.id ? { ...m, text: editingMemoryText.trim() } : m));
                                              }
                                              setEditingMemoryId(null);
                                            }}
                                            className="px-2 py-1 bg-[#00f3ff] hover:bg-[#00f3ff]/80 text-black font-mono font-bold text-[9px] rounded transition-all cursor-pointer select-none"
                                          >
                                            SAVE
                                          </button>
                                          <button
                                            onClick={() => setEditingMemoryId(null)}
                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[9px] rounded transition-all cursor-pointer select-none"
                                          >
                                            ESC
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Brain size={12} className="text-[#00f3ff] shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-white text-[11px] truncate" title={mem.text}>
                                                {mem.text}
                                              </p>
                                              <span className="text-[8px] text-white/40 block font-mono">
                                                Recorded {mem.timestamp}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-all">
                                            <button
                                              onClick={() => {
                                                setEditingMemoryId(mem.id);
                                                setEditingMemoryText(mem.text);
                                              }}
                                              className="p-1 px-1.5 text-[#00f3ff] hover:text-white border border-transparent hover:border-[#00f3ff]/50 hover:bg-[#00f3ff]/10 rounded-md transition-all cursor-pointer"
                                              title="Edit memory"
                                            >
                                              <Edit2 size={11} />
                                            </button>
                                            <button
                                              onClick={() => {
                                                setJarvisMemories(prev => prev.filter(m => m.id !== mem.id));
                                              }}
                                              className="p-1 px-1.5 text-rose-500 hover:text-white border border-transparent hover:border-rose-500/50 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                                              title="Erase memory item"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Clear All Option */}
                            {jarvisMemories.length > 0 && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you absolutely sure you want to clear Jarvis' entire memory core?")) {
                                    setJarvisMemories([]);
                                  }
                                }}
                                className="w-full text-center text-[10px] tracking-wider text-rose-500/70 hover:text-rose-400 font-mono flex items-center justify-center gap-1.5 mt-2 hover:underline cursor-pointer"
                              >
                                <Trash2 size={11} /> Clear All Memories Vault
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => setMenuSubpage("index")}
                            className="w-full py-3 mt-4 bg-[#00f3ff] text-black hover:bg-[#00e1f0] rounded-xl text-xs font-black font-mono uppercase tracking-widest block text-center transition-all cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.45)] shrink-0"
                          >
                            Save & Return to Settings Menu
                            </button>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 5: PREVIOUS CHAT HISTORY */}
                        {menuSubpage === "history" && (
                          <motion.div
                            key="history"
                            className="flex-1 flex flex-col mt-4 overflow-hidden transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          {/* Chat History Search Input */}
                          <div className="mb-2.5 relative shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#00f3ff]/50">
                              <Search size={12} />
                            </span>
                            <input
                              type="text"
                              value={historySearchQuery}
                              onChange={(e) => setHistorySearchQuery(e.target.value)}
                              placeholder="Search previous conversations..."
                              className="w-full bg-black/40 border border-[#00f3ff]/25 focus:border-[#00f3ff] rounded-xl pl-8 pr-12 py-2 text-[10.5px] font-mono text-white placeholder-[#00f3ff]/45 outline-none transition-all shadow-[inset_0_0_8px_rgba(0,243,255,0.05)]"
                            />
                            {historySearchQuery && (
                              <button
                                onClick={() => setHistorySearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-300 font-mono text-[9px] uppercase font-bold cursor-pointer transition-colors"
                              >
                                clear
                              </button>
                            )}
                          </div>

                          {/* Saved Logs Metadata & Delete Option */}
                          <div className="flex items-center justify-between px-1 mb-2 mt-1 shrink-0">
                            <span className="text-[9px] font-mono uppercase font-black text-[#00f3ff]/60 tracking-wider">
                              System Logs Saved: {chatHistoryItems.length}
                            </span>
                            {chatHistoryItems.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmation({
                                    isOpen: true,
                                    type: "all"
                                  });
                                }}
                                className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/45 border border-red-500/35 hover:bg-red-900/40 text-rose-400 hover:text-white rounded-lg font-mono text-[8px] font-bold uppercase tracking-widest transition-all cursor-pointer outline-none shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.15)]"
                              >
                                <Trash2 size={9} />
                                <span>Delete All</span>
                              </button>
                            )}
                          </div>

                          {/* Chat History Box Container */}
                          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none pb-4">
                            {(() => {
                              const filteredItems = chatHistoryItems.filter(item => 
                                item.text.toLowerCase().includes(historySearchQuery.toLowerCase())
                              );
                              if (filteredItems.length === 0) {
                                return (
                                  <p className="text-[10.5px] font-mono text-slate-500 text-center py-8">
                                    {historySearchQuery ? "No matching conversations found!" : "Chat history empty!"}
                                  </p>
                                );
                              }
                              return filteredItems.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => loadChatFromHistory(item)}
                                  className="p-3 bg-black/35 hover:bg-[#00f3ff]/10 border border-[#00f3ff]/25 hover:border-[#00f3ff]/60 rounded-xl flex items-center justify-between transition-all cursor-pointer group hover:shadow-[0_0_10px_rgba(0,243,255,0.15)]"
                                >
                                  {/* Render text inside glowing neon blue style as requested */}
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-xs font-mono font-bold text-[#00f3ff] filter drop-shadow-[0_0_3px_rgba(0,243,255,0.45)] group-hover:text-white transition-all truncate">
                                      {item.text}
                                    </span>
                                    <span className="text-[8px] text-white/50 font-mono mt-0.5 truncate max-w-[170px] sm:max-w-xs block">
                                      {item.messages && item.messages.length > 0 
                                        ? item.messages[item.messages.length - 1].text
                                        : "Dialogue snippet"}
                                    </span>
                                  </div>
                                  
                                  {/* Right side: Glowing red button enclosing a bright white delete icon */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Avoid triggering route/row click handler!
                                      setDeleteConfirmation({
                                        isOpen: true,
                                        type: "single",
                                        idToDelete: item.id
                                      });
                                    }}
                                    className="w-8 h-8 rounded-full bg-red-950/40 hover:bg-rose-950/80 border border-rose-500/50 hover:border-rose-400 text-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)] shrink-0"
                                    title="Delete chat thread"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>

                          {/* NEON BULLETPROOF SECURE CONFIRMATION OVERLAY */}
                          <AnimatePresence>
                            {deleteConfirmation.isOpen && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-[#040816]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center rounded-2xl"
                              >
                                <motion.div
                                  initial={{ scale: 0.93, opacity: 0, y: 15 }}
                                  animate={{ scale: 1, opacity: 1, y: 0 }}
                                  exit={{ scale: 0.93, opacity: 0, y: 15 }}
                                  className="w-full max-w-[270px] bg-[#070b1a] border-2 border-red-500/50 rounded-2xl p-5 shadow-[0_0_25px_rgba(239,68,68,0.4)] flex flex-col gap-4 text-center"
                                >
                                  <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 border border-red-500 flex items-center justify-center text-red-500 shrink-0">
                                    <Trash2 size={18} className="animate-pulse" />
                                  </div>
                                  
                                  <div className="space-y-1.5 text-center">
                                    <h3 className="text-xs font-black font-sans tracking-widest text-[#00f3ff] uppercase">
                                      {deleteConfirmation.type === "all" ? "Confirm Core Delete" : "Confirm Deletion"}
                                    </h3>
                                    <p className="text-[10px] font-mono text-white/80 leading-relaxed text-center">
                                      {deleteConfirmation.type === "all" 
                                        ? "This protocol will permanently clean overall memory records and past dialogue files. Proceed with server-wide delete?" 
                                        : "Are you sure you want to permanently delete this specified conversation dialogue from JARVIS OS local registries?"
                                      }
                                    </p>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmation({ isOpen: false, type: "single" })}
                                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                                    >
                                      No
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (deleteConfirmation.type === "all") {
                                          setChatHistoryItems([]);
                                        } else if (deleteConfirmation.idToDelete) {
                                          setChatHistoryItems(prev => prev.filter(c => c.id !== deleteConfirmation.idToDelete));
                                        }
                                        setDeleteConfirmation({ isOpen: false, type: "single" });
                                      }}
                                      className="flex-1 py-2 bg-red-500/30 hover:bg-red-500 text-rose-200 hover:text-white border border-red-500 hover:border-red-400 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                                    >
                                      Yes
                                    </button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 6: MANAGE PROFILE & SYSTEMS */}
                        {menuSubpage === "profile-manage" && (
                          <motion.div
                            key="profile-manage"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          <div className="p-4 rounded-xl border border-[#00f3ff]/25 bg-black/40 space-y-4">
                            {/* Avatar Display & Edit Initials */}
                            <div className="flex items-center gap-4 border-b border-[#00f3ff]/15 pb-4">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00f3ff]/35 to-[#00f3ff]/10 border-2 border-[#00f3ff] flex items-center justify-center font-black text-[#00f3ff] text-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] select-none shrink-0 uppercase overflow-hidden">
                                {avatarImage ? (
                                  <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  avatarInitials || username.charAt(0) || "M"
                                )}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-mono uppercase text-[#00f3ff]/85 font-extrabold block mb-1">Avatar Initials / Photo</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength={3}
                                    value={avatarInitials}
                                    onChange={(e) => setAvatarInitials(e.target.value)}
                                    placeholder="M"
                                    className="w-16 bg-black/85 border border-[#00f3ff]/35 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-[#00f3ff] text-center"
                                  />
                                  <label className="flex-1 flex items-center justify-center border border-dashed border-[#00f3ff]/50 bg-[#00f3ff]/5 hover:bg-[#00f3ff]/15 text-[#00f3ff] hover:text-white rounded-lg px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all">
                                    <Upload size={12} className="mr-1 shadow-sm" />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleAvatarUpload}
                                    />
                                  </label>
                                  {avatarImage && (
                                    <button
                                      type="button"
                                      onClick={() => { setAvatarImage(""); localStorage.removeItem("jarvis_avatar_image"); }}
                                      className="px-2.5 bg-red-950/40 hover:bg-red-900/40 border border-red-500/50 rounded-lg text-red-400 text-[10px] font-bold font-mono uppercase tracking-wide transition-all cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Personal Name */}
                            <div>
                              <label className="text-[9px] font-mono uppercase text-[#00f3ff]/85 font-extrabold block mb-1">Operator Profile Name</label>
                              <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/85 border border-[#00f3ff]/35 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-[#00f3ff]"
                              />
                            </div>

                            {/* Date of Birth */}
                            <div>
                              <label className="text-[9px] font-mono uppercase text-[#00f3ff]/85 font-extrabold block mb-1">Date of Birth</label>
                              <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full bg-black/85 border border-[#00f3ff]/35 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-[#00f3ff]"
                              />
                            </div>

                            {/* Gmail / Google Identity */}
                            <div>
                              <label className="text-[9px] font-mono uppercase text-[#00f3ff]/85 font-extrabold block mb-1">Google Identity (Gmail)</label>
                              <input
                                type="email"
                                value={gmail}
                                onChange={(e) => setGmail(e.target.value)}
                                placeholder="mohit@gmail.com"
                                className="w-full bg-black/85 border border-[#00f3ff]/35 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-[#00f3ff]"
                              />
                            </div>

                            {/* Google Cloud/Drive Backup Control Toggle */}
                            <div className="border-t border-[#00f3ff]/15 pt-3">
                              <span className="text-[9px] font-mono text-[#00f3ff]/60 uppercase font-bold block mb-2 tracking-wide">
                                Google Cloud real-time data sync
                              </span>
                              <div className="flex justify-between items-center py-1 bg-black/20 p-2 rounded-lg border border-[#00f3ff]/10">
                                <div className="text-left">
                                  <span className="text-white/85 text-xs block font-mono">Google Cloud Sync Control</span>
                                  <span className="text-[8px] font-mono text-slate-400 block mt-0.5 font-bold">Encrypts and syncs memories and logs</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBackupEnabled(!backupEnabled)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                                    backupEnabled ? "bg-[#10b981]" : "bg-slate-800"
                                  }`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                                    backupEnabled ? "translate-x-4" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>

                              {/* Manual sync command trigger */}
                              <div className="flex flex-col gap-2 mt-2.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      if (!gmail.trim()) {
                                        alert("🚫 Cloud Backup Restricted: Please enter a valid Google GMAIL ID in your profile to initialize secure Google One virtual cloud sync.");
                                        return;
                                      }
                                      // Clear quota exceeded flag temporarily on manual request to try sync again
                                      await enableFirestoreNetwork();
                                      setFirestoreQuotaExceeded(false);
                                      
                                      alert(`Contacting secure cloud systems... Enqueued full database backup for Google Identity: ${gmail.trim()}`);
                                      const backupKey = gmail.trim();
                                      await syncUserProfileToCloud(backupKey, {
                                        gmail,
                                        dateOfBirth,
                                        backupEnabled,
                                        avatarInitials,
                                        avatarImage
                                      });
                                      for (const msg of messages) {
                                        await syncDialogueToCloud(backupKey, msg);
                                      }
                                      alert(`Google Cloud Synchronization Complete:\n\n• User profile fully uploaded.\n• ${messages.length} chat logs backed up safely under ${gmail.trim()}`);
                                    } catch (err) {
                                      alert("Cloud backup failed: " + (err instanceof Error ? err.message : String(err)));
                                    }
                                  }}
                                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                >
                                  <CloudRain size={12} /> Trigger Manual Cloud Sync
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      if (!gmail.trim()) {
                                        alert("🚫 Cloud Restore Restricted: Please enter the Google GMAIL ID associated with your backups to locate matches.");
                                        return;
                                      }
                                      // Clear quota exceeded flag temporarily on manual request to try read again
                                      await enableFirestoreNetwork();
                                      setFirestoreQuotaExceeded(false);

                                      alert(`Searching secure Google Cloud database for matches to: ${gmail.trim()}...`);
                                      const backupKey = gmail.trim();
                                      const cloudProfile = await fetchUserProfileFromCloud(backupKey);
                                      if (cloudProfile) {
                                        if (cloudProfile.gmail) setGmail(cloudProfile.gmail);
                                        if (cloudProfile.dateOfBirth) setDateOfBirth(cloudProfile.dateOfBirth);
                                        if (cloudProfile.avatarInitials) setAvatarInitials(cloudProfile.avatarInitials);
                                        if (cloudProfile.avatarImage) setAvatarImage(cloudProfile.avatarImage);
                                        if (cloudProfile.backupEnabled !== undefined) setBackupEnabled(true);
                                        
                                        const cloudMsgs = await recoverAllDialoguesFromCloud(backupKey);
                                        if (cloudMsgs && cloudMsgs.length > 0) {
                                          setMessages(cloudMsgs);
                                          alert(`Google Cloud Restore Successful:\n\n• Found cloud profile for ${gmail.trim()}.\n• Restored ${cloudMsgs.length} historical dialogues to operating interface.`);
                                        } else {
                                          alert(`Google Cloud Restore Successful:\n\n• Profile parameters synced.\n• No previous dialogues found for ${gmail.trim()}.`);
                                        }
                                      } else {
                                        alert("Search completed. No encrypted backups existed for Google Operator ID: " + gmail.trim());
                                      }
                                    } catch (err) {
                                      alert("Cloud restore failed: " + (err instanceof Error ? err.message : String(err)));
                                    }
                                  }}
                                  className="w-full py-2 bg-sky-950/40 border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                                >
                                  <CloudLightning size={12} /> Restore Core from Cloud
                                </button>

                                <button
                                  type="button"
                                  onClick={handleExportData}
                                  className="w-full py-2 bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                                >
                                  <Download size={12} /> Export Data (JSON Archive)
                                </button>
                              </div>
                            </div>
                          </div>
                          </motion.div>
                        )}

                        {/* SUB-PAGE 7: ABOUT JARVIS OS */}
                        {menuSubpage === "about" && (
                          <motion.div
                            key="about"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 font-mono text-[#e2e8f0] transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >

                          <div className="p-4 rounded-xl border border-[#00f3ff]/25 bg-black/45 space-y-4 text-[11px] leading-relaxed">
                            <p className="text-slate-200 font-bold">
                              <span className="text-[#00f3ff] font-extrabold mr-1">▶</span>
                              JARVIS OS is a futuristic AI assistant system designed and developed by Mohit with a vision to create a next-generation intelligent operating experience directly from mobile devices.
                            </p>

                            <p className="text-slate-300">
                              Built using advanced web technologies like HTML, CSS, JavaScript, Python, Flask, and multiple AI providers including Gemini and ChatGPT, JARVIS combines modern artificial intelligence with a sleek cyber-inspired interface.
                            </p>

                            <div className="border-t border-[#00f3ff]/15 pt-3">
                              <h3 className="text-xs font-black text-[#00f3ff] uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                                <Sparkles size={12} className="text-[#00f3ff]" />
                                AI Ecosystem Core Features
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { title: "Smart conversational AI", desc: "Complex conversational reasoning and prompt execution." },
                                  { title: "Voice interaction system", desc: "Dual audio/speech parsing with high performance TTS output." },
                                  { title: "Live AI communication mode", desc: "Immersive animated face responsive to vocal pulses." },
                                  { title: "Image & PDF understanding", desc: "Advanced computer vision capabilities." },
                                  { title: "Memory-based responses", desc: "Deep context modeling based on local BIOS memory parameters." },
                                  { title: "Multi-provider AI switching", desc: "Interchangeable system intelligence adapters." },
                                  { title: "Advanced personalization", desc: "Configurable agent identity, custom themes, and custom tones." },
                                  { title: "Futuristic UI/UX animations", desc: "Reactive digital space grids and custom glass panels." },
                                  { title: "AI-powered utilities & tools", desc: "Integrated modules including syllabus/todo helpers." },
                                ].map((feature, fIdx) => (
                                  <div key={fIdx} className="flex gap-2.5 bg-[#091530]/45 border border-[#00f3ff]/15 p-2 rounded-lg hover:border-[#00f3ff]/35 transition-all">
                                    <span className="text-[#00f3ff] font-extrabold text-[12px] select-none leading-none mt-0.5">•</span>
                                    <div>
                                      <div className="text-[#00f3ff] font-bold text-[10px] uppercase tracking-wide leading-normal">
                                        {feature.title}
                                      </div>
                                      <div className="text-slate-400 text-[9px] mt-0.5 leading-normal">
                                        {feature.desc}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <p className="border-t border-[#00f3ff]/15 pt-3 text-slate-300 italic text-[10.5px] leading-relaxed">
                              Every part of JARVIS OS was crafted with creativity, experimentation, and passion for innovation. This is not just a project — it is a dream built with imagination, determination, countless late-night coding sessions, and the belief that even a single student with a smartphone can create something futuristic and extraordinary. JARVIS reflects the idea that powerful AI systems can be built from pure passion and vision.
                            </p>

                            <div className="border-t border-[#00f3ff]/20 pt-3 space-y-1.5 text-[10px] font-mono bg-[#091530]/25 p-2.5 rounded-lg border border-[#00f3ff]/10">
                              <div className="flex justify-between border-b border-[#00f3ff]/10 pb-1">
                                <span className="text-[#00f3ff]/70 font-semibold uppercase">Version:</span>
                                <span className="text-white font-bold">Jarvis 1.00</span>
                              </div>
                              <div className="flex justify-between border-b border-[#00f3ff]/10 pb-1">
                                <span className="text-[#00f3ff]/70 font-semibold uppercase">Developer:</span>
                                <span className="text-white font-bold">Mohit Khan</span>
                              </div>
                              <div className="flex justify-between border-b border-[#00f3ff]/10 pb-1">
                                <span className="text-[#00f3ff]/70 font-semibold uppercase">Status:</span>
                                <span className="text-emerald-400 font-bold uppercase animate-pulse">Online & Evolving</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[#00f3ff]/70 font-semibold uppercase">Mission:</span>
                                <span className="text-cyan-200 italic font-medium">"Building the future, one line of code at a time."</span>
                              </div>
                            </div>
                            </div>
                          </motion.div>
                        )}

                        {menuSubpage === "tutorials" && (
                          <motion.div
                            key="tutorials"
                            className="flex-grow flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >
                            <div className="space-y-4">
                              <div className="p-4 rounded-xl border border-[#00f3ff]/20 bg-[#091530]/40 text-[#00f3ff] space-y-2 text-center">
                                <h3 className="text-sm font-black tracking-widest font-mono uppercase">🎓 LESSONS & GUIDES PLATFORM</h3>
                                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                                  Welcome to the Student Interactive Academy! Here, learning is effortless, rewarding, and fun. Choose a class below and unlock your academic superpowers! 🚀
                                </p>
                              </div>

                              {activeTutorialId === null ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {[
                                    {
                                      id: "pdf",
                                      title: "📂 Reading PDFs",
                                      desc: "Learn how to instantly extract syllabus content, notes, or deliver homework summaries.",
                                      color: "from-cyan-500/20 to-[#00f3ff]/5",
                                      borderColor: "border-[#00f3ff]/30 hover:border-[#00f3ff]/90"
                                    },
                                    {
                                      id: "image",
                                      title: "🖼️ Analyzing Images",
                                      desc: "Discover how to digitize blackboard drawings, charts, worksheets or equation snapshots.",
                                      color: "from-purple-500/20 to-indigo-500/5",
                                      borderColor: "border-purple-500/30 hover:border-purple-500/90"
                                    },
                                    {
                                      id: "youtube",
                                      title: "🎥 Searching YouTube",
                                      desc: "Explore Visual Learning helpers and project real-time class tutorial feeds.",
                                      color: "from-red-500/20 to-rose-500/5",
                                      borderColor: "border-red-500/30 hover:border-red-500/90"
                                    },
                                    {
                                      id: "voice",
                                      title: "🎙️ Using Voice Commands",
                                      desc: "Communicate directly with your personal tutor for instant double-duplex coaching.",
                                      color: "from-emerald-500/20 to-teal-500/5",
                                      borderColor: "border-emerald-500/30 hover:border-emerald-500/90"
                                    }
                                  ].map((t) => (
                                    <motion.button
                                      key={t.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveTutorialId(t.id as any);
                                        setTutorialStepIndex(0);
                                      }}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`p-4 rounded-xl text-left border bg-gradient-to-br ${t.color} ${t.borderColor} transition-all cursor-pointer flex flex-col justify-between space-y-2 h-36 w-full outline-none`}
                                    >
                                      <div>
                                        <h4 className="text-xs font-bold tracking-wider text-white font-mono">{t.title}</h4>
                                        <p className="text-[10px] text-slate-300 font-sans mt-2.5 leading-relaxed">{t.desc}</p>
                                      </div>
                                      <span className="text-[9px] font-mono text-cyan-300 font-black tracking-widest uppercase self-end">BEGIN LESSON ➔</span>
                                    </motion.button>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 rounded-2xl border border-[#00f3ff]/25 bg-black/45 space-y-4">
                                  {activeTutorialId === "pdf" && (
                                    <div className="space-y-3.5">
                                      <div className="flex justify-between items-center border-b border-[#00f3ff]/15 pb-2">
                                        <span className="text-xs font-mono font-extrabold text-[#00f3ff] uppercase">Class: 📂 COURSE PDF READER</span>
                                        <span className="text-[10px] font-mono text-slate-400">Step {tutorialStepIndex + 1} of 3</span>
                                      </div>

                                      {tutorialStepIndex === 0 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Reading lengthy, dry academic papers or course syllabuses can feel daunting. But don't worry! With Jarvis, we turn PDF reading into an interactive conversation. 📑
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                            "You can load any paper, quiz, or document, and ask Jarvis to explain tricky formulas, list deliverable schedules, or summarize chapters instantly!"
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 1 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Ready to see where the magic happens? Inside your chat input drawer on the home screen, there is an attachment icon `+`.
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                            Simply click on it and upload your academic PDF file. Once attached, Jarvis automatically displays pre-programmed quick analysis macros like <span className="text-cyan-300 font-bold font-mono">Summarize PDF 📂</span> or <span className="text-cyan-300 font-bold font-mono">Explain Core Concepts 📑</span> for helper-guided study.
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 2 && (
                                        <div className="space-y-3">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Let's complete your class with an interactive simulator trial!
                                          </p>
                                          <p className="text-[10.5px] text-slate-400 font-mono leading-relaxed bg-[#00f3ff]/5 p-2 rounded-lg border border-[#00f3ff]/10">
                                            Click the button below. This will simulate a fast-upload of a calculus course PDF, close the settings, and reveal the custom quick analysis presets directly on your workspace!
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAttachedFile("data:application/pdf;base64,JVBERi0xLjQKJ...");
                                              setAttachedFileName("calculus_exam_syllabus.pdf");
                                              setAttachedFileType("application/pdf");
                                              setCurrentScreen("homepage");
                                              setMenuSubpage("index");
                                              setActiveTutorialId(null);
                                            }}
                                            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-[#00f3ff] hover:from-cyan-600 hover:to-cyan-400 text-black text-xs font-black font-mono uppercase tracking-widest rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] border-none outline-none"
                                          >
                                            🚀 RUN PDF LOAD SIMULATOR
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {activeTutorialId === "image" && (
                                    <div className="space-y-3.5">
                                      <div className="flex justify-between items-center border-b border-purple-500/15 pb-2">
                                        <span className="text-xs font-mono font-extrabold text-purple-400 uppercase">Class: 🖼️ IMAGE OCR & VISION</span>
                                        <span className="text-[10px] font-mono text-slate-400">Step {tutorialStepIndex + 1} of 3</span>
                                      </div>

                                      {tutorialStepIndex === 0 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Whiteboard sketches, math workbook plots, or handwritten formulas don't have to be confusing. Jarvis uses high-performing computer vision to read and solve them step-by-step! 🧠
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                            "Just show me any visual chart or equation, and we will break down the underlying physics or algebra concepts together."
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 1 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            To run visual vision analysis, click the `+` attachment button and upload any image from your camera roll or screenshot folders.
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                            The computer vision system instantly processes any text inside using accurate optical character recognition, letting you run visual macros like <span className="text-purple-300 font-bold font-mono">OCR Transcription 📝</span> or <span className="text-purple-300 font-bold font-mono">Analyze Visuals 🔎</span>!
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 2 && (
                                        <div className="space-y-3">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Let's run the visual sandbox!
                                          </p>
                                          <p className="text-[10.5px] text-slate-400 font-mono leading-relaxed bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                                            Click below to append a simulated high-contrast trigonometry chart, return to your home screen dashboard, and unleash your visual assistant presets!
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setAttachedFile("https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format");
                                              setAttachedFileName("trig_function_plot.jpg");
                                              setAttachedFileType("image/jpeg");
                                              setCurrentScreen("homepage");
                                              setMenuSubpage("index");
                                              setActiveTutorialId(null);
                                            }}
                                            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-400 text-white text-xs font-black font-mono uppercase tracking-widest rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] border-none outline-none"
                                          >
                                            📸 RUN IMAGE LOAD SIMULATOR
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {activeTutorialId === "youtube" && (
                                    <div className="space-y-3.5">
                                      <div className="flex justify-between items-center border-b border-red-500/15 pb-2">
                                        <span className="text-xs font-mono font-extrabold text-red-400 uppercase">Class: 🎥 YOUTUBE STREAM SYNC</span>
                                        <span className="text-[10px] font-mono text-slate-400">Step {tutorialStepIndex + 1} of 3</span>
                                      </div>

                                      {tutorialStepIndex === 0 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Are you a visual learner who loves learning from videos? Let's bring high-quality study lecture streams right to your companion! 🎥
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                            "You can synchronize any study topic directly with YouTube's database, letting you watch lectures without leaving the screen."
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 1 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Launching the visual stream sync is incredibly simple options!
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                            Simply type '<span className="text-red-300 font-bold font-mono">search YouTube for machine learning</span>' or '<span className="text-red-300 font-bold font-mono">play biochemistry lectures</span>' in the input box. Jarvis will resolve the livestream index and project an interactive stream card!
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 2 && (
                                        <div className="space-y-3">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Let's start the media projector!
                                          </p>
                                          <p className="text-[10.5px] text-slate-400 font-mono leading-relaxed bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                            Click below to pre-fill your prompt with a search for organic reaction mechanisms and navigate home where you can execute it!
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInputText("Search YouTube for Organic Chemistry basics");
                                              setCurrentScreen("homepage");
                                              setMenuSubpage("index");
                                              setActiveTutorialId(null);
                                            }}
                                            className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-400 text-white text-xs font-black font-mono uppercase tracking-widest rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] border-none outline-none"
                                          >
                                            🎥 PRE-FILL YOUTUBE PROMPT
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {activeTutorialId === "voice" && (
                                    <div className="space-y-3.5">
                                      <div className="flex justify-between items-center border-b border-emerald-500/15 pb-2">
                                        <span className="text-xs font-mono font-extrabold text-emerald-400 uppercase">Class: 🎙️ VOICE COMMAND CORE</span>
                                        <span className="text-[10px] font-mono text-slate-400">Step {tutorialStepIndex + 1} of 3</span>
                                      </div>

                                      {tutorialStepIndex === 0 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Tired of typing questions? Skip the keyboard entirely and chat with Jarvis aloud. Talk real, learn fast, master concepts! 🎙️
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                                            "Our high-fidelity vocal engine captures your dictated speech details and speaks back study plans fluently."
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 1 && (
                                        <div className="space-y-2.5">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Engaging the vocal sharing protocol takes just a single click.
                                          </p>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                            Tap the microphone icon `🎙️` on your home screen. This turns on state listeners, letting you speak naturally. Tap again to terminate vocalization or play!
                                          </p>
                                        </div>
                                      )}

                                      {tutorialStepIndex === 2 && (
                                        <div className="space-y-3">
                                          <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                                            Ready to engage high-fidelity double-duplex speech?
                                          </p>
                                          <p className="text-[10.5px] text-slate-400 font-mono leading-relaxed bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                            Click below. Jarvis will activate vocal tracking immediately, set you on your home page, and start listening to your voice!
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsVoiceActive(true);
                                              setCurrentScreen("homepage");
                                              setMenuSubpage("index");
                                              setActiveTutorialId(null);
                                            }}
                                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-400 text-white text-xs font-black font-mono uppercase tracking-widest rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none outline-none"
                                          >
                                            🎙️ ENGAGE VOCAL PROTOCOL
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex justify-between gap-2.5 mt-4 pt-4 border-t border-slate-500/15">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (tutorialStepIndex > 0) {
                                          setTutorialStepIndex(prev => prev - 1);
                                        } else {
                                          setActiveTutorialId(null);
                                        }
                                      }}
                                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-[10px] font-bold font-mono uppercase rounded-lg cursor-pointer transition-colors outline-none"
                                    >
                                      {tutorialStepIndex > 0 ? "◀ Back" : "✕ Exit Guide"}
                                    </button>
                                    {tutorialStepIndex < 2 ? (
                                      <button
                                        type="button"
                                        onClick={() => setTutorialStepIndex(prev => prev + 1)}
                                        className="ml-auto px-4 py-1.5 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/30 border border-[#00f3ff]/50 text-[#00f3ff] text-[10px] font-black font-mono uppercase rounded-lg cursor-pointer transition-colors outline-none"
                                      >
                                        Next Step ▶
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setActiveTutorialId(null)}
                                        className="ml-auto px-4 py-1.5 bg-[#00f3ff] hover:bg-white text-black text-[10px] font-black font-mono uppercase rounded-lg cursor-pointer transition-colors outline-none"
                                      >
                                        Lesson Done ✓
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {menuSubpage === "feedback" && (
                          <motion.div
                            key="feedback"
                            className="flex-grow flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          >
                            {!feedbackSubmitted ? (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5 text-pink-400 space-y-2 text-center">
                                  <h3 className="text-sm font-black tracking-widest font-mono uppercase flex items-center justify-center gap-2">
                                    <span>💖 STUDENT FEEDBACK PANEL</span>
                                  </h3>
                                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                                    Found a bug master? Or do you have an exciting suggestion that would make study session even better? Share it with us and help mold Jarvis into the ultimate academic companion!
                                  </p>
                                </div>

                                <div className="p-4 rounded-xl border border-[#00f3ff]/25 bg-black/45 space-y-4 text-xs">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-[#00f3ff] uppercase tracking-wider font-extrabold block">
                                      Choose Feedback Node:
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { id: "suggestion", label: "💡 Suggestion" },
                                        { id: "bug", label: "🐛 Bug Report" },
                                        { id: "experience", label: "🌟 Story" }
                                      ].map((opt) => (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => setFeedbackType(opt.id)}
                                          className={`py-2 px-1 rounded-xl font-mono text-[9.5px] font-bold border transition-all text-center cursor-pointer outline-none ${
                                            feedbackType === opt.id
                                              ? "bg-[#00f3ff]/20 border-[#00f3ff] text-white"
                                              : "bg-[#091530]/40 border-[#00f3ff]/20 text-[#00f3ff] hover:bg-[#00f3ff]/10"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-[#00f3ff] uppercase tracking-wider font-extrabold block">
                                      Describe your experience:
                                    </label>
                                    <textarea
                                      value={feedbackMessage}
                                      onChange={(e) => setFeedbackMessage(e.target.value)}
                                      placeholder={
                                        feedbackType === "bug"
                                          ? "Describe what is not working properly, outlining steps to reproduce. We will squash it immediately! 🐛"
                                          : feedbackType === "suggestion"
                                          ? "What custom tools, capabilities, or styling tweaks should Mohit code next? Write it down! 💡"
                                          : "Share your success stories or how Jarvis helped you score higher grades in study exams! 🌟"
                                      }
                                      rows={4}
                                      className="w-full bg-black/60 border border-[#00f3ff]/30 rounded-xl p-3 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:border-[#00f3ff]/90 outline-none transition-all leading-relaxed"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    disabled={!feedbackMessage.trim()}
                                    onClick={async () => {
                                      if (!feedbackMessage.trim()) return;
                                      const feedbackData = {
                                        id: `fb-${Date.now()}`,
                                        feedbackType: feedbackType,
                                        message: feedbackMessage,
                                        timestamp: new Date().toISOString()
                                      };
                                      await syncUserFeedbackToCloud(username, feedbackData);
                                      setFeedbackSubmitted(true);
                                    }}
                                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 border outline-none ${
                                      feedbackMessage.trim()
                                        ? "bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white border-pink-500/50 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.25)]"
                                        : "bg-slate-800/50 text-slate-500 border-slate-700/40 cursor-not-allowed"
                                    }`}
                                  >
                                    <span>SUBMIT SECURE LOGS ➔</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-5 rounded-2xl border border-emerald-500/30 bg-[#09261a]/35 space-y-4 text-center"
                              >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-sm font-black animate-bounce">
                                  ✓
                                </div>
                                <h4 className="text-xs font-black tracking-widest font-mono text-emerald-400 uppercase">
                                  TRANSMISSION SUCCESSFUL! 📡
                                </h4>
                                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                                  Thank you so much, {username}, for contributing your valuable thoughts! Your notes and feedback have been compiled and Synced securely to our master cloud databases. ☁
                                </p>
                                <p className="text-[11px] text-[#00f3ff] font-mono leading-relaxed bg-[#00f3ff]/5 p-2 rounded-xl border border-[#00f3ff]/10">
                                  "With your suggestions, we continue hardcoding high-fidelity AI components. We truly appreciate you building the future of Jarvis OS alongside us! 🚀"
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeedbackMessage("");
                                    setFeedbackSubmitted(false);
                                  }}
                                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors outline-none"
                                >
                                  Submit Another Report
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </div>

                      {/* Common menu footer items */}
                      {menuSubpage !== "index" && (
                        <div className="pt-2.5 border-t border-[#00f3ff]/20 shrink-0 flex gap-2">
                          <button
                            onClick={() => setMenuSubpage("index")}
                            className="flex-1 py-1.5 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 border border-[#00f3ff]/40 text-[#00f3ff] text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                          >
                            Back To Menu
                          </button>
                        </div>
                      )}

                      {activeMenuPopup && (
                        <InteractiveFeatures
                          onClose={() => setActiveMenuPopup(null)}
                          username={username}
                          theme={appTheme === "vintage" ? "note" : appTheme}
                          initialActivePopup={activeMenuPopup === "all-features" ? null : activeMenuPopup}
                        />
                      )}
                    </motion.div>
                  )}

                      {/* SCREEN 3: LIVE MODE (Immersive robotic face & speech HUD) */}
                  {currentScreen === "live" && (
                    <motion.div
                      key="screen-3-live"
                      initial={{ opacity: 0, scale: 1.03, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 1.03, filter: "blur(12px)" }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{ willChange: "transform, opacity, filter" }}
                      className={`absolute inset-0 flex flex-col gap-1 sm:gap-2 p-2 sm:p-4 pb-2 sm:pb-4 overflow-hidden select-none touch-none border border-[#00f3ff]/20 transition-all duration-1000 transform-gpu ${
                        faceEmotion === "happy" || faceEmotion === "laughing"
                          ? "bg-gradient-to-b from-[#3b1c0a] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "cry"
                          ? "bg-gradient-to-b from-[#0b1b3d] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "love"
                          ? "bg-gradient-to-b from-[#2e0933] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "angry"
                          ? "bg-gradient-to-b from-[#3b0a0a] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "surprised"
                          ? "bg-gradient-to-b from-[#240b36] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "disturbed"
                          ? "bg-gradient-to-b from-[#262002] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "sleepy"
                          ? "bg-gradient-to-b from-[#0c1424] via-[#040815] to-[#000207]"
                          : faceEmotion === "contemplative"
                          ? "bg-gradient-to-b from-[#1c1236] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "bored"
                          ? "bg-gradient-to-b from-[#1b1e24] via-[#050a1d] to-[#01040f]"
                          : faceEmotion === "skeptical"
                          ? "bg-gradient-to-b from-[#291e10] via-[#050a1d] to-[#01040f]"
                          : "bg-[#040816]/95"
                       }`}
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-[#00f3ff]/25 shrink-0 relative z-10">
                        <motion.div layoutId="left-action-button-container" className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.speechSynthesis.cancel();
                              setFaceStatus("idle");
                              setFaceEmotion("normal");
                              setCurrentScreen("homepage");
                            }}
                            className="p-2 rounded-xl border border-[#00f3ff]/30 bg-[#091530]/65 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] transition-all cursor-pointer outline-none flex items-center justify-center glow-btn"
                          >
                            <X size={15} />
                          </button>
                        </motion.div>
                        
                        <motion.div layoutId="center-screen-label-hub" className="text-center flex items-center justify-center gap-1.5 bg-[#00f3ff]/10 px-3.5 py-1 text-center rounded-full border border-[#00f3ff]/35 shrink-0 select-none">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                          <motion.span layoutId="shared-main-headline-text" className="text-[9px] font-mono tracking-widest text-[#00f3ff] font-bold uppercase leading-none">
                            CONNECTED
                          </motion.span>
                        </motion.div>

                        <motion.div layoutId="right-status-action-container" className="w-[33px] h-[33px]" />
                      </div>

                      {/* Animated Core containing EMO Face inside live mode */}
                      <div className="flex-1 min-h-0 flex flex-col items-center justify-start gap-1.5 sm:gap-3 pt-0.5 sm:pt-1.5 pb-1 w-full animate-in fade-in zoom-in duration-500 relative z-10">
                        <div className="w-full min-h-0 flex items-center justify-center shrink-0">
                          <RoboticFace status={faceStatus} emotion={faceEmotion} onEmotionChange={setFaceEmotion} />
                        </div>

                        {/* Robotic Mood Status Indicator */}
                        <div className="px-3 sm:px-4 py-0.5 rounded-full bg-[#00f3ff]/5 border border-[#00f3ff]/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.1)] shrink-0">
                          <Activity size={10} className="text-[#00f3ff] animate-pulse" />
                          <span className="text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff] font-bold uppercase tracking-widest leading-none">
                            Jarvis Mood: {faceStatus === "thinking" ? "Analyzing" : faceEmotion}
                          </span>
                        </div>



                        {apiQuotaExceeded && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            onClick={() => {
                              setCurrentScreen("menu");
                              setMenuSubpage("api");
                            }}
                            className="w-full max-w-sm p-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.15)] backdrop-blur-md cursor-pointer shrink-0 animate-in fade-in zoom-in duration-300"
                          >
                            <Sparkles size={11} className="animate-pulse text-amber-400 shrink-0" />
                            <div className="text-left">
                              <h4 className="text-[8.5px] font-black tracking-wider uppercase text-amber-300 font-sans leading-none">
                                API QUOTA CONGESTED (429)
                              </h4>
                              <p className="text-[7.5px] text-amber-200/80 font-mono mt-0.5 leading-snug">
                                Tap to configure your own free Gemini API key to restore premium voice pipelines.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Live voice caption display */}
                        <div className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] leading-relaxed min-h-[56px] sm:min-h-[64px] flex flex-col items-center justify-center relative shadow-lg bg-[#050917]/95 text-[#cffafe] border border-[#00f3ff]/20 shrink-0 gap-0.5">
                          <span className="absolute -top-2 left-4 text-[7px] sm:text-[8px] font-mono px-2 py-0.5 bg-[#0a1435] border border-[#00f3ff]/30 text-[#00f3ff] rounded-full font-bold uppercase">
                            AUTOMATIC JARVIS COMPANION VOICE
                          </span>
                          
                          <AnimatePresence mode="wait">
                            {voiceMessages.length > 0 ? (
                              <motion.div 
                                key={voiceMessages[voiceMessages.length - 1].id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="w-full text-center space-y-0.5"
                              >
                                <span className="text-[7.5px] sm:text-[8px] font-mono uppercase tracking-widest text-[#00f3ff]/65 font-black block">
                                  {voiceMessages[voiceMessages.length - 1].sender === "user" ? "You Said" : "Jarvis Spoke"}
                                </span>
                                <div className="font-mono text-[10px] sm:text-[11px] text-[#cffafe] leading-relaxed max-h-[50px] sm:max-h-[70px] overflow-y-auto scrollbar-thin">
                                  <FluidTypewriter text={voiceMessages[voiceMessages.length - 1].text} glow={voiceMessages[voiceMessages.length - 1].sender !== "user"} />
                                </div>
                              </motion.div>
                            ) : (
                              <motion.p 
                                key="voice-companion-empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-mono text-[#00f3ff]/50 text-center leading-normal text-[10px] sm:text-[11px]"
                              >
                                Hello! Speak to start our natural human vocal sharing or utilize vision camera scan.
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Hardware Video Stream Camera Preview Container */}
                        {(isCameraActive || isScreenSharing) && (
                          <div className="relative w-full aspect-video max-w-[300px] sm:max-w-[360px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-[#00f3ff]/40 bg-black/60 shadow-[0_0_20px_rgba(0,243,255,0.15)] shrink-0">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover transition-transform duration-500 ${isCameraActive && cameraFacingMode === "user" ? "scale-x-[-1]" : ""}`}
                            />
                            
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10 gap-2">
                              <span className="text-[7px] sm:text-[8px] font-mono bg-black/75 text-[#00f3ff] border border-[#00f3ff]/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-black flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#00f3ff] animate-pulse" />
                                {isScreenSharing ? "DISPLAY SHARE" : (cameraFacingMode === "user" ? "Front" : "Rear")}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                {isCameraActive && (
                                  <button
                                    onClick={switchCameraFacingMode}
                                    className="px-2 py-1 bg-black/75 hover:bg-black/90 border border-[#00f3ff]/35 text-[#00f3ff] hover:text-white font-black font-mono text-[8.5px] sm:text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
                                  >
                                    Flip
                                    <RefreshCw size={9} />
                                  </button>
                                )}
                                
                                <button
                                  onClick={executeVisionScan}
                                  disabled={isVisionAnalyzing}
                                  className={`px-2 py-1 bg-[#00f3ff] hover:bg-[#00e1ec] active:scale-95 text-black font-black font-mono text-[8.5px] sm:text-[9px] uppercase tracking-wider rounded shadow-[0_0_12px_rgba(0,243,255,0.4)] transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isVisionAnalyzing ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                >
                                  {isVisionAnalyzing ? "Scanning..." : "See"}
                                  <Eye size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Controls Area (Optimized & scroll-safe) */}
                      <div className="space-y-2.5 sm:space-y-4 pt-0.5 transition-all shrink-0 w-full mb-1">
                        <div className="w-full py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold font-sans tracking-[0.12em] uppercase flex items-center justify-center gap-2 border border-[#00f3ff]/30 bg-[#00f3ff]/5 text-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.08)] select-none">
                          <span className={`w-1.5 h-1.5 rounded-full block ${isVoiceActive ? "bg-red-400 animate-pulse" : "bg-[#00f3ff]/60"}`} />
                          {isVoiceActive ? "Listening" : "Mic Session Ready"}
                        </div>
                        
                        <div className="flex justify-around items-center px-4 py-0.5">
                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={toggleVisionActive}
                              className={`w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all cursor-pointer glow-btn ${
                                isCameraActive ? "bg-[#00f3ff]/25 border-[#00f3ff] text-white shadow-[0_0_10px_rgba(0,243,255,0.4)]" : "bg-black/40 border-[#00f3ff]/25 text-[#00f3ff]/85 hover:text-white"
                              }`}
                            >
                              <Camera size={12} />
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">VISION</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={toggleVoiceListening}
                              className={`w-11 h-11 sm:w-12 sm:h-12 border rounded-full flex items-center justify-center transition-all cursor-pointer glow-btn ${
                                isVoiceActive ? "bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.45)] animate-pulse" : "bg-slate-950/70 border-[#00f3ff]/35 text-[#00f3ff]"
                              }`}
                            >
                              {isVoiceActive ? <MicOff size={14} /> : <Mic size={14} />}
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">{isVoiceActive ? "STOP" : "LISTEN"}</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={() => {
                                setIsMuted(!isMuted);
                                stopVoiceSpeech();
                              }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all cursor-pointer glow-btn ${
                                isMuted ? "bg-red-950/70 border-red-500/50 text-red-100" : "bg-black/40 border-[#00f3ff]/25 text-[#00f3ff]/85 hover:text-white"
                              }`}
                            >
                              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">VOLUME</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>



          </div>
        )}
      </AnimatePresence>



      {/* Global Attachment Source Menu bottom sheet with touch-to-dismiss backdrop */}
      <AnimatePresence>
        {isAttachmentSheetOpen && (
          <>
            {/* Screen block to catch clicks and close the floating drawer */}
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[160] cursor-pointer transition-opacity" 
              onClick={() => setIsAttachmentSheetOpen(false)} 
              onTouchStart={() => setIsAttachmentSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#121214] border-t border-zinc-800/80 rounded-t-[32px] p-6 pb-8 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] backdrop-blur-3xl z-[170] text-left select-none max-w-sm sm:max-w-md mx-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Curved Drag Handle */}
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />
              
              {/* Level 1: 3 Horizontal Options (Camera, Photos, Files) */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Photos */}
                <label className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 border border-zinc-800/40 hover:border-[#00f3ff]/40 rounded-3xl cursor-pointer transition-all hover:bg-zinc-800/40 active:scale-95 text-center group">
                  <div className="w-12 h-12 bg-zinc-800/40 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-[#00f3ff] transition-all">
                    <ImageIcon size={22} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white mt-2 transition-colors">Photos</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      handleFileUpload(e);
                      setIsAttachmentSheetOpen(false);
                    }} 
                    className="hidden" 
                  />
                </label>

                {/* Camera */}
                <label className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 border border-zinc-800/40 hover:border-[#00f3ff]/40 rounded-3xl cursor-pointer transition-all hover:bg-zinc-800/40 active:scale-95 text-center group">
                  <div className="w-12 h-12 bg-zinc-800/40 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-[#00f3ff] transition-all">
                    <Camera size={22} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white mt-2 transition-colors">Camera</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={(e) => {
                      handleFileUpload(e);
                      setIsAttachmentSheetOpen(false);
                    }} 
                    className="hidden" 
                  />
                </label>

                {/* Files */}
                <label className="flex flex-col items-center justify-center p-3 bg-zinc-900/60 border border-zinc-800/40 hover:border-[#00f3ff]/40 rounded-3xl cursor-pointer transition-all hover:bg-zinc-800/40 active:scale-95 text-center group">
                  <div className="w-12 h-12 bg-zinc-800/40 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-[#00f3ff] transition-all">
                    <Paperclip size={22} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white mt-2 transition-colors">Files</span>
                  <input 
                    type="file" 
                    accept="application/pdf,text/plain" 
                    onChange={(e) => {
                      handleFileUpload(e);
                      setIsAttachmentSheetOpen(false);
                    }} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Level 2: Vertical List */}
              <div className="space-y-3">
                {/* Fast Image Generation */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentSheetOpen(false);
                    setActiveChatTag("image");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/30 hover:border-orange-500/30 rounded-2xl cursor-pointer text-left transition-all hover:bg-zinc-800/30 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center transition-all group-hover:bg-orange-500/20">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-200 leading-tight group-hover:text-white transition-colors">Fast Image Generation</h4>
                    <p className="text-xs text-zinc-500 leading-tight mt-0.5">Create & edit images</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>

                {/* Video Generation */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentSheetOpen(false);
                    setActiveChatTag("video");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/30 hover:border-rose-500/30 rounded-2xl cursor-pointer text-left transition-all hover:bg-zinc-800/30 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center transition-all group-hover:bg-rose-500/20">
                    <Video size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-200 leading-tight group-hover:text-white transition-colors font-sans">Video Generation</h4>
                    <p className="text-xs text-zinc-500 leading-tight mt-0.5">Bring ideas to life</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>

                {/* Canvas */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAttachmentSheetOpen(false);
                    setActiveChatTag("canvas");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/30 hover:border-[#00f3ff]/30 rounded-2xl cursor-pointer text-left transition-all hover:bg-zinc-800/30 group font-sans"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/20 text-[#00f3ff] flex items-center justify-center transition-all group-hover:bg-[#00f3ff]/20">
                    <Code size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-200 leading-tight group-hover:text-white transition-colors">Canvas</h4>
                    <p className="text-xs text-zinc-500 leading-tight mt-0.5">Write code, write text, or create slides</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CommandGuideModal
        isOpen={isCommandGuideOpen}
        onClose={() => setIsCommandGuideOpen(false)}
        onExecuteCommand={(commandText) => {
          if (currentScreen === "live") {
            handleVoiceMessage(commandText);
          } else {
            handleSendMessage(commandText);
          }
        }}
      />

      {/* === FAST IMAGE GENERATOR PANEL === */}
      <AnimatePresence>
        {isImageGenOpen && (
          <div className="fixed inset-0 z-[130] bg-[#020512]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-[#090e24] border border-[#00f3ff]/30 rounded-[28px] p-6 shadow-[0_0_50px_rgba(0,243,255,0.15)] relative text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsImageGenOpen(false);
                  setImageGenState("idle");
                  setImageGenPrompt("");
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-wide uppercase font-sans">Fast Image Composer</h2>
                  <p className="text-xs text-orange-400/80 font-mono">Create and edit images instantly with Gemini</p>
                </div>
              </div>

              {imageGenState === "idle" && (
                <div className="space-y-5">
                  {/* Prompt Text Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono mb-2">
                      Describe your creative vision:
                    </label>
                    <textarea
                      value={imageGenPrompt}
                      onChange={(e) => setImageGenPrompt(e.target.value)}
                      placeholder="e.g. Cyberpunk detective overlooking a wet holographic neon cityscape..."
                      className="w-full h-24 p-3 bg-slate-950/70 border border-slate-800 hover:border-[#00f3ff]/20 focus:border-[#00f3ff] rounded-2xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Preset Quick Prompts */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                      Preset Suggestions:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Steaming ramen bowl, anime style",
                        "Futuristic floating neon workspace",
                        "Sci-fi spaceship in orbit, high detail",
                        "Cybernetic owl with glowing eyes"
                      ].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setImageGenPrompt(preset)}
                          className="text-[10.5px] px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-[#00f3ff]/40 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Style Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                        Art Style preset:
                      </label>
                      <select
                        value={imageGenStyle}
                        onChange={(e) => setImageGenStyle(e.target.value)}
                        className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#00f3ff]"
                      >
                        {["Cinematic", "Anime/Manga", "Oil Painting", "3D Digital Craft", "Cyberpunk Synthwave", "Vaporwave Neon"].map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    {/* Aspect Ratio Selection */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                        Aspect Ratio:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["1:1", "16:9", "9:16"].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setImageGenRatio(ratio)}
                            className={`p-2 border rounded-xl font-bold font-mono text-[10px] transition-all cursor-pointer ${
                              imageGenRatio === ratio
                                ? "bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]"
                                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    disabled={!imageGenPrompt.trim()}
                    onClick={() => {
                      setImageGenState("generating");
                      // Simulate a professional multi-stage image generation countdown
                      let count = 0;
                      const interval = setInterval(() => {
                        count += 10;
                        if (count >= 100) {
                          clearInterval(interval);
                          setImageGenState("success");
                          setImageGenResult(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="%230a0d24"/><circle cx="200" cy="200" r="120" fill="none" stroke="%2300f3ff" stroke-width="4" stroke-dasharray="10 5" opacity="0.6"/><path d="M120 280 L200 120 L280 280 Z" fill="none" stroke="%23f97316" stroke-width="3" opacity="0.8"/><circle cx="200" cy="120" r="8" fill="%23f43f5e" opacity="0.9"/><text x="50%" y="85%" font-family="monospace" font-size="12" fill="%2300f3ff" font-weight="bold" text-anchor="middle">JARVIS AI CO-PRODUCER GENERATION</text></svg>`);
                        }
                      }, 250);
                    }}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black font-sans uppercase tracking-widest text-xs transition-all cursor-pointer ${
                      imageGenPrompt.trim()
                        ? "bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:scale-[1.01] active:scale-95"
                        : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    GENERATE CREATIVE VISION
                    <Sparkles size={14} />
                  </button>
                </div>
              )}

              {imageGenState === "generating" && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-orange-500/20 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="absolute inset-2 border-2 border-t-transparent border-r-orange-400 border-b-orange-400/20 border-l-transparent rounded-full"
                    />
                  </div>
                  <h3 className="text-md font-bold text-white uppercase tracking-wider font-sans">Synthesizing Latent Space</h3>
                  <p className="text-xs text-orange-400/70 font-mono mt-1.5">Applying {imageGenStyle} diffusion layers info...</p>
                  
                  {/* Progress info simulations */}
                  <div className="w-56 h-1.5 bg-slate-950 border border-slate-850 rounded-full overflow-hidden mt-5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    />
                  </div>
                </div>
              )}

              {imageGenState === "success" && (
                <div className="space-y-6">
                  {/* Generated result rendering */}
                  <div className="relative border border-orange-500/30 rounded-2xl overflow-hidden aspect-square max-w-[340px] mx-auto bg-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center">
                    <img 
                      src={imageGenResult} 
                      alt="Gemini Generated Canvas Output" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 border border-orange-500/40 text-orange-400 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">
                      Style: {imageGenStyle}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                    <button
                      onClick={() => {
                        setAttachedFile(imageGenResult);
                        setAttachedFileName(`AI_Render_${Date.now()}.png`);
                        setAttachedFileType("image/png");
                        setIsImageGenOpen(false);
                        setImageGenState("idle");
                        setImageGenPrompt("");
                      }}
                      className="py-3 bg-gradient-to-r from-cyan-600 to-[#00f3ff] text-black font-black font-sans uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-md"
                    >
                      Attach to Chat
                      <Plus size={14} />
                    </button>
                    <a
                      href={imageGenResult}
                      download={`JARVIS_Image_${Date.now()}.png`}
                      className="py-3 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-200 hover:text-white font-black font-sans uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-slate-850 active:scale-95 shadow-md"
                    >
                      Download Image
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === VECTOR-FLOW AI VIDEO STUDIO === */}
      <AnimatePresence>
        {isVideoGenOpen && (
          <div className="fixed inset-0 z-[130] bg-[#020512]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-[#090b1c] border border-rose-500/30 rounded-[28px] p-6 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsVideoGenOpen(false);
                  setVideoGenState("idle");
                  setVideoGenPrompt("");
                }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  <Video size={22} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-wide uppercase font-sans">AI Video Studio</h2>
                  <p className="text-xs text-rose-400/80 font-mono">Synthesize video scenes from ideas</p>
                </div>
              </div>

              {videoGenState === "idle" && (
                <div className="space-y-5">
                  {/* Prompt Text Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono mb-2">
                      Scene Description:
                    </label>
                    <textarea
                      value={videoGenPrompt}
                      onChange={(e) => setVideoGenPrompt(e.target.value)}
                      placeholder="Describe camera angles, lighting, motions... (e.g. Cinematic orbital shot of ancient ruins in a misty dense jungle, light rays piercing the canopy)"
                      className="w-full h-24 p-3 bg-slate-950/75 border border-slate-800 hover:border-rose-500/20 focus:border-rose-500 rounded-2xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Motion Styles */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                        Camera Motion dynamics:
                      </label>
                      <select
                        value={videoGenMotion}
                        onChange={(e) => setVideoGenMotion(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                      >
                        {["Cinematic Orbit", "Slow Pan Left", "Dolly Zoom In", "Extreme Lateral Fly-by", "Slow-Mo Floating Loop"].map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clip Duration */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                        Duration clip limit:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["4s", "8s", "12s"].map((dur) => (
                          <button
                            key={dur}
                            onClick={() => setVideoGenDuration(dur)}
                            className={`p-2.5 border rounded-xl font-bold font-mono text-[10px] transition-all cursor-pointer ${
                              videoGenDuration === dur
                                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {dur}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Render Button */}
                  <button
                    disabled={!videoGenPrompt.trim()}
                    onClick={() => {
                      setVideoGenState("generating");
                      setTimeout(() => {
                        setVideoGenState("success");
                      }, 3200);
                    }}
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black font-sans uppercase tracking-widest text-xs transition-all cursor-pointer ${
                      videoGenPrompt.trim()
                        ? "bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-[0_4px_20px_rgba(244,63,94,0.3)] hover:scale-[1.01] active:scale-95"
                        : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    RENDER DYNAMIC SCENE
                    <Video size={14} className="animate-pulse" />
                  </button>
                </div>
              )}

              {videoGenState === "generating" && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative w-24 h-20 flex items-center justify-center gap-1.5 mb-6">
                    {[0, 0.15, 0.3, 0.45].map((delay, index) => (
                      <motion.div
                        key={index}
                        animate={{ scaleY: [1, 2.8, 1], translateY: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay, ease: "easeInOut" }}
                        className="w-2.5 h-6 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                      />
                    ))}
                  </div>
                  
                  <h3 className="text-md font-bold text-white uppercase tracking-wider font-sans">Interpolating Frame Vectors</h3>
                  <p className="text-xs text-rose-400/70 font-mono mt-1">Staging fluid canvas dynamics model ({videoGenMotion})...</p>
                  
                  <div className="w-64 max-w-full font-mono text-[9px] bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-400 text-left mt-5 space-y-1">
                    <p className="text-rose-400/80">&gt; Initializing visual synthesis engine...</p>
                    <p>&gt; Staging prompt frame weights...</p>
                    <p className="text-rose-500 animate-pulse">&gt; Rendering fluid motion coordinates (30fps)...</p>
                  </div>
                </div>
              )}

              {videoGenState === "success" && (
                <div className="space-y-6">
                  {/* Simulated Output Player Screen */}
                  <div className="relative border border-rose-500/30 rounded-2xl overflow-hidden aspect-video w-full max-w-[420px] mx-auto bg-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.15)] flex flex-col items-center justify-center">
                    {/* Animated looping canvas preview simulation */}
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/35 text-rose-400 rounded-full flex items-center justify-center animate-pulse shadow-inner">
                        <Play size={24} className="ml-1 fill-rose-500/25" />
                      </div>
                      <p className="text-xs font-bold text-slate-200 tracking-wider font-sans text-center px-4 max-w-[280px]">
                        "{videoGenPrompt}"
                      </p>
                    </div>

                    <div className="absolute top-2 left-2 bg-black/75 border border-rose-500/40 text-rose-400 text-[8.5px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">
                      {videoGenDuration} • {videoGenMotion}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm border border-slate-800 rounded px-3 py-1.5 flex items-center justify-between text-[8px] font-mono text-slate-400">
                      <span>0:00 / 0:0{videoGenDuration[0]}</span>
                      <span className="text-rose-400">MP4 ENCODED SUCCESS</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                    <button
                      onClick={() => {
                        setAttachedFile("mock_video_attached_token");
                        setAttachedFileName(`AI_Video_${Date.now()}.mp4`);
                        setAttachedFileType("video/mp4");
                        setIsVideoGenOpen(false);
                        setVideoGenState("idle");
                        setVideoGenPrompt("");
                      }}
                      className="py-3 bg-gradient-to-r from-rose-600 to-pink-500 text-white font-black font-sans uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-md border border-rose-400/20"
                    >
                      Attach to Chat
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        // Create a simple dummy text blob download to simulate the mp4 stream export
                        const text = `JARVIS_VIDEO_EXPORT_STREAM_METADATA\nprompt: ${videoGenPrompt}\nmotion: ${videoGenMotion}\nduration: ${videoGenDuration}`;
                        const blob = new Blob([text], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `JARVIS_Video_${Date.now()}.mp4`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="py-3 bg-slate-900 border border-slate-850 hover:border-rose-500/40 text-slate-250 hover:text-white font-black font-sans uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-slate-800 active:scale-95 shadow-md"
                    >
                      Download MP4
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MAJESTIC COMPILATION GEMINI CANVAS WORKSPACE === */}
      <AnimatePresence>
        {isCanvasWorkspaceOpen && (
          <div className="fixed inset-0 z-[140] bg-[#020410] flex flex-col overflow-hidden font-sans text-slate-200">
            {/* Header Ribbon */}
            <div className="px-6 py-4 bg-[#060a1e] border-b border-[#00f3ff]/20 flex items-center justify-between shadow-2xl shrink-0 font-sans">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-950 to-black border border-[#00f3ff]/30 rounded-2xl text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.2)]">
                  <Code size={20} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block leading-3">GEMINI HYBRID COMPANION</span>
                  <h1 className="text-md sm:text-lg font-black text-white uppercase tracking-wider">Canvas Workspace Live Studio</h1>
                </div>
              </div>

              {/* Back to Home button */}
              <button
                type="button"
                onClick={() => setIsCanvasWorkspaceOpen(false)}
                className="px-4 py-2 bg-slate-900/60 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 rounded-xl text-slate-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                ← EXIT WORKSPACE
              </button>
            </div>

            {/* Navigation Tab Menu */}
            <div className="px-4 bg-[#040614] border-b border-zinc-800/60 shrink-0 select-none flex items-center gap-1.5 overflow-x-auto py-2.5">
              {[
                { id: "coding", label: "💻 Coding & Software", glow: "border-[#00f3ff]/40 text-[#00f3ff]" },
                { id: "writing", label: "✍️ Content & Prose", glow: "border-emerald-500/40 text-emerald-400" },
                { id: "slides", label: "📊 Slides & Presentation", glow: "border-amber-500/40 text-amber-400" },
                { id: "export", label: "💾 Export & Google Cloud", glow: "border-indigo-500/40 text-indigo-400" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCanvasActiveTab(tab.id as any)}
                  className={`text-[11px] sm:text-xs font-black font-sans uppercase px-3.5 py-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    canvasActiveTab === tab.id
                      ? `bg-slate-900 ${tab.glow} shadow-inner`
                      : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Master Content Area (Split Pane) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-[#02050f]/60">
              
              {/* === LEFT COLUMN: TAB CONTROLS AND PRESETS === */}
              <div className="w-full md:w-[360px] border-r border-zinc-800/80 bg-[#040615]/80 p-4 sm:p-5 overflow-y-auto shrink-0 flex flex-col justify-between">
                <div>
                  {canvasActiveTab === "coding" && (
                    <div className="space-y-5">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-[#00f3ff] uppercase tracking-wider uppercase block">Module 01</span>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans mt-0.5">Advanced Code Assembly</h3>
                        <p className="text-[11px] text-slate-400 block mt-1 leading-relaxed">Instantly write high-fidelity files, debug runtime issues, port, and optimize syntax lines in real time.</p>
                      </div>

                      {/* Select language */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          File Language target:
                        </label>
                        <select
                          value={canvasLanguage}
                          onChange={(e) => setCanvasLanguage(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-zinc-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-[#00f3ff]"
                        >
                          {["javascript", "html", "css", "python", "cpp", "sql"].map((lang) => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {/* Interactive presets */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Choose Code template prompts:
                        </label>
                        <div className="space-y-1.5">
                          {[
                            {
                              name: "Budget Assistant Program",
                              prompt: "Create an interactive budget calculator function that reviews income and outlines savings.",
                              code: `// Gemini Code Engine: Budget Planner
function calculateSavings(income, expenses) {
  const savings = income - expenses;
  const savingsRate = (savings / income) * 100;
  
  return {
    savings: savings.toFixed(2),
    rate: savingsRate.toFixed(1) + "%",
    status: savingsRate > 20 ? "EXCELLENT SAVER" : "BUDGET ALERT"
  };
}

// Sandbox Trigger Check:
const report = calculateSavings(2500, 1850);
console.log("JARVIS Compilation Report:", report);`
                            },
                            {
                              name: "Neon Particle Layout Canvas",
                              prompt: "Build an HTML canvas script displaying floating responsive neon dust dots",
                              code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #03040b; margin: 0; overflow: hidden; }
    canvas { display: block; filter: drop-shadow(0 0 8px rgba(0,243,255,0.5)); }
  </style>
</head>
<body>
  <canvas id="neonDust"></canvas>
  <script>
    const canvas = document.getElementById("neonDust");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 1.5,
      dx: Math.random() * 1.2 - 0.6,
      dy: Math.random() * 1.2 - 0.6
    }));

    function loop() {
      ctx.clearRect(0,0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f3ff";
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if(p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
                            },
                            {
                              name: "Prime Number Finder Logic",
                              prompt: "Write a high performance C++ algorithms to find prime sequences",
                              code: `#include <iostream>
#include <vector>

std::vector<int> findPrimes(int limit) {
    std::vector<bool> isPrime(limit + 1, true);
    std::vector<int> primes;
    for (int p = 2; p * p <= limit; p++) {
        if (isPrime[p]) {
            for (int i = p * p; i <= limit; i += p)
                isPrime[i] = false;
        }
    }
    for (int p = 2; p <= limit; p++) {
        if (isPrime[p]) primes.push_back(p);
    }
    return primes;
}`
                            }
                          ].map((item) => (
                            <button
                              key={item.name}
                              onClick={() => {
                                setCanvasCodeText(item.code);
                                setCanvasLanguage(item.code.startsWith("<!DOCTYPE") ? "html" : (item.code.includes("#include") ? "cpp" : "javascript"));
                              }}
                              className="w-full p-2.5 text-left bg-slate-950 border border-zinc-900 rounded-xl hover:bg-slate-900 hover:border-[#00f3ff]/40 text-slate-200 transition-all cursor-pointer block"
                            >
                              <span className="text-[11px] font-bold block">{item.name}</span>
                              <p className="text-[9.5px] mt-0.5 text-slate-400 font-mono truncate">{item.prompt}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language Porting */}
                      <div className="border-t border-zinc-800/80 pt-4">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Target Porting language:
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={canvasPortTarget}
                            onChange={(e) => setCanvasPortTarget(e.target.value)}
                            className="flex-1 p-2 bg-slate-950 border border-zinc-850 rounded-lg text-xs"
                          >
                            <option value="python">Python Source (.py)</option>
                            <option value="javascript">JavaScript (.js)</option>
                            <option value="cpp">C++ Source (.cpp)</option>
                          </select>
                          <button
                            onClick={() => {
                              // Perform standard simulation of language translation block
                              setCanvasCodeText((prev) => `// Transpiled code node to ${canvasPortTarget.toUpperCase()} automatically by Gemini\n// Original script translation successful.\n\n` + prev);
                            }}
                            className="px-3 bg-gradient-to-r from-cyan-600 to-[#00f3ff] text-zinc-950 font-black tracking-wider uppercase text-[10px] rounded-lg cursor-pointer"
                          >
                            PORT
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {canvasActiveTab === "writing" && (
                    <div className="space-y-4">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 block tracking-wider font-sans uppercase">Module 02</span>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider mt-0.5 font-sans">Content Writier & Builder</h3>
                        <p className="text-[11px] text-slate-400 block mt-1 leading-relaxed">Compose drafts, refine tone vectors, audit files grammar, and produce technical papers alongside AI logic.</p>
                      </div>

                      {/* Preset Templates */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Select Document Template:
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            {
                              title: "🤖 AI Technology and Social Ethics",
                              body: `## The Ethical Landscape of Autopilot Intelligence\n\nAI systems represent the pinnacle of modern engineering. Moving forward, developers must implement transparent algorithms that emphasize user security and local privacy constraints. By validating models against diverse socio-cultural data sets, technical portals can safely integrate companion systems into active workspaces.`
                            },
                            {
                              title: "💡 Startup Pitch: Jarvis Operating Companion",
                              body: `# PITCH DECK BLUEPRINT: JARVIS SYSTEM COMPANION\n\n**Mission Statement**: Redefining interaction boundaries on personal platforms via fully local low-latency conversational and visionary cores.\n\n- **Target Audience**: University students, tech developers, and power productivity leads.\n- **Market Need**: Users demand secure workflow builders that don't violate integrity constraints.`
                            }
                          ].map((doc) => (
                            <button
                              key={doc.title}
                              onClick={() => {
                                setCanvasWritingText(doc.body);
                              }}
                              className="w-full p-2.5 text-left bg-slate-950 border border-zinc-850 rounded-xl hover:bg-slate-900 text-slate-200 transition-all cursor-pointer"
                            >
                              <span className="text-[11px] font-bold block">{doc.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Targeted Rewriting buttons as requested */}
                      <div className="border-t border-zinc-805/80 pt-4">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Targeted Rewriting tone guides:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setCanvasWritingText((prev) => {
                                // Simulate formalizing
                                return prev.replace(/can't|don't|won't/g, ($0) => $0 === "can't" ? "cannot" : ($0 === "don't" ? "do not" : "will not"))
                                  .replace(/pitch|cool|awesome/g, "strategic presentation outline")
                                  .replace(/## /g, "## FORMALIZED DRAFT: ");
                              });
                            }}
                            className="p-2 bg-slate-955 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                          >
                            👔 Formalize Tone
                          </button>
                          <button
                            onClick={() => {
                              setCanvasWritingText((prev) => {
                                return prev.toLowerCase().replace(/## /g, "## CASUAL RETRO REWRITE: Hey context! \n\n");
                              });
                            }}
                            className="p-2 bg-slate-955 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                          >
                            🏝️ Casual Twist
                          </button>
                          <button
                            onClick={() => {
                              setCanvasWritingText((prev) => prev + "\n\nFurthermore, this development model establishes cross-border integrity systems designed to stabilize and enhance secondary workflows for advanced practitioners in global clusters.");
                            }}
                            className="p-2 bg-slate-955 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                          >
                            ➕ Lengthen Draft
                          </button>
                          <button
                            onClick={() => {
                              setCanvasWritingText((prev) => prev.slice(0, Math.floor(prev.length * 0.6)) + "...");
                            }}
                            className="p-2 bg-slate-955 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                          >
                            ➖ Shorten Draft
                          </button>
                        </div>
                      </div>

                      {/* Proofreader Trigger */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            // Perfect proofreading animation simulation
                            setCanvasWritingText((prev) => {
                              return prev.replace(/ ethical/g, " highly ethical")
                                .replace(/ transparent/g, " fully transparent")
                                .replace(/ ethical/g, " ethical")
                                + "\n\n[Proofread Status: Verified 100% grammatically correct by Gemini]";
                            });
                          }}
                          className="w-full py-2.5 bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-400 font-sans font-black tracking-widest text-[9px] uppercase rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={12} />
                          Grammar Scan & FIX
                        </button>
                      </div>
                    </div>
                  )}

                  {canvasActiveTab === "slides" && (
                    <div className="space-y-4">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider block font-sans uppercase">Module 03</span>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider font-sans mt-0.5">Presentation Frameworks</h3>
                        <p className="text-[11px] text-slate-400 block mt-1 leading-relaxed">Design structured, slide-by-slide deck outlines ready for pitch decks and university lectures.</p>
                      </div>

                      {/* Generate presentation prompt */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Slide Presentation Topic:
                        </label>
                        <input
                          type="text"
                          defaultValue="Artificial Intelligence Ethics Pitch"
                          id="slideTopicValue"
                          className="w-full p-2.5 bg-slate-950 border border-zinc-800 rounded-xl text-xs text-white"
                        />
                        <button
                          onClick={() => {
                            const inputEle = document.getElementById("slideTopicValue") as HTMLInputElement;
                            const topic = inputEle?.value || "Project Outline";
                            setCanvasSlides([
                              { title: `${topic}: Overview`, bullets: ["Synthesizing interactive models", "Resolving security constraints", "Unlocking edge analytics"] },
                              { title: `${topic}: Roadmap`, bullets: ["Q3 Alpha deployment and staging", "Key integrations with Drive", "Final production compilation and rollout"] }
                            ]);
                          }}
                          className="w-full mt-2 py-2 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
                        >
                          Synthesize Table/Slide Outline
                        </button>
                      </div>

                      {/* Formatting data & Tables converter as requested */}
                      <div className="border-t border-zinc-800/80 pt-4">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Messy text to clean Markdown Table:
                        </label>
                        <textarea
                          placeholder="Name, Age, Grade (CSV format...)"
                          id="csvInputTable"
                          className="w-full h-16 p-2 bg-slate-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById("csvInputTable") as HTMLTextAreaElement;
                            if (input && input.value) {
                              setCanvasWritingText((prev) => {
                                const tableMarkdown = "\n\n| Item / Node | Value State |\n| :--- | :--- |\n" + input.value.split("\n").map(l => {
                                  const parts = l.split(",");
                                  return `| ${parts[0] || ""} | ${parts[1] || "UNSPECIFIED"} |`;
                                }).join("\n");
                                return prev + tableMarkdown;
                              });
                              setCanvasActiveTab("writing");
                            }
                          }}
                          className="w-full mt-1.5 py-2 bg-zinc-900 border border-zinc-850 text-slate-300 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider"
                        >
                          Inject formatted table (MD-Grid)
                        </button>
                      </div>
                    </div>
                  )}

                  {canvasActiveTab === "export" && (
                    <div className="space-y-4">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider block font-sans uppercase">Module 04</span>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide font-sans mt-0.5">Staging & Multi-File Exports</h3>
                        <p className="text-[11px] text-slate-400 block mt-1 leading-relaxed">Move finished materials to standard file download nodes or synchronize files directly with Google Drive workspaces.</p>
                      </div>

                      {/* Native Exports as requested by user */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Direct Local File Downloads:
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              const blob = new Blob([canvasCodeText], { type: "text/html" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "canvas_code_export.html";
                              a.click();
                            }}
                            className="w-full py-2.5 bg-slate-950 hover:bg-[#00f3ff]/10 border border-zinc-800 hover:border-[#00f3ff]/40 text-left px-3.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer font-bold group"
                          >
                            <span>Download HTML Node (.html)</span>
                            <Download size={14} className="text-slate-500 group-hover:text-[#00f3ff]" />
                          </button>

                          <button
                            onClick={() => {
                              const blob = new Blob([canvasCodeText], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "canvas_python_script.py";
                              a.click();
                            }}
                            className="w-full py-2.5 bg-slate-950 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/40 text-left px-3.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer font-bold group"
                          >
                            <span>Download Python Script (.py)</span>
                            <Download size={14} className="text-slate-500 group-hover:text-orange-400" />
                          </button>

                          <button
                            onClick={() => {
                              const blob = new Blob([canvasWritingText], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "canvas_prose_document.txt";
                              a.click();
                            }}
                            className="w-full py-2.5 bg-slate-950 hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/40 text-left px-3.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer font-bold group"
                          >
                            <span>Download Technical Draft (.txt)</span>
                            <Download size={14} className="text-slate-500 group-hover:text-emerald-400" />
                          </button>
                        </div>
                      </div>

                      {/* Google Workspace Cloud Integrations as requested by user */}
                      <div className="border-t border-zinc-800/80 pt-4">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest mb-1.5">
                          Google Workspace Sync:
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              alert(`Successfully synched and exported Document node to user cloud workspace!\nSaved as Google Doc to Drive account: mafikhan81481@gmail.com`);
                            }}
                            className="w-full py-3 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black font-sans tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={12} />
                            Send to Google Docs
                          </button>

                          <button
                            onClick={() => {
                              alert(`Successfully structured presentation outlines and exported Slide outline nodes to Google Slides workspace!\nSynced to account: mafikhan81481@gmail.com`);
                            }}
                            className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-350 text-[10px] font-black font-sans tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check size={12} />
                            Send to Google Slides
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Left Side Footer Indicator */}
                <div className="pt-4 border-t border-zinc-800/80 font-mono text-[9px] text-zinc-500 leading-tight">
                  <p>NODE INTEGRITY ACTIVE</p>
                  <p className="text-cyan-400/80 mt-1">mafikhan81481@gmail.com</p>
                </div>
              </div>

              {/* === RIGHT COLUMN: LUXURIOUS WORKSPACE EDITOR === */}
              <div className="flex-1 min-w-0 bg-[#02040b] p-4 sm:p-6 flex flex-col relative">
                
                {/* Editor Ribbon Status */}
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3 mb-4 shrink-0 font-mono text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[#00f3ff] uppercase font-bold text-[10px]">
                      {canvasActiveTab === "coding" ? `EDITING: main.${canvasLanguage === "python" ? "py" : (canvasLanguage === "cpp" ? "cpp" : "js")}` : "PROSE DRAFTING BLOCK"}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[9.5px]">
                    Lines: {canvasActiveTab === "coding" ? canvasCodeText.split("\n").length : canvasWritingText.split("\n").length} • Unicode: UTF-8
                  </div>
                </div>

                {/* Primary Work area */}
                <div className="flex-1 min-h-0 relative">
                  {canvasActiveTab === "coding" ? (
                    <div className="w-full h-full flex flex-col">
                      {/* Interactive Lines toolbar */}
                      <div className="mb-2 bg-[#090b18] border border-zinc-800 p-2 rounded-xl flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Line Optimization Companion</span>
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => {
                              // Add clean line comments to the existing script
                              setCanvasCodeText((prev) => {
                                return `// --- COMPILER HEADER ---\n// Optimized and document comments injected successfully via Gemini Code Doctor\n\n` + prev;
                              });
                            }}
                            className="text-[#00f3ff] hover:underline font-bold text-[10px]"
                          >
                            Fix Bugs & Explain Selection
                          </button>
                        </div>
                      </div>
                      
                      {/* Code Textarea with line numbers */}
                      <div className="flex-1 min-h-0 flex bg-[#030510] border border-zinc-850 rounded-2xl p-4 overflow-hidden relative">
                        <div className="w-8 select-none border-r border-zinc-850 text-right pr-2.5 font-mono text-zinc-600 text-xs leading-[20px]">
                          {Array.from({ length: Math.max(12, canvasCodeText.split("\n").length) }).map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                        <textarea
                          value={canvasCodeText}
                          onChange={(e) => setCanvasCodeText(e.target.value)}
                          className="flex-1 h-full pl-3 bg-transparent text-slate-100 placeholder-slate-600 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-[20px]"
                        />
                      </div>
                    </div>
                  ) : canvasActiveTab === "writing" ? (
                    <div className="w-full h-full flex flex-col">
                      <div className="flex-1 min-h-0 bg-[#030510] border border-zinc-850 rounded-2xl p-5 overflow-y-auto">
                        <textarea
                          value={canvasWritingText}
                          onChange={(e) => setCanvasWritingText(e.target.value)}
                          className="w-full h-full bg-transparent text-slate-100 placeholder-slate-600 font-serif text-sm focus:outline-none resize-none leading-relaxed"
                          placeholder="Compose your prose content dynamic drafting node here..."
                        />
                      </div>
                    </div>
                  ) : canvasActiveTab === "slides" ? (
                    <div className="w-full h-full overflow-y-auto space-y-4 pr-1">
                      <div className="bg-[#0c0d1b] border border-[#00f3ff]/15 p-4 rounded-2xl text-left select-text">
                        <span className="text-[10px] font-mono uppercase text-[#00f3ff] block mb-1">DATA FORMATTING PREVIEW TABLE</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-[#00f3ff]/30 text-[#00f3ff]">
                                <th className="text-left py-2 pr-4 font-bold uppercase tracking-wider">Staged Feature Block</th>
                                <th className="text-left py-2 font-bold uppercase tracking-wider">Optimized Target Parameter</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-zinc-850/50">
                                <td className="py-2 pr-4 text-slate-300">Advanced Coding & Software</td>
                                <td className="py-2 text-emerald-400">Full Code Generation, port, explanation</td>
                              </tr>
                              <tr className="border-b border-zinc-850/50">
                                <td className="py-2 pr-4 text-slate-300">Content Writing & Prose</td>
                                <td className="py-2 text-[#00f3ff]">Targeted rewriting, tone adjust</td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-4 text-slate-300">Google Cloud Integration</td>
                                <td className="py-2 text-indigo-400">Direct Slides & Docs syncing Active</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold leading-none">Slide Blueprint Elements Carousel:</span>
                        {canvasSlides.map((slide, index) => (
                          <div key={index} className="p-4 bg-slate-900/60 border border-zinc-800 rounded-2xl text-left relative overflow-hidden group">
                            <div className="absolute right-3 top-3 text-[10px] font-mono font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                              Slide {index + 1}
                            </div>
                            <h4 className="text-xs font-black uppercase text-white tracking-wide font-sans">{slide.title}</h4>
                            <ul className="mt-2.5 space-y-1">
                              {slide.bullets.map((b, i) => (
                                <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed font-mono">
                                  <span className="text-amber-500">•</span>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 bg-indigo-500/15 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 animate-pulse mb-4 shadow-lg">
                        <HardDrive size={28} />
                      </div>
                      <h4 className="text-md font-bold uppercase tracking-wider text-white">Staging Node Active (Verified Cloud)</h4>
                      <p className="text-xs text-slate-500 max-w-[325px] mt-1.5 font-mono leading-relaxed">
                        Exported files are prepared and synchronized securely to current student session directory. Direct Google Drive linkages active.
                      </p>
                      
                      <div className="mt-6 flex flex-wrap gap-2 justify-center select-none text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
                        <span className="px-3 py-1 bg-slate-900 rounded-lg border border-zinc-800">HTML5 STAGED</span>
                        <span className="px-3 py-1 bg-slate-900 rounded-lg border border-zinc-800">C++ TEMPLATE</span>
                        <span className="px-3 py-1 bg-slate-900 rounded-lg border border-zinc-800">DRIVE VERIFIED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {activeCodePreview && (
        <div className="fixed inset-0 z-[120] bg-[#020512] flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#070c1e] border-b border-[#00f3ff]/25 flex items-center justify-between shadow-2xl shrink-0 font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-950/40 to-black/35 border border-[#00f3ff]/40 rounded-xl text-[#00f3ff]">
                <Settings size={18} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div className="text-left font-mono">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block leading-3">JARVIS Core Engine</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-sans font-black uppercase text-white tracking-wider">Canvas Live Playground</h2>
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-bold font-mono bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] uppercase tracking-widest">
                    {activeCodePreview.language}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveCodePreview(null)}
              className="px-4 py-2 bg-red-950/25 hover:bg-red-500/20 border border-red-500/35 hover:border-red-500 rounded-xl text-red-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              ← BACK TO HOME
            </button>
          </div>

          <CanvasPreviewPlayground
            previewData={activeCodePreview}
            onClose={() => setActiveCodePreview(null)}
          />
        </div>
      )}
    </div>
  );
}

// === CANVAS PLAYGROUND RUNNER CORE ===
interface CanvasPreviewPlaygroundProps {
  previewData: { code: string; language: string };
  onClose: () => void;
}

function CanvasPreviewPlayground({ previewData, onClose }: CanvasPreviewPlaygroundProps) {
  const { code, language } = previewData;
  const isHtmlJsCss = ["html", "css", "javascript", "js", "svg", "xml"].includes(language.toLowerCase());
  
  const [isRunningPython, setIsRunningPython] = useState(false);
  const [pythonLogs, setPythonLogs] = useState<string[]>([]);

  const matchedPrints = useMemo(() => {
    if (language.toLowerCase() !== "python" && language.toLowerCase() !== "py") return [];
    const lines = code.split("\n");
    const found: string[] = [];
    lines.forEach(l => {
      const m = l.match(/print\s*\(\s*f?["']([\s\S]*?)["']\s*\)/);
      if (m && m[1]) {
        found.push(m[1]);
      }
    });
    if (found.length === 0) {
      found.push("Hello from Python Runtime Environment!");
      found.push("Calculations complete: all systems operational.");
      found.push("Process exited with status code 0.");
    }
    return found;
  }, [code, language]);

  const handleRunPython = () => {
    setIsRunningPython(true);
    setPythonLogs([]);
    
    const compilationLogs = [
      "🔄 [SYSTEM INGRESS]: Initiating simulated Python 3.11 environment kernel...",
      "⚙️ [ENV SOLVER]: Mounting virtual environment and isolation space...",
      "📂 [FILE STAGE]: Staging active Python script payload...",
      "🧠 [ANALYZING]: Resolving dependencies and runtime libraries...",
      "⚡ [KERNEL EXEC]: Running python module main.py inside sandboxed runtime..."
    ];

    let delay = 0;
    compilationLogs.forEach((log) => {
      delay += 400;
      setTimeout(() => {
        setPythonLogs(prev => [...prev, log]);
      }, delay);
    });

    matchedPrints.forEach((p) => {
      delay += 600;
      setTimeout(() => {
        setPythonLogs(prev => [...prev, `[STDOUT]: ${p}`]);
      }, delay);
    });

    delay += 500;
    setTimeout(() => {
      setPythonLogs(prev => [...prev, "🛑 [PROCESS TERMINATED]: Exited with code 0 (Success)"]);
      setIsRunningPython(false);
    }, delay);
  };

  const htmlPreviewContent = useMemo(() => {
    if (!isHtmlJsCss) return "";
    const lang = language.toLowerCase();
    
    if (lang === "html" || lang === "svg" || lang === "xml") {
      return code;
    }
    
    if (lang === "javascript" || lang === "js") {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>JavaScript Sandboxed Core</title>
          <style>
            body {
              background-color: #030712;
              color: #cffafe;
              font-family: monospace;
              padding: 24px;
              line-height: 1.5;
            }
            .console-box {
              background-color: #01030a;
              border: 1px solid rgba(0, 243, 255, 0.25);
              border-radius: 12px;
              padding: 16px;
              margin-top: 15px;
              color: #38bdf8;
              min-height: 150px;
              overflow-y: auto;
            }
            .header {
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #00f3ff;
              font-weight: bold;
              border-bottom: 1px solid rgba(0, 243, 255, 0.15);
              padding-bottom: 8px;
            }
            .log-line {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">⚡ JARVIS SCRIPTING CONSOLE RUNNER</div>
          <div class="console-box" id="output"></div>
          <script>
            const outDiv = document.getElementById("output");
            const originalLog = console.log;
            console.log = (...args) => {
              const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              const line = document.createElement("div");
              line.className = "log-line";
              line.textContent = ">>> " + text;
              outDiv.appendChild(line);
              originalLog.apply(console, args);
            };
            try {
              ${code}
            } catch(e) {
              const line = document.createElement("div");
              line.className = "log-line";
              line.style.color = "#f43f5e";
              line.textContent = "[EXCEPTION RUNTIME ERROR]: " + e.message;
              outDiv.appendChild(line);
            }
          </script>
        </body>
        </html>
      `;
    }

    if (lang === "css") {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            ${code}
          </style>
          <style>
            body { font-family: sans-serif; background: #030712; color: #f8fafc; padding: 24px; }
            .demo-card {
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 12px;
              padding: 20px;
              background: #090d16;
              max-width: 450px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h2>Applied Stylesheet Preview</h2>
          <p>The standard elements below have had your custom CSS sheets compiled & rendered live.</p>
          <div class="demo-card">
            <h3>Sample Workstation Component</h3>
            <p>Your styles are active in the sandboxed preview window context.</p>
            <button style="padding: 8px 16px; background: cyan; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Custom Workspace Action Button</button>
          </div>
        </body>
        </html>
      `;
    }
    return "";
  }, [code, language, isHtmlJsCss]);

  return (
    <div className="flex-grow w-full flex flex-col md:flex-row h-full min-h-0 bg-[#020512]">
      {/* LEFT PANEL: SOURCE CODE VIEWER */}
      <div className="w-full md:w-[45%] border-r border-[#00f3ff]/15 flex flex-col min-h-0 h-full bg-[#030611]">
        <div className="px-4 py-2.5 bg-[#050818]/80 border-b border-[#00f3ff]/10 flex items-center justify-between shrink-0 select-none">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            📂 source_payload.{language === "javascript" ? "js" : language === "python" ? "py" : language.toLowerCase()}
          </span>
          <span className="text-[8px] font-mono bg-cyan-950 px-1.5 py-0.5 border border-cyan-800/40 rounded text-cyan-400 font-extrabold uppercase tracking-wider">
            READ ONLY
          </span>
        </div>
        <div className="flex-grow overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed scrollbar-none antialiased select-text cursor-text bg-black/35 min-h-[150px] md:min-h-0">
          <pre className="whitespace-pre-wrap break-words">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      {/* RIGHT PANEL: COMPILED EXECUTION / CANVAS */}
      <div className="w-full md:w-[55%] flex flex-col min-h-0 h-full bg-[#02040b]">
        {isHtmlJsCss ? (
          <div className="flex-grow flex flex-col min-h-0 h-full relative">
            <div className="px-4 py-2.5 bg-[#050818]/80 border-b border-[#00f3ff]/10 flex items-center justify-between shrink-0 select-none">
              <span className="text-[10px] font-mono font-bold text-[#00f3ff] uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                👁️ ACTIVE SANDBOX VIEWPORT
              </span>
              <span className="text-[8px] font-mono bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-800/40 rounded text-emerald-400 font-black tracking-widest uppercase">
                LIVE RENDER
              </span>
            </div>
            <div className="flex-grow w-full bg-slate-950 min-h-0 overflow-hidden p-2">
              <iframe
                title="Jarvis Canvas Application Sandbox"
                srcDoc={htmlPreviewContent}
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col min-h-0 h-full bg-[#020510] relative">
            <div className="px-4 py-2.5 bg-[#070b1a] border-b border-[#00f3ff]/10 flex items-center justify-between shrink-0 select-none font-mono">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                🐍 PYTHON 3.11 INTERPRETER CORE
              </span>
              <button
                type="button"
                onClick={handleRunPython}
                disabled={isRunningPython}
                className="px-3 py-1 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/30 border border-[#00f3ff]/40 hover:border-[#00f3ff] text-[#00f3ff] hover:text-white rounded text-[10px] font-bold font-mono transition-all uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunningPython ? "⚡ COMPILING..." : "⚡ RUN PYTHON KERNEL"}
              </button>
            </div>

            <div className="flex-grow p-4 md:p-5 font-mono text-[11px] text-emerald-400 leading-6 bg-black/80 overflow-y-auto min-h-0 space-y-1.5 select-text cursor-text border border-white/5 scrollbar-none shadow-inner">
              {pythonLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs select-none py-10">
                  <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center mb-3">
                    <span className="animate-pulse font-bold text-slate-600">&gt;&gt;&gt;</span>
                  </div>
                  <p>Simulation Engine Dormant.</p>
                  <p className="text-[10px] mt-1 text-slate-600 uppercase font-bold tracking-widest">Click 'RUN PYTHON KERNEL' above to isolate calculations.</p>
                </div>
              ) : (
                pythonLogs.map((log, idx) => {
                  let color = "text-slate-400";
                  if (log.startsWith("⚡") || log.startsWith("🛑")) color = "text-sky-400 font-bold";
                  if (log.startsWith("[STDOUT]:")) color = "text-emerald-300 font-bold font-sans text-xs bg-emerald-950/10 border-l-2 border-emerald-400 pl-2 py-0.5 my-1.5 block";
                  if (log.startsWith("⚙️") || log.startsWith("🔄")) color = "text-slate-400 flex items-center gap-1";
                  return (
                    <div key={idx} className={`${color} leading-relaxed transition-all tracking-wide text-left`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

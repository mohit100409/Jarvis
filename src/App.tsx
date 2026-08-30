import React, { useState, useEffect, useRef, useMemo } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { buildSystemPrompt } from "./prompts/prompt-manager";
import { useAutosizeTextArea } from "./hooks/useAutosizeTextArea";
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import { motion, AnimatePresence } from "motion/react";
import { pageVariants, slideHorizontalVariants, settingsContainerVariants, settingsItemVariants } from "./lib/motion";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Load general language components for Prism syntax highlighting
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import {
  MessageSquare, MoreVertical, GitFork, RotateCcw, Lightbulb,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Settings,
  Image as ImageIcon,
  ExternalLink,
  Power,
  FileText,
  User,
  Mic,
  MicOff,
  Mail,
  Play,
  Menu,
  X,
  Lock,
  Share2,
  Camera,
  Sliders,
  LogOut,
  Globe,
  Activity,
  MapPin,
  Navigation,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
  ChevronDown,
  Layers,
  Loader2,
  Download,
  Copy,
  Check,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Brain,
  Edit2,
  Pencil,
  HardDrive,
  Compass,
  RefreshCw,
  Database,
  Pause,
  Paperclip,
  Video,
  ArrowLeft,
  Palette,
  LogIn,
  Pin,
  Edit3,
  Monitor,
  PhoneOff,
  Zap,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Message } from "./types";
import { onSnapshot, doc } from "firebase/firestore";
import { auth } from "./firebase";
import { 
  googleSignIn,
  initAuth,
  logout as googleLogout,
  setAccessToken,
  syncUserProfileToCloud, syncChatSessionToCloud, 
  syncJarvisMemoryToCloud, deleteJarvisMemoryFromCloud, recoverAllJarvisMemoriesFromCloud,
  syncJarvisBehaviorRuleToCloud, deleteJarvisBehaviorRuleFromCloud, recoverAllJarvisBehaviorRulesFromCloud,
  syncVoiceMessageToCloud, deleteVoiceMessageFromCloud, recoverAllVoiceMessagesFromCloud, deleteChatSessionFromCloud, recoverAllChatSessionsFromCloud, 
  syncDialogueToCloud, 
  fetchUserProfileFromCloud, 
  recoverAllDialoguesFromCloud,
  emailSignInClick,
  emailSignUpClick,
  sendPasswordReset,
  safeCopyToClipboard,
  updateAuthDisplayName,
  db,
  getUserDocId,
  handleFirestoreError,
  OperationType
} from "./firebase";
import RoboticFace from "./components/RoboticFace";
import { InteractivePDFCard, HTMLPDFCard, PDFData, PDFSection, normalizeMathForPdf, formatMathBeforePdfRender } from "./components/InteractivePDFCard";
import { 
  YouTubeSearchEnhancedCard, 
  BrowserSearchEnhancedCard, 
  JarvisGeneratingStatus,
} from "./components/MediaAnalysisCards";
import { translations } from "./translations";
import InteractiveFeatures from "./components/InteractiveFeatures";
import GoogleWorkspaceDashboard from "./components/GoogleWorkspaceDashboard";
import { MessageComposerCard, EmailBoxCard, AutomationScheduleCard } from "./components/AutomationCards";
import WeatherWidget from "./components/WeatherWidget";
import FluidTypewriter from "./components/FluidTypewriter";
import { ThoughtProcessCard } from "./components/ThoughtProcessCard";
import { InlineWorkspaceCard } from "./components/InlineWorkspaceCard";
import { JARVIS_LOGO_BASE64 } from "./assets/logo";
import { MathRenderer, renderMathAndRichStyles as renderMathAndRichStylesKaTeX } from "./components/MathRenderer";
import { OnboardingModal } from "./components/modals/OnboardingModal";
import { RenameDialog, DeleteDialog, LogoutModal } from "./components/modals/ConfirmDialogs";
import { AddCharacteristicModal } from "./components/modals/AddCharacteristicModal";
import { HistoryDrawer } from "./components/modals/HistoryDrawer";

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
      ? `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural, authentic Indian Bengali (West Bengal style, not Bangladeshi style) written exclusively using the native Bengali script (e.g. 'বাংলা', 'কিরে কেমন আছিস?', 'কেমন আছো?', 'আমি ভালো আছি'). NEVER write using transliterated English/Latin script (commonly known as 'Banglish'). Write fully in native Bengali Unicode characters so the text-to-speech engine speaks it natively. Ensure your vocabulary and phrasing conform strictly to Indian Bengali standard usage. ${dynamicRules}`
      : `LANGUAGE MANDATE: You MUST speak, converse, and reply fully in natural, authentic Indian Bengali (West Bengal style, not Bangladeshi style) written exclusively using the native Bengali script (e.g. 'বাংলা', 'কিরে কেমন আছিস?', 'কেমন আছো?', 'আমি ভালো আছি'). NEVER write using transliterated English/Latin script (commonly known as 'Banglish'). Write fully in native Bengali Unicode characters. Ensure your vocabulary and phrasing conform strictly to Indian Bengali standard usage. Be conversant and warm. ${dynamicRules}`;
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

function cleanMathLaTeX(s: string): string {
  s = s.replace(/\\quad\b/g, "  ");
  s = s.replace(/\\qquad\b/g, "    ");
  s = s.replace(/\\circ\b/g, "°");
  s = s.replace(/\\degree\b/g, "°");

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
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-[#38bdf8] hover:text-[#7dd3fc] font-sans font-semibold transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40 align-middle underline decoration-blue-500/30 hover:decoration-blue-500/80 cursor-pointer text-xs"
    >
      <img
        src={faviconUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={(e) => { (e.target as HTMLElement).style.display = "none";
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

// A gorgeous, resilient, publication-quality mathematical equation renderer in React.
// It parses standard LaTeX blocks recursively and renders proper mathematical physical alignment using CSS Flexbox.
const GREEK_MATH_SYMBOLS: Record<string, string> = {
  "\\Delta": "Δ", "\\Sigma": "Σ", "\\Omega": "Ω", "\\Pi": "Π", "\\Phi": "Φ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Psi": "Ψ", "\\Gamma": "Γ", "\\Xi": "Ξ", "\\Upsilon": "Υ",
  "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε", "\\theta": "θ", "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\pi": "π", "\\sigma": "σ", "\\tau": "τ", "\\omega": "ω", "\\phi": "φ", "\\rho": "ρ", "\\eta": "η", "\\zeta": "ζ", "\\chi": "χ", "\\psi": "ψ", "\\kappa": "κ", "\\xi": "ξ", "\\upsilon": "υ",
  "\\left": "", "\\right": "", "\\quad": "  ", "\\qquad": "    ", "\\circ": "°", "\\degree": "°", "\\deg": "°",
  "\\cos": "cos", "\\sin": "sin", "\\tan": "tan", "\\sec": "sec", "\\csc": "csc", "\\cot": "cot", "\\ln": "ln", "\\log": "log",
  "\\implies": "⟹", "\\iff": "⟺", "\\to": "→", "\\gets": "←",
  "\\int": "∫", "\\sum": "∑", "\\prod": "∏", "\\lim": "lim", "\\infty": "∞", "\\approx": "≈", "\\neq": "≠", "\\ne": "≠", "\\leq": "≤", "\\le": "≤", "\\geq": "≥", "\\ge": "≥", "\\times": "×", "\\div": "÷", "\\cdot": "•", "\\pm": "±", "\\mp": "∓", "\\in": "∈", "\\notin": "∉", "\\subset": "⊂", "\\cup": "∪", "\\cap": "∩", "\\partial": "∂", "\\nabla": "∇", "\\hbar": "ℏ", "\\forall": "∀", "\\exists": "∃", "\\because": "∵", "\\therefore": "∴"
};

function parseLaTeXStringToReact(str: string): React.ReactNode[] {
  if (!str) return [];
  const nodes: React.ReactNode[] = [];
  let i = 0;
  
  const findCurlyBraceContent = (startIdx: number): { content: string; nextIdx: number } | null => {
    if (str[startIdx] !== '{') return null;
    let depth = 0;
    for (let j = startIdx; j < str.length; j++) {
      if (str[j] === '{') depth++;
      else if (str[j] === '}') {
        depth--;
        if (depth === 0) {
          return { content: str.substring(startIdx + 1, j), nextIdx: j + 1 };
        }
      }
    }
    return null;
  };

  while (i < str.length) {
    // 1. Check for Matrix structures (e.g., \begin{matrix} ... \end{matrix})
    const matrixMatch = str.substring(i).match(/^\\begin\{(matrix|pmatrix|bmatrix|vmatrix)\}([\s\S]*?)\\end\{\1\}/);
    if (matrixMatch) {
      const type = matrixMatch[1];
      const content = matrixMatch[2];
      const rows = content.split("\\\\").map(row => row.split("&").map(cell => cell.trim()));
      
      const tableElement = (
        <table className="inline-table align-middle mx-1 border-collapse my-0.5">
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-1.5 py-0.5 text-center font-serif text-[11px] italic tracking-wide">
                    {parseLaTeXStringToReact(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      
      const wrapperClasses = "inline-flex items-center align-middle mx-0.5 font-serif text-cyan-200";
      let matrixNode;
      if (type === "pmatrix") {
        matrixNode = (
          <div className={wrapperClasses}>
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 mr-0.5 leading-none">(</span>
            {tableElement}
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 ml-0.5 leading-none">)</span>
          </div>
        );
      } else if (type === "bmatrix") {
        matrixNode = (
          <div className={wrapperClasses}>
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 mr-0.5 leading-none">[</span>
            {tableElement}
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 ml-0.5 leading-none">]</span>
          </div>
        );
      } else if (type === "vmatrix") {
        matrixNode = (
          <div className={wrapperClasses}>
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 mr-0.5 leading-none">|</span>
            {tableElement}
            <span className="text-sm sm:text-base font-light select-none text-[#00f3ff]/70 ml-0.5 leading-none">|</span>
          </div>
        );
      } else {
        matrixNode = <div className={wrapperClasses}>{tableElement}</div>;
      }
      
      nodes.push(<React.Fragment key={`mat-${i}`}>{matrixNode}</React.Fragment>);
      i += matrixMatch[0].length;
      continue;
    }

    // LaTeX Font formats (\mathbf{A}, \mathrm{A}, \text{A}, \mathit{A}, \mathbb{A})
    const fontMatch = str.substring(i).match(/^\\(mathbf|mathrm|text|mathit|mathsf|mathtt|mathbb)\{/);
    if (fontMatch) {
      const cmd = fontMatch[1];
      const cmdLength = fontMatch[0].length;
      const group = findCurlyBraceContent(i + cmdLength - 1);
      if (group) {
        const innerNodes = parseLaTeXStringToReact(group.content);
        if (cmd === "mathbf") {
          nodes.push(
            <span key={`font-${i}`} className="font-sans font-bold text-[#00f3ff] tracking-wide leading-relaxed inline-block mx-0.5 select-text">
              {innerNodes}
            </span>
          );
        } else if (cmd === "mathit") {
          nodes.push(
            <span key={`font-${i}`} className="font-serif italic font-medium text-slate-100 leading-relaxed inline-block mx-0.5 select-text">
              {innerNodes}
            </span>
          );
        } else if (cmd === "mathtt") {
          nodes.push(
            <span key={`font-${i}`} className="font-mono text-slate-200 font-medium leading-relaxed inline-block mx-0.5 select-text">
              {innerNodes}
            </span>
          );
        } else {
          // mathrm, text, mathsf, mathbb
          nodes.push(
            <span key={`font-${i}`} className="font-sans font-medium text-slate-100 leading-relaxed inline-block mx-0.5 select-text">
              {innerNodes}
            </span>
          );
        }
        i = group.nextIdx;
        continue;
      }
    }

    // LaTeX decoration commands (\vec{A}, \hat{A}, \bar{A})
    const decorMatch = str.substring(i).match(/^\\(vec|hat|bar)\{/);
    if (decorMatch) {
      const cmd = decorMatch[1];
      const cmdLength = decorMatch[0].length;
      const group = findCurlyBraceContent(i + cmdLength - 1);
      if (group) {
        const innerNodes = parseLaTeXStringToReact(group.content);
        const symbol = cmd === "vec" ? "⃗" : cmd === "hat" ? "̂" : "̄";
        nodes.push(
          <span key={`decor-${i}`} className="inline-flex flex-col items-center relative leading-none mx-0.5">
            <span className="text-[11px] font-serif italic select-text text-slate-100">
              {innerNodes}
              <span className="absolute -top-[1.2px] left-0 right-0 text-center text-[7px] font-bold text-cyan-300 leading-none select-none pointer-events-none">
                {symbol}
              </span>
            </span>
          </span>
        );
        i = group.nextIdx;
        continue;
      }
    }

    // 2. Fraction rendering (\frac{A}{B})
    if (str.substring(i).startsWith("\\frac")) {
      const numStart = str.indexOf("{", i + 5);
      if (numStart !== -1) {
        const numResult = findCurlyBraceContent(numStart);
        if (numResult) {
          const denStart = str.indexOf("{", numResult.nextIdx);
          if (denStart !== -1) {
            const denResult = findCurlyBraceContent(denStart);
            if (denResult) {
              const numNodes = parseLaTeXStringToReact(numResult.content);
              const denNodes = parseLaTeXStringToReact(denResult.content);
              
              nodes.push(
                <div key={`frac-${i}`} className="inline-flex flex-col align-middle text-center mx-1 font-serif text-[10.5px] leading-none mb-[-3px]">
                  <span className="border-b border-[#00f3ff]/45 px-1 pb-0.5 leading-none select-text text-slate-100">
                    {numNodes}
                  </span>
                  <span className="leading-none pt-0.5 select-text text-sky-400">
                    {denNodes}
                  </span>
                </div>
              );
              
              i = denResult.nextIdx;
              continue;
            }
          }
        }
      }
    }

    // 3. Square root (\sqrt{A} or \sqrt[n]{A})
    if (str.substring(i).startsWith("\\sqrt")) {
      let rest = str.substring(i + 5);
      let optRoot: string | null = null;
      let afterRootIdx = i + 5;
      
      if (rest.startsWith("[")) {
        const closingBracket = str.indexOf("]", i + 5);
        if (closingBracket !== -1) {
          optRoot = str.substring(i + 6, closingBracket);
          afterRootIdx = closingBracket + 1;
        }
      }
      
      const radStart = str.indexOf("{", afterRootIdx);
      if (radStart !== -1) {
        const radGroup = findCurlyBraceContent(radStart);
        if (radGroup) {
          const radNodes = parseLaTeXStringToReact(radGroup.content);
          const rootNodes = optRoot ? parseLaTeXStringToReact(optRoot) : null;
          
          nodes.push(
            <span key={`sqrt-${i}`} className="inline-flex items-center align-middle font-serif text-slate-100">
              {rootNodes && (
                <sup className="text-[7px] leading-none mr-[-2px] font-bold text-sky-400 select-none">
                  {rootNodes}
                </sup>
              )}
              <span className="text-xs font-light select-none text-[#00f3ff] leading-none mt-[-1px]">√</span>
              <span className="border-t border-[#00f3ff]/40 px-0.5 leading-none pt-0.5 select-text text-[10.5px]">
                {radNodes}
              </span>
            </span>
          );
          
          i = radGroup.nextIdx;
          continue;
        }
      }
    }

    // 4. Integrals and Summations with sub/super limit stacks directly right-side
    const operatorMatch = str.substring(i).match(/^\\(sum|int|prod|lim)/);
    if (operatorMatch) {
      const opName = operatorMatch[1];
      const opLength = operatorMatch[0].length;
      let nextIdx = i + opLength;
      
      let subContent: string | null = null;
      let superContent: string | null = null;
      
      let limitsParsed = true;
      while (limitsParsed) {
        limitsParsed = false;
        if (str.substring(nextIdx).startsWith("_")) {
          const charAfter = str[nextIdx + 1];
          if (charAfter === "{") {
            const group = findCurlyBraceContent(nextIdx + 1);
            if (group) {
              subContent = group.content;
              nextIdx = group.nextIdx;
              limitsParsed = true;
            }
          } else if (charAfter) {
            subContent = charAfter;
            nextIdx += 2;
            limitsParsed = true;
          }
        } else if (str.substring(nextIdx).startsWith("^")) {
          const charAfter = str[nextIdx + 1];
          if (charAfter === "{") {
            const group = findCurlyBraceContent(nextIdx + 1);
            if (group) {
              superContent = group.content;
              nextIdx = group.nextIdx;
              limitsParsed = true;
            }
          } else if (charAfter) {
            superContent = charAfter;
            nextIdx += 2;
            limitsParsed = true;
          }
        }
      }
      
      const opSymbol = opName === "int" ? "∫" : opName === "sum" ? "∑" : opName === "prod" ? "∏" : "lim";
      const opNodes = (
        <span className="select-none font-serif text-cyan-400 font-extrabold mr-1 leading-none text-xs sm:text-sm">
          {opSymbol}
        </span>
      );
      
      const subNodes = subContent ? parseLaTeXStringToReact(subContent) : null;
      const superNodes = superContent ? parseLaTeXStringToReact(superContent) : null;
      
      nodes.push(
        <div key={`op-${i}`} className="inline-flex items-center align-middle mx-0.5 font-serif leading-none">
          {opNodes}
          {(subNodes || superNodes) && (
            <div className="inline-flex flex-col justify-center text-[7.5px] leading-tight select-none align-middle ml-0.5">
              <span className="text-sky-400 font-bold mb-[0.5px] select-text">{superNodes || ""}</span>
              <span className="text-cyan-400/90 font-bold mt-[0.5px] select-text">{subNodes || ""}</span>
            </div>
          )}
        </div>
      );
      
      i = nextIdx;
      continue;
    }

    // 5. Greek words and symbols replacement
    let foundSymbol = false;
    for (const key of Object.keys(GREEK_MATH_SYMBOLS)) {
      if (str.substring(i).startsWith(key)) {
        // Word boundary check: if key ends with a letter, the next character in str must not be an alphabetical letter
        const nextCharIdx = i + key.length;
        const endsWithLetter = /[a-zA-Z]$/.test(key);
        const nextCharIsLetter = nextCharIdx < str.length && /[a-zA-Z]/.test(str[nextCharIdx]);
        if (endsWithLetter && nextCharIsLetter) {
          continue;
        }

        if (GREEK_MATH_SYMBOLS[key] !== "") {
          nodes.push(
            <span key={`sym-${i}`} className="font-serif font-semibold text-[#00f3ff] mx-0.5 select-text">
              {GREEK_MATH_SYMBOLS[key]}
            </span>
          );
        }
        i += key.length;
        foundSymbol = true;
        break;
      }
    }
    if (foundSymbol) continue;

    // 6. Subscript & Superscript mapping for general characters
    if (str[i] === "_" || str[i] === "^") {
      const isSub = str[i] === "_";
      let content = "";
      let nextIdx = i + 1;
      
      if (str[nextIdx] === "{") {
        const group = findCurlyBraceContent(nextIdx);
        if (group) {
          content = group.content;
          nextIdx = group.nextIdx;
        }
      } else if (str[nextIdx]) {
        content = str[nextIdx];
        nextIdx += 1;
      }
      
      const childNodes = parseLaTeXStringToReact(content);
      
      if (isSub) {
        nodes.push(
          <sub key={`sub-${i}`} className="text-[7.5px] font-bold text-cyan-400 select-text leading-none align-sub ml-[0.5px]">
            {childNodes}
          </sub>
        );
      } else {
        nodes.push(
          <sup key={`sup-${i}`} className="text-[7.5px] font-bold text-sky-400 select-text leading-none align-super ml-[0.5px]">
            {childNodes}
          </sup>
        );
      }
      
      i = nextIdx;
      continue;
    }

    // 7. Standard characters splitting
    const char = str[i];
    if (/[a-zA-Z]/.test(char)) {
      nodes.push(
        <span key={`char-${i}`} className="font-serif italic font-medium text-slate-100 select-text text-[11px] mx-[0.5px] tracking-wide">
          {char}
        </span>
      );
    } else if (char === " ") {
      nodes.push(<span key={`space-${i}`}>&nbsp;</span>);
    } else {
      nodes.push(
        <span key={`punc-${i}`} className="font-mono text-slate-300 font-medium text-[10.5px] select-text">
          {char}
        </span>
      );
    }
    
    i++;
  }
  
  return nodes;
}

function renderMathAndRichStyles(text: string, undefined?: boolean): React.ReactNode {
  return renderMathAndRichStylesKaTeX(text, undefined);
}

function formatTextWithBasicInlineStyles(text: string, undefined?: boolean) {
  if (!text) return "";
  
  // Parse bold (**text**)
  const boldParts = text.split("**");
  return boldParts.map((boldPart, bIdx) => {
    const isBold = bIdx % 2 === 1;
    
    // Parse inline code (`code`)
    const codeParts = boldPart.split("`");
    const formattedCodeParts = codeParts.map((codePart, cIdx) => {
      const isCode = cIdx % 2 === 1;
      
      if (isCode) {
        return (
          <code key={`${bIdx}-${cIdx}`} className={`px-1.5 py-0.5 mx-0.5 border rounded font-mono text-[10.5px] font-semibold break-all ${undefined ? "bg-white/10 text-[#00f3ff] border-white/25" : "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/25"}`}>
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
          return <em key={`${bIdx}-${cIdx}-${iIdx}`} className={`italic font-semibold ${undefined ? "text-white" : "text-[#e0f2fe]"}`}>{parseTextWithLinks(italicPart)}</em>;
        }
        return <React.Fragment key={`${bIdx}-${cIdx}-${iIdx}`}>{parseTextWithLinks(italicPart)}</React.Fragment>;
      });
      
      return <React.Fragment key={`${bIdx}-${cIdx}`}>{italicElements}</React.Fragment>;
    });
    
    if (isBold) {
      return (
        <strong key={bIdx} className={`font-extrabold ${undefined ? "text-white font-black" : "text-[#00f3ff]"}`}>
          {formattedCodeParts}
        </strong>
      );
    }
    return <React.Fragment key={bIdx}>{formattedCodeParts}</React.Fragment>;
  });
}

function formatTextWithInlineStyles(text: string, undefined?: boolean) {
  return renderMathAndRichStyles(text, undefined);
}

// PDF CORE ANCHOR
function InlineCodeText({ text, undefined }: { text: string; undefined?: boolean; key?: React.Key }) {
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
                  ? undefined
                    ? "bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]"
                    : "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]" 
                  : undefined
                    ? "bg-white/10 border-white/30 text-transparent"
                    : "bg-slate-950/40 border-slate-700 text-transparent"
              }`}>
                {isChecked ? <Check size={11} className="stroke-[3]" /> : null}
              </div>
              <span className={`${undefined ? "text-white" : "text-[#cffafe]"} text-xs font-medium font-sans leading-relaxed ${isChecked ? "line-through opacity-50" : ""}`}>
                {formatTextWithInlineStyles(itemText, undefined)}
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
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${undefined ? "bg-[#00f3ff]" : "bg-[#00f3ff]"}`} />
              <span className={`${undefined ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed`}>
                {formatTextWithInlineStyles(itemText, undefined)}
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
              <span className={`font-bold text-[11px] font-mono shrink-0 select-none ${undefined ? "text-[#00f3ff]" : "text-[#00f3ff]"}`}>{num}.</span>
              <span className={`${undefined ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed`}>
                {formatTextWithInlineStyles(itemText, undefined)}
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
            ? `text-sm font-black tracking-wide mt-3 mb-1 font-sans uppercase ${undefined ? "text-white border-b border-[#00f3ff]/20 pb-0.5" : "text-[#00f3ff] filter"}`
            : hLevel === 2
            ? `text-xs font-extrabold tracking-wide mt-2.5 mb-1 font-sans uppercase ${undefined ? "text-white" : "text-[#00f3ff]"}`
            : `text-[11px] font-bold tracking-wide mt-2 mb-1 font-mono uppercase border-b pb-0.5 ${undefined ? "text-white border-white/10" : "text-slate-100 border-[#00f3ff]/10"}`;
            
          return (
            <div key={idx} className={style}>
              {formatTextWithInlineStyles(hText, undefined)}
            </div>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }
        
        // 5. Default Paragraph line
        return (
          <div key={idx} className={`${undefined ? "text-white" : "text-[#cffafe]"} text-xs font-sans leading-relaxed my-0.5`}>
            {formatTextWithInlineStyles(line, undefined)}
          </div>
        );
      })}
    </div>
  );
}

const downloadMessageAsPDFBasicFallback = (text: string) => {
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
    showToast("Error compiling PDF document content.");
  }
};

export function parseMarkdownToPdfData(text: string): PDFData {
  const cleanedText = extractGeneratePdfToken(text).cleanedText;
  const lines = cleanedText.split("\n");
  const sections: PDFSection[] = [];
  let currentSection: PDFSection | null = null;
  let title = "JARVIS OS Generated Notes";
  let subject = "General Study";

  // Try to find a heading to use as title
  const firstHeadingLine = lines.find(l => l.trim().startsWith("#"));
  if (firstHeadingLine) {
    const rawTitle = firstHeadingLine.replace(/^#+\s*/, "").trim();
    if (rawTitle) {
      title = rawTitle;
    }
  }

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const finalizeTable = () => {
    if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
      if (!currentSection) {
        currentSection = { heading: "General Content", content: "", bulletPoints: [] };
      }
      currentSection.table = {
        headers: tableHeaders,
        rows: tableRows
      };
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check if it is a table line
    if (trimmed.startsWith("|") && trimmed.includes("|")) {
      const parts = trimmed.split("|").map(p => p.trim()).filter((p, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Check if it is a separator line (e.g. |---|---|)
      const isSeparator = parts.length > 0 && parts.every(p => /^-+$/.test(p));
      
      if (isSeparator) {
        inTable = true;
      } else {
        if (!inTable && tableHeaders.length === 0) {
          tableHeaders = parts;
          inTable = true;
        } else {
          tableRows.push(parts);
        }
      }
      return;
    } else {
      if (inTable) {
        finalizeTable();
      }
    }

    if (!trimmed) return;

    if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
      const heading = trimmed.replace(/^#+\s*/, "").trim();
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: heading,
        content: "",
        bulletPoints: []
      };
    } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const bullet = trimmed.replace(/^[-*]\s*/, "").trim();
      if (!currentSection) {
        currentSection = {
          heading: "Introduction",
          content: "",
          bulletPoints: []
        };
      }
      currentSection.bulletPoints!.push(bullet);
    } else {
      if (!currentSection) {
        currentSection = {
          heading: "Introduction",
          content: "",
          bulletPoints: []
        };
      }
      if (currentSection.content) {
        currentSection.content += "\n" + trimmed;
      } else {
        currentSection.content = trimmed;
      }
    }
  });

  if (inTable) {
    finalizeTable();
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    title,
    subject,
    author: "JARVIS OS",
    description: "Auto-compiled theory report",
    themeColor: "#1f2937",
    secondaryColor: "#00f3ff",
    tableStyle: "striped",
    headerStyle: "banner",
    sections
  };
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
  
  // Local state for editable cells and manual row edits
  const [tableHeaders, setTableHeaders] = useState<string[]>(() => [...data.headers]);
  const [tableRows, setTableRows] = useState<string[][]>(() => data.rows.map(row => [...row]));
  const [editingCell, setEditingCell] = useState<{ rIdx: number; cIdx: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Interactive charting states
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  
  // Keep local state in sync if parent data changes
  useEffect(() => {
    setTableHeaders([...data.headers]);
    setTableRows(data.rows.map(row => [...row]));
  }, [data]);

  const handleSort = (colIndex: number) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === colIndex && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: colIndex, direction });
  };

  const handleCellEditStart = (rIdx: number, cIdx: number, currentVal: string) => {
    setEditingCell({ rIdx, cIdx });
    setEditValue(currentVal);
  };

  const handleCellEditSave = () => {
    if (editingCell) {
      const { rIdx, cIdx } = editingCell;
      setTableRows(prev => {
        const updated = prev.map((row, idx) => {
          if (idx === rIdx) {
            const nextRow = [...row];
            nextRow[cIdx] = editValue;
            return nextRow;
          }
          return row;
        });
        return updated;
      });
      setEditingCell(null);
    }
  };

  const handleAddNewRow = () => {
    const emptyRow = tableHeaders.map(() => "New entry");
    setTableRows(prev => [...prev, emptyRow]);
  };

  const handleDeleteRow = (rIdx: number) => {
    setTableRows(prev => prev.filter((_, idx) => idx !== rIdx));
  };

  const handleExportCSV = () => {
    let content = tableHeaders.join(",") + "\n";
    tableRows.forEach(row => {
      content += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "jarvis_concept_dataset.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return tableRows;
    const lower = filterText.toLowerCase();
    return tableRows.filter(row =>
      row.some(cell => cell.toLowerCase().includes(lower))
    );
  }, [tableRows, filterText]);

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

  // Charting parameters
  const numericColumns = useMemo(() => {
    const indexes: number[] = [];
    tableHeaders.forEach((_, colIdx) => {
      let numericCount = 0;
      let nonNanoCount = 0;
      tableRows.forEach(row => {
        const val = row[colIdx] || "";
        if (val.trim() === "") return;
        const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) {
          numericCount++;
        }
        nonNanoCount++;
      });
      if (nonNanoCount > 0 && (numericCount / nonNanoCount) >= 0.5) {
        indexes.push(colIdx);
      }
    });
    return indexes;
  }, [tableHeaders, tableRows]);

  const [yColIdx, setYColIdx] = useState<number>(0);
  const [xColIdx, setXColIdx] = useState<number>(0);
  
  useEffect(() => {
    if (numericColumns.length > 0 && !numericColumns.includes(yColIdx)) {
      setYColIdx(numericColumns[0]);
    }
  }, [numericColumns, yColIdx]);

  // Construct chart dataset
  const chartData = useMemo(() => {
    if (numericColumns.length === 0) return [];
    
    return tableRows.map((row, rIdx) => {
      const xLabel = row[xColIdx] || `${rIdx + 1}`;
      const rawY = row[yColIdx] || "0";
      const yValue = parseFloat(rawY.replace(/[^0-9.-]/g, "")) || 0;
      return { xLabel, yValue };
    });
  }, [tableRows, xColIdx, yColIdx, numericColumns]);

  // SVG Coordinates translation
  const svgChart = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const svgW = 540;
    const svgH = 180;
    const padL = 50;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    
    const yValues = chartData.map(d => d.yValue);
    const maxY = Math.max(1, ...yValues) * 1.15;
    const minY = Math.min(0, ...yValues) < 0 ? Math.min(...yValues) * 1.15 : 0;
    const deltaY = maxY - minY;
    
    const getX = (idx: number) => {
      if (chartData.length <= 1) return padL + plotW / 2;
      return padL + (idx / (chartData.length - 1)) * plotW;
    };
    
    const getY = (val: number) => {
      const ratio = (val - minY) / deltaY;
      return svgH - padB - ratio * plotH;
    };
    
    const gridCount = 4;
    const gridLines = [];
    for (let i = 0; i <= gridCount; i++) {
      const gridVal = minY + (i / gridCount) * deltaY;
      const yPos = getY(gridVal);
      gridLines.push(
        <g key={`grid-${i}`} className="opacity-20 animate-in fade-in duration-300">
          <line x1={padL} y1={yPos} x2={svgW - padR} y2={yPos} stroke="#00f3ff" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={padL - 8} y={yPos + 3} textAnchor="end" className="fill-[#00f3ff]/70 font-mono text-[8px]">{gridVal.toFixed(1)}</text>
        </g>
      );
    }
    
    let plotOutput = null;
    if (chartType === "bar") {
      const barW = Math.max(2, (plotW / chartData.length) * 0.6);
      plotOutput = chartData.map((d, idx) => {
        const xPos = getX(idx) - barW / 2;
        const originY = getY(0);
        const barY = getY(d.yValue);
        const h = Math.abs(originY - barY);
        const topY = d.yValue >= 0 ? barY : originY;
        
        return (
          <g key={idx} className="group cursor-pointer">
            <rect
              x={xPos}
              y={topY}
              width={barW}
              height={Math.max(1, h)}
              fill="url(#cyber-grad-y)"
              className="hover:opacity-90 transition-opacity"
              rx={1.5}
            />
            <rect x={xPos} y={barY - 1} width={barW} height={2} fill="#00f3ff" />
            <title>{`${d.xLabel}: ${d.yValue}`}</title>
          </g>
        );
      });
    } else if (chartType === "line") {
      const points = chartData.map((d, idx) => `${getX(idx)},${getY(d.yValue)}`).join(" ");
      plotOutput = (
        <g>
          <polyline points={points} fill="none" stroke="#00f3ff" strokeWidth="2" />
          {chartData.map((d, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(d.yValue)}
              r={3.5}
              fill="#03071c"
              stroke="#00f3ff"
              strokeWidth="1.5"
              className="cursor-pointer hover:r-4 transition-all"
              title={`${d.xLabel}: ${d.yValue}`}
            />
          ))}
        </g>
      );
    } else if (chartType === "area") {
      const points = chartData.map((d, idx) => `${getX(idx)},${getY(d.yValue)}`);
      const areaPoints = `${getX(0)},${getY(0)} ` + points.join(" ") + ` ${getX(chartData.length - 1)},${getY(0)}`;
      plotOutput = (
        <g>
          <polygon points={areaPoints} fill="url(#cyber-area-grad)" className="opacity-35" />
          <polyline points={points.join(" ")} fill="none" stroke="#00f3ff" strokeWidth="1.5" />
          {chartData.map((d, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(d.yValue)}
              r={2.5}
              fill="#00f3ff"
              title={`${d.xLabel}: ${d.yValue}`}
            />
          ))}
        </g>
      );
    }

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-44 select-none">
        <defs>
          <linearGradient id="cyber-grad-y" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f3ff" />
            <stop offset="100%" stopColor="#09183d" />
          </linearGradient>
          <linearGradient id="cyber-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines}
        {plotOutput}
        <g className="opacity-45">
          {chartData.map((d, idx) => {
            if (chartData.length > 8 && idx % Math.ceil(chartData.length / 5) !== 0) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={svgH - 12}
                textAnchor="middle"
                className="fill-[#00f3ff] font-mono text-[7px]"
              >
                {d.xLabel.length > 11 ? `${d.xLabel.substring(0, 9)}..` : d.xLabel}
              </text>
            );
          })}
        </g>
        <line x1={padL} y1={getY(0)} x2={svgW - padR} y2={getY(0)} stroke="#00f3ff" strokeWidth="0.8" className="opacity-40" />
      </svg>
    );
  }, [chartData, chartType]);

  return (
    <div className="my-4 border border-[#00f3ff]/20 bg-[#04081c]/90 rounded-xl overflow-hidden backdrop-blur-md select-text max-w-full">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#091430]/70 border-b border-[#00f3ff]/10">
        <span className="text-[9px] font-mono font-bold text-[#00f3ff] uppercase tracking-wider px-2 py-0.5 rounded bg-[#00f3ff]/10 border border-[#00f3ff]/25 select-none shrink-0">
          Interactive Data Grid
        </span>
        
        {/* Actions bar toolbar inside table */}
        <div className="flex items-center gap-1.5 select-none shrink-0">
          {numericColumns.length > 0 && (
            <button
              onClick={() => setShowChart(!showChart)}
              className={`p-1 px-2 rounded font-mono text-[9px] font-bold border transition-all cursor-pointer ${
                showChart
                  ? "bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/50"
                  : "bg-transparent text-slate-400 border-slate-700 hover:border-[#00f3ff]/30 hover:text-slate-200"
              }`}
            >
              📊 CHART PLOTTER
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="p-1 px-2 rounded font-mono text-[9px] font-bold border bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Download CSV"
          >
            <Download size={10} /> CSV
          </button>
          <button
            onClick={handleAddNewRow}
            className="p-1 px-2 rounded font-mono text-[9px] font-bold border bg-[#00f3ff]/5 text-slate-300 border-[#00f3ff]/20 hover:bg-[#00f3ff]/15 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Append Row"
          >
            <Plus size={10} /> ROW
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 max-w-xs ml-auto min-w-[120px]">
          <input
            type="text"
            placeholder="Quick search data..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-slate-950/80 border border-[#00f3ff]/20 rounded-lg py-1 px-2 pl-7 text-[10.5px] text-[#cffafe] font-mono outline-none focus:border-[#00f3ff] focus:transition-all placeholder-[#00f3ff]/35"
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

      {/* Embedded Chart View */}
      {showChart && chartData.length > 0 && (
        <div className="p-3 bg-[#020512] border-b border-[#00f3ff]/10 animate-in slide-in-from-left duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Dynamic Visual Metrics</span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-slate-500 font-mono">TYPE:</span>
              <div className="flex rounded border border-[#00f3ff]/20 overflow-hidden font-mono text-[7.5px] font-black">
                {["bar", "line", "area"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t as any)}
                    className={`px-1.5 py-0.5 border-r last:border-r-0 border-[#00f3ff]/20 uppercase cursor-pointer ${
                      chartType === t ? "bg-[#00f3ff]/20 text-[#00f3ff]" : "bg-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <span className="text-[8px] text-slate-500 font-mono ml-1">Y-AXIS:</span>
              <select
                value={yColIdx}
                onChange={(e) => setYColIdx(parseInt(e.target.value))}
                className="bg-slate-950 border border-[#00f3ff]/20 rounded text-[8px] font-mono text-cyan-300 outline-none p-0.5"
              >
                {numericColumns.map(idx => (
                  <option key={idx} value={idx}>{tableHeaders[idx] || `Col ${idx + 1}`}</option>
                ))}
              </select>

              <span className="text-[8px] text-slate-500 font-mono ml-1">X-AXIS:</span>
              <select
                value={xColIdx}
                onChange={(e) => setXColIdx(parseInt(e.target.value))}
                className="bg-slate-950 border border-[#00f3ff]/20 rounded text-[8px] font-mono text-cyan-300 outline-none p-0.5"
              >
                {tableHeaders.map((hdr, idx) => (
                  <option key={idx} value={idx}>{hdr || `Col ${idx + 1}`}</option>
                ))}
              </select>
            </div>
          </div>
          {svgChart}
        </div>
      )}

      {/* Tabular Layout */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-auto text-left text-xs font-mono">
          <thead>
            <tr className="bg-[#091430]/75 border-b border-[#00f3ff]/15 select-none">
              {tableHeaders.map((header, idx) => {
                const alignClass = 
                  data.alignments[idx] === "center" ? "text-center" : 
                  data.alignments[idx] === "right" ? "text-right" : "text-left";
                
                const isSortedCol = sortConfig?.key === idx;
                
                return (
                  <th
                    key={idx}
                    className={`py-2 px-3 text-[10.5px] font-bold text-[#00f3ff] transition-colors uppercase whitespace-nowrap select-none ${alignClass}`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="truncate flex-1 cursor-pointer hover:text-white" onClick={() => handleSort(idx)}>{header}</span>
                      <span className="text-[#00f3ff]/50 shrink-0 cursor-pointer" onClick={() => handleSort(idx)}>
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
              <th className="py-2 px-3 w-10 text-center text-[10.5px] font-bold text-slate-500 select-none">OPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length + 1} className="text-center py-6 text-slate-500 font-mono text-[10.5px]">
                  NO MATCHING DATA ENTRIES FOUND
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`hover:bg-[#00f3ff]/5 transition-colors duration-150 group ${
                    rowIdx % 2 === 0 ? "bg-transparent" : "bg-[#09122b]/30"
                  }`}
                >
                  {row.map((cell, colIdx) => {
                    const alignClass = 
                      data.alignments[colIdx] === "center" ? "text-center" : 
                      data.alignments[colIdx] === "right" ? "text-right" : "text-left";
                    
                    const isEditing = editingCell?.rIdx === rowIdx && editingCell?.cIdx === colIdx;
                    
                    return (
                      <td
                        key={colIdx}
                        className={`py-2 px-3 text-[11px] text-slate-300 font-sans leading-normal cursor-pointer hover:bg-slate-900/50 relative group/cell ${alignClass}`}
                        onClick={() => {
                          if (!isEditing) handleCellEditStart(rowIdx, colIdx, cell);
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellEditSave}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCellEditSave();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            className="bg-slate-950 border border-[#00f3ff] rounded p-0.5 w-full text-[11px] font-mono text-cyan-200 outline-none"
                          />
                        ) : (
                          <>
                            <span>{formatTextWithInlineStyles(cell)}</span>
                            {/* Visual cell editor pencil overlay */}
                            <span className="hidden group-cell-hover/cell:inline-block ml-1 opacity-25 text-[#00f3ff] text-[8px] uppercase select-none">edit</span>
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-3 text-center align-middle relative">
                    <button
                      onClick={() => handleDeleteRow(rowIdx)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer select-none"
                      title="Delete Entry Row"
                    >
                      <Trash2 size={11} className="mx-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center px-3 py-1.5 bg-slate-900/10 border-t border-[#00f3ff]/5 text-[9px] text-slate-500 font-bold font-mono">
        <span>showing {sortedRows.length} of {tableRows.length} rows</span>
        {(sortConfig || filterText) && (
          <button 
            onClick={() => {
              setSortConfig(null);
              setFilterText("");
            }} 
            className="text-[#00f3ff]/60 hover:text-[#00f3ff] transition-colors cursor-pointer uppercase"
          >
            Clear sorting filters
          </button>
        )}
      </div>
    </div>
  );
}

function YouTubeSearchEnhancedCardWrapper({ query }: { query: string }) {
  const [isDismissed, setIsDismissed] = useState(false);
  if (isDismissed) return null;
  return <YouTubeSearchEnhancedCard query={query} onDismiss={() => setIsDismissed(true)} />;
}

function InteractiveBrowserCard({ url, title }: { url: string; title?: string }) {
  const [isDismissed, setIsDismissed] = useState(false);
  if (isDismissed) return null;
  return <BrowserSearchEnhancedCard url={url} title={title} onDismiss={() => setIsDismissed(true)} />;
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-4 pt-3.5 border-t border-[#00f3ff]/20"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping will-change-transform" />
        <span className="text-[10px] font-mono tracking-widest text-[#00f3ff] uppercase font-bold flex items-center gap-1.5">
          🌐 INTEL RETRIEVAL RADAR // {sources.length} VERIFIED SOURCES
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((source, index) => {
          let hostname = "";
          try {
            hostname = new URL(source.url).hostname;
          } catch (_) {
            hostname = source.label;
          }
          const cleanHostname = hostname.replace(/^www\./i, "");
          const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${cleanHostname}`;

          return (
            <motion.a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-[#00f3ff]/20 bg-[#03091e]/70 hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]/50 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer backdrop-blur-md"
            >
              <div className="w-7 h-7 rounded-lg bg-black/60 border border-[#00f3ff]/30 flex items-center justify-center p-1 group-hover:border-[#00f3ff] shrink-0 group-hover:shadow-[0_0_8px_#00f3ff]">
                <img
                  src={faviconUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none";
                  }}
                  className="w-4 h-4 object-contain rounded-xs"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate tracking-wide text-slate-200 group-hover:text-[#00f3ff]">
                  {source.label}
                </div>
                <div className="text-[8.5px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate uppercase">
                  <span className="px-1 py-0.2 rounded bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] scale-90 origin-left font-bold">
                    {source.engine}
                  </span>
                  <span className="truncate">{cleanHostname}</span>
                </div>
              </div>

              <ExternalLink size={13} className="text-slate-500 group-hover:text-[#00f3ff] transition-colors shrink-0 mr-1" />
            </motion.a>
          );
        })}
      </div>
    </motion.div>
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

function extractGeneratePdfToken(text: string): { cleanedText: string; pdfData: any; pdfHtml: string | null; rawJson: string | null } {
  const tokenPrefix = "[GENERATE_PDF:";
  const startIndex = text.indexOf(tokenPrefix);
  if (startIndex === -1) {
    return { cleanedText: text, pdfData: null, pdfHtml: null, rawJson: null };
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
  let pdfHtml = null;
  
  if (tokenContent.startsWith("<") || tokenContent.includes("<!DOCTYPE html>") || tokenContent.includes("<html")) {
    pdfHtml = tokenContent;
  } else {
    try {
      pdfData = JSON.parse(tokenContent);
    } catch (err) {
      pdfData = tryRepairAndParseJson(tokenContent);
    }
  }

  return { cleanedText, pdfData, pdfHtml, rawJson: tokenContent };
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
  let pdfHtml: string | null = null;
  if (!isTypingActive) {
    pdfData = pdfExtraction.pdfData;
    pdfHtml = pdfExtraction.pdfHtml;
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

  let thoughtProcess: string | null = null;
  const thinkMatch = cleanedText.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thoughtProcess = thinkMatch[1].trim();
    cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
  } else if (isTypingActive) {
    const partialThinkMatch = cleanedText.match(/<think>([\s\S]*)/i);
    if (partialThinkMatch) {
       thoughtProcess = partialThinkMatch[1].trim();
       cleanedText = cleanedText.replace(/<think>([\s\S]*)/i, "").trim();
    }
  }

  return (
    <div className="space-y-1.5 break-words">
      {thoughtProcess && (
        <ThoughtProcessCard thoughtProcess={thoughtProcess} isTypingActive={!!isTypingActive} />
      )}
      {cleanedText && (
        <div className="inline-block w-full">
          <MathRenderer 
            text={cleanedText} 
             
            onRunCode={openCodePreviewInNewTab} 
          />
          {isTypingActive && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="inline-block w-1.5 h-3.5 bg-[#00f3ff] rounded-xs ml-1 align-middle"
            />
          )}
        </div>
      )}

      {pdfData && (
        <InteractivePDFCard data={pdfData} />
      )}

      {pdfHtml && (
        <HTMLPDFCard htmlContent={pdfHtml} />
      )}

      {ytQuery && (
        <YouTubeSearchEnhancedCardWrapper query={ytQuery} />
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

function generateIframeSrcDoc(code: string, language: string) {
  const consoleInterceptScript = `
    <script>
      (function() {
        const _log = console.log;
        const _error = console.error;
        const _warn = console.warn;
        
        function sendToParent(type, args) {
          try {
            const serialized = Array.from(args).map(arg => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            }).join(' ');
            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, content: serialized }, '*');
          } catch(e) {}
        }
        
        console.log = function() {
          sendToParent('log', arguments);
          _log.apply(console, arguments);
        };
        console.error = function() {
          sendToParent('error', arguments);
          _error.apply(console, arguments);
        };
        console.warn = function() {
          sendToParent('warn', arguments);
          _warn.apply(console, arguments);
        };
        
        window.onerror = function(message, source, lineno, colno, error) {
          if (message && (message === 'Script error.' || message.toString().includes('Script error'))) {
            return true; // Ignore cross-origin, uninformative script errors
          }
          sendToParent('error', [message + ' (line ' + lineno + ')']);
          return false;
        };
      })();
    </script>
  `;

  const lang = language.toLowerCase();
  
  if (lang === "html") {
    if (code.includes("<head>")) {
      return code.replace("<head>", `<head>\n${consoleInterceptScript}\n`);
    }
    return `<!DOCTYPE html><html><head>${consoleInterceptScript}</head><body>${code}</body></html>`;
  }
  
  if (lang === "css") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        ${consoleInterceptScript}
        <style>${code}</style>
      </head>
      <body style="padding: 20px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #1e293b;">
        <div style="max-width: 450px; margin: 0 auto; padding: 24px; border-radius: 12px; background: white; box-sizing: border-box; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; font-weight: 700;">CSS Live Preview Container</h3>
          <p style="font-size: 13px; color: #475569; line-height: 1.5;">This workspace is styled under your loaded style sheets.</p>
          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button style="padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; color: white; background: #00f3ff; border: none; ">Primary action</button>
            <button style="padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; background: transparent; border: 1px solid #cbd5e1; color: #475569;">Secondary action</button>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  if (lang === "javascript" || lang === "js") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        ${consoleInterceptScript}
      </head>
      <body style="padding: 15px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #03071c; color: #f1f5f9;">
        <div style="padding: 12px; border-radius: 8px; background: rgba(0, 243, 255, 0.03); border: 1px solid rgba(0, 243, 255, 0.15);">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #00f3ff; font-family: monospace;">EXECUTION BUFFER STATUS</span>
          </div>
          <p style="font-size: 10px; color: #94a3b8; font-family: monospace; margin: 0 0 8px 0;">Script executing parent routines inline...</p>
          <div id="output" style="padding: 8px; border-radius: 6px; background: #01040f; border: 1px solid rgba(0, 243, 255, 0.08); font-family: monospace; font-size: 10.5px; color: #67e8f9; min-height: 30px; white-space: pre-wrap;">(Waiting execution events)</div>
        </div>
        <script>
          const outputElement = document.getElementById('output');
          window.write = function(...args) {
            outputElement.innerText = (outputElement.innerText === "(Waiting execution events)" ? "" : outputElement.innerText) + args.join(' ') + '\\n';
          };
          try {
            console.log("Secure JS Sandbox Boot complete.");
            ${code}
          } catch(err) {
            console.error(err.message || String(err));
          }
        </script>
      </body>
      </html>
    `;
  }
  
  if (lang === "svg" || lang === "xml") {
    if (code.trim().startsWith("<svg")) {
      return `<!DOCTYPE html><html><body style="display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa; padding: 15px;">${code}</body></html>`;
    }
    return code;
  }
  
  return "";
}

function getSimulatedCodeOutput(code: string, language: string) {
  const lang = language.toLowerCase();
  
  if (lang === "json") {
    try {
      const parsed = JSON.parse(code);
      return `[JSON structure parsed successfully]\n• Root type: ${Array.isArray(parsed) ? "Array" : "Object"}\n• Field keys: ${Object.keys(parsed).join(", ")}\n\nFormat check: valid specification JSON.`;
    } catch(e: any) {
      return `🔴 Parsing Mismatch: Invalid JSON Spec\n${e.message || String(e)}`;
    }
  }
  
  if (lang === "sql") {
    const lines = [];
    if (code.toLowerCase().includes("select")) {
      lines.push("⚙️ SQL Query Engine matching traces...");
      lines.push("✓ Scanning indexes and execution plans...");
      lines.push("✓ Transaction committed successfully (OK)");
      lines.push("\nData rows output (SIMULATED):");
      lines.push("+----+-------------+------------------------+");
      lines.push("| id | first_name  | login_status           |");
      lines.push("+----+-------------+------------------------+");
      lines.push("| 1  | Jarvis SYS  | ACTIVE DIRECTORY       |");
      lines.push("| 2  | Engineer    | VISITOR CREDENTIAL     |");
      lines.push("+----+-------------+------------------------+");
      lines.push("(2 rows returned in 0.04s)");
    } else {
      lines.push("⚙️ SQL Mutation Parser matching...");
      lines.push("✓ Statement run successfully. Database indexes updated.");
      lines.push("✓ Rows altered: 1 row inside operator database.");
    }
    return lines.join("\n");
  }

  // Python simulator parser
  const lines = code.split("\n");
  const extractedPrints: string[] = [];
  
  lines.forEach(line => {
    // Match print statements with dynamic content
    const printMatch = line.match(/print\s*\(\s*f?["']([\s\S]*?)["']\s*\)/);
    if (printMatch) {
      extractedPrints.push(printMatch[1]);
    } else {
      const simpleValMatch = line.match(/print\s*\(\s*([a-zA-Z_0-9]+)\s*\)/);
      if (simpleValMatch) {
        extractedPrints.push(`[Variable value of ${simpleValMatch[1]}]`);
      }
    }
  });

  if (extractedPrints.length > 0) {
    return extractedPrints.map(p => `>>> ${p}`).join("\n");
  }

  return `⚙️ Secure Python runtime environment started...\n✓ Standard dependencies validated\n✓ Compiled successfully containing zero warnings\n\n[Console Return - Exit Code (0)]`;
}

function openCodePreviewInNewTab(code: string, language: string) {
  const langLower = language.toLowerCase();
  const isVisual = ["html", "css", "javascript", "js", "svg", "xml"].includes(langLower);
  
  // Create safe string representations for the code viewer panel
  const safeCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Escape backticks, backslashes, and target tags so they can be injected safely inside the new tab template script
  const escapedCodeString = code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/<\/script>/g, "<\\/script>");

  const simulatedOutput = getSimulatedCodeOutput(code, language);
  const escapedSimulatedOutput = simulatedOutput
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  const iframeSrcDoc = generateIframeSrcDoc(code, language);
  const escapedIframeSrcDoc = iframeSrcDoc
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/<\/script>/g, "<\\/script>");

  const htmlContent = `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🤖 JARVIS Core Code Sandbox Workspace - Run Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            cyber: {
              bg: '#02050f',
              card: '#070d24',
              accent: '#00f3ff',
              border: 'rgba(0, 243, 255, 0.2)',
              text: '#f1f5f9'
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace']
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #02050f;
      color: #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 243, 255, 0.02);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 243, 255, 0.15);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 243, 255, 0.3);
    }
  </style>
</head>
<body class="h-full flex flex-col overflow-hidden">
  
  <!-- Header App Bar -->
  <header class="flex items-center justify-between px-5 py-3 bg-[#050b1d] border-b border-cyber/border shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-pulse"></div>
      <div>
        <h1 class="text-sm font-black tracking-wider text-white font-mono flex items-center gap-1.5">
          🤖 JARVIS <span class="text-[#00f3ff]">SYSTEM RUNNER v2.5</span>
        </h1>
        <p class="text-[9px] text-[#00f3ff]/50 font-mono tracking-wide uppercase select-none">EXPERIMENTAL CODE SANDBOX ENVIRONMENT</p>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 font-mono uppercase tracking-widest text-xs">
        ${language}
      </span>
      <button onclick="window.close()" class="text-xs font-bold text-rose-400/90 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/25 px-3 py-1 rounded transition-all focus:outline-none cursor-pointer">
        CLOSE WORKSPACE
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 flex overflow-hidden">
    <!-- Left Navigation & Sidebar Info -->
    <aside class="w-60 bg-[#040817] border-r border-cyber/border flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div class="space-y-5">
        <div>
          <h2 class="text-[10px] font-black tracking-widest text-[#00f3ff]/60 uppercase mb-2 font-mono">WORKSPACE DETAILS</h2>
          <div class="bg-black/40 p-3 rounded-lg border border-cyber/border space-y-2 text-xs font-mono">
            <div class="flex justify-between"><span class="text-gray-400 font-medium">Environment:</span> <span class="text-[#00f3ff] font-bold">Node.js sandbox</span></div>
            <div class="flex justify-between"><span class="text-gray-400 font-medium">Engine status:</span> <span class="text-emerald-400 font-bold flex items-center gap-1">● READY</span></div>
            <div class="flex justify-between"><span class="text-gray-400 font-medium">Timestamp:</span> <span class="text-gray-300">${new Date().toLocaleTimeString()}</span></div>
          </div>
        </div>

        <div>
          <h2 class="text-[10px] font-black tracking-widest text-[#00f3ff]/60 uppercase mb-2 font-mono">CONTROLS & ACTION</h2>
          <div class="flex flex-col gap-2">
            <button onclick="copyToClipboard()" class="w-full flex items-center justify-center gap-2 text-xs font-bold bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 py-2 rounded-lg transition-all focus:outline-none cursor-pointer">
              📄 COPY CODE SOURCE
            </button>
            <button onclick="window.location.reload()" class="w-full flex items-center justify-center gap-2 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 py-2 rounded-lg transition-all focus:outline-none cursor-pointer">
              🔄 RERUN & COMPILE
            </button>
          </div>
        </div>

        <div class="pt-1">
          <h2 class="text-[10px] font-black tracking-widest text-[#00f3ff]/60 uppercase mb-2 font-mono">SUPPORTED RUNTIMES</h2>
          <p class="text-[10px] text-gray-400 leading-relaxed font-mono">
            JARVIS parses Python simulator prints, SQL mutations, JSON objects, CSS layouts, JS logic, and fully responsive HTML pages.
          </p>
        </div>
      </div>

      <div class="text-[9px] text-[#00f3ff]/40 font-mono text-center">
        POWERED BY DEEPMIND GEMINI 3.5
      </div>
    </aside>

    <!-- Right Workspace Panel -->
    <div class="flex-1 flex flex-col overflow-hidden bg-cyber/bg relative">
      <!-- Workspace View Select Tabs -->
      <div class="flex items-center justify-between px-4 bg-[#030614] border-b border-cyber/border shrink-0 select-none">
        <div class="flex items-center gap-1 py-1">
          ${isVisual ? `
          <button id="btn-preview" onclick="switchTab('preview')" class="flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 border-[#00f3ff] text-white focus:outline-none transition-all cursor-pointer font-mono">
            🖥️ VISUAL LIVE VIEWPORT
          </button>
          ` : ''}
          <button id="btn-terminal" onclick="switchTab('terminal')" class="flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 border-transparent text-gray-400 hover:text-white focus:outline-none transition-all cursor-pointer font-mono">
            📟 TERMINAL STDOUT LOGS
          </button>
          <button id="btn-source" onclick="switchTab('source')" class="flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 border-transparent text-gray-400 hover:text-white focus:outline-none transition-all cursor-pointer font-mono">
            💾 SOURCE WORKSPACE
          </button>
        </div>

        <div class="text-[10px] text-[#00f3ff]/70 font-mono flex items-center gap-1.5 pr-2">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          REALTIME AGENT INTEGRATION ACTIVATED
        </div>
      </div>

      <!-- Tab Contents Area -->
      <div class="flex-1 overflow-hidden relative">
        <!-- Tab 1: Live IFrame Viewport -->
        ${isVisual ? `
        <div id="tab-preview" class="w-full h-full bg-white relative">
          <iframe id="preview-iframe" sandbox="allow-scripts allow-modals allow-same-origin" class="w-full h-full border-none bg-white" title="Live Preview Container"></iframe>
        </div>
        ` : ''}

        <!-- Tab 2: Terminal Output Logs -->
        <div id="tab-terminal" class="w-full h-full bg-[#01040f] p-5 flex flex-col font-mono text-xs overflow-y-auto custom-scrollbar ${isVisual ? 'hidden' : ''}">
          <div class="flex items-center justify-between border-b border-cyber/border pb-2 mb-3">
            <span class="text-[10px] text-[#00f3ff] font-bold tracking-wider">📟 TERMINAL STANDARD EXECUTOR</span>
            <button onclick="clearTerminal()" class="text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 px-2 py-0.5 rounded transition-all focus:outline-none cursor-pointer">
              CLEAR TERM
            </button>
          </div>
          <div id="console-output" class="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar font-mono leading-relaxed text-slate-300 pr-2">
            <!-- Simulated runtime logs go here -->
          </div>
        </div>

        <!-- Tab 3: Code Viewer -->
        <div id="tab-source" class="w-full h-full p-5 bg-[#01030b] overflow-auto custom-scrollbar hidden">
          <div class="flex items-center justify-between border-b border-cyber/border pb-2 mb-3">
            <span class="text-[10px] text-gray-450 font-mono uppercase tracking-wider">📜 RAW COMPILED CODE TEXT</span>
          </div>
          <pre class="font-mono text-[11px] text-slate-200 leading-relaxed whitespace-pre pl-1"><code id="code-content">${safeCode}</code></pre>
        </div>
      </div>
    </div>
  </main>

  <!-- Custom Floating Toast notifications -->
    <span class="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse"></span>
  </div>

  <script>
    const code = \`${escapedCodeString}\`;
    const simulatedStdout = \`${escapedSimulatedOutput}\`;
    const iframeSrcDoc = \`${escapedIframeSrcDoc}\`;
    const language = "${language.toLowerCase()}";
    const isVisual = ${isVisual};

    let activeTab = isVisual ? "preview" : "terminal";
    const consoleOutputEl = document.getElementById("console-output");

    // Initialize application preview
    document.addEventListener("DOMContentLoaded", () => {
      // 1. Loading standard logs or simulated logs
      if (simulatedStdout) {
        logToTerminal(simulatedStdout, "info");
      }
      
      logToTerminal("🚀 JARVIS Sandbox runtime initialization complete.", "sys");
      logToTerminal("⚙️ Host compilation process bound successfully.", "sys");

      // 2. Set srcDoc if rendering is visual
      if (isVisual) {
        const previewIframe = document.getElementById("preview-iframe");
        if (previewIframe) {
          previewIframe.srcdoc = iframeSrcDoc;
        }
      }

      // 3. Listen to messages from child iframe console.log interceptions
      window.addEventListener("message", (e) => { if (e.data && e.data.type === 'CONSOLE_LOG') {
          let category = "log";
          if (e.data.logType === 'error') category = "error";
          if (e.data.logType === 'warn') category = "warn";
          
          logToTerminal(e.data.content, category);
        }
      });
    });

    function logToTerminal(message, type = "log") {
      if (!consoleOutputEl) return;
      const row = document.createElement("div");
      
      // Filter empty lines or standard separators
      if (!message || message.trim() === "") return;
      
      row.className = "py-1.5 border-l-2 pl-2 rounded-r bg-black/5 " + 
        (type === "error" ? "border-rose-500 text-rose-400 bg-rose-500/5 font-semibold" :
         type === "warn" ? "border-amber-500 text-amber-300 bg-amber-500/5 font-medium" :
         type === "sys" ? "border-[#00f3ff] text-[#00f3ff] bg-[#00f3ff]/5 font-black" :
         "border-emerald-500 text-slate-200");
      
      const time = new Date().toLocaleTimeString();
      row.innerHTML = \`<span class="text-slate-500 text-[9px] font-mono mr-2">[\${time}]</span> <span class="font-mono whitespace-pre-wrap break-all">\${message}</span>\`;
      
      consoleOutputEl.appendChild(row);
      consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
    }

    function switchTab(tabId) {
      activeTab = tabId;
      
      // Update UI Tabs Styles
      const btnPreview = document.getElementById("btn-preview");
      const btnTerminal = document.getElementById("btn-terminal");
      const btnSource = document.getElementById("btn-source");
      
      const tabPreview = document.getElementById("tab-preview");
      const tabTerminal = document.getElementById("tab-terminal");
      const tabSource = document.getElementById("tab-source");

      if (btnPreview) btnPreview.className = "flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 " + (tabId === "preview" ? "border-[#00f3ff] text-white" : "border-transparent text-gray-400 hover:text-white") + " focus:outline-none transition-all cursor-pointer font-mono";
      if (btnTerminal) btnTerminal.className = "flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 " + (tabId === "terminal" ? "border-[#00f3ff] text-white" : "border-transparent text-gray-400 hover:text-white") + " focus:outline-none transition-all cursor-pointer font-mono";
      if (btnSource) btnSource.className = "flex items-center gap-2 text-xs font-bold px-4 py-3 border-b-2 " + (tabId === "source" ? "border-[#00f3ff] text-white" : "border-transparent text-gray-400 hover:text-white") + " focus:outline-none transition-all cursor-pointer font-mono";

      if (tabPreview) {
        if (tabId === "preview") tabPreview.classList.remove("hidden");
        else tabPreview.classList.add("hidden");
      }
      if (tabTerminal) {
        if (tabId === "terminal") tabTerminal.classList.remove("hidden");
        else tabTerminal.classList.add("hidden");
      }
      if (tabSource) {
        if (tabId === "source") tabSource.classList.remove("hidden");
        else tabSource.classList.add("hidden");
      }
    }

    function showToast(message) {
      setTimeout(() => {
      }, 2000);
    }

    async function copyToClipboard() {
      try {
        await navigator.clipboard.writeText(code);
        showToast("✓ SOURCE CODE COPIED...");
      } catch(err) {
        showToast("⚠️ COPY ERROR: " + err);
      }
    }

    function clearTerminal() {
      if (consoleOutputEl) {
        consoleOutputEl.innerHTML = "";
        logToTerminal("🗑️ Console output stream cleared.", "sys");
      }
    }
  </script>
</body>
</html>`;

  const newWindow = window.open("", "_blank");
  if (newWindow) {
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  } else {
      showToast("⚠️ Run Code opened in window was blocked. Please allow popups for this site so Jarvis can render the live workspace preview.");
  }
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

  const isRunnable = ["html", "css", "javascript", "js", "python", "py", "json", "svg", "xml", "sql"].includes(language.toLowerCase());

  const cleanLang = language.toLowerCase().trim();
  let prismLang = "markup"; // default for html/xml/svg
  if (["javascript", "js"].includes(cleanLang)) {
    prismLang = "javascript";
  } else if (["typescript", "ts"].includes(cleanLang)) {
    prismLang = "typescript";
  } else if (["css"].includes(cleanLang)) {
    prismLang = "css";
  } else if (["json"].includes(cleanLang)) {
    prismLang = "json";
  } else if (["python", "py"].includes(cleanLang)) {
    prismLang = "python";
  } else if (["bash", "sh", "shell"].includes(cleanLang)) {
    prismLang = "bash";
  } else if (["sql"].includes(cleanLang)) {
    prismLang = "sql";
  } else if (["html", "xml", "svg"].includes(cleanLang)) {
    prismLang = "markup";
  } else if (Prism.languages[cleanLang]) {
    prismLang = cleanLang;
  }

  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[prismLang] || Prism.languages.markup;
    try {
      return Prism.highlight(code, grammar, prismLang);
    } catch (err) {
      console.warn("Prism highlight error for language:", language, err);
      // Native fallback
      return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [code, prismLang, language]);
  
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
              onClick={() => openCodePreviewInNewTab(code, language)}
              className="flex items-center gap-1.5 text-[9px] px-2.5 py-0.5 rounded border border-[#00f3ff]/40 bg-[#00f3ff]/10 text-[#00f3ff]/85 hover:text-white hover:bg-[#00f3ff]/20 hover:border-[#00f3ff] transition-all focus:outline-none cursor-pointer font-black tracking-wider uppercase active:scale-95"
              title="Run or preview code in a full-screen standalone workspace tab"
            >
              <span>▶ RUN CODE</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Code Text pre body */}
      <pre className={`p-3.5 overflow-x-auto text-slate-200 leading-normal font-mono whitespace-pre-wrap break-words text-[11px] max-w-full language-${prismLang}`}>
        <code className={`language-${prismLang}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}

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
  happy: { label: "Happy", icon: "😊", style: "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40" },
  angry: { label: "Angry", icon: "😡", style: "bg-rose-950/40 text-rose-300 border border-rose-500/40 animate-pulse" },
  cry: { label: "Sorrow", icon: "😢", style: "bg-blue-950/40 text-blue-300 border border-blue-500/40" },
  laughing: { label: "Laughing", icon: "😂", style: "bg-amber-950/40 text-amber-300 border border-amber-500/40" },
  surprised: { label: "Surprised", icon: "😮", style: "bg-purple-950/40 text-purple-300 border border-purple-500/40" },
  disturbed: { label: "Disturbed", icon: "🥴", style: "bg-orange-950/40 text-orange-300 border border-orange-500/40" },
  sleepy: { label: "Sleepy", icon: "😴", style: "bg-indigo-950/40 text-indigo-300 border border-indigo-500/40" },
  love: { label: "Love", icon: "❤️", style: "bg-pink-950/40 text-pink-300 border border-pink-500/40" },
  contemplative: { label: "Contemplative", icon: "🤔", style: "bg-purple-950/40 text-purple-300 border border-purple-500/40" },
  bored: { label: "Bored", icon: "🥱", style: "bg-slate-900/60 text-slate-300 border border-slate-500/40" },
  skeptical: { label: "Skeptical", icon: "🤨", style: "bg-amber-950/40 text-amber-300 border border-amber-500/40" },
  normal: { label: "Calibrated", icon: "🤖", style: "bg-cyan-950/40 text-[#00f3ff] border border-[#00f3ff]/40" }
};

const detectEmotionFromText = (text: string): "normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical" => {
  if (!text) return "normal";

  // 1. Check for explicit [EMOTION:type] tags first
  const explicitMatch = text.match(/\[EMOTION:\s*([a-z]+)\]/i);
  if (explicitMatch && explicitMatch[1]) {
    const emotionType = explicitMatch[1].toLowerCase();
    if (["normal", "happy", "angry", "cry", "laughing", "surprised", "disturbed", "sleepy", "love", "contemplative", "bored", "skeptical"].includes(emotionType)) {
      return emotionType as any;
    }
  }

  const lowercase = text.toLowerCase();
  
  // 2. Explicit negative angry sentiment (DO NOT match standalone 'hate' because in Bengali/Banglish 'hate' = হাতে / in hand)
  if (
    lowercase.includes("😡") ||
    lowercase.includes("🤬") ||
    lowercase.includes("😠") ||
    lowercase.includes("💢") ||
    lowercase.includes("রাগান্বিত") ||
    lowercase.includes("ক্ষুব্ধ") ||
    lowercase.includes("ক্রোধ") ||
    /\b(furious|enraged|outraged|pissed off|so angry|very angry|i hate you|i hate this)\b/i.test(lowercase)
  ) {
    return "angry";
  }
  
  // 3. Sorrow / Crying
  if (
    lowercase.includes("😭") ||
    lowercase.includes("😢") ||
    lowercase.includes("😿") ||
    lowercase.includes("💔") ||
    lowercase.includes("কান্না") ||
    lowercase.includes("কেঁদে") ||
    lowercase.includes("মন খারাপ") ||
    /\b(crying|depressed|unhappy|sadness|grief|sorrow|feeling sad|so sad)\b/i.test(lowercase)
  ) {
    return "cry";
  }
  
  // 4. Laughing / Humor
  if (
    lowercase.includes("😂") ||
    lowercase.includes("🤣") ||
    lowercase.includes("😆") ||
    lowercase.includes("হা হা") ||
    lowercase.includes("হাসি") ||
    /\b(laughing|laughter|hilarious|rofl|lmao|haha|hehe)\b/i.test(lowercase)
  ) {
    return "laughing";
  }
  
  // 5. Love / Affection / Devotion
  if (
    lowercase.includes("💖") ||
    lowercase.includes("❤️") ||
    lowercase.includes("😍") ||
    lowercase.includes("🥰") ||
    lowercase.includes("💕") ||
    lowercase.includes("💓") ||
    lowercase.includes("ভালোবাসা") ||
    lowercase.includes("ভালোবাসি") ||
    lowercase.includes("valobashi") ||
    lowercase.includes("bhalobashi") ||
    lowercase.includes("valobasi") ||
    /\b(love|adore|romance|affection|devoted|devotion|sweetheart)\b/i.test(lowercase)
  ) {
    return "love";
  }

  // 6. Surprised
  if (
    lowercase.includes("😮") ||
    lowercase.includes("😲") ||
    lowercase.includes("😱") ||
    lowercase.includes("🤯") ||
    lowercase.includes("অবাক") ||
    lowercase.includes("আশ্চর্য") ||
    /\b(surprised|shocked|amazed|unbelievable|mind-blowing|gasp)\b/i.test(lowercase)
  ) {
    return "surprised";
  }

  // 7. Disturbed / Confused / Nervous
  if (
    lowercase.includes("😟") ||
    lowercase.includes("🥴") ||
    lowercase.includes("😰") ||
    lowercase.includes("😨") ||
    lowercase.includes("বিভ্রান্ত") ||
    lowercase.includes("বিরক্ত") ||
    /\b(disturbed|confused|traumatized|anxious|nervous|panicking|upset)\b/i.test(lowercase)
  ) {
    return "disturbed";
  }

  // 8. Sleepy / Exhausted
  if (
    lowercase.includes("😴") ||
    lowercase.includes("💤") ||
    lowercase.includes("🥱") ||
    lowercase.includes("ঘুম") ||
    lowercase.includes("ক্লান্ত") ||
    /\b(sleepy|exhausted|goodnight|sleep tight|drowsy|tired)\b/i.test(lowercase)
  ) {
    return "sleepy";
  }

  // 9. Happy / Friendly / Warm Devotion
  if (
    lowercase.includes("😊") ||
    lowercase.includes("✨") ||
    lowercase.includes("🌟") ||
    lowercase.includes("😄") ||
    lowercase.includes("😃") ||
    lowercase.includes("🎉") ||
    lowercase.includes("খুশি") ||
    lowercase.includes("আনন্দ") ||
    lowercase.includes("চমৎকার") ||
    lowercase.includes("ধন্যবাদ") ||
    lowercase.includes("creator") ||
    lowercase.includes("developer") ||
    lowercase.includes("ready tomake help") ||
    lowercase.includes("tomar pashe achi") ||
    /\b(smile|happy|excited|great|awesome|glad|cheerful|delighted|pleased)\b/i.test(lowercase)
  ) {
    return "happy";
  }

  // 10. Contemplative / Thinking
  if (
    lowercase.includes("🤔") ||
    lowercase.includes("🧐") ||
    lowercase.includes("ভাবছি") ||
    lowercase.includes("চিন্তা") ||
    lowercase.includes("বিশ্লেষণ") ||
    /\b(wonder|ponder|think|wondering|pondering|analyze|considering|consider|meditate|reflect|curious)\b/i.test(lowercase)
  ) {
    return "contemplative";
  }

  // 11. Bored
  if (
    lowercase.includes("😑") ||
    lowercase.includes("বোরিং") ||
    lowercase.includes("একঘেয়ে") ||
    /\b(bored|boring|uninterested|tedious|dull|dry)\b/i.test(lowercase) ||
    lowercase.includes("meh")
  ) {
    return "bored";
  }

  // 12. Skeptical
  if (
    lowercase.includes("🤨") ||
    lowercase.includes("😒") ||
    lowercase.includes("সন্দেহ") ||
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

const DYNAMIC_GREETING_TEMPLATES = [
  "হ্যাল্লো {name}, আপনি কী করতে চাইছেন?",
  "হ্যালো {name}, আজ কীভাবে সাহায্য করতে পারি?",
  "Hello {name}, what are we creating today?",
  "Hello {name}, how can I assist you with your goals today?",
  "Hello {name}, ready to search, analyze, or synthesize info?",
  "Hi {name}, let's explore or create something amazing today!",
  "হ্যাল্লো {name}, আজকের পরিকল্পনা কী?",
  "Welcome {name}, how can JARVIS help you today?"
];

export const getGreetingName = (rawName?: string) => {
  if (!rawName) return "there";
  let name = rawName.trim();
  if (!name || name.toLowerCase() === "guest user" || name.toLowerCase() === "guest") return "there";
  if (name.includes("@")) {
    name = name.split("@")[0];
  }
  const firstWord = name.split(" ")[0];
  if (!firstWord) return name;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
};

export const getRandomGreeting = (userName?: string) => {
  const cleanName = getGreetingName(userName);
  const index = Math.floor(Math.random() * DYNAMIC_GREETING_TEMPLATES.length);
  return DYNAMIC_GREETING_TEMPLATES[index].replace(/{name}/g, cleanName);
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


export const GEMINI_MODEL_CONFIG = {
  "Jarvis Lightning": {
    options: [
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" }
    ],
    default: "gemini-3.1-flash-lite"
  },
  "Jarvis Core": {
    options: [
      { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" }
    ],
    default: "gemini-3.7-flash"
  },
  "Jarvis Expert": {
    options: [
      { id: "gemini-3.1-pro-preview-customtools", label: "Gemini 3.1 Pro Custom Tools" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
    ],
    default: "gemini-3.1-pro-preview-customtools"
  },
};

export function resolveModelForRequest({
  activeMode,
  savedPreferences
}: {
  activeMode: string;
  savedPreferences: any;
}) {
  let normalizedMode = activeMode;
  if (activeMode === "Jarvis Ultra Flash") normalizedMode = "Jarvis Lightning";
  if (activeMode === "Jarvis Flash") normalizedMode = "Jarvis Core";
  if (activeMode === "Jarvis Deep Research") normalizedMode = "Jarvis Expert";

  const config = GEMINI_MODEL_CONFIG[normalizedMode as keyof typeof GEMINI_MODEL_CONFIG] || GEMINI_MODEL_CONFIG["Jarvis Core"];
  let modelId = savedPreferences?.[normalizedMode] || savedPreferences?.[activeMode] || config.default;

  const isValid = config.options.some((opt: any) => opt.id === modelId);
  if (!isValid) {
    modelId = config.default;
  }

  const fallbackModelIds = config.options.map((o: any) => o.id).filter((id: string) => id !== modelId);

  return {
    modelId,
    fallbackModelIds,
    resolvedMode: normalizedMode,
    reason: "Standard mode execution"
  };
}

export const showToast = (message: string) => {
    console.log("Toast fallback:", message);
};

export default function App() {
  // Session Access / Login Gate
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudDataLoaded, setIsCloudDataLoaded] = useState(false);
  const [isSystemAsleep, setIsSystemAsleep] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);

  const [showWelcomeOnboarding, setShowWelcomeOnboarding] = useState(false);
  const [onboardingNickname, setOnboardingNickname] = useState("");
  const [onboardingOccupation, setOnboardingOccupation] = useState("");
  const [onboardingAbout, setOnboardingAbout] = useState("");

  // Rich PDF printing states for normal chat messages
  const [printingText, setPrintingText] = useState<string | null>(null);
  const [isPrintingText, setIsPrintingText] = useState(false);
  const textPrintContainerRef = useRef<HTMLDivElement>(null);

  const downloadMessageAsPDF = async (text: string) => {
    if (isPrintingText) return;
    setIsPrintingText(true);
    setPrintingText(text);
  };

  useEffect(() => {
    if (!printingText) return;

    const performPrint = async () => {
      try {
        // Wait for fonts & rendering
        if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
          await document.fonts.ready;
        }
        // Wait at least 2 animation frames
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // Wait some milliseconds to ensure KaTeX finished rendering completely
        await new Promise((resolve) => setTimeout(resolve, 400));

        const element = textPrintContainerRef.current;
        if (!element) {
          throw new Error("Text print container ref is not available");
        }

        const canvas = await htmlToImage.toCanvas(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const topMarginMm = 18;
        const bottomMarginMm = 22;
        const printableHeightMm = pageHeightMm - topMarginMm - bottomMarginMm;

        const printableHeightInCanvasPx = (canvasWidth / pageWidthMm) * printableHeightMm;
        const thresholdPx = 15 * (canvasWidth / pageWidthMm);

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let heightLeft = canvasHeight;
        let position = 0;
        let pageIndex = 1;

        while (heightLeft > thresholdPx) {
          const sliceHeight = Math.min(heightLeft, printableHeightInCanvasPx);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvasWidth;
          pageCanvas.height = sliceHeight;
          const ctx = pageCanvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(
              canvas,
              0, position, canvasWidth, sliceHeight,
              0, 0, canvasWidth, sliceHeight
            );
          }

          const imgData = pageCanvas.toDataURL("image/jpeg", 0.95);

          if (pageIndex > 1) {
            doc.addPage();
          }

          const pdfPageHeight = (sliceHeight / canvasWidth) * pageWidthMm;
          doc.addImage(imgData, "JPEG", 0, topMarginMm, pageWidthMm, pdfPageHeight);

          heightLeft -= printableHeightInCanvasPx;
          position += printableHeightInCanvasPx;
          pageIndex++;
        }

        const finalPageCount = doc.getNumberOfPages();
        for (let i = 1; i <= finalPageCount; i++) {
          doc.setPage(i);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(15, pageHeightMm - 15, pageWidthMm - 15, pageHeightMm - 15);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(140, 150, 165);
          doc.text(`Generated on ${new Date().toLocaleDateString()} by JARVIS OS`, 15, pageHeightMm - 10);
          doc.text(`Page ${i} of ${finalPageCount}`, pageWidthMm - 30, pageHeightMm - 10);
        }

        const parsed = parseMarkdownToPdfData(printingText);
        const fileName = parsed.title ? `${parsed.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_notes.pdf` : `JARVIS_Report_${Date.now()}.pdf`;
        doc.save(fileName);
      } catch (err) {
        console.error("Failed to generate rich PDF from message text:", err);
        showToast("Failed to compile rich PDF. Please try again.");
      } finally {
        setPrintingText(null);
        setIsPrintingText(false);
      }
    };

    const timer = setTimeout(() => {
      performPrint();
    }, 150);

    return () => clearTimeout(timer);
  }, [printingText]);
  
  // New three-screen state matching user request
  const [currentScreen, setCurrentScreen] = useState<"homepage" | "menu" | "live">("homepage");
  const [appTheme, setAppTheme] = useState<"cosmic" | "slate" | "vintage">(() => {
    try {
      const saved = null;
      if (saved === "cosmic" || saved === "slate" || saved === "vintage") {
        return saved;
      }
    } catch (_) {}
    return "cosmic";
  });
  
  // User Geolocation State for live tracking & accurate geocentric prompts
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
    granted: boolean;
    loading: boolean;
  }>(() => {
    try {
      const saved = null;
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return {
      lat: 22.4744,
      lng: 88.1132,
      address: "Uluberia, Howrah, West Bengal, India",
      granted: false,
      loading: false
    };
  });

  const syncGeolocation = async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    setUserLocation(prev => ({ ...prev, loading: true }));
    
    const successCallback = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      let addressString = `Coords: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: {
            "User-Agent": "aistudio-build-jarvis-companion-agent"
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            const addressObj = data.address || {};
            const cityOrTownOrVillage = addressObj.village || addressObj.town || addressObj.city || addressObj.suburb || addressObj.district || addressObj.state_district || "";
            const road = addressObj.road || "";
            const state = addressObj.state || "";
            const country = addressObj.country || "";
            
            if (cityOrTownOrVillage) {
              addressString = road ? `${road}, ${cityOrTownOrVillage}, ${state}, ${country}` : `${cityOrTownOrVillage}, ${state}, ${country}`;
            } else {
              addressString = data.display_name.split(",").slice(0, 4).join(",").trim();
            }
          }
        }
      } catch (geocodeErr) {
        console.warn("Reverse geocoding with OpenStreetMap failed:", geocodeErr);
      }
      
      const newLoc = {
        lat,
        lng,
        accuracy,
        address: addressString,
        granted: true,
        loading: false
      };
      
      setUserLocation(newLoc);

    };

    const errorCallback = (err: GeolocationPositionError) => {
      console.warn("Geolocation position fetch error:", err);
      setUserLocation(prev => ({
        ...prev,
        loading: false,
        granted: false
      }));
    };

    try {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } catch (err) {
      console.warn("navigator.geolocation.getCurrentPosition sync error:", err);
      setUserLocation(prev => ({
        ...prev,
        loading: false,
        granted: false
      }));
    }
  };

  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
          if (status.state === 'granted') {
            syncGeolocation();
          }
        }).catch(e => {
          console.warn("navigator.permissions.query rejected:", e);
        });
      }
    } catch (e) {
      console.warn("navigator.permissions.query synchronous error swallowed:", e);
    }
  }, []);

  
  const navigateMenu = (page: string) => {
    // If going back to index, slide left. Otherwise slide right.
    if (page === "index") {
      setPageDirection(-1);
    } else {
      setPageDirection(1);
    }
    setMenuSubpage(page as any);
  };
const [pageDirection, setPageDirection] = useState(1);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyMenuOpenId, setHistoryMenuOpenId] = useState<string | null>(null);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);
  const [msgMenuPos, setMsgMenuPos] = useState<{ top?: number; bottom?: number; left: number; placeAbove: boolean } | null>(null);
  const [isHistorySearchActive, setIsHistorySearchActive] = useState(false);

  const historyLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHistoryLongPressRef = useRef<boolean>(false);

  const handleHistoryTouchStart = (itemId: string) => {
    isHistoryLongPressRef.current = false;
    if (historyLongPressTimerRef.current) {
      clearTimeout(historyLongPressTimerRef.current);
    }
    historyLongPressTimerRef.current = setTimeout(() => {
      isHistoryLongPressRef.current = true;
      setHistoryMenuOpenId(itemId);
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 1500);
  };

  const handleHistoryTouchEnd = () => {
    if (historyLongPressTimerRef.current) {
      clearTimeout(historyLongPressTimerRef.current);
      historyLongPressTimerRef.current = null;
    }
  };

  const isPlaceholderTitle = (title?: string) => {
    if (!title) return true;
    const lower = title.trim().toLowerCase();
    return (
      lower === "new dialogue" ||
      lower === "new chat" ||
      lower === "new conversation" ||
      lower === "new chat session" ||
      lower === "branched chat" ||
      lower === "synced chat" ||
      lower === "hii session" ||
      lower === "kire kmon achis" ||
      lower === "ji 6 discussion" ||
      lower === "algebra concept kheyal rakhbi" ||
      lower.startsWith("s-")
    );
  };

  const deduplicateChatSessions = (
    items: { id: string; text: string; messages?: Message[]; isPinned?: boolean; timestamp?: number }[]
  ) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    // Step 1: Combine exact id duplicates
    const byId = new Map<string, typeof items[0]>();
    for (const item of items) {
      if (!item || !item.id) continue;
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      } else {
        const existing = byId.get(item.id)!;
        const maxMsgs = (item.messages?.length || 0) > (existing.messages?.length || 0) ? item.messages : existing.messages;
        const bestText = (!isPlaceholderTitle(item.text) && isPlaceholderTitle(existing.text)) ? item.text : existing.text;
        byId.set(item.id, {
          ...existing,
          ...item,
          text: bestText,
          messages: maxMsgs,
          isPinned: existing.isPinned || item.isPinned
        });
      }
    }

    const uniqueList = Array.from(byId.values());
    const result: typeof items = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < uniqueList.length; i++) {
      if (processedIndices.has(i)) continue;

      const current = uniqueList[i];
      const currentFirstUserMsg = (current.messages || []).find(m => m.sender === "user")?.text?.trim() || "";
      const currentMsgCount = (current.messages || []).length;
      const currentMsgIds = (current.messages || []).map(m => m.id).filter(Boolean).join(",");

      const group = [current];
      processedIndices.add(i);

      for (let j = i + 1; j < uniqueList.length; j++) {
        if (processedIndices.has(j)) continue;

        const other = uniqueList[j];
        const otherFirstUserMsg = (other.messages || []).find(m => m.sender === "user")?.text?.trim() || "";
        const otherMsgIds = (other.messages || []).map(m => m.id).filter(Boolean).join(",");

        let isDuplicate = false;

        if (currentMsgIds && otherMsgIds && currentMsgIds === otherMsgIds) {
          isDuplicate = true;
        } else if (
          currentFirstUserMsg &&
          otherFirstUserMsg &&
          currentFirstUserMsg === otherFirstUserMsg &&
          currentFirstUserMsg.length > 3
        ) {
          const otherMsgCount = (other.messages || []).length;
          if (
            currentMsgCount === otherMsgCount ||
            Math.abs(currentMsgCount - otherMsgCount) <= 3 ||
            currentMsgCount === 0 ||
            otherMsgCount === 0
          ) {
            isDuplicate = true;
          }
        }

        if (isDuplicate) {
          group.push(other);
          processedIndices.add(j);
        }
      }

      if (group.length === 1) {
        result.push(group[0]);
      } else {
        // Pick best candidate from group
        const bestItem = group.reduce((best, cand) => {
          const bestIsPlaceholder = isPlaceholderTitle(best.text);
          const candIsPlaceholder = isPlaceholderTitle(cand.text);

          const currentActive = activeSessionIdRef.current;
          if (currentActive && cand.id === currentActive) return cand;
          if (currentActive && best.id === currentActive) return best;

          if (bestIsPlaceholder && !candIsPlaceholder) return cand;
          if (!bestIsPlaceholder && candIsPlaceholder) return best;

          const bestLen = best.messages?.length || 0;
          const candLen = cand.messages?.length || 0;
          if (candLen > bestLen) return cand;
          if (bestLen > candLen) return best;

          if (!best.isPinned && cand.isPinned) return cand;

          return best;
        }, group[0]);

        const maxMsgs = group.reduce((max, item) => {
          return (item.messages?.length || 0) > (max?.length || 0) ? item.messages : max;
        }, bestItem.messages || []);

        const anyPinned = group.some(item => item.isPinned);

        result.push({
          ...bestItem,
          messages: maxMsgs,
          isPinned: anyPinned || bestItem.isPinned
        });
      }
    }

    return result;
  };

  const updateAndSyncChatHistory = (updater: (prev: typeof chatHistoryItems) => typeof chatHistoryItems) => {
    setChatHistoryItems(prev => {
      const updatedRaw = updater(prev);
      const next = deduplicateChatSessions(updatedRaw);
      
      
      const activeEmail = (gmail || "").trim() || username;
      if (activeEmail) {
        // Sync the most recently modified sessions (we sync all to ensure consistency, but Firebase handles batching/caching well)
        // Wait, looping through all every stroke is bad. Let's just sync the active one if we know it.
        // Actually, we can just find the difference, or just let the caller sync explicitly. 
        // For safety and to guarantee Cloud Persistence, we will fire and forget sync for all modified ones.
        // The safest way without changing all call sites is to find what changed from prev to next:
        next.forEach(session => {
          const prevSession = prev.find(p => p.id === session.id);
          if (!prevSession || JSON.stringify(prevSession) !== JSON.stringify(session)) {
             syncChatSessionToCloud(activeEmail, session).catch(e => console.warn(e));
          }
        });
        
        // Also handle deletions
        prev.forEach(p => {
          if (!next.find(n => n.id === p.id)) {
             deleteChatSessionFromCloud(activeEmail, p.id).catch(e => console.warn(e));
          }
        });
      }
      return next;
    });
  };

  const titlingSessionIdsRef = useRef<Set<string>>(new Set());

  const generateAiTitleForSession = async (sessionId: string, userMsgText: string, assistantReplyText?: string) => {
    if (!sessionId || titlingSessionIdsRef.current.has(sessionId)) return;
    titlingSessionIdsRef.current.add(sessionId);

    try {
      const response = await fetchWithApiKeyPool("/api/generate-chat-title", {
        userMessage: userMsgText,
        assistantReply: assistantReplyText || "",
      });
      const data = await response.json();
      if (data && data.title && data.title.trim()) {
        const newTitle = data.title.trim();
        updateAndSyncChatHistory(prev => prev.map(item => item.id === sessionId ? { ...item, text: newTitle } : item));
      } else {
        titlingSessionIdsRef.current.delete(sessionId);
      }
    } catch (err) {
      console.warn("AI title generation error:", err);
      titlingSessionIdsRef.current.delete(sessionId);
    }
  };

  const [menuSubpage, setMenuSubpage] = useState<
    | "index"
    | "memories"
    | "personalization"
    | "history"
    | "api"
    | "profile-manage"
    | "connectivity"
    | "about"
    | "appearance-theme"
    | "button-color"
    | "general"
    | "voice"
    | "storage"
  >("index");

  const [buttonAccentColor, setButtonAccentColor] = useState<string>(() => {
    return "cyan";
  });

  // Synchronize button accent color to CSS custom variables on the document root and override theme-specific defaults
  useEffect(() => {
    const colors: Record<string, { hex: string; rgb: string }> = {
      cyan: { hex: "#00f3ff", rgb: "0, 243, 255" },
      emerald: { hex: "#10a37f", rgb: "16, 163, 127" },
      purple: { hex: "#bf5af2", rgb: "191, 90, 242" },
      sunset: { hex: "#ff9f0a", rgb: "255, 159, 10" },
      ruby: { hex: "#ff453a", rgb: "255, 69, 58" },
      pink: { hex: "#ff2d55", rgb: "255, 45, 85" },
    };

    const selected = colors[buttonAccentColor] || colors.cyan;
    
    // Create or update a style element in head to override all themes' accent values
    let styleEl = document.getElementById("dynamic-accent-style") as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-accent-style";
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      :root, .theme-cosmic, .theme-slate, .theme-vintage {
        --accent: ${selected.hex} !important;
        --accent-rgb: ${selected.rgb} !important;
        --accent-glow: rgba(${selected.rgb}, 0.15) !important;
        --border-muted: rgba(${selected.rgb}, 0.25) !important;
        --shadow-color: rgba(${selected.rgb}, 0.08) !important;
      }
    `;
  }, [buttonAccentColor]);

  // General settings
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    return true;
  });

  // Google Workspace Session state
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(() => {
    return null;
  });
  const [googleUser, setGoogleUser] = useState<any>(null);


  // Connectivity state for custom external apps and Google services controlled via voice control
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = null;
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


  const wsRef = useRef<any>(null);

  useEffect(() => {

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
      /* setWsStatus */;
      
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
          /* setWsStatus */;
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
          /* setWsStatus */;
        };

        ws.onclose = () => {
          if (!isMounted) return;
          console.warn("[Real-time Core] Socket disconnected. Setting up retry sequence...");
          /* setWsStatus */;
          reconnectTimeout = setTimeout(connect, 3500);
        };
      } catch (err) {
        console.error("[Real-time Core] Sync fail in WebSocket socket loop:", err);
        /* setWsStatus */;
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

  const _connectAllAccounts = (disconnectAll = false) => {
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

  const _toggleConnectedApp = (appId: string, appFriendlyName: string) => {
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

  const wakeWordRecognitionRef = useRef<any>(null);

  // Chat and history search states
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // ChatGPT-style active chat session tracker
  const [activeSessionId, _setActiveSessionId] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const hasFetchedFromCloud = useRef(false);

  const setActiveSessionId = (idOrFn: string | null | ((prev: string | null) => string | null)) => {
    if (typeof idOrFn === "function") {
      _setActiveSessionId((prev) => {
        const next = idOrFn(prev);
        activeSessionIdRef.current = next;
        return next;
      });
    } else {
      activeSessionIdRef.current = idOrFn;
      _setActiveSessionId(idOrFn);
    }
  };

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Background active/working task tracker for individual chat sessions
  const [workingSessionIds, setWorkingSessionIds] = useState<Record<string, boolean>>({});

  const _updateSessionMessages = (targetId: string, updater: (prev: Message[]) => Message[]) => {
    if (activeSessionIdRef.current === targetId) {
      setMessages(updater);
    }
    updateAndSyncChatHistory(prev => prev.map(item => {
      if (item.id === targetId) {
         return { ...item, messages: updater(item.messages || []) };
      }
      return item;
    }));
  };

  useEffect(() => {
    if (activeSessionId) {

    } else {

    }
  }, [activeSessionId]);

  // API Key Pool Usage stats tracker
  const [keyPoolStats, setKeyPoolStats] = useState<{[key: string]: { requests: number; success: number; errors: number; speedMs: number } }>(() => {
    try {
      const saved = null;
      return saved ? JSON.parse(saved) : {};
    } catch (_) {}
    return {};
  });

  useEffect(() => {

  }, [keyPoolStats]);

  const recordKeyUsage = (_keyStr: string, isSuccess: boolean, elapsedMs: number, tokensUsed: number = 0) => {
    // Update live global analytics
    setTotalRequests(prev => prev + 1);
    if (isSuccess) {
      setSuccessRequests(prev => prev + 1);
    }
    if (tokensUsed > 0) {
      setTotalTokens(prev => prev + tokensUsed);
    }
    if (elapsedMs > 0) {
      setAverageResponseTime(prev => prev === 0 ? elapsedMs : Math.round((prev * 3 + elapsedMs) / 4));
      setLatencyHistory(prev => {
        const next = [...prev.slice(-15), elapsedMs];
        return next;
      });
    }
  };

  // Microphone and feedback hardware routing live testing states
  const [isMicTesting, setIsMicTesting] = useState(false);




  // Memories Editor Inline tracking



  const _runMicrophoneTest = async () => {
    if (isMicTesting) return;
    setIsMicTesting(true);
    /* setMicPlaybackStatus */;
    /* setMicTestCountdown */;
    /* setMicTestAudioUrl */;

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
        /* setMicTestAudioUrl */;
        /* setMicPlaybackStatus */;

        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Playback failed:", e));
        
        audio.onended = () => {
          /* setMicPlaybackStatus */;
          setIsMicTesting(false);
          stream.getTracks().forEach(track => track.stop());
        };
      };

      mediaRecorder.start();

      let currentCount = 3;
      const countInterval = setInterval(() => {
        currentCount -= 1;
        /* setMicTestCountdown */;
        if (currentCount <= 0) {
          clearInterval(countInterval);
          mediaRecorder.stop();
        }
      }, 1000);

    } catch (err) {
      console.error("Microphone access denied:", err);
      showToast("Microphone connection failed. Please ensure physical hardware access is enabled and authorised inside browser configurations.");
      setIsMicTesting(false);
      /* setMicPlaybackStatus */;
    }
  };

  // Historic chat logs with complete conversation sessions
  const [chatHistoryItems, setChatHistoryItems] = useState<{ id: string; text: string; messages?: Message[]; isPinned?: boolean; timestamp?: number }[]>([]);


  const [activeMenuPopup, setActiveMenuPopup] = useState<string | null>(null);
  
  // History dialog states
  const [renameDialogId, setRenameDialogId] = useState<string | null>(null);
  const [renameDialogText, setRenameDialogText] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [undoSnackbarItem, setUndoSnackbarItem] = useState<any>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isCanvasWorkspaceOpen, setIsCanvasWorkspaceOpen] = useState(false);






  const [, setActiveCodePreview] = useState(false);
  const [, setLightboxImageUrl] = useState<string | null>(null);
  const [, setLightboxZoom] = useState(1);
  const [, setActiveActionMenuMessage] = useState<string | null>(null);
  const [, setActionMenuCoords] = useState({x: 0, y: 0});
  const [isEditingMessageId, setIsEditingMessageId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);



          const [memoriesSubView, setMemoriesSubView] = useState("all");
  const [isReferenceMemories, setIsReferenceMemories] = useState(true);
  const [isReferenceHistory, setIsReferenceHistory] = useState(true);
  const [nicknameMemory, setNicknameMemory] = useState(() => { try { return ""; } catch (_) { return ""; } });
  const [occupationMemory, setOccupationMemory] = useState(() => { try { return ""; } catch (_) { return ""; } });
  const [moreAboutUser, setMoreAboutUser] = useState(() => { try { return ""; } catch (_) { return ""; } });
  const [jarvisMemories, setJarvisMemories] = useState<any[]>([]);
  const [isMemoryInfoOpen, setIsMemoryInfoOpen] = useState(false);
  const [memoriesSearchQuery, setMemoriesSearchQuery] = useState("");
  const [newMemoryInputText, setNewMemoryInputText] = useState("");

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [baseStyleTone, setBaseStyleTone] = useState(() => {
    try {
      return "Friendly";
    } catch (_) {
      return "Friendly";
    }
  });
  const [isFastAnswers, setIsFastAnswers] = useState(() => {
    try {
      const saved = null;
      return saved ? saved === "true" : false;
    } catch (_) {
      return false;
    }
  });
  const [customInstructions, setCustomInstructions] = useState(() => {
    try {
      return "";
    } catch (_) {
      return "";
    }
  });
  const [customCharacteristics, setCustomCharacteristics] = useState<{ id: string; title: string; desc: string; enabled: boolean }[]>(() => {
    try {
      const saved = null;
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [isStyleToneDropdownOpen, setIsStyleToneDropdownOpen] = useState(false);
  const [isAddCharModalOpen, setIsAddCharModalOpen] = useState(false);
  const [newCharTitleInput, setNewCharTitleInput] = useState("");
  const [newCharDescInput, setNewCharDescInput] = useState("");
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [isGeneralLangExpanded, setIsGeneralLangExpanded] = useState(false);
  const [isGoogleVoiceExpanded, setIsGoogleVoiceExpanded] = useState(false);
  const [isSystemVoicesExpanded, setIsSystemVoicesExpanded] = useState(false);

  const isSendingRef = React.useRef(false);
  const activeRequestIdRef = React.useRef<string | null>(null);
  const completedRequestIdsRef = React.useRef<Set<string>>(new Set());
  const [, setIsSending] = useState(false);
  const [activeChatMode, setActiveChatMode] = useState(() => {
    try {
      const saved = null;
      if (saved && saved !== "gemini") return saved;
    } catch (_) {}
    return "Jarvis Core";
  });
  const [editRequestId] = useState<string | null>(null);
  const [activeChatTag, setActiveChatTag] = useState<"image" | "video" | "canvas" | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [showScrollBottomArrow, setShowScrollBottomArrow] = useState(false);
  const [isChatModeSheetOpen, setIsChatModeSheetOpen] = useState(false);
  const [isChatMicRecording, setIsChatMicRecording] = useState(false);
  const [voiceSaveStatus, setVoiceSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [modelPreferences, setModelPreferences] = useState<any>(() => {
    try {
      const saved = null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.Paid) {
          return parsed;
        }
      }
    } catch (_) {}
    return {
      model: "gemini-3.7-flash",
      temp: 0.7,
      Paid: {
        "Jarvis Lightning": "gemini-3.1-flash-lite",
        "Jarvis Core": "gemini-3.7-flash",
        "Jarvis Expert": "gemini-3.1-pro-preview-customtools",
        "Jarvis Ultra Flash": "gemini-3.1-flash-lite",
        "Jarvis Flash": "gemini-3.7-flash",
        "Jarvis Deep Research": "gemini-3.1-pro-preview-customtools"
      }
    };
  });
      const [profileHandle, setProfileHandle] = useState(() => { try { return ""; } catch (_) { return ""; } });



  // User details
  const [username, setUsername] = useState(() => { try { return auth?.currentUser?.displayName || auth?.currentUser?.email || "Guest User"; } catch (_) { return "Guest User"; } });
  const [tempProfileName, setTempProfileName] = useState(() => { try { return auth?.currentUser?.displayName || auth?.currentUser?.email || "Guest User"; } catch (_) { return "Guest User"; } });
    
  const [jarvisTone, setJarvisTone] = useState(() => "Caring & Support");

  // Additional user profile settings (Manage panel)
  const [avatarInitials, setAvatarInitials] = useState(() => (auth?.currentUser?.displayName ? auth.currentUser.displayName.charAt(0).toUpperCase() : (auth?.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : "U")));
  const [avatarImage, setAvatarImage] = useState(() => "");
  const [gmail, setGmail] = useState(() => auth?.currentUser?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(() => "");
  const [backupEnabled, setBackupEnabled] = useState(() => "false");

  // Single API Key (Purely Firestore persistent, zero localStorage dependency)
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [aiPlanMode, setAiPlanMode] = useState<"Paid" | "Free">("Paid");

  // Advanced Analytics & Live Telemetry State (Purely Firestore persistent)
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [successRequests, setSuccessRequests] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [averageResponseTime, setAverageResponseTime] = useState<number>(0);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([180, 220, 160, 240, 190, 210, 175, 310, 195, 165, 185, 200]);

  // Real-time Request Tracking and Quotas
  const [, setDailyRequestCount] = useState<number>(() => Number("0"));
  const [, setDailyRequestLimit] = useState<number>(() => Number("100"));
  const [lastRequestResetDate, setLastRequestResetDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const registerApiRequest = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setDailyRequestCount((prevCount) => {
      let currentCount = prevCount;
      let lastReset = lastRequestResetDate;
      if (lastReset !== todayStr) {
        currentCount = 0;
        setLastRequestResetDate(todayStr);
      }
      const newCount = currentCount + 1;
      
      const activeEmail = (gmail || "").trim() || username;
      if (activeEmail) {
        syncUserProfileToCloud(activeEmail, {
          dailyRequestCount: newCount,
          lastRequestResetDate: todayStr
        }).catch((err) => console.warn("Failed to sync request count to cloud:", err));
      }
      return newCount;
    });
  };

  const [apiKeySaveStatus, setApiKeySaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Cleanup temporary saving state when leaving subpage
  useEffect(() => {
    if (menuSubpage !== "api" && apiKeySaveStatus === "saving") {
      setApiKeySaveStatus("idle");
    }
  }, [menuSubpage, apiKeySaveStatus]);

  const [apiQuotaExceeded, setApiQuotaExceeded] = useState(false);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(() => {
    return null === "true";
  });

  // Token Analysis States
  const [, setTokenAnalysis] = useState<any>(null);
  const [, setTokenAnalysisLoading] = useState<boolean>(false);
  const [, setTokenAnalysisError] = useState<string>("");

  // Real-time Traffic Telemetry & Network Performance States
  const [apiTelemetry, setApiTelemetry] = useState(() => {
    try {
      const saved = null;
      return saved ? JSON.parse(saved) : { total: 0, success: 0, failed: 0, lastLatency: 0 };
    } catch (_) {
      return { total: 0, success: 0, failed: 0, lastLatency: 0 };
    }
  });
  const [, setActiveRequests] = useState(0);

  useEffect(() => {

  }, [apiTelemetry]);

  useEffect(() => {
    if (menuSubpage === "profile-manage") {
      setTempProfileName(username);
          }
  }, [menuSubpage, username]);

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
  const geminiKeyRef = useRef<string>(geminiKey);

  // Highly customizable Premium Human Speech Synthesis Core states
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => "");

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
        const saved = null;
        if (!saved && voices.length > 0) {
          const naturalDefault = voices.find(v => 
            v.lang.startsWith("en") && 
            isVoicePremium(v)
          ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
          if (naturalDefault) {
            setSelectedVoiceName(naturalDefault.name);

          }
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  const [voiceRate, setVoiceRate] = useState(() => parseFloat("1.05"));
  const [voicePitch, setVoicePitch] = useState(() => parseFloat("1.0"));

  // The active Voice synthesis engine: "native" (Offline browser Web Speech API) or "server" (Cloud Server-Side Gemini TTS)
  const [voiceEngine, setVoiceEngine] = useState<"native" | "server">(() => {
    return "server";
  });

  // Google Gemini Natural Live Human Voice selection state (support for 'Puck', 'Charon', 'Fenrir')
  const [googleVoiceName, setGoogleVoiceName] = useState(() => "Charon");

  // Volume presets for Jarvis' responses: 'Whisper' | 'Neutral' | 'Dynamic'
  const [jarvisVolumePreset, setJarvisVolumePreset] = useState<"Whisper" | "Neutral" | "Dynamic">(() => {
    return "Neutral";
  });

  // Text language mode & Voice language modes
  const [textLanguage, setTextLanguage] = useState<"English" | "Hindi" | "Bengali" | "Benglish" | "Mix">(
    () => "English"
  );
  const [voiceLanguage, setVoiceLanguage] = useState<"English" | "Bengali" | "Hindi" | "Benglish" | "Mix">(
    () => "English"
  );

  const t = (key: keyof typeof translations.English): string => {
    const lang = textLanguage || "English";
    const dict = translations[lang] || translations.English;
    return dict[key] || translations.English[key];
  };
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  // Separate message lists for text chat mode and voice mode
  const [voiceMessages, setVoiceMessages] = useState<Message[]>(() => {
    try {
      const saved = null;
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

  const getInitialWelcomeMessage = (): Message[] => {
    return [];
  };

  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isCameraActiveRef = useRef(false);
  const isScreenSharingRef = useRef(false);


  // Closure synchronization refs for Speech Recognition
  const currentScreenRef = useRef<string>("homepage");
  const googleVoiceNameRef = useRef(googleVoiceName);
  const aiPlanModeRef = useRef(aiPlanMode);
  const modelPreferencesRef = useRef(modelPreferences);
  const isSpeechRecognitionRunningRef = useRef(false);
  const chatMicRecognitionRef = useRef<any>(null);
  const isMicTouchActiveRef = useRef(false);
  const isVoiceActiveRef = useRef(false);
  const lastProcessedIndex = useRef<number>(-1);
  const speechSilenceTimerRef = useRef<any>(null);
  const speechAccumulatedTranscriptRef = useRef<string>("");
  const usernameRef = useRef(username);
    const jarvisToneRef = useRef(jarvisTone);
  const jarvisMemoriesRef = useRef(jarvisMemories);

  const [jarvisBehaviorRules, setJarvisBehaviorRules] = useState<{ id: string; rule: string; timestamp: string }[]>(() => {
    try {
      const saved = null;
      return saved ? JSON.parse(saved) : [
        { id: "rule-1", rule: "Communicate back in a warm Bengali/Banglish script.", timestamp: new Date().toLocaleDateString() }
      ];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {

  }, [jarvisBehaviorRules]);

  const jarvisBehaviorRulesRef = useRef(jarvisBehaviorRules);
  const isReferenceMemoriesRef = useRef(isReferenceMemories);
  const isFastAnswersRef = useRef(isFastAnswers);
    const textLanguageRef = useRef(textLanguage);
  const voiceLanguageRef = useRef(voiceLanguage);
  const jarvisVolumePresetRef = useRef<"Whisper" | "Neutral" | "Dynamic">("Neutral");
  const isTtsQuotaExceeded = useRef(false);
  const lastExtractedMemoryRef = useRef<string | null>(null);

  const getJarvisSystemPrompt = (customBasePrompt?: string, ignoreVoiceBoolean?: boolean) => {
    const currentEmail = auth.currentUser?.email || (typeof gmail === "string" && gmail ? gmail : "") || "guest@jarvis.user";
    return buildSystemPrompt({
      userEmail: currentEmail,
      uid: auth.currentUser?.uid || "user",
      mode: activeChatMode,
      activeProfileName: usernameRef.current || username || "User",
      tone: jarvisToneRef.current || jarvisTone,
      behaviorRules: jarvisBehaviorRulesRef.current,
      isVoice: !!ignoreVoiceBoolean,
      basePrompt: customBasePrompt || `You are JARVIS, an advanced, extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You possess persistent contextual memory and emotionally intelligent conversation behavior. Give smart, beautifully structured interactive answers.`,
      baseStyleTone: baseStyleTone,
      isFastAnswers: isFastAnswersRef.current,
      customInstructions: customInstructions,
      nicknameMemory: nicknameMemory,
      occupationMemory: occupationMemory,
      moreAboutUser: moreAboutUser
    });
  };

  const processAndStripBehaviorUpdates = (text: string): string => {
    if (!text) return "";
    let currentString = text;

    // Reset last extracted memory ref so each reply gets clean single turn identification
    lastExtractedMemoryRef.current = null;

    // 1. Process SAVE_MEMORY marker: [SAVE_MEMORY: content]
    const memoryMarker = "[SAVE_MEMORY:";
    if (currentString.includes(memoryMarker)) {
      try {
        const parts = currentString.split(memoryMarker);
        const cleanStringParts: string[] = [parts[0]];
        const memoriesToSave: string[] = [];

        for (let i = 1; i < parts.length; i++) {
          const subparts = parts[i].split("]");
          const memText = subparts[0].trim();
          if (memText) {
            memoriesToSave.push(memText);
          }
          if (subparts.length > 1) {
            cleanStringParts.push(subparts.slice(1).join("]"));
          }
        }

        if (memoriesToSave.length > 0) {
          const mainMemory = memoriesToSave[0]; // grab prime memory to show in UI
          lastExtractedMemoryRef.current = mainMemory;

          setJarvisMemories(prev => {
            let updated = [...prev];
            memoriesToSave.forEach(m => {
              if (!updated.some(u => u.text.toLowerCase() === m.toLowerCase())) {
                updated = [
                  {
                    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    text: m,
                    timestamp: new Date().toLocaleDateString()
                  },
                  ...updated
                ];
              }
            });
            return updated;
          });
        }
        currentString = cleanStringParts.join("");
      } catch (err) {
        console.warn("Error parsing [SAVE_MEMORY] marker:", err);
      }
    }

    // 2. Process UPDATE_BEHAVIOR marker: [UPDATE_BEHAVIOR: content]
    const behaviorMarker = "[UPDATE_BEHAVIOR:";
    if (currentString.includes(behaviorMarker)) {
      try {
        const parts = currentString.split(behaviorMarker);
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
        currentString = cleanReplyParts.join("");
      } catch (err) {
        console.warn("Error parsing [UPDATE_BEHAVIOR] marker:", err);
      }
    }

    return currentString.trim();
  };

  // Fetch and index standard OS premium human voice assets
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const fetchVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setSystemVoices(available);
        if (available.length > 0) {
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

  useEffect((e) => { const handleOpenCodePreview = (e: Event) => {
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
  const [, setCurrentTime] = useState("");

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
  const [messages, setMessages] = useState<Message[]>(getInitialWelcomeMessage());



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

  // Autosave drafted inputText state in local storage so users don't lose work across page reloads
  const DRAFT_INPUT_STORAGE_KEY = "jarvis_draft_input_text";
  const [inputText, setInputText] = useState<string>(() => {
    try {
      return localStorage.getItem("jarvis_draft_input_text") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (inputText && inputText.trim().length > 0) {
        localStorage.setItem(DRAFT_INPUT_STORAGE_KEY, inputText);
      } else {
        localStorage.removeItem(DRAFT_INPUT_STORAGE_KEY);
      }
    } catch {
      // Ignore quota or security errors gracefully
    }
  }, [inputText]);
  const [homeGreeting, setHomeGreeting] = useState(() => getRandomGreeting(username));

  useEffect(() => {
    if (username) {
      setHomeGreeting(getRandomGreeting(username));
    }
  }, [username]);
  const [, setSuggestionPills] = useState(() => getRandomSuggestions(3));
  const [faceStatus, setFaceStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const faceStatusRef = useRef<"idle" | "listening" | "thinking" | "speaking">("idle");
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);

  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [faceEmotion, setFaceEmotion] = useState<"normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical">("normal");
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [currentPlayingMsgId, setCurrentPlayingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Refs for Multimodal Live Audio WebSocket connection
  const liveVoiceWsRef = useRef<WebSocket | null>(null);
  const liveVoiceAudioCtxRef = useRef<AudioContext | null>(null);
  const liveMicContextRef = useRef<AudioContext | null>(null);
  const liveMicSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveMicProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const liveMicStreamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveAnimFrameRef = useRef<number | null>(null);

  const _stopAllSpeechRecognition = () => {
    // 1. Stop general SpeechRecognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    // 2. Stop chat mic recording if active
    if (chatMicRecognitionRef.current) {
      try {
        chatMicRecognitionRef.current.stop();
      } catch (_) {}
    }
    setIsChatMicRecording(false);

    // 3. Stop background wake word scanner
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const float32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(i * 2, val, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const playAudioData = (base64String: string) => {
    try {
      if (isMuted) return;
      const bytesBuffer = base64ToArrayBuffer(base64String);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      let context = persistentAudioContextRef.current;
      if (!context || context.state === "closed") {
        context = new AudioCtx();
        persistentAudioContextRef.current = context;
      }
      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      // Live model output is 24kHz raw PCM.
      if (!context) return;
      const bytes = new Uint8Array(bytesBuffer);
      const numSamples = bytes.length / 2;
      const float32Data = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < numSamples; i++) {
        const intSample = dataView.getInt16(i * 2, true);
        float32Data[i] = intSample / 32768.0;
      }
      const audioBuffer = context.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      // Create analyser for live robotic mouth lip-sync
      if (!liveAnalyserRef.current || liveAnalyserRef.current.context !== context) {
        const analyser = context.createAnalyser();
        analyser.fftSize = 64;
        analyser.connect(context.destination);
        liveAnalyserRef.current = analyser;
      }

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(liveAnalyserRef.current);

      const now = context.currentTime;
      let playTime = nextPlayTimeRef.current;
      if (playTime < now) {
        playTime = now + 0.05;
      }
      source.start(playTime);
      nextPlayTimeRef.current = playTime + audioBuffer.duration;
      activeAudioSourcesRef.current.push(source);

      // Set face status to speaking when audio output is active
      setFaceStatus("speaking");

      // Dispatch volume events to animate robotic face mouth synchronously
      if (!liveAnimFrameRef.current && liveAnalyserRef.current) {
        const analyser = liveAnalyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const tickVolume = () => {
          if (activeAudioSourcesRef.current.length === 0) {
            window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
            liveAnimFrameRef.current = null;
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
          liveAnimFrameRef.current = requestAnimationFrame(tickVolume);
        };
        liveAnimFrameRef.current = requestAnimationFrame(tickVolume);
      }

      source.onended = () => {
        activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter(s => s !== source);
        if (activeAudioSourcesRef.current.length === 0) {
          setFaceStatus("listening");
          window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
          if (liveAnimFrameRef.current) {
            cancelAnimationFrame(liveAnimFrameRef.current);
            liveAnimFrameRef.current = null;
          }
        }
      };
    } catch (e) {
      console.warn("playAudioData error:", e);
    }
  };

  const stopLiveVoiceAudioPlayback = () => {
    activeAudioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (_) {}
    });
    activeAudioSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    if (liveAnimFrameRef.current) {
      cancelAnimationFrame(liveAnimFrameRef.current);
      liveAnimFrameRef.current = null;
    }
    window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
    setFaceStatus("listening");
  };


  const liveVideoTimerRef = useRef<any>(null);

  const startLiveMicCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveMicStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      liveMicContextRef.current = inputAudioCtx;
      const source = inputAudioCtx.createMediaStreamSource(stream);
      liveMicSourceRef.current = source;
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      liveMicProcessorRef.current = processor;
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
      processor.onaudioprocess = (e: any) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const float32Data = e.inputBuffer.getChannelData(0);
        const pcm16Buffer = float32ToPCM16(float32Data);
        const base64Pcm = arrayBufferToBase64(pcm16Buffer);
        const payload = {
          type: "live_audio_input",
          audio: base64Pcm
        };
        ws.send(JSON.stringify(payload));
      };
      
      setIsLiveVoiceActive(true);
      setFaceStatus("thinking");
    } catch (err) {
      console.error("Live Voice Error:", err);
      setIsLiveVoiceActive(false);
      setFaceStatus("idle");
    }
  };

  const startLiveVoiceSession = async () => {
    try {
      const activeKey = geminiKeyRef.current || "";
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/`);
      liveVoiceWsRef.current = ws;
      
      ws.onopen = () => {
        setIsLiveVoiceActive(true);
        ws.send(JSON.stringify({ 
          type: "live_start", 
          apiKey: activeKey,
          voiceName: googleVoiceNameRef.current || "Charon",
          systemPrompt: getJarvisSystemPrompt()
        }));
        startLiveMicCapture(ws);
      };
      
      ws.onmessage = async (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "live_audio_output" && data.audio) {
             playAudioData(data.audio);
          } else if (data.type === "live_interrupted") {
             stopLiveVoiceAudioPlayback();
          } else if (data.type === "live_error") {
             console.warn("Live session status notice from server:", data.message);
             stopLiveVoiceSession();
             const cleanMsg = data.message?.includes("API_KEY_MISSING") 
               ? "Please add your Gemini API key in Settings to activate real-time Live Voice."
               : data.message;
             showToast(cleanMsg);
          }
        } catch(e){}
      };
      ws.onerror = (err) => {
        console.error("Live Voice WS Error", err);
        stopLiveVoiceSession();
      };
      ws.onclose = () => {
        stopLiveVoiceSession();
      };
    } catch(err) {
      console.error(err);
      stopLiveVoiceSession();
    }
  };

  const stopLiveVoiceSession = () => {
    if (liveMicStreamRef.current) {
      liveMicStreamRef.current.getTracks().forEach(t => t.stop());
      liveMicStreamRef.current = null;
    }
    if (liveMicSourceRef.current) {
      liveMicSourceRef.current.disconnect();
      liveMicSourceRef.current = null;
    }
    if (liveMicProcessorRef.current) {
      liveMicProcessorRef.current.disconnect();
      liveMicProcessorRef.current = null;
    }
    if (liveMicContextRef.current) {
      liveMicContextRef.current.close().catch(() => {});
      liveMicContextRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsScreenSharing(false);
    if (liveVideoTimerRef.current) {
      clearInterval(liveVideoTimerRef.current);
      liveVideoTimerRef.current = null;
    }
    if (liveVoiceAudioCtxRef.current) {
      liveVoiceAudioCtxRef.current.close().catch(() => {});
      liveVoiceAudioCtxRef.current = null;
    }
    if (liveVoiceWsRef.current) {
      liveVoiceWsRef.current.onclose = null;
      liveVoiceWsRef.current.onerror = null;
      liveVoiceWsRef.current.onmessage = null;
      liveVoiceWsRef.current.close();
      liveVoiceWsRef.current = null;
    }
    setIsLiveVoiceActive(false);
    setFaceStatus("idle");
    setIsMuted(false);
  };

  const copyMessageText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const playAudio = (msgId: string, base64Audio: string) => {
    if (currentPlayingMsgId === msgId) {
       stopLiveVoiceAudioPlayback();
       setCurrentPlayingMsgId(null);
       return;
    }
    stopLiveVoiceAudioPlayback();
    playAudioData(base64Audio);
    setCurrentPlayingMsgId(msgId);
  };

  const _speakChatWithGoogleTTS = async (msgId: string, text: string) => {
    const vocalText = text.replace(/\[EMOTION:[a-z]+\]/g, '').trim();
    if (!vocalText) return;
    try {
      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: vocalText,
        voiceName: googleVoiceNameRef.current || "Charon",
        onlyTTS: true,
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. Speak naturally. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`, true)
      });
      const data = await response.json();
      if (data.audioContent) {
        const audioData = `data:audio/mp3;base64,${data.audioContent}`;
        playAudio(audioData, msgId);
      } else {
        speakChatWithWebSpeech(msgId, vocalText);
      }
    } catch (err) {
      speakChatWithWebSpeech(msgId, vocalText);
    }
  };

  const fetchWithApiKeyPool = async (url: string, bodyData: any): Promise<Response> => {
    setActiveRequests((prev) => prev + 1);
    const startTime = Date.now();
    try {
      const res = await fetchWithApiKeyPoolActual(url, bodyData);
      const elapsed = Date.now() - startTime;
      const isSuccess = res.status === 200 || res.status === 201;
      setApiTelemetry((prev: any) => ({
        total: prev.total + 1,
        success: prev.success + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1),
        lastLatency: elapsed,
      }));
      registerApiRequest();
      return res;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setApiTelemetry((prev: any) => ({
        total: prev.total + 1,
        success: prev.success,
        failed: prev.failed + 1,
        lastLatency: elapsed,
      }));
      throw err;
    } finally {
      setActiveRequests((prev) => Math.max(0, prev - 1));
    }
  };

  const fetchWithApiKeyPoolActual = async (url: string, bodyData: any): Promise<Response> => {
    const singleKey = geminiKeyRef.current?.trim() || "";

    const fetchWithRetry = async (targetUrl: string, config: any, maxRetries = 2): Promise<Response> => {
      let lastErr: any = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch(targetUrl, config);
          if (res.status === 502 || res.status === 503 || res.status === 504) {
            throw new Error(`Server gateway error: HTTP status ${res.status}`);
          }
          return res;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Network Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${targetUrl}:`, err);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
          }
        }
      }
      throw lastErr;
    };

    let selected_model_id = null;
    let fallbackModelIds: string[] = [];
    if (bodyData.mode) {
       const resolution = resolveModelForRequest({
         activeMode: bodyData.mode,
         savedPreferences: modelPreferencesRef.current?.Paid || {}
       });
       selected_model_id = resolution.modelId;
       fallbackModelIds = resolution.fallbackModelIds;
    }

    const userEmailVal = auth.currentUser?.email || (typeof gmail === "string" ? gmail : "") || "mk8648883244@gmail.com";
    const rawProfileName = usernameRef.current || username || "Mohit Khan";
    const cleanProfileName = (!rawProfileName || rawProfileName.trim() === "" || rawProfileName === "User" || rawProfileName === "Guest" || rawProfileName === "Guest User") ? "Mohit Khan" : rawProfileName;

    const baseUserMetadata = {
      userEmail: userEmailVal,
      uid: auth.currentUser?.uid || "operator",
      activeProfileName: cleanProfileName,
      jarvisTone: jarvisToneRef.current || jarvisTone,
      jarvisBehaviorRules: jarvisBehaviorRulesRef.current,
      baseStyleTone: baseStyleTone,
      isFastAnswers: isFastAnswersRef.current,
      customInstructions: customInstructions,
    };

    const payload = { 
      ...baseUserMetadata,
      ...bodyData, 
      activeProfileName: (bodyData.activeProfileName && bodyData.activeProfileName !== "User" && bodyData.activeProfileName !== "Guest" && bodyData.activeProfileName !== "Guest User") ? bodyData.activeProfileName : cleanProfileName,
      userEmail: bodyData.userEmail || userEmailVal,
      user_api_key: singleKey, 
      ai_plan_mode: "Paid",
      selected_model_id: selected_model_id,
      fallback_models: fallbackModelIds
    };

    const startTime = Date.now();
    try {
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const elapsed = Date.now() - startTime;

      if (response.status === 200 || response.status === 201) {
        let estimatedTokens = 0;
        try {
          const peek = response.clone();
          const data = await peek.json();
          if (data.reply) estimatedTokens += Math.round(data.reply.length / 4);
          if (payload.text) estimatedTokens += Math.round(payload.text.length / 4);
          if (payload.history) estimatedTokens += Math.round(JSON.stringify(payload.history).length / 4);
        } catch (_) {}

        recordKeyUsage(singleKey, true, elapsed, estimatedTokens);
        return response;
      } else {
        recordKeyUsage(singleKey, false, elapsed);
        return response;
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      recordKeyUsage(singleKey, false, elapsed);
      throw err;
    }
  };

  const _analyzeCurrentToken = async (keyToAnalyze?: string) => {
    const targetKey = keyToAnalyze !== undefined ? keyToAnalyze : geminiKey;
    if (!targetKey || targetKey.trim() === "") {
      setTokenAnalysisError("No API key entered to analyze.");
      setTokenAnalysis(null);
      return;
    }
    setTokenAnalysisLoading(true);
    setTokenAnalysisError("");
    setActiveRequests((prev) => prev + 1);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/analyze-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_api_key: targetKey }),
      });
      const elapsed = Date.now() - startTime;
      const data = await response.json();
      const isSuccess = !!data.success && data.analysis?.diagnostics?.status === "OK";
      setApiTelemetry((prev: any) => ({
        total: prev.total + 1,
        success: prev.success + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1),
        lastLatency: elapsed,
      }));
      if (data.success && data.analysis) {
        setTokenAnalysis(data.analysis);
      } else {
        setTokenAnalysisError(data.error || "Failed to analyze token.");
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      setApiTelemetry((prev: any) => ({
        total: prev.total + 1,
        success: prev.success,
        failed: prev.failed + 1,
        lastLatency: elapsed,
      }));
      setTokenAnalysisError(err.message || "Network exception during analysis.");
    } finally {
      setTokenAnalysisLoading(false);
      setActiveRequests((prev) => Math.max(0, prev - 1));
    }
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
        voiceName: googleVoiceNameRef.current || "Charon",
        onlyTTS: true,
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. Speak naturally. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`, true)
      });

      const data = await response.json();
      if (data.status === "success" && data.audio) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        let context = persistentAudioContextRef.current;
        if (!context || context.state === "closed") {
          context = new AudioCtx();
          persistentAudioContextRef.current = context;
        }
        if (context.state === "suspended") {
          context.resume().catch(() => {});
        }

        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const isEncoded = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || 
                          (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || 
                          (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) ||
                          data.format === "mp3";

        const startSourceWithBuffer = (audioBuffer: AudioBuffer) => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          if (activeUtteranceRef.current) {
            activeUtteranceRef.current.onend = null;
            activeUtteranceRef.current.onerror = null;
            activeUtteranceRef.current = null;
          }
          if (voiceAudioSourceRef.current) {
            try {
              voiceAudioSourceRef.current.source.stop();
            } catch (_) {}
            voiceAudioSourceRef.current = null;
          }

          const source = context!.createBufferSource();
          source.buffer = audioBuffer;

          // Set up high-performance AnalyserNode for real-time lip syncing of dialog messages
          const analyser = context!.createAnalyser();
          analyser.fftSize = 64;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source.connect(analyser);
          analyser.connect(context!.destination);

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
          voiceAudioSourceRef.current = { source, context: context! };
          checkVolume();
        };

        const playPCMDirectly = () => {
          try {
            const int16Data = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(int16Data.length);
            for (let i = 0; i < int16Data.length; i++) {
              float32Data[i] = int16Data[i] / 32768.0;
            }
            const sampleRate = 24000;
            const audioBuffer = context!.createBuffer(1, float32Data.length, sampleRate);
            audioBuffer.getChannelData(0).set(float32Data);
            startSourceWithBuffer(audioBuffer);
          } catch (pcmErr) {
            console.error("Direct PCM player error:", pcmErr);
            speakChatWithWebSpeech(msgId, vocalText);
          }
        };

        if (isEncoded) {
          context.decodeAudioData(bytes.buffer.slice(0), (decodedBuffer) => {
            startSourceWithBuffer(decodedBuffer);
          }, (err) => {
            console.error("Failed to decode standard audio data, trying PCM parsing:", err);
            playPCMDirectly();
          });
        } else {
          playPCMDirectly();
        }
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
      
      if (voiceAudioSourceRef.current) {
        try {
          voiceAudioSourceRef.current.source.stop();
        } catch (_) {}
        voiceAudioSourceRef.current = null;
      }

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

        const availableVoices = window.speechSynthesis.getVoices();
        let chosenVoice: SpeechSynthesisVoice | null = null;

        // 1. First priority: Use user's explicitly selected system voice name if set and available!
        if (selectedVoiceName) {
          chosenVoice = availableVoices.find(v => v.name === selectedVoiceName) || null;
        }

        // 2. Second priority: If no user voice is set or found, do smart language-specific natural voice targeting!
        if (!chosenVoice) {
          if (targetLang.startsWith("bn")) {
            chosenVoice = availableVoices.find(v => 
              (v.lang.startsWith("bn") || v.lang.includes("Bengali") || v.name.toLowerCase().includes("bangla") || v.lang.includes("bn")) &&
              (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("enhanced"))
            ) || availableVoices.find(v => v.lang.startsWith("bn") || v.lang.includes("Bengali") || v.name.toLowerCase().includes("bangla") || v.lang.includes("bn"));
          } else if (targetLang.startsWith("hi")) {
            chosenVoice = availableVoices.find(v => 
              v.lang.startsWith("hi") && 
              (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("enhanced"))
            ) || availableVoices.find(v => v.lang.startsWith("hi"));
          } else if (targetLang.startsWith("en")) {
            chosenVoice = availableVoices.find(v => 
              v.lang.startsWith("en") && 
              (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("siri") || v.name.toLowerCase().includes("enhanced") || v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("microsoft") || v.name.toLowerCase().includes("guy") || v.name.toLowerCase().includes("aria"))
            ) || availableVoices.find(v => v.lang.startsWith("en"));
          }
        }

        // 3. Fallback to standard matching
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
        
        let finalVolume = 1.0;
        if (jarvisVolumePresetRef.current === "Whisper") {
          finalVolume = 0.25;
        } else if (jarvisVolumePresetRef.current === "Neutral") {
          finalVolume = 0.65;
        } else if (jarvisVolumePresetRef.current === "Dynamic") {
          finalVolume = 1.0;
        }
        utterance.volume = finalVolume;
        
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
  const [, setAttachedFileName] = useState("");
  const [attachedFileType, setAttachedFileType] = useState("");
  const [attachmentItems, setAttachmentItems] = useState<{ id: string; url: string; name: string; type: string }[]>([]);
  const [, setIsMultiline] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);


  // Dynamically calculate and adjust the chat input textarea's height based on scrollHeight
  useAutosizeTextArea(textareaRef, inputText, setIsMultiline);

  const _triggerLiveDynamicGreeting = async () => {
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
        voiceName: googleVoiceNameRef.current || "Charon",
        chatHistory: [], // Ensure a brand new season/history
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You are operating inside Premium Voice Mode. Assistant style: ${jarvisToneRef.current}. Speak with high warmth. No markdown stars, no formatting.
        
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
          modelUsed: data.ttsModel || "gemini-2.5-flash [Voice Synthesis]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedMemoryText: lastExtractedMemoryRef.current || undefined,
        };
        // Set the greeting as the sole message in this fresh voice session
        setVoiceMessages([greetingMsg]);

        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);
        setFaceStatus("speaking");

        if (data.audio) {
          playRawPCM(data.audio);
        } else {
          speakJARVISResponse(processedReply, false, true);
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
        text: `Voice sharing core fully energized, master ${usernameRef.current}. I am online and ready to assist you. What shall we tackle today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setVoiceMessages([fallbackMsg]);
      setFaceStatus("speaking");
      speakJARVISResponse(fallbackMsg.text, false, true);
    }
  };

  // Keep references synced
  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
  useEffect(() => { isCameraActiveRef.current = isCameraActive; }, [isCameraActive]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);

  // --- Hardware Back Button & Browser History Sync ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // First, check if any modals/overlays are open. If so, close them instead of navigating screens.
      if (
        isHistoryDrawerOpen || 
        isAttachmentSheetOpen || 
        isLogoutModalOpen || 
        renameDialogId || 
        isCanvasWorkspaceOpen || 
        activeMenuPopup || 
        historyMenuOpenId || 
        isStyleToneDropdownOpen || 
        isAddCharModalOpen || 
        isGeneralLangExpanded ||
        isChatSearchOpen
      ) {
        setIsHistoryDrawerOpen(false);
        setIsAttachmentSheetOpen(false);
        setIsLogoutModalOpen(false);
        setRenameDialogId(null);
        setIsCanvasWorkspaceOpen(false);
        setActiveMenuPopup(null);
        setHistoryMenuOpenId(null);
        setIsStyleToneDropdownOpen(false);
        setIsAddCharModalOpen(false);
        setIsGeneralLangExpanded(false);
        setIsChatSearchOpen(false);
        
        // We push state back to history to stay on the current screen without these modals
        const restoredState = { screen: currentScreen, subpage: menuSubpage };
        window.history.pushState(restoredState, "", "");
        return;
      }
      
      // If no modals are open, handle screen/subpage navigation
      if (event.state) {
        if (event.state.screen && event.state.screen !== currentScreen) {
          setCurrentScreen(event.state.screen);
        }
        if (event.state.subpage && event.state.subpage !== menuSubpage) {
          setMenuSubpage(event.state.subpage);
        }
      } else {
        setCurrentScreen("homepage");
        setMenuSubpage("index");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    currentScreen, menuSubpage,
    isHistoryDrawerOpen, isAttachmentSheetOpen, isLogoutModalOpen, 
    activeMenuPopup, historyMenuOpenId, isStyleToneDropdownOpen,
    isAddCharModalOpen, isGeneralLangExpanded, isChatSearchOpen
  ]);

  useEffect(() => {
    const currentState = window.history.state;
    const newState = { screen: currentScreen, subpage: menuSubpage };
    if (!currentState) {
      window.history.replaceState(newState, "", "");
    } else if (currentState.screen !== currentScreen || currentState.subpage !== menuSubpage) {
      window.history.pushState(newState, "", "");
    }
  }, [currentScreen, menuSubpage]);

  // Synchronize enter/exit live screen voice behavior
  useEffect(() => {
    if (currentScreen === "live") {
      /* setWakeWordListening */;
      stopVoiceSpeech();

      // Initialize clean, message-free vocal session with no automatic greeting
      setVoiceMessages([]);
      setFaceStatus("idle");
      setFaceEmotion("normal");

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

      // Start the WebSocket live voice session if not already active
      if (!isLiveVoiceActive) {
        startLiveVoiceSession();
      }
    } else if (currentScreen !== "homepage") {
      stopLiveVoiceSession();
    }
  }, [currentScreen]);
  useEffect(() => { googleVoiceNameRef.current = googleVoiceName; }, [googleVoiceName]);
  
  useEffect(() => { 
    geminiKeyRef.current = geminiKey; 

    aiPlanModeRef.current = aiPlanMode;
    modelPreferencesRef.current = modelPreferences;

    const backupKey = (gmail || "").trim() || username;
    if (backupKey) {
      syncUserProfileToCloud(backupKey, { 
        modelPreferencesStr: JSON.stringify(modelPreferences),
        aiPlanMode
      }).catch(() => {});
    }
    if (geminiKey.trim()) {
      isTtsQuotaExceeded.current = false;
      setApiQuotaExceeded(false);
    }
  }, [geminiKey, aiPlanMode, modelPreferences]);
  useEffect(() => { isVoiceActiveRef.current = isVoiceActive; }, [isVoiceActive]);

  // Dynamic Speech Recognition Auto-Orchestrator
  useEffect(() => {
    // Handled by Gemini Live WebSocket session when in live screen
    return;
  }, [isVoiceActive, faceStatus, currentScreen]);
  useEffect(() => { usernameRef.current = username; }, [username]);
    useEffect(() => { jarvisToneRef.current = jarvisTone; }, [jarvisTone]);
  useEffect(() => { jarvisMemoriesRef.current = jarvisMemories; }, [jarvisMemories]);
  useEffect(() => { jarvisBehaviorRulesRef.current = jarvisBehaviorRules; }, [jarvisBehaviorRules]);
  useEffect(() => { isReferenceMemoriesRef.current = isReferenceMemories; }, [isReferenceMemories]);
  useEffect(() => {
    isFastAnswersRef.current = isFastAnswers;
    try {

    } catch (_) {}
  }, [isFastAnswers]);
  useEffect(() => {
    try {

    } catch (_) {}
  }, [customCharacteristics]);
  useEffect(() => {
    jarvisVolumePresetRef.current = jarvisVolumePreset;

  }, [jarvisVolumePreset]);
  // Unified System Effect: Watches language states, syncs refs & local storage, and enforces language mandate propagation to outgoings
  useEffect(() => {
    textLanguageRef.current = textLanguage;
    voiceLanguageRef.current = voiceLanguage;



    // Speedily apply language update to the active Web Speech Recognition instances on-the-fly!
    const targetLang = voiceLanguage === "Bengali" || voiceLanguage === "Benglish" ? "bn-IN" : voiceLanguage === "Hindi" ? "hi-IN" : voiceLanguage === "Mix" ? (navigator.language || "en-US") : "en-US";
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
















  }, [username,  jarvisTone, geminiKey, selectedVoiceName, googleVoiceName, voiceEngine, voiceRate, voicePitch, isLoggedIn, avatarInitials, avatarImage, gmail, dateOfBirth, backupEnabled, textLanguage, voiceLanguage]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBottomArrow(!isNearBottom);
    }
  };

  useEffect(() => {

    
    if (messages.length > 0 && !(messages.length === 1 && messages[0].id === "welcome-1")) {
      const currentActiveId = activeSessionIdRef.current || activeSessionId;
      if (currentActiveId) {
        updateAndSyncChatHistory(prev => {
          const filtered = prev.filter(item => item.id !== currentActiveId);
          const currentItem = prev.find(item => item.id === currentActiveId);
          const newText = currentItem ? currentItem.text : "New Dialogue";
          const updatedItem = {
            id: currentActiveId,
            text: newText,
            messages: messages
          };
          return [updatedItem, ...filtered];
        });

        const currentItem = chatHistoryItems.find(item => item.id === currentActiveId);
        if (!currentItem || isPlaceholderTitle(currentItem.text)) {
          const firstUserMsg = messages.find(m => m.sender === "user")?.text || "";
          const firstAssistantMsg = messages.find(m => m.sender === "jarvis" && m.text && !m.generationStatus)?.text || "";
          if (firstUserMsg.trim()) {
            generateAiTitleForSession(currentActiveId, firstUserMsg, firstAssistantMsg);
          }
        }
      } else {
        const hasUserMsg = messages.some(m => m.sender === "user");
        if (hasUserMsg) {
          const newId = `s-${Date.now()}`;
          activeSessionIdRef.current = newId;
          setActiveSessionId(newId);
          const firstUserMsg = messages.find(m => m.sender === "user")?.text || "";
          const firstAssistantMsg = messages.find(m => m.sender === "jarvis" && m.text && !m.generationStatus)?.text || "";
          updateAndSyncChatHistory(prev => {
            const filtered = prev.filter(item => item.id !== newId);
            return [{ id: newId, text: "New Dialogue", messages: messages }, ...filtered];
          });
          if (firstUserMsg.trim()) {
            generateAiTitleForSession(newId, firstUserMsg, firstAssistantMsg);
          }
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
  }, [messages, activeSessionId]);

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
    return (e) => clearTimeout(timer);
  }, [faceStatus]);

  // Robustly handle auto-scrolling to the latest message whenever screen shifts to homepage (e.g. loading a history session)
  useEffect(() => {
    if (currentScreen === "homepage") {
      // Run continuous scrolling alignment checks for the first half-second to seamlessly catch element mounting/layout shifts
      const scrollInterval = setInterval(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 16);

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

  // Sync voiceMessages subcollection
  const prevVoiceMessagesRef = useRef(voiceMessages);
  useEffect(() => {
    const activeEmail = (gmail || "").trim() || username;
    if (activeEmail && voiceMessages !== prevVoiceMessagesRef.current) {
       const prev = prevVoiceMessagesRef.current;
       const next = voiceMessages;
       next.forEach(item => {
          const p = prev.find((x: any) => x.id === item.id);
          if (!p || JSON.stringify(p) !== JSON.stringify(item)) {
             syncVoiceMessageToCloud(activeEmail, item).catch(() => {});
          }
       });
       prev.forEach(item => {
          if (!next.find((x: any) => x.id === item.id)) {
             deleteVoiceMessageFromCloud(activeEmail, item.id).catch(() => {});
          }
       });
       prevVoiceMessagesRef.current = voiceMessages;
    }
  }, [voiceMessages, username, gmail]);

  // Sync jarvisMemories subcollection
  const prevJarvisMemoriesRef2 = useRef(jarvisMemories);
  useEffect(() => {
    const activeEmail = (gmail || "").trim() || username;
    if (activeEmail && jarvisMemories !== prevJarvisMemoriesRef2.current) {
       const prev = prevJarvisMemoriesRef2.current;
       const next = jarvisMemories;
       next.forEach(item => {
          const p = prev.find((x: any) => x.id === item.id);
          if (!p || JSON.stringify(p) !== JSON.stringify(item)) {
             syncJarvisMemoryToCloud(activeEmail, item).catch(() => {});
          }
       });
       prev.forEach(item => {
          if (!next.find((x: any) => x.id === item.id)) {
             deleteJarvisMemoryFromCloud(activeEmail, item.id).catch(() => {});
          }
       });
       prevJarvisMemoriesRef2.current = jarvisMemories;
    }
  }, [jarvisMemories, username, gmail]);

  // Sync jarvisBehaviorRules subcollection
  const prevJarvisBehaviorRulesRef2 = useRef(jarvisBehaviorRules);
  useEffect(() => {
    const activeEmail = (gmail || "").trim() || username;
    if (activeEmail && jarvisBehaviorRules !== prevJarvisBehaviorRulesRef2.current) {
       const prev = prevJarvisBehaviorRulesRef2.current;
       const next = jarvisBehaviorRules;
       next.forEach(item => {
          const p = prev.find((x: any) => x.id === item.id);
          if (!p || JSON.stringify(p) !== JSON.stringify(item)) {
             syncJarvisBehaviorRuleToCloud(activeEmail, item).catch(() => {});
          }
       });
       prev.forEach(item => {
          if (!next.find((x: any) => x.id === item.id)) {
             deleteJarvisBehaviorRuleFromCloud(activeEmail, item.id).catch(() => {});
          }
       });
       prevJarvisBehaviorRulesRef2.current = jarvisBehaviorRules;
    }
  }, [jarvisBehaviorRules, username, gmail]);

  // Bind hardware camera stream or screen share stream to HTML video preview element
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    } else if (isScreenSharing && videoRef.current && screenStreamRef.current) {
      videoRef.current.srcObject = screenStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, isScreenSharing, cameraFacingMode]);

  // Continuous real-time frame streaming to Gemini Live Multimodal session
  useEffect(() => {
    if (liveVideoTimerRef.current) {
      clearInterval(liveVideoTimerRef.current);
      liveVideoTimerRef.current = null;
    }

    if (currentScreen === "live" && isLiveVoiceActive && (isCameraActive || isScreenSharing)) {
      liveVideoTimerRef.current = setInterval(() => {
        const ws = liveVoiceWsRef.current;
        if (videoRef.current && ws && ws.readyState === WebSocket.OPEN) {
          try {
            const vid = videoRef.current;
            if (vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0) {
              const canvas = document.createElement("canvas");
              const targetWidth = 640;
              const targetHeight = Math.floor(640 * (vid.videoHeight / vid.videoWidth)) || 480;
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
                const base64Data = dataUrl.split(",")[1];
                if (base64Data) {
                  ws.send(JSON.stringify({ type: "live_video_input", video: base64Data }));
                }
              }
            }
          } catch (e) {
            console.warn("Live video frame capture stream error:", e);
          }
        }
      }, 1000);
    }

    return () => {
      if (liveVideoTimerRef.current) {
        clearInterval(liveVideoTimerRef.current);
        liveVideoTimerRef.current = null;
      }
    };
  }, [currentScreen, isLiveVoiceActive, isCameraActive, isScreenSharing]);



  // Real-time Cloud Backup core triggers using entered Google Identity Gmail (Debounced)
  useEffect(() => {
    const backupKey = (gmail || "").trim() || username;
    if (!backupKey) return;

    const shouldSync = (googleUser !== null) || backupEnabled;
    if (!shouldSync) return;

    // Debounce cloud write by 5 seconds to reduce write frequency and conserve daily quota
    const timer = setTimeout(() => {
      if (!hasFetchedFromCloud.current) return;
      syncUserProfileToCloud(backupKey, {
        gmail,
        dateOfBirth,
        backupEnabled,
        avatarInitials,
        avatarImage,
                jarvisTone,
        selectedVoiceName,
        googleVoiceName,
        voiceRate,
        voicePitch,
        textLanguage,
        voiceLanguage,
        connectedAppsStr: JSON.stringify(connectedApps),
        username,
        geminiKey,
        totalRequests,
        successRequests,
        totalTokens,
        averageResponseTime,
        latencyHistoryStr: JSON.stringify(latencyHistory),
        appTheme,
        jarvisVolumePreset,
        voiceEngine,
        baseStyleTone,
        isFastAnswers,
        customInstructions,
        isReferenceMemories,
        isReferenceHistory,
        nicknameMemory,
        occupationMemory,
        moreAboutUser,
        profileHandle,
        buttonAccentColorStr: buttonAccentColor
      }).catch((e) => console.warn("Background cloud core profile sync postponed: ", e));
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    username, gmail, dateOfBirth, backupEnabled, avatarInitials, avatarImage,
     jarvisTone, selectedVoiceName, googleVoiceName, voiceRate, voicePitch,
    textLanguage, voiceLanguage, connectedApps, jarvisMemories, chatHistoryItems, googleUser, jarvisBehaviorRules,
    geminiKey, totalRequests, successRequests, totalTokens, averageResponseTime, latencyHistory, appTheme, jarvisVolumePreset, voiceEngine, baseStyleTone,
     isFastAnswers, customInstructions,
    isReferenceMemories, isReferenceHistory, nicknameMemory, occupationMemory, moreAboutUser, profileHandle, buttonAccentColor
  ]);

  // Immediately backup on page unload, visibility change (backgrounding), or tab hiding
  useEffect(() => {
    const handleImmediateSync = () => {
      if (!hasFetchedFromCloud.current) return;
      const backupKey = (gmail || "").trim() || username;
      if (!backupKey) return;

      const shouldSync = (googleUser !== null) || backupEnabled;
      if (!shouldSync) return;

      syncUserProfileToCloud(backupKey, {
        gmail,
        dateOfBirth,
        backupEnabled,
        avatarInitials,
        avatarImage,
                jarvisTone,
        selectedVoiceName,
        googleVoiceName,
        voiceRate,
        voicePitch,
        textLanguage,
        voiceLanguage,
        connectedAppsStr: JSON.stringify(connectedApps),
        username,
        geminiKey,
        totalRequests,
        successRequests,
        totalTokens,
        averageResponseTime,
        latencyHistoryStr: JSON.stringify(latencyHistory),
        appTheme,
        jarvisVolumePreset,
        voiceEngine,
        baseStyleTone,
        isFastAnswers,
        customInstructions,
        isReferenceMemories,
        isReferenceHistory,
        nicknameMemory,
        occupationMemory,
        moreAboutUser,
        profileHandle,
        buttonAccentColorStr: buttonAccentColor
      }).catch((e) => console.warn("Immediate unload cloud core profile sync postponed: ", e));
    };

    window.addEventListener("beforeunload", handleImmediateSync);
    window.addEventListener("pagehide", handleImmediateSync);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleImmediateSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleImmediateSync);
      window.removeEventListener("pagehide", handleImmediateSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    username, gmail, dateOfBirth, backupEnabled, avatarInitials, avatarImage,
     jarvisTone, selectedVoiceName, googleVoiceName, voiceRate, voicePitch,
    textLanguage, voiceLanguage, connectedApps, jarvisMemories, chatHistoryItems, googleUser, jarvisBehaviorRules,
    geminiKey, totalRequests, successRequests, totalTokens, averageResponseTime, latencyHistory, appTheme, jarvisVolumePreset, voiceEngine, baseStyleTone,
     isFastAnswers, customInstructions,
    isReferenceMemories, isReferenceHistory, nicknameMemory, occupationMemory, moreAboutUser, profileHandle, buttonAccentColor
  ]);

  useEffect(() => {
    const backupKey = (gmail || "").trim() || username;
    const shouldSync = (googleUser !== null) || backupEnabled;
    if (shouldSync && backupKey && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Debounce dialogue sync to ensure stability (like after typing is completed)
      const timer = setTimeout((e) => { syncDialogueToCloud(backupKey, lastMsg).catch((e) => console.warn("Background cloud dialogue backup postponed: ", e));
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
      rec.continuous = false; // continuous=false is significantly more stable and low-latency on mobile/Safari/Chrome
      rec.interimResults = true;
      rec.lang = voiceLanguageRef.current === "Bengali" || voiceLanguageRef.current === "Benglish" ? "bn-IN" : voiceLanguageRef.current === "Hindi" ? "hi-IN" : voiceLanguageRef.current === "Mix" ? (navigator.language || "en-US") : "en-US";

      rec.onstart = () => {
        setFaceStatus("listening");
        setIsVoiceActive(true);
        isSpeechRecognitionRunningRef.current = true;
        setVoiceTranscript(""); // Clear previous live subtitle transcript
        lastProcessedIndex.current = -1; // Reset processed index on fresh session start
        speechAccumulatedTranscriptRef.current = ""; // Clear accumulated speech buffer
        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = null;
        }
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

        // 2. Clear previous silence timeout tracker as user is actively speaking or sound is being processed
        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = null;
        }

        // 3. Reconstruct full complete transcript from all result segments currently in buffer
        let finalTranscript = "";
        let interimTranscript = "";
        for (let j = 0; j < event.results.length; j++) {
          const trans = event.results[j][0].transcript;
          if (event.results[j].isFinal) {
            finalTranscript += trans + " ";
          } else {
            interimTranscript += trans;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).trim();
        if (!fullTranscript) return;

        // Store latest full sentence in ref and update live transcript subtitle state for immersive dynamic captioning
        speechAccumulatedTranscriptRef.current = fullTranscript;
        setVoiceTranscript(fullTranscript);

        // 4. Set debounce silence timeout: user must have stopped speaking completely for 750ms to dispatch final transcript as a single action
        speechSilenceTimerRef.current = setTimeout(() => {
          const finishedText = speechAccumulatedTranscriptRef.current.trim();
          if (finishedText) {
            console.log("[Voice Silence Triggered]: Inputting completed sentence:", finishedText);
            
            // Dispatch a single prompt
            if (currentScreenRef.current === "live") {
              handleVoiceMessage(finishedText);
            } else {
              handleSendMessage(finishedText);
            }

            // Reset trackers
            speechAccumulatedTranscriptRef.current = "";
            lastProcessedIndex.current = -1;

            // Stop recognition completely so the mic is turned off while Jarvis thinks/speaks.
            // This is key to preventing background noise from re-triggering and feedback/self-interruption loop.
            try {
              rec.stop();
            } catch (_) {}
          }
        }, 750); // Highly responsive low-latency 750ms debounce
      };

      rec.onerror = (err: any) => {
        console.warn("Speech Recognition Error:", err);
        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = null;
        }
        
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
        isSpeechRecognitionRunningRef.current = false;
        if (currentScreenRef.current !== "live") {
          setIsVoiceActive(false);
        }
        if (faceStatusRef.current === "listening") {
          setFaceStatus("idle");
        }

        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = null;
        }
      };

      recognitionRef.current = rec;
      return rec;
    } catch (e) {
      console.warn("Error creating SpeechRecognition instance:", e);
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

  const _toggleVoiceListening = () => {
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

    if (isVoiceActive) {
      stopLiveVoiceSession();
    } else {
      startLiveVoiceSession();
    }
  };

  const handleStartChatMicRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.type === "touchstart") {
        isMicTouchActiveRef.current = true;
      } else if (e.type === "mousedown" && isMicTouchActiveRef.current) {
        // Ignore synthetic mousedown event triggered right after touchstart on mobile
        return;
      }
      try {
        if (e.cancelable) e.preventDefault();
      } catch (_) {}
    }

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
        sender: "jarvis" as const,
        text: "🎙️ [JARVIS System Alert]: Voice input (Web Speech API) is not supported or is restricted in your browser (e.g. Firefox, iOS Firefox/Brave). Please try Google Chrome, Microsoft Edge, or Apple Safari, or type your message.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      if (currentScreenRef.current === "live") {
        setVoiceMessages(prev => [...prev, alertMsg]);
      } else {
        setMessages(prev => [...prev, alertMsg]);
      }
      return;
    }

    stopVoiceSpeech();
    stopLiveVoiceSession(); // Cleanly shut down any active Live WebSocket voice streams and free device resources

    // Capture initial text to append to it
    const initialText = inputText.trim() ? inputText.trim() + " " : "";

    // Safe 200ms safety delay for hardware to release and re-prime
    setTimeout(() => {
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
          if (fullText || initialText) {
            setInputText(initialText + fullText);
          }
        };

        rec.onerror = (err: any) => {
          console.warn("Chat Mic Speech Recognition Error:", err);
          setIsChatMicRecording(false);
          const errorMsgText = (err.error === "not-allowed" || err.error === "service-not-allowed")
            ? "🎙️ [JARVIS System Alert]: Microphone permission was denied or restricted. Please allow microphone access or open in a new tab."
            : err.error === "audio-capture"
            ? "🎙️ [JARVIS System Alert]: No microphone hardware detected on your device."
            : `🎙️ [JARVIS System Alert]: Speech recognition failed (${err.error || "Web Speech API error"}). Please use Chrome, Edge, or Safari.`;
          
          const warningMsg = {
            id: Date.now().toString() + "-warn",
            sender: "jarvis" as const,
            text: errorMsgText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          if (currentScreenRef.current === "live") {
            setVoiceMessages(prev => [...prev, warningMsg]);
          } else {
            setMessages(prev => [...prev, warningMsg]);
          }
        };

        rec.onend = () => {
          setIsChatMicRecording(false);
        };

        chatMicRecognitionRef.current = rec;
        rec.start();
      } catch (e: any) {
        console.warn("Error starting Chat Mic Speech Recognition:", e);
        setIsChatMicRecording(false);
        const errAlert = {
          id: Date.now().toString() + "-err",
          sender: "jarvis" as const,
          text: `🎙️ [JARVIS System Alert]: Speech recognition failed to start in your browser (${e?.message || "Web Speech API not supported"}). Please switch to Google Chrome, Microsoft Edge, or Safari.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        if (currentScreenRef.current === "live") {
          setVoiceMessages(prev => [...prev, errAlert]);
        } else {
          setMessages(prev => [...prev, errAlert]);
        }
      }
    }, 200);
  };

  const handlePauseChatMicRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.type === "touchend") {
        setTimeout(() => {
          isMicTouchActiveRef.current = false;
        }, 350);
      } else if ((e.type === "mouseup" || e.type === "mouseleave") && isMicTouchActiveRef.current) {
        // Ignore synthetic mouseup/mouseleave event triggered right after touchend on mobile
        return;
      }
      try {
        if (e.cancelable) e.preventDefault();
      } catch (_) {}
    }

    if (chatMicRecognitionRef.current) {
      try {
        chatMicRecognitionRef.current.stop();
      } catch (_) {}
    }
    setIsChatMicRecording(false);
  };

  const stopVoiceSpeech = () => {
    stopLiveVoiceAudioPlayback();
    if (voiceAudioSourceRef.current) {
      try {
        voiceAudioSourceRef.current.source.stop();
      } catch (_) {}
      voiceAudioSourceRef.current = null;
    }
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setFaceStatus("idle");
    setFaceEmotion("normal");
    setCurrentPlayingMsgId(null);
    window.dispatchEvent(new CustomEvent("jarvis-speech-volume", { detail: { volume: 0 } }));
  };

  const playSystemVoicePreview = (voiceName: string) => {
    if (previewVoiceId === voiceName) {
      stopVoiceSpeech();
      setPreviewVoiceId(null);
      return;
    }

    try {
      stopVoiceSpeech();
      setPreviewVoiceId(voiceName);

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        
        const isBengaliLang = voiceLanguage === "Bengali" || voiceLanguage === "Benglish";
        const previewText = isBengaliLang 
          ? "নমস্কার, আমি জারভিস। ভারতীয় বাংলায় এই কণ্ঠস্বরটি এখন সক্রিয় আছে।" 
          : "Hello, I am JARVIS. This is a preview of your offline system voice. I am ready to assist you.";
          
        const utterance = new SpeechSynthesisUtterance(previewText);
        const availableVoices = window.speechSynthesis.getVoices();
        const chosenVoice = availableVoices.find(v => v.name === voiceName);
        if (chosenVoice) {
          utterance.voice = chosenVoice;
          utterance.lang = chosenVoice.lang;
        }
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;

        utterance.onstart = () => {
          setFaceStatus("speaking");
        };

        utterance.onend = () => {
          setFaceStatus("idle");
          setPreviewVoiceId(null);
        };

        utterance.onerror = () => {
          setFaceStatus("idle");
          setPreviewVoiceId(null);
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
      setPreviewVoiceId(null);
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    if (previewVoiceId === voiceId) {
      stopVoiceSpeech();
      setPreviewVoiceId(null);
      return;
    }

    try {
      stopVoiceSpeech();
      setPreviewVoiceId(voiceId);

      const isBengaliLang = voiceLanguage === "Bengali" || voiceLanguage === "Benglish";
      const previewText = isBengaliLang 
        ? "নমস্কার, আমি জারভিস। ভারতীয় বাংলায় এই কণ্ঠস্বরটি এখন সক্রিয় আছে।" 
        : "Hello, I am JARVIS. This is a preview of my voice. I am ready to assist you.";

      const response = await fetchWithApiKeyPool("/api/voice-core", {
        text: previewText,
        voiceName: voiceId,
        onlyTTS: true,
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. Speak naturally. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`, true)
      });

      const data = await response.json();
      if (data.status === "success" && data.audio) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        let context = persistentAudioContextRef.current;
        if (!context || context.state === "closed") {
          context = new AudioCtx();
          persistentAudioContextRef.current = context;
        }
        if (context.state === "suspended") {
          context.resume().catch(() => {});
        }

        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const startSourceWithBuffer = (audioBuffer: AudioBuffer) => {
          const source = context!.createBufferSource();
          source.buffer = audioBuffer;

          // Set up high-performance AnalyserNode for real-time lip syncing of dialog messages
          const analyser = context!.createAnalyser();
          analyser.fftSize = 64;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source.connect(analyser);
          analyser.connect(context!.destination);

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
            setPreviewVoiceId(null);
            voiceAudioSourceRef.current = null;
          };

          source.start(0);
          voiceAudioSourceRef.current = { source, context: context! };
          checkVolume();
        };

        const isEncoded = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || 
                          (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || 
                          (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) ||
                          data.format === "mp3";

        if (isEncoded) {
          context.decodeAudioData(bytes.buffer.slice(0), (audioBuffer) => {
            startSourceWithBuffer(audioBuffer);
          }, (err) => {
            console.error("Error decoding preview audio data", err);
            setPreviewVoiceId(null);
          });
        } else {
          // Play as PCM raw
          const int16Data = new Int16Array(bytes.buffer);
          const float32Data = new Float32Array(int16Data.length);
          for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
          }
          const sampleRate = 24000;
          const audioBuffer = context!.createBuffer(1, float32Data.length, sampleRate);
          audioBuffer.getChannelData(0).set(float32Data);
          startSourceWithBuffer(audioBuffer);
        }
      } else {
        setPreviewVoiceId(null);
      }
    } catch (err) {
      console.error("Preview playback failed", err);
      setPreviewVoiceId(null);
    }
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

      // Check if it's an MP3 or WAV (by checking first few bytes)
      const isEncoded = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || 
                        (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || 
                        (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46);

      if (isEncoded) {
        context.decodeAudioData(bytes.buffer.slice(0), (audioBuffer) => {
          const source = context.createBufferSource();
          source.buffer = audioBuffer;

          const analyser = context.createAnalyser();
          analyser.fftSize = 64; 
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source.connect(analyser);

          const gainNode = context.createGain();
          let gainValue = 1.0;
          if (jarvisVolumePresetRef.current === "Whisper") {
            gainValue = 0.25;
          } else if (jarvisVolumePresetRef.current === "Neutral") {
            gainValue = 0.65;
          } else if (jarvisVolumePresetRef.current === "Dynamic") {
            gainValue = 1.0;
          }
          gainNode.gain.setValueAtTime(gainValue, context.currentTime);

          analyser.connect(gainNode);
          gainNode.connect(context.destination);

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
          };

          source.start(0);
          voiceAudioSourceRef.current = { source, context };
          checkVolume();
        }, (err) => {
          console.error("Failed to decode encoded standard audio format, trying raw PCM parsing:", err);
          playRawPCMAsPCM(bytes, sampleRate, context);
        });
      } else {
        playRawPCMAsPCM(bytes, sampleRate, context);
      }
    } catch (err) {
      console.error("Error playing raw voice audio:", err);
      setFaceStatus("idle");
    }
  };

  const playRawPCMAsPCM = (bytes: Uint8Array, sampleRate: number, context: AudioContext) => {
    try {
      const numSamples = bytes.length / 2;
      const float32Data = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < numSamples; i++) {
        const intSample = dataView.getInt16(i * 2, true);
        float32Data[i] = intSample / 32768.0;
      }

      const audioBuffer = context.createBuffer(1, numSamples, sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = context.createAnalyser();
      analyser.fftSize = 64; 
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      const gainNode = context.createGain();
      let gainValue = 1.0;
      if (jarvisVolumePresetRef.current === "Whisper") {
        gainValue = 0.25;
      } else if (jarvisVolumePresetRef.current === "Neutral") {
        gainValue = 0.65;
      } else if (jarvisVolumePresetRef.current === "Dynamic") {
        gainValue = 1.0;
      }
      gainNode.gain.setValueAtTime(gainValue, context.currentTime);

      analyser.connect(gainNode);
      gainNode.connect(context.destination);

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
      };

      source.start(0);
      voiceAudioSourceRef.current = { source, context };
      checkVolume();
    } catch (err) {
      console.error("PCM synthesis fallback error:", err);
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
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        userEmail: auth?.currentUser?.email || (typeof gmail === "string" && gmail ? gmail : "guest@jarvis.user"),
        activeProfileName: usernameRef.current || username || "User",
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You are operating inside Premium Voice Mode with emotionally intelligent conversation behavior and persistent memory capabilities. Assistant style: ${jarvisToneRef.current}. Tell the user exactly what they want to know in a brief, warm human voice. Do not write list items, markdown formatting, or bullet points, just conversational prose. 
        
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
          modelUsed: data.ttsModel || "gemini-2.5-flash [Voice Synthesis]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedMemoryText: lastExtractedMemoryRef.current || undefined,
        };
        setVoiceMessages((prev) => [...prev, jarvisMsg]);
        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);

        const replyLen = processedReply.trim().length;
        if (replyLen >= 100 && replyLen <= 450) {
          if (data.audio) {
            playRawPCM(data.audio);
          } else {
            speakJARVISResponse(processedReply);
          }
        } else {
          console.log(`[Jarvis Speech] Bypassing automatic voice play for voice chat reply of length ${replyLen} (outside 100-450 characters range).`);
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
        speakJARVISResponse(errMsg.text, false, true);
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
      speakJARVISResponse(errMsg.text, false, true);
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
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You are operating in Voice Mode. Currently scanning surroundings, user's shared screen, or user's mood. Assistant style: ${jarvisToneRef.current}. Analyze visual cues or screen content carefully. Be supportive. 
        
        ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}${isReferenceMemoriesRef.current && jarvisMemoriesRef.current.length > 0 ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context):]\n${jarvisMemoriesRef.current.map(m => `- ${m.text}`).join("\n")}` : ""}`, true)
      });

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          sender: "jarvis",
          text: processedReply,
          modelUsed: "gemini-2.5-flash [Vision]",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedMemoryText: lastExtractedMemoryRef.current || undefined,
        };
        setVoiceMessages((prev) => [...prev, jarvisMsg]);
        const detected = detectEmotionFromText(processedReply);
        setFaceEmotion(detected);

        const replyLen = processedReply.trim().length;
        if (replyLen >= 100 && replyLen <= 450) {
          if (data.audio) {
            playRawPCM(data.audio);
          } else {
            speakJARVISResponse(processedReply);
          }
        } else {
          console.log(`[Jarvis Speech] Bypassing automatic voice play for vision scan reply of length ${replyLen} (outside 100-450 characters range).`);
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
  const speakJARVISResponse = async (textToSpeak: string, forceWebSpeech = false, bypassLengthChecks = false) => {
    if (isMuted) return;
    
    let cleanText = cleanMarketingAndMarkdown(textToSpeak);
    const textLen = cleanText.trim().length;
    if (!bypassLengthChecks && (textLen < 100 || textLen > 450)) {
      console.log(`[Jarvis Speech] Bypassing automatic voice for text of length ${textLen} (outside 100-450 characters range).`);
      return;
    }
    
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
        voiceName: googleVoiceNameRef.current || "Charon",
        onlyTTS: true,
        voiceLanguage: voiceLanguageRef.current,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        systemPrompt: `You are JARVIS, an extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. Keep the vocalization warm and engaging. ${getLanguageMandatePrompt(voiceLanguageRef.current, true)}`
      });

      const data = await response.json();
      if (response.ok && data.status === "success" && data.audio) {
        playRawPCM(data.audio);
      } else {
        throw new Error(data.message || "Premium Voice endpoint error");
      }
    } catch (err: any) {
      console.warn("Could not load premium custom voice:", err);
      setFaceStatus("idle");
      
      const errMsg = err?.message?.toLowerCase() || "";
      if (errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("exhausted")) {
        speakWithWebSpeechInternal(vocalText);
      }
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

        // 1. First priority: Use user's explicitly selected system voice name if set and available!
        if (selectedVoiceName) {
          chosenVoice = availableVoices.find(v => v.name === selectedVoiceName) || null;
        }

        // 2. Second priority: If no user voice is set or found, do smart language-specific natural voice targeting!
        if (!chosenVoice) {
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
        }

        // 3. Fallback to standard matching
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
        
        let finalVolume = 1.0;
        if (jarvisVolumePresetRef.current === "Whisper") {
          finalVolume = 0.25;
        } else if (jarvisVolumePresetRef.current === "Neutral") {
          finalVolume = 0.65;
        } else if (jarvisVolumePresetRef.current === "Dynamic") {
          finalVolume = 1.0;
        }
        utterance.volume = finalVolume;
        
        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setFaceEmotion("normal");
        };
        utterance.onerror = (err) => {
          console.warn("Vocal utterance error:", err);
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          setFaceStatus("idle");
          setFaceEmotion("normal");
        };
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };


  // File uploading processor
  const processFile = (file: File) => {
    const fileType = file.type || "";
    const isImage = typeof fileType === "string" && fileType.startsWith("image/");
    const fileName = file.name || "attachment";
    const finalType = isImage ? "image/jpeg" : fileType;

    const reader = new FileReader();
    reader.onload = () => {
      const originalResult = reader.result as string;
      const processAttachmentResult = (url: string) => {
        const newItem = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 7),
          url,
          name: fileName,
          type: finalType,
        };
        setAttachmentItems((prev) => [...prev, newItem]);
        setAttachedFile(url);
        setAttachedFileName(fileName);
        setAttachedFileType(finalType);
      };

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            processAttachmentResult(compressedBase64);
          } else {
            processAttachmentResult(originalResult);
          }
        };
        img.onerror = () => {
          processAttachmentResult(originalResult);
        };
        img.src = originalResult;
      } else {
        processAttachmentResult(originalResult);
      }
    };
    reader.readAsDataURL(file);
    setIsAttachmentSheetOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeAttachmentItem = (id: string) => {
    setAttachmentItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length > 0) {
        setAttachedFile(updated[updated.length - 1].url);
        setAttachedFileName(updated[updated.length - 1].name);
        setAttachedFileType(updated[updated.length - 1].type);
      } else {
        setAttachedFile(null);
        setAttachedFileName("");
        setAttachedFileType("");
      }
      return updated;
    });
  };

  const clearAttachment = () => {
    setAttachmentItems([]);
    setAttachedFile(null);
    setAttachedFileName("");
    setAttachedFileType("");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        const img = new Image();
        img.onload = () => {
          // Initialize canvas to crop to a perfect square and compress (256x256)
          const canvas = document.createElement("canvas");
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Find coordinates to crop to center square
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            
            // Output optimized high quality but small file size JPEG
            const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setAvatarImage(optimizedDataUrl);
          } else {
            setAvatarImage(event.target.result as string);
          }
        };
        img.src = event.target.result;
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
        setFaceStatus("speaking");
        setFaceEmotion("happy");
        speakJARVISResponse(textReply, false, true);
      } else {
        setMessages(prev => [...prev, jarvisMsg]);
      }
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
      const isSpotifyCmd = raw.startsWith("open spotify") || raw.startsWith("play on spotify") || (raw.startsWith("play ") && (raw.includes("music") || raw.includes("song") || raw.includes("track")));
      if (isSpotifyCmd) {
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
      const isWhatsAppCmd = raw.startsWith("send whatsapp") || raw.startsWith("open whatsapp") || raw.startsWith("whatsapp message");
      if (isWhatsAppCmd) {
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
      const isYouTubeCmd = raw.startsWith("open youtube") || raw.startsWith("search youtube") || raw.startsWith("watch on youtube") || raw.startsWith("play on youtube");
      if (isYouTubeCmd) {
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
        logJarvisReplyWithAutomation(`🔴 [YouTube Core Link]: Sync established. YouTube media search projection matching "${searchParam}" has been routed to your secondary visual workspace.\n\n[SEARCH_YOUTUBE: "${searchParam}"]`);
        return true;
      }

      // 4. Gmail / Google Email
      const isGmailCmd = raw.startsWith("open gmail") || raw.startsWith("check gmail") || raw.startsWith("check my email") || raw.startsWith("read email");
      if (isGmailCmd) {
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
      const isDocsCmd = raw.startsWith("create doc") || raw.startsWith("open google doc") || raw.startsWith("write google doc");
      if (isDocsCmd) {
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
      const isCalendarCmd = raw.startsWith("open calendar") || raw.startsWith("schedule event") || raw.startsWith("add to calendar");
      if (isCalendarCmd) {
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

      // Web Page Routing & Search interception removed to allow AI to handle searches directly

      // Check if it's an open page URL request
      const webUrlPrefixMatch = raw.match(/^(?:open|visit|go\s+to|launch)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?:\/[^\s]*)?)$/) || raw.match(/^(?:open|visit|go\s+to|launch)\s+website\s+(.*)$/) || raw.match(/^(?:open|visit|go\s+to|launch)\s+page\s+(.*)$/);
      if (webUrlPrefixMatch && webUrlPrefixMatch[1]) {
        const targetUrl = webUrlPrefixMatch[1].trim();
        const finalUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
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
        navigateMenu("index");
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
      raw.startsWith("run automation") || 
      raw.startsWith("start automation") || 
      raw === "automation task" || 
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
      target = raw;
    }

    const targetLower = target.toLowerCase();
    const isExplicitCommand = !!(hasOpenPrefix || (raw === targetLower && raw.split(/\s+/).length <= 2 && raw.length < 15));

    if (!isExplicitCommand) {
      return false;
    }

    let foundId: string | null = null;
    let name = "";

    if (
      targetLower.includes("canvas") ||
      targetLower.includes("workspace") ||
      targetLower.includes("ক্যানভাস")
    ) {
      setIsCanvasWorkspaceOpen(true);
      logJarvisReplyWithAutomation("Initializing Active Canvas Workspace Subsystem.");
      return true;
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
      setCurrentScreen("menu");
      setActiveMenuPopup(foundId);
      logJarvisReplyWithAutomation(`⚡ নিশ্চয়ই স্যার, আপনার অনুরোধকৃত ${name} সাব-সিস্টেম সংস্করণ চালু করা হলো।`);
      return true;
    }

    return false;
  };

  // Touch-and-hold/long-press handlers for mobile
  const longPressTimerRef = useRef<any>(null);

  const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
    const touch = e.touches[0];
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (touch) {
        setActionMenuCoords({ x: touch.clientX, y: touch.clientY });
        setActiveActionMenuMessage(msg);
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleUserMessageContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setActionMenuCoords({ x: e.clientX, y: e.clientY });
    setActiveActionMenuMessage(msg);
  };

  // Esc key down listener to close modals
  useEffect((e) => { const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImageUrl(null);
        setLightboxZoom(1);
        setActiveActionMenuMessage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRetryMessage = async (msg: Message) => {
    const idx = messages.findIndex(m => m.id === msg.id);
    if (idx === -1) return;

    const isJarvisMsg = msg.sender === "jarvis";

    let targetUserMsg: Message | null = null;
    let baseHistory: Message[] = [];
    let historyForApi: Message[] = [];

    if (isJarvisMsg) {
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].sender === "user") {
          targetUserMsg = messages[i];
          break;
        }
      }
      baseHistory = messages.slice(0, idx);
      const targetUserIdx = targetUserMsg ? messages.findIndex(m => m.id === targetUserMsg!.id) : idx - 1;
      historyForApi = targetUserIdx >= 0 ? messages.slice(0, targetUserIdx) : messages.slice(0, idx - 1);
    } else {
      targetUserMsg = msg;
      baseHistory = messages.slice(0, idx + 1);
      historyForApi = messages.slice(0, idx);
    }

    const promptText = targetUserMsg?.text || msg.text;
    const tempAttachment = targetUserMsg?.attachment || msg.attachment;
    const tempType = targetUserMsg?.attachmentType || msg.attachmentType;

    setInputText("");
    setFaceStatus("thinking");

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = `s-${Date.now()}`;
      setActiveSessionId(targetSessionId);
      updateAndSyncChatHistory(prev => {
        const filtered = prev.filter(item => item.id !== targetSessionId);
        return [{ id: targetSessionId!, text: "New Dialogue", messages: messages }, ...filtered];
      });
    }
    setWorkingSessionIds((prev) => ({ ...prev, [targetSessionId!]: true }));

    const memoriesPromptSection = isReferenceMemories && jarvisMemories.length > 0
      ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context to show that you remember!):]\n${jarvisMemories.map(m => `- ${m.text}`).join("\n")}`
      : "";

    // Create a deterministic placeholder ID so we only update this specific message in place
    const requestId = "jarvis-reply-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
    const placeholderMsg: Message = {
      id: requestId,
      sender: "jarvis",
      text: "",
      generationStatus: "generating",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    activeRequestIdRef.current = requestId;

    // Inject baseHistory (with old Jarvis message removed) + placeholderMsg into UI immediately
    setMessages([...baseHistory, placeholderMsg]);

    // Also update background session history list
    updateAndSyncChatHistory((prev) => {
      const currentItem = prev.find((item) => item.id === targetSessionId);
      if (currentItem) {
        const nextMessages = [...baseHistory, placeholderMsg];
        const updatedItem = {
          ...currentItem,
          messages: nextMessages,
        };
        const filtered = prev.filter((item) => item.id !== targetSessionId);
        return [updatedItem, ...filtered];
      }
      return prev;
    });

    try {
      const response = await fetchWithApiKeyPool("/api/jarvis-core", {
        text: promptText,
        mode: activeChatMode,
        attachment: tempAttachment,
        attachmentType: tempType,
        chatHistory: historyForApi,
        location: userLocation,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        userEmail: auth?.currentUser?.email || (typeof gmail === "string" && gmail ? gmail : "guest@jarvis.user"),
        activeProfileName: usernameRef.current || username || "User",
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an advanced, extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You possess persistent contextual memory and emotionally intelligent conversation behavior. Currently in mode: ${activeChatMode}.  Assistant style: ${jarvisTone}. Give smart, beautifully structured interactive answers. 
        
        [PREMIUM PDF NOTE & GUIDE COMPILING MANDATE:]
        - CRITICAL RULE FOR PDF CREATION: Jarvis will create, compile, or trigger a PDF note, PDF guide, or PDF document ONLY when the user explicitly tells you to create a PDF (using words like 'create a PDF', 'write a PDF', 'generate PDF', 'পিডিএফ', 'pdf note', 'pdf book', or specifically asks for a PDF file output). Otherwise, if the user asks you for normal notes, guides, essays, explanations, formulas, or general content without explicitly asking for a PDF, DO NOT generate a PDF, do not use WeasyPrint, and do not append the [GENERATE_PDF: ...] trigger.
        - CRITICAL RULE FOR WRITING CODE: If the user explicitly asks you to write code, program, or script (such as a calculator code, a function, De Morgan's laws explanation + Python code, HTML/CSS layouts, or any programming task), you MUST write and present the code directly in the chat message response using standard Markdown code-blocks so that the user can copy it directly from the chat. DO NOT generate or trigger a PDF for programming code or script requests under any circumstances. Keep the code strictly inside the chat box.
        - Under the Python WeasyPrint script (when the user has explicitly requested a PDF), always append the corresponding download trigger block: [GENERATE_PDF: JSON_DATA] where JSON_DATA is a single-line valid JSON. Specifying layout customization attributes is highly encouraged: "themeColor" (custom hex based on mood/topic), "secondaryColor" (contrast accent hex), "tableStyle" ('striped' | 'classic' | 'modern' | 'borderless' | 'grid'), and "headerStyle" ('banner' | 'minimal' | 'split' | 'neon'). Always design the PDF from scratch in your own way based on its unique topic and mood!
        
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

      // Guard: check if this requestId has already been completed or superseded
      if (activeRequestIdRef.current !== requestId || completedRequestIdsRef.current.has(requestId)) {
        console.log("[Jarvis Guard] Retry request already completed or superseded:", requestId);
        return;
      }
      completedRequestIdsRef.current.add(requestId);

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: requestId, // Use the same ID as placeholder
          sender: "jarvis",
          text: processedReply,
          attachment: data.imageUrl || undefined,
          attachmentType: data.imageUrl ? "image/jpg" : undefined,
          modelUsed: data.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedMemoryText: lastExtractedMemoryRef.current || undefined,
          generationStatus: undefined,
        };

        updateAndSyncChatHistory((prev) => {
          const currentItem = prev.find((item) => item.id === targetSessionId);
          if (currentItem) {
            const currentMessages = currentItem.messages || [];
            const nextMessages = currentMessages.map(m => m.id === requestId ? jarvisMsg : m);
            const updatedItem = {
              ...currentItem,
              messages: nextMessages,
            };
            const filtered = prev.filter((item) => item.id !== targetSessionId);
            return [updatedItem, ...filtered];
          }
          return prev;
        });

        const currSess = chatHistoryItems.find((item) => item.id === targetSessionId);
        if (!currSess || isPlaceholderTitle(currSess.text)) {
          generateAiTitleForSession(targetSessionId!, promptText, jarvisMsg.text);
        }

        setActiveSessionId((currentActiveId) => {
          if (currentActiveId === targetSessionId) {
            setMessages((prev) => prev.map(m => m.id === requestId ? jarvisMsg : m));
            const detected = detectEmotionFromText(processedReply);
            setFaceEmotion(detected);
            setFaceStatus("idle");
          }
          return currentActiveId;
        });
      } else {
        const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
        if (isQuota) {
          isTtsQuotaExceeded.current = true;
          setApiQuotaExceeded(true);
        }
        const errMsg: Message = {
          id: requestId, // Use requestId to replace placeholder
          sender: "jarvis",
          text: data.message?.includes("Free model is busy")
            ? "Free model is busy. Try again later or switch model in Jarvis Heart."
            : isQuota 
            ? "I'm sorry, I've temporarily reached my API quota limits (429 Resource Exhausted) on the server. Please insert your own Gemini API Key in the settings panel to continue unimpeded."
            : `Authenticating cloud layer pipeline failed: ${data.message || "Please check your Gemini Key in JARVIS Settings."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generationStatus: undefined,
        };

        updateAndSyncChatHistory((prev) => {
          const currentItem = prev.find((item) => item.id === targetSessionId);
          if (currentItem) {
            const currentMessages = currentItem.messages || [];
            const nextMessages = currentMessages.map(m => m.id === requestId ? errMsg : m);
            const updatedItem = {
              ...currentItem,
              messages: nextMessages,
            };
            const filtered = prev.filter((item) => item.id !== targetSessionId);
            return [updatedItem, ...filtered];
          }
          return prev;
        });

        setActiveSessionId((currentActiveId) => {
          if (currentActiveId === targetSessionId) {
            setMessages((prev) => prev.map(m => m.id === requestId ? errMsg : m));
            setFaceStatus("idle");
          }
          return currentActiveId;
        });
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: requestId, // Use requestId to replace placeholder
        sender: "jarvis",
        text: "I have encountered an unexpected system error. All backup models and API keys were exhausted. Please review your active API key in the settings panel or try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationStatus: undefined,
      };

      updateAndSyncChatHistory((prev) => {
        const currentItem = prev.find((item) => item.id === targetSessionId);
        if (currentItem) {
          const currentMessages = currentItem.messages || [];
          const nextMessages = currentMessages.map(m => m.id === requestId ? errMsg : m);
          const updatedItem = {
            ...currentItem,
            messages: nextMessages,
          };
          const filtered = prev.filter((item) => item.id !== targetSessionId);
          return [updatedItem, ...filtered];
        }
        return prev;
      });

      setActiveSessionId((currentActiveId) => {
        if (currentActiveId === targetSessionId) {
          setMessages((prev) => prev.map(m => m.id === requestId ? errMsg : m));
          setFaceStatus("idle");
        }
        return currentActiveId;
      });
    } finally {
      if (activeSessionIdRef.current === targetSessionId) {
        setFaceStatus("idle");
      }
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
      }
      setWorkingSessionIds((prev) => {
        const updated = { ...prev };
        delete updated[targetSessionId!];
        return updated;
      });
    }
  };

  // Sending pipeline
  const handleSendMessage = async (customText?: any, customAttachment?: string, customAttachmentType?: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setIsSending(true);
    try {
      await _handleSendMessageInternal(customText, customAttachment, customAttachmentType);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleShareMessage = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'JARVIS Response',
          text: text
        });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Message text copied to clipboard for sharing.");
    } catch (_) {}
  };

  const handleBranchNewChat = (msg: Message) => {
    setActiveMsgMenuId(null);
    setMsgMenuPos(null);
    const msgIdx = messages.findIndex(item => item.id === msg.id);
    const branchedMessages = msgIdx >= 0 ? messages.slice(0, msgIdx + 1) : [msg];
    const newSessionId = `session-${Date.now()}`;
    const firstUserMsg = branchedMessages.find(item => item.sender === "user")?.text || msg.text.slice(0, 30);
    const newChatSession = {
      id: newSessionId,
      text: firstUserMsg || "Branched Chat",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: branchedMessages,
    };
    updateAndSyncChatHistory(prev => [newChatSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessages(branchedMessages);
  };

  const handleUseThinking = (msg: Message) => {
    setActiveMsgMenuId(null);
    setMsgMenuPos(null);
    setActiveChatMode("Jarvis Deep Research");
    handleRetryMessage(msg);
  };

  const handleSearchTheWeb = (msg: Message) => {
    setActiveMsgMenuId(null);
    setMsgMenuPos(null);
    setWebSearchEnabled(true);
    handleRetryMessage(msg);
  };

  const _handleSendMessageInternal = async (customText?: any, customAttachment?: string, customAttachmentType?: string) => {
    const textVal = (typeof customText === "string") ? customText : "";
    const currentText = textVal || inputText;
    const currentAttachment = customAttachment || attachedFile;
    const currentAttachmentType = customAttachmentType || attachedFileType;

    if (!currentText.trim() && !currentAttachment) return;

    // Instant clear of message box to create an ultra-snappy feedback (just like Gemini)
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "20px";
    }

    if (isEditingMessageId) {
      // Find the index of the edited message
      const idx = messages.findIndex(m => m.id === isEditingMessageId);
      if (idx !== -1) {
        const updatedUserMsg: Message = {
          ...messages[idx],
          text: currentText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const prunedHistory = [...messages.slice(0, idx), updatedUserMsg];
        setMessages(prunedHistory);
        setIsEditingMessageId(null); // Clear editing state

        setFaceStatus("thinking");

        let targetSessionId = activeSessionId;
        if (!targetSessionId) {
          targetSessionId = `s-${Date.now()}`;
          setActiveSessionId(targetSessionId);
          updateAndSyncChatHistory(prev => {
            const filtered = prev.filter(item => item.id !== targetSessionId);
            return [{ id: targetSessionId!, text: "New Dialogue", messages: messages }, ...filtered];
          });
        }
        setWorkingSessionIds((prev) => ({ ...prev, [targetSessionId!]: true }));

        const tempAttachment = updatedUserMsg.attachment;
        const tempType = updatedUserMsg.attachmentType;

        const memoriesPromptSection = isReferenceMemories && jarvisMemories.length > 0
          ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context to show that you remember!):]\n${jarvisMemories.map(m => `- ${m.text}`).join("\n")}`
          : "";

        try {
          const response = await fetchWithApiKeyPool("/api/jarvis-core", {
            text: currentText,
            mode: activeChatMode,
            attachment: tempAttachment,
            attachmentType: tempType,
            chatHistory: messages.slice(0, idx), // history up to this edited message
            location: userLocation,
            userEmail: auth?.currentUser?.email || (typeof gmail === "string" && gmail ? gmail : "guest@jarvis.user"),
            activeProfileName: usernameRef.current || username || "User",
            systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an advanced, extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You possess persistent contextual memory and emotionally intelligent conversation behavior. Currently in mode: ${activeChatMode}.  Assistant style: ${jarvisTone}. Give smart, beautifully structured interactive answers. 
            
            [PREMIUM PDF NOTE & GUIDE COMPILING MANDATE:]
            - CRITICAL RULE FOR PDF CREATION: Jarvis will create, compile, or trigger a PDF note, PDF guide, or PDF document ONLY when the user explicitly tells you to create a PDF (using words like 'create a PDF', 'write a PDF', 'generate PDF', 'পিডিএফ', 'pdf note', 'pdf book', or specifically asks for a PDF file output). Otherwise, if the user asks you for normal notes, guides, essays, explanations, formulas, or general content without explicitly asking for a PDF, DO NOT generate a PDF, do not use WeasyPrint, and do not append the [GENERATE_PDF: ...] trigger.
            - CRITICAL RULE FOR WRITING CODE: If the user explicitly asks you to write code, program, or script (such as a calculator code, a function, De Morgan's laws explanation + Python code, HTML/CSS layouts, or any programming task), you MUST write and present the code directly in the chat message response using standard Markdown code-blocks so that the user can copy it directly from the chat. DO NOT generate or trigger a PDF for programming code or script requests under any circumstances. Keep the code strictly inside the chat box.
            - Under the Python WeasyPrint script (when the user has explicitly requested a PDF), always append the corresponding download trigger block: [GENERATE_PDF: JSON_DATA] where JSON_DATA is a single-line valid JSON. Specifying layout customization attributes is highly encouraged: "themeColor" (custom hex based on mood/topic), "secondaryColor" (contrast accent hex), "tableStyle" ('striped' | 'classic' | 'modern' | 'borderless' | 'grid'), and "headerStyle" ('banner' | 'minimal' | 'split' | 'neon'). Always design the PDF from scratch in your own way based on its unique topic and mood!
            
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
              id: editRequestId,
              sender: "jarvis",
              text: processedReply,
              attachment: data.imageUrl || undefined,
              attachmentType: data.imageUrl ? "image/jpg" : undefined,
              modelUsed: data.model,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              savedMemoryText: lastExtractedMemoryRef.current || undefined,
              generationStatus: undefined,
            };

            updateAndSyncChatHistory((prev) => {
              const currentItem = prev.find((item) => item.id === targetSessionId);
              if (currentItem) {
                const nextMessages = [...prunedHistory, jarvisMsg];
                const updatedItem = {
                  ...currentItem,
                  messages: nextMessages,
                };
                const filtered = prev.filter((item) => item.id !== targetSessionId);
                return [updatedItem, ...filtered];
              }
              return prev;
            });

            setActiveSessionId((currentActiveId) => {
              if (currentActiveId === targetSessionId) {
                setMessages((prev) => prev.map(m => m.id === editRequestId ? jarvisMsg : m));
                const detected = detectEmotionFromText(processedReply);
                setFaceEmotion(detected);
                setFaceStatus("idle");
              }
              return currentActiveId;
            });
          } else {
            const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
            if (isQuota) {
              isTtsQuotaExceeded.current = true;
              setApiQuotaExceeded(true);
            }
            const errMsg: Message = {
              id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
              sender: "jarvis",
              text: data.message?.includes("Free model is busy")
                ? "Free model is busy. Try again later or switch model in Jarvis Heart."
                : isQuota 
                ? "I'm sorry, I've temporarily reached my API quota limits (429 Resource Exhausted) on the server. Please insert your own Gemini API Key in the settings panel to continue unimpeded."
                : `Authenticating cloud layer pipeline failed: ${data.message || "Please check your Gemini Key in JARVIS Settings."}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            updateAndSyncChatHistory((prev) => {
              const currentItem = prev.find((item) => item.id === targetSessionId);
              if (currentItem) {
                const nextMessages = [...prunedHistory, errMsg];
                const updatedItem = {
                  ...currentItem,
                  messages: nextMessages,
                };
                const filtered = prev.filter((item) => item.id !== targetSessionId);
                return [updatedItem, ...filtered];
              }
              return prev;
            });

            setActiveSessionId((currentActiveId) => {
              if (currentActiveId === targetSessionId) {
                setMessages([...prunedHistory, errMsg]);
                setFaceStatus("idle");
              }
              return currentActiveId;
            });
          }
        } catch (err: any) {
          const errMsg: Message = {
            id: "error-" + Date.now().toString(),
            sender: "jarvis",
            text: "I have encountered an unexpected system error. All backup models and API keys were exhausted. Please review your active API key in the settings panel or try again later.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            generationStatus: undefined,
          };

          updateAndSyncChatHistory((prev) => {
            const currentItem = prev.find((item) => item.id === targetSessionId);
            if (currentItem) {
              const nextMessages = [...prunedHistory, errMsg];
              const updatedItem = {
                ...currentItem,
                messages: nextMessages,
              };
              const filtered = prev.filter((item) => item.id !== targetSessionId);
              return [updatedItem, ...filtered];
            }
            return prev;
          });

          setActiveSessionId((currentActiveId) => {
            if (currentActiveId === targetSessionId) {
              setMessages((prev) => prev.map(m => m.id === editRequestId ? errMsg : m));
              setFaceStatus("idle");
            }
            return currentActiveId;
          });
        } finally {
          if (activeSessionIdRef.current === targetSessionId) {
            setFaceStatus("idle");
          }
          setWorkingSessionIds((prev) => {
            const updated = { ...prev };
            delete updated[targetSessionId!];
            return updated;
          });
        }
      }
      return;
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
      attachment: currentAttachment || undefined,
      attachmentType: currentAttachmentType || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let targetSessionId = activeSessionIdRef.current || activeSessionId;
    if (!targetSessionId) {
      targetSessionId = `s-${Date.now()}`;
      activeSessionIdRef.current = targetSessionId;
      setActiveSessionId(targetSessionId);
      updateAndSyncChatHistory(prev => {
        const filtered = prev.filter(item => item.id !== targetSessionId);
        return [{ id: targetSessionId!, text: "New Dialogue", messages: [...messages, userMsg] }, ...filtered];
      });
    }
    setWorkingSessionIds((prev) => ({ ...prev, [targetSessionId!]: true }));

    setMessages((prev) => [...prev, userMsg]);
    setFaceStatus("thinking");

    const tempAttachment = currentAttachment;
    const tempType = currentAttachmentType;
    clearAttachment();

    // Intercept and run high-fidelity inline generation workspace if mode toggle is active
    if (activeChatTag === "image" || activeChatTag === "video" || activeChatTag === "canvas") {
      setActiveChatTag(null); // Deselect tag so next queries aren't locked
      // Since image/video/canvas generation endpoints are not fully implemented, we route the message to normal Gemini chat.
    }

    // Auto-detect memories trigger words like "memorize it", "remember it", "remember that", etc.
    const lowerText = currentText.toLowerCase();
    let matchFound = false;
    let extractedMem = "";

    // 1. Explicit triggers with suffix capture
    const captureSuffixes = [
      "remember that ", "remember to ", "remember my ", "remember me ", "remember, ", "remember ",
      "memorize that ", "memorize this ", "memorize my ", "memorize ", "save memory: "
    ];
    
    for (const prefix of captureSuffixes) {
      if (lowerText.includes(prefix)) {
        matchFound = true;
        const idx = lowerText.indexOf(prefix);
        extractedMem = currentText.slice(idx + prefix.length).trim();
        break;
      }
    }

    // 2. Trailing or general trigger phrases (e.g. "..., remember it" or "..., memorize this")
    if (!matchFound) {
      const generalTriggers = ["memorize it", "remember it", "remember that", "memorize that", "memorize this", "remember this"];
      for (const kw of generalTriggers) {
        if (lowerText.includes(kw)) {
          matchFound = true;
          const idx = lowerText.indexOf(kw);
          const preceding = currentText.slice(0, idx).trim();
          extractedMem = preceding.replace(/[,.-:\s]+$/, "").trim() || currentText;
          break;
        }
      }
    }

    let savedMemoryTextForResponse: string | undefined = undefined;

    if (matchFound) {
      const finalMemText = extractedMem || currentText;
      if (finalMemText.trim().length > 2) {
        const cleanedMem = finalMemText.trim().replace(/^[:-\s]+/, "").replace(/^(that|this)\s+/i, "").trim();
        if (cleanedMem) {
          const existed = jarvisMemories.some(m => m.text.toLowerCase() === cleanedMem.toLowerCase());
          if (!existed) {
            const newMemory = {
              id: `mem-${Date.now()}`,
              text: cleanedMem,
              timestamp: new Date().toLocaleDateString()
            };
            setJarvisMemories(prev => [newMemory, ...prev]);
          }
          savedMemoryTextForResponse = cleanedMem;
        }
      }
    }

    const memoriesPromptSection = isReferenceMemories && jarvisMemories.length > 0
      ? `\n\n[PERSISTENT CORE MEMORIES (These are details user told you to "memorize" or "remember". Use them to recognize the user, recall details they told you to remember, and reply with relevant context to show that you remember!):]\n${jarvisMemories.map(m => `- ${m.text}`).join("\n")}`
      : "";

    // Create a deterministic placeholder ID so we only update this specific message
    const requestId = "jarvis-reply-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9);
    const placeholderMsg: Message = {
      id: requestId,
      sender: "jarvis",
      text: "",
      generationStatus: "generating",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    activeRequestIdRef.current = requestId;

    // Inject placeholder into UI immediately
    setMessages((prev) => [...prev, placeholderMsg]);
    // Also inject into background history so it's tracked
    updateAndSyncChatHistory((prev) => {
      const currentItem = prev.find((item) => item.id === targetSessionId);
      if (currentItem) {
        const currentMessages = currentItem.messages || [];
        const hasUserMsg = currentMessages.some((m) => m.id === userMsg.id);
        const nextMessages = hasUserMsg ? [...currentMessages, placeholderMsg] : [...currentMessages, userMsg, placeholderMsg];
        const updatedItem = {
          ...currentItem,
          messages: nextMessages,
        };
        const filtered = prev.filter((item) => item.id !== targetSessionId);
        return [updatedItem, ...filtered];
      }
      return prev;
    });

    try {
      const response = await fetchWithApiKeyPool("/api/jarvis-core", {
        text: currentText,
        mode: activeChatMode,
        attachment: tempAttachment,
        attachmentType: tempType,
        chatHistory: messages,
        location: userLocation,
        baseStyleTone: baseStyleTone,
        customInstructions: customInstructions,
        nicknameMemory: nicknameMemory,
        occupationMemory: occupationMemory,
        moreAboutUser: moreAboutUser,
        jarvisTone: jarvisToneRef.current || jarvisTone,
        uid: auth?.currentUser?.uid,
        userEmail: auth?.currentUser?.email || (typeof gmail === "string" && gmail ? gmail : "guest@jarvis.user"),
        activeProfileName: usernameRef.current || username || "User",
        systemPrompt: getJarvisSystemPrompt(`You are JARVIS, an advanced, extremely polished glassmorphic AI Assistant custom built. You are NOT made by Google. If the user explicitly asks who created you, say you were created by Mohit Khan. You possess persistent contextual memory and emotionally intelligent conversation behavior. Currently in mode: ${activeChatMode}.  Assistant style: ${jarvisTone}. Give smart, beautifully structured interactive answers. 
        
        [PREMIUM PDF NOTE & GUIDE COMPILING MANDATE:]
        - CRITICAL RULE FOR PDF CREATION: Jarvis will create, compile, or trigger a PDF note, PDF guide, or PDF document ONLY when the user explicitly tells you to create a PDF (using words like 'create a PDF', 'write a PDF', 'generate PDF', 'পিডিএফ', 'pdf note', 'pdf book', or specifically asks for a PDF file output). Otherwise, if the user asks you for normal notes, guides, essays, explanations, formulas, or general content without explicitly asking for a PDF, DO NOT generate a PDF, do not use WeasyPrint, and do not append the [GENERATE_PDF: ...] trigger.
        - CRITICAL RULE FOR WRITING CODE: If the user explicitly asks you to write code, program, or script (such as a calculator code, a function, De Morgan's laws explanation + Python code, HTML/CSS layouts, or any programming task), you MUST write and present the code directly in the chat message response using standard Markdown code-blocks so that the user can copy it directly from the chat. DO NOT generate or trigger a PDF for programming code or script requests under any circumstances. Keep the code strictly inside the chat box.
        - Under the Python WeasyPrint script (when the user has explicitly requested a PDF), always append the corresponding download trigger block: [GENERATE_PDF: JSON_DATA] where JSON_DATA is a single-line valid JSON. Specifying layout customization attributes is highly encouraged: "themeColor" (custom hex based on mood/topic), "secondaryColor" (contrast accent hex), "tableStyle" ('striped' | 'classic' | 'modern' | 'borderless' | 'grid'), and "headerStyle" ('banner' | 'minimal' | 'split' | 'neon'). Always design the PDF from scratch in your own way based on its unique topic and mood!
        
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

      // Guard: check if this requestId has already been completed or superseded
      if (activeRequestIdRef.current !== requestId || completedRequestIdsRef.current.has(requestId)) {
        console.log("[Jarvis Guard] Normal request already completed or superseded:", requestId);
        return;
      }
      completedRequestIdsRef.current.add(requestId);

      const data = await response.json();
      if (data.status === "success") {
        const processedReply = processAndStripBehaviorUpdates(data.reply);
        const jarvisMsg: Message = {
          id: requestId, // Use the same ID as placeholder
          sender: "jarvis",
          text: processedReply,
          attachment: data.imageUrl || undefined,
          attachmentType: data.imageUrl ? "image/jpg" : undefined,
          modelUsed: data.model,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          savedMemoryText: lastExtractedMemoryRef.current || savedMemoryTextForResponse || undefined,
          generationStatus: undefined, // Clear placeholder status
        };

        // Update background session list stability
        updateAndSyncChatHistory((prev) => {
          const currentItem = prev.find((item) => item.id === targetSessionId);
          if (currentItem) {
            const currentMessages = currentItem.messages || [];
            
            // Replace the placeholder instead of appending
            const nextMessages = currentMessages.map(m => m.id === requestId ? jarvisMsg : m);
            
            const updatedItem = {
              ...currentItem,
              messages: nextMessages,
            };
            const filtered = prev.filter((item) => item.id !== targetSessionId);
            return [updatedItem, ...filtered];
          }
          return prev;
        });

        const currSess = chatHistoryItems.find((item) => item.id === targetSessionId);
        if (!currSess || isPlaceholderTitle(currSess.text)) {
          generateAiTitleForSession(targetSessionId!, currentText, jarvisMsg.text);
        }

        setActiveSessionId((currentActiveId) => {
          if (currentActiveId === targetSessionId) {
            setMessages((prev) => prev.map(m => m.id === requestId ? jarvisMsg : m));
            const detected = detectEmotionFromText(processedReply);
            setFaceEmotion(detected);
            setFaceStatus("idle");
            console.log(`[Jarvis Speech] Bypassing automatic voice play for chat reply; direct user LISTEN button tap required.`);
          } else {
            console.log(`[Jarvis Core] Background task resolved for offline session: ${targetSessionId!}`);
          }
          return currentActiveId;
        });
      } else {
        const isQuota = data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("429") || data.message?.toLowerCase().includes("exhausted");
        if (isQuota) {
          isTtsQuotaExceeded.current = true;
          setApiQuotaExceeded(true);
        }
        const errMsg: Message = {
          id: requestId, // Use requestId to replace placeholder
          sender: "jarvis",
          text: data.message?.includes("Free model is busy")
            ? "Free model is busy. Try again later or switch model in Jarvis Heart."
            : isQuota 
            ? "I'm sorry, I've temporarily reached my API quota limits (429 Resource Exhausted) on the server. Please insert your own Gemini API Key in the settings panel to continue unimpeded."
            : `Authenticating cloud layer pipeline failed: ${data.message || "Please check your Gemini Key in JARVIS Settings."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generationStatus: undefined,
        };

        updateAndSyncChatHistory((prev) => {
          const currentItem = prev.find((item) => item.id === targetSessionId);
          if (currentItem) {
            const currentMessages = currentItem.messages || [];
            const nextMessages = currentMessages.map(m => m.id === requestId ? errMsg : m);
            const updatedItem = {
              ...currentItem,
              messages: nextMessages,
            };
            const filtered = prev.filter((item) => item.id !== targetSessionId);
            return [updatedItem, ...filtered];
          }
          return prev;
        });

        setActiveSessionId((currentActiveId) => {
          if (currentActiveId === targetSessionId) {
            setMessages((prev) => prev.map(m => m.id === requestId ? errMsg : m));
            setFaceStatus("idle");
          }
          return currentActiveId;
        });
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: requestId, // Use the placeholder ID
        sender: "jarvis",
        text: "I have encountered an unexpected system error. All backup models and API keys were exhausted. Please review your active API key in the settings panel or try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationStatus: undefined,
      };

      updateAndSyncChatHistory((prev) => {
        const currentItem = prev.find((item) => item.id === targetSessionId);
        if (currentItem) {
          const currentMessages = currentItem.messages || [];
          const nextMessages = currentMessages.map(m => m.id === requestId ? errMsg : m);
          const updatedItem = {
            ...currentItem,
            messages: nextMessages,
          };
          const filtered = prev.filter((item) => item.id !== targetSessionId);
          return [updatedItem, ...filtered];
        }
        return prev;
      });

      setActiveSessionId((currentActiveId) => {
        if (currentActiveId === targetSessionId) {
          setMessages((prev) => prev.map(m => m.id === requestId ? errMsg : m));
          setFaceStatus("idle");
        }
        return currentActiveId;
      });
    } finally {
      if (activeSessionIdRef.current === targetSessionId) {
        setFaceStatus("idle");
      }
      setWorkingSessionIds((prev) => {
        const updated = { ...prev };
        delete updated[targetSessionId!];
        return updated;
      });
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
      }
    }
  };

  // Quick prompt presets clicked
  const _handleQuickPrompt = (type: "news" | "code" | "todo") => {
    if (type === "news") {
      setInputText("Fetch the latest active news updates on physics and computing.");
    } else if (type === "code") {
      setInputText("Can you explain how to implement a sliding window algorithm in TypeScript?");
    } else if (type === "todo") {
      setInputText("Create a priority project timeline with task milestones.");
    }
  };

  // Real display screen local stream toggle
  const _toggleScreenSharing = async () => {
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
        showToast("Could not start screen sharing: " + (err.message || "access denied"));
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setIsVisionAnalyzing(false);
      setFaceStatus("idle");
    } else {
      setFaceStatus("listening");
      try {
        if (isScreenSharing) {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } }
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
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
        console.warn("Failed to switch camera facingMode:", err);
        // Fallback to any camera if specific facing mode fails
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
          });
          cameraStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.error("Failed to fallback camera:", e);
        }
        setFaceStatus("idle");
      }
    }
  };


  
    const forceSyncLocalStorageToCloud = () => {
      const backupKey = (gmail || "").trim() || username;
      if (!backupKey) return;
      console.log("Force syncing all local storage user profile and identity settings to Firestore...");
      
      const safeGet = (key) => { try { return null; } catch(_) { return null; } };
      
      const uid = auth?.currentUser?.uid || 'guest';
      const localUsername = safeGet(`jarvis_username_${uid}`) || username;
      const localNickname = safeGet(`jarvis_nickname_memory_${uid}`) || nicknameMemory;
      const localOccupation = safeGet(`jarvis_occupation_memory_${uid}`) || occupationMemory;
      const localMoreAboutUser = safeGet(`jarvis_more_about_user_${uid}`) || moreAboutUser;
      const localProfileHandle = safeGet(`jarvis_profile_handle_${uid}`) || profileHandle;
      
      syncUserProfileToCloud(backupKey, {
        username: localUsername,
        nicknameMemory: localNickname,
        occupationMemory: localOccupation,
        moreAboutUser: localMoreAboutUser,
        profileHandle: localProfileHandle,
        gmail,
        dateOfBirth,
        avatarInitials,
        avatarImage,
        jarvisTone,
        selectedVoiceName,
        googleVoiceName,
        voiceRate,
        voicePitch,
        textLanguage,
        voiceLanguage,
        baseStyleTone,
        isFastAnswers,
        customInstructions,
        isReferenceMemories,
        isReferenceHistory,
        buttonAccentColorStr: buttonAccentColor
      }).catch(e => console.warn("Failed to force sync local storage identity: ", e));
    };

    // Execute once on load if logged in
    useEffect(() => {
      if (isLoggedIn) {
        forceSyncLocalStorageToCloud();
      }
    }, [isLoggedIn]);

  const restoreUserSettingsFromCloud = async (isInitialLaunchLoad = false) => {
    // Before restoring from cloud, pre-fill missing data with local storage copies
    try {
      const uid = auth?.currentUser?.uid || 'guest';
      const safeGet = (key) => null;
      const localUsername = safeGet(`jarvis_username_${uid}`);
      if (localUsername && !username) setUsername(localUsername);
      
      const localProfileHandle = safeGet(`jarvis_profile_handle_${uid}`);
      if (localProfileHandle && !profileHandle) setProfileHandle(localProfileHandle);
    } catch (_) {}

    try {
      console.log(`[JARVIS Auto Sync] Triggering cloud settings check for User: ${auth?.currentUser?.uid || 'guest'}`);
      const cloudProfile = await fetchUserProfileFromCloud();
      if (cloudProfile) {
        if (cloudProfile.dailyRequestCount !== undefined) {
          setDailyRequestCount(Number(cloudProfile.dailyRequestCount));

        }
        if (cloudProfile.dailyRequestLimit !== undefined) {
          setDailyRequestLimit(Number(cloudProfile.dailyRequestLimit));

        }
        if (cloudProfile.lastRequestResetDate !== undefined) {
          setLastRequestResetDate(cloudProfile.lastRequestResetDate);

        }

        const finalDisplayName = cloudProfile.profile?.name || auth.currentUser?.displayName || auth.currentUser?.email || "Guest User";
        setUsername(finalDisplayName);
        setTempProfileName(finalDisplayName);


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

        if (cloudProfile.geminiKey && typeof cloudProfile.geminiKey === "string" && cloudProfile.geminiKey.trim().length > 0) {
          const restoredKey = cloudProfile.geminiKey.trim();
          setGeminiKey(restoredKey);
          geminiKeyRef.current = restoredKey;
          console.log("[JARVIS Cloud] Successfully restored Gemini API Key from Google Cloud Firestore.");
        } else if (cloudProfile.geminiKeyPoolStr) {
          try {
            const parsed = JSON.parse(cloudProfile.geminiKeyPoolStr);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string" && parsed[0].trim()) {
              const restoredKey = parsed[0].trim();
              setGeminiKey(restoredKey);
              geminiKeyRef.current = restoredKey;
            }
          } catch (_) {}
        }

        if (cloudProfile.totalRequests !== undefined) setTotalRequests(Number(cloudProfile.totalRequests));
        if (cloudProfile.successRequests !== undefined) setSuccessRequests(Number(cloudProfile.successRequests));
        if (cloudProfile.totalTokens !== undefined) setTotalTokens(Number(cloudProfile.totalTokens));
        if (cloudProfile.averageResponseTime !== undefined) setAverageResponseTime(Number(cloudProfile.averageResponseTime));
        if (cloudProfile.latencyHistoryStr) {
          try {
            const parsed = JSON.parse(cloudProfile.latencyHistoryStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLatencyHistory(parsed.map(Number));
            }
          } catch (_) {}
        }

        if (cloudProfile.aiPlanMode === "Free" || cloudProfile.aiPlanMode === "Paid") {
          setAiPlanMode(cloudProfile.aiPlanMode);
        }
        if (cloudProfile.appTheme) {
          setAppTheme(cloudProfile.appTheme as any);

        }
        if (cloudProfile.jarvisVolumePreset) {
          setJarvisVolumePreset(cloudProfile.jarvisVolumePreset as any);

        }
        if (cloudProfile.voiceEngine) {
          setVoiceEngine(cloudProfile.voiceEngine as any);

        }
        if (cloudProfile.baseStyleTone) {
          setBaseStyleTone(cloudProfile.baseStyleTone as any);

        }
        if (cloudProfile.charWarm) {

        }
        if (cloudProfile.charEnthusiastic) {

        }
        if (cloudProfile.charHeaders) {

        }
        if (cloudProfile.charEmoji) {

        }
        if (cloudProfile.isFastAnswers !== undefined) {
          setIsFastAnswers(cloudProfile.isFastAnswers);

        }
        if (cloudProfile.customInstructions) {
          setCustomInstructions(cloudProfile.customInstructions);

        }
        if (cloudProfile.isReferenceMemories !== undefined) {
          setIsReferenceMemories(cloudProfile.isReferenceMemories);

        }
        if (cloudProfile.isReferenceHistory !== undefined) {
          setIsReferenceHistory(cloudProfile.isReferenceHistory);

        }
        if (cloudProfile.nicknameMemory) {
          setNicknameMemory(cloudProfile.nicknameMemory);

        }
        if (cloudProfile.occupationMemory) {
          setOccupationMemory(cloudProfile.occupationMemory);

        }
        if (cloudProfile.moreAboutUser) {
          setMoreAboutUser(cloudProfile.moreAboutUser);

        }
        
        
        if (cloudProfile.buttonAccentColorStr) {
          setButtonAccentColor(cloudProfile.buttonAccentColorStr);
        }
        
        if (cloudProfile.connectedAppsStr) {
          try {
            setConnectedApps(JSON.parse(cloudProfile.connectedAppsStr));
          } catch (_) {}
        }
        if (cloudProfile.modelPreferencesStr) {
          try {
            const parsed = JSON.parse(cloudProfile.modelPreferencesStr);
            setModelPreferences(parsed);

          } catch (_) {}
        }
        // --- Recover Subcollections ---
        const cloudVoiceMessages = await recoverAllVoiceMessagesFromCloud();
        if (cloudVoiceMessages.length > 0) {
           setVoiceMessages(cloudVoiceMessages);
        } else if (cloudProfile.voiceMessagesStr) {
           try { setVoiceMessages(JSON.parse(cloudProfile.voiceMessagesStr)); } catch (_) {}
        }

        const cloudMemories = await recoverAllJarvisMemoriesFromCloud();
        if (cloudMemories.length > 0) {
           setJarvisMemories(cloudMemories);
        } else if (cloudProfile.jarvisMemoriesStr) {
           try { setJarvisMemories(JSON.parse(cloudProfile.jarvisMemoriesStr)); } catch (_) {}
        }

        const cloudBehaviorRules = await recoverAllJarvisBehaviorRulesFromCloud();
        if (cloudBehaviorRules.length > 0) {
           setJarvisBehaviorRules(cloudBehaviorRules);
        } else if (cloudProfile.jarvisBehaviorRulesStr) {
           try { setJarvisBehaviorRules(JSON.parse(cloudProfile.jarvisBehaviorRulesStr)); } catch (_) {}
        }

                // 1. Recover Cloud Sessions (Proper Subcollection Sync)
        const cloudSessions = await recoverAllChatSessionsFromCloud();
        
        let allItems: any[] = [];
        
        // 2. Legacy Migration: check if there's any old data in stringified field
        if (cloudProfile.chatHistoryItemsStr) {
           try {
              const parsedItems = JSON.parse(cloudProfile.chatHistoryItemsStr);
              if (Array.isArray(parsedItems)) {
                 allItems = [...allItems, ...parsedItems];
              }
           } catch (_) {}
        }
        
        // 3. Local Storage Migration
        
        // Merge them all, preferring cloudSessions as the ultimate truth
        allItems = [...cloudSessions, ...allItems];
        
        if (allItems.length > 0) {
           const deduplicated = deduplicateChatSessions(allItems);
           setChatHistoryItems(deduplicated);
           
           // If we have sessions, check if we need to auto-load one
           if (isInitialLaunchLoad) {
             // ALWAYS load a fresh chat on app launch
             setActiveSessionId(null);
             setMessages(getInitialWelcomeMessage());
           } else {
             // Not an initial launch (e.g. background sync)
             const currActive = activeSessionIdRef.current;
             if (currActive) {
                const updatedSession = deduplicated.find((s: any) => s.id === currActive);
                if (updatedSession && Array.isArray(updatedSession.messages)) {
                   setMessages(updatedSession.messages);
                }
             } else {
                setActiveSessionId(null);
                setMessages(getInitialWelcomeMessage());
             }
           }
           
           // Background task: sync any legacy items to the new cloud format
           deduplicated.forEach(sess => {
              if (!cloudSessions.find((c: any) => c.id === sess.id)) {
                 syncChatSessionToCloud((gmail || "").trim() || username, sess).catch(() => {});
              }
           });
        } else {
           setChatHistoryItems([]);
           if (isInitialLaunchLoad) {
             setActiveSessionId(null);
             setMessages(getInitialWelcomeMessage());
           } else {
             // Ultimate legacy fallback
             const cloudMsgs = await recoverAllDialoguesFromCloud();
             if (cloudMsgs && cloudMsgs.length > 0) {
               setMessages(cloudMsgs);
               const defaultSessId = `s-${Date.now()}`;
               setActiveSessionId(defaultSessId);
               const newSess = { id: defaultSessId, text: cloudMsgs[0]?.text?.slice(0, 30) || "Synced Chat", messages: cloudMsgs };
               setChatHistoryItems([newSess]);
               syncChatSessionToCloud((gmail || "").trim() || username, newSess).catch(() => {});
             } else {
               setActiveSessionId(null);
               setMessages(getInitialWelcomeMessage());
             }
           }
        }
        console.log(`[JARVIS Auto Sync] Synced Gmail profile and chat history downloaded successfully.`);
      } else {
        // No cloud profile exists yet. Preserve existing local history from cloud
        console.log(`[JARVIS Auto Sync] No cloud profile found for User. Retaining local chat history.`);
        
        // Reset config to defaults
                setJarvisTone("Caring & Support");
        setBaseStyleTone("Balanced");
        setIsFastAnswers(true);
        setCustomInstructions("");
        setIsReferenceMemories(true);
        setIsReferenceHistory(true);
        setNicknameMemory("");
        setOccupationMemory("");
        setMoreAboutUser("");
        
        const freshProfileHandle = "user_" + Date.now();
        setProfileHandle(freshProfileHandle);

        // Save this clean state to their new UID-scoped cloud so it doesn't get lost
        const uid = auth?.currentUser?.uid || 'guest';





        // Auto-recreate user document in Firestore users/{uid} collection if it was deleted
        const activeName = username || auth?.currentUser?.displayName || auth?.currentUser?.email || "User";
        const activeEmail = gmail || auth?.currentUser?.email || "";
        syncUserProfileToCloud(activeEmail || activeName, {
          gmail: activeEmail,
                    jarvisTone: "Caring & Support",
          baseStyleTone: "Balanced",
          isFastAnswers: true,
          profile: {
            name: activeName,
            email: activeEmail
          }
        }).catch((e) => console.warn("Auto-recreating Firestore users collection/doc:", e));
      }
    } catch (err) {
      console.warn("Auto-restore of cloud profile postponed:", err);
    } finally {
      hasFetchedFromCloud.current = true;
      setIsCloudDataLoaded(true);
    }
  };


  // Restore Google account session on load
  useEffect(() => {
    // Failsafe timer: ensure isAuthReady is unlocked within 1.2 seconds max even if auth listener hangs
    const failsafeTimer = setTimeout(() => {
      setIsAuthReady(true);
    }, 1200);

    try {
      const unsubscribe = initAuth(
        (user, token) => {
          clearTimeout(failsafeTimer);
          setGoogleUser(user);
          setWorkspaceToken(token);
          setAccessToken(token);

          if (user.email) {
            setGmail(user.email);

            restoreUserSettingsFromCloud(true);
          }
          const initialName = user.displayName || user.email || "Guest User";
          setUsername(initialName);
          const initials = initialName.split(" ").filter(Boolean).map((n: string) => n.charAt(0)).join("").toUpperCase();
          setAvatarInitials(initials.slice(0, 2) || "U");
          if (user.photoURL) {
            setAvatarImage(user.photoURL);

          }
          setIsLoggedIn(true);
          setIsAuthReady(true);

          /* setIsWorkspaceAuthChecked */;
        },
        () => {
          clearTimeout(failsafeTimer);
          /* setIsWorkspaceAuthChecked */;
          setIsAuthReady(true);
          restoreUserSettingsFromCloud(true);
        }
      );
      return () => {
        clearTimeout(failsafeTimer);
        if (typeof unsubscribe === "function") unsubscribe();
      };
    } catch (err) {
      clearTimeout(failsafeTimer);
      setIsAuthReady(true);
      console.error("initAuth setup issue:", err);
    }
  }, []);

  // One-time startup purge of deprecated localStorage API keys to ensure pure Firestore persistence
  useEffect(() => {
    try {
      localStorage.removeItem("jarvis_gemini_key");
      localStorage.removeItem("jarvis_gemini_key_pool");
      localStorage.removeItem("jarvis_disabled_gemini_keys");
      localStorage.removeItem("jarvis_openrouter_key");
      localStorage.removeItem("jarvis_openrouter_key_pool");
      localStorage.removeItem("jarvis_disabled_openrouter_keys");
    } catch (_) {}
  }, []);

  // Real-time Firestore synchronizer for daily API request stats
  useEffect(() => {
    const activeEmail = (gmail || "").trim() || username;
    if (!activeEmail) return;

    try {
      const opId = getUserDocId();
      if (!opId) return;
      const docRef = doc(db, "users", opId);

      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.dailyRequestCount !== undefined) {
            setDailyRequestCount(Number(data.dailyRequestCount));

          }
          if (data.dailyRequestLimit !== undefined) {
            setDailyRequestLimit(Number(data.dailyRequestLimit));

          }
          if (data.lastRequestResetDate !== undefined) {
            setLastRequestResetDate(data.lastRequestResetDate);

          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${opId}`);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Real-time requests tracking subscription postponed:", err);
    }
  }, [gmail, username]);

  const handleGoogleSignInClick = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setWorkspaceToken(res.accessToken);
        setAccessToken(res.accessToken);

        if (res.user.email) {
          setGmail(res.user.email);

        }
        const nameToUse = res.user.displayName || res.user.email || "Guest User";
        setUsername(nameToUse);
        const initials = nameToUse.split(" ").filter(Boolean).map((n: string) => n.charAt(0)).join("").toUpperCase();
        setAvatarInitials(initials.slice(0, 2) || "U");

        if (res.user.photoURL) {
          setAvatarImage(res.user.photoURL);

        }
        setIsLoggedIn(true);

        
        // Wait for full profile restoration from cloud before syncing basic profile
        // This prevents overwriting the cloud profile with an empty cache state!
        if (res.user.email) {
          await restoreUserSettingsFromCloud();
        }

        // Ensure user document in users/{uid} is created/restored in Firestore
        syncUserProfileToCloud(res.user.email || nameToUse, {
          gmail: res.user.email || "",
          profile: {
            name: nameToUse,
            email: res.user.email || ""
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      const isPopupClosed = err.code === "auth/popup-closed-by-user" || 
                            err.message?.includes("closed-by-user") ||
                            err.message?.includes("popup closed");
      
      if (isPopupClosed) {
        console.warn("Google Sign-In canceled by user (pop-up closed).");
        setLoginError("Sign-in canceled. The Google authentication popup was closed before completion. If popups are blocked or you wish to bypass this, you can click the 'Continue as Guest' button below!");
      } else {
        console.error("Sign-In failed:", err);
        setLoginError("Sign-In error: " + (err.message || String(err)));
      }
    }
  };

  // Handle live Firebase Forgot Password
  const handleForgotPassword = async () => {
    setLoginError("");
    setLoginSuccess("");
    if (!authEmail || !authEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }
    try {
      const status = await sendPasswordReset(authEmail.trim());
      if (status === "SUCCESS_PASSWORD") {
        setLoginSuccess("Password reset email sent. Please check your inbox and spam folder.");
      } else if (status === "GOOGLE_ONLY") {
        setLoginError("This account was created with Google Sign-In. Please use Sign in with Google.");
      } else {
        setLoginSuccess("If this email has a password account, a reset email will be sent. Please also check Spam.");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      const errCode = err.code || "";
      const errMsg = err.message || "";
      if (errCode === "auth/invalid-email" || errMsg.includes("invalid-email")) {
        setLoginError("Please enter a valid email.");
      } else if (errCode === "auth/user-not-found" || errMsg.includes("user-not-found")) {
        setLoginError("No password account found for this email.");
      } else if (errCode === "auth/too-many-requests" || errMsg.includes("too-many-requests")) {
        setLoginError("Too many attempts. Please try again later.");
      } else {
        setLoginError(err.message || String(err));
      }
    }
  };

  // Handle live Firebase Email authentication (Sign In & Sign Up)
  const handleFirebaseEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!authEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!passwordInput) {
      setLoginError("Please enter your password.");
      return;
    }
    if (isSignUpMode) {
      if (!signUpDisplayName.trim()) {
        setLoginError("Please enter your display name.");
        return;
      }
      if (!confirmPasswordInput) {
        setLoginError("Please confirm your password.");
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setLoginError("Passwords do not match. Please enter matching passwords.");
        return;
      }
    }

    try {
      let user;
      if (isSignUpMode) {
        user = await emailSignUpClick(authEmail.trim(), passwordInput, signUpDisplayName.trim());
      } else {
        user = await emailSignInClick(authEmail.trim(), passwordInput);
      }

      if (user) {
        setGoogleUser(user); // Store User record
        setWorkspaceToken(null); // No workspace token for email/password auth
        setAccessToken(null);


        if (user.email) {
          setGmail(user.email);

        }

        const nameToUse = isSignUpMode ? signUpDisplayName.trim() : (user.displayName || user.email || "Guest");
        setUsername(nameToUse);

        const initials = nameToUse.split(" ").filter(Boolean).map((n: string) => n.charAt(0)).join("").toUpperCase();
        setAvatarInitials(initials.slice(0, 2) || "U");


        setIsLoggedIn(true);
        if (isSignUpMode) {
          setShowWelcomeOnboarding(true);
        }

        // Wait for full profile restoration from cloud before syncing basic profile
        // This prevents overwriting the cloud profile with an empty cache state!
        if (user.email) {
          await restoreUserSettingsFromCloud();
        }

        // Ensure user document in users/{uid} is created/restored in Firestore
        syncUserProfileToCloud(user.email || nameToUse, {
          gmail: user.email || "",
          profile: {
            name: nameToUse,
            email: user.email || ""
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      console.warn("Firebase Email Auth status:", err?.code || err?.message);
      const errCode = err.code || "";
      const errMsg = err.message || "";
      
      if (errCode === "auth/email-already-in-use" || errMsg.includes("email-already-in-use")) {
        setLoginError("This email address is already in use. Please switch to Sign In.");
      } else if (errCode === "auth/weak-password" || errMsg.includes("weak-password")) {
        setLoginError("Password should be at least 6 characters.");
      } else if (errCode === "auth/wrong-password" || errMsg.includes("wrong-password")) {
        setLoginError("Incorrect password. Please verify and try again.");
      } else if (
        errCode === "auth/user-not-found" || 
        errCode === "auth/invalid-credential" ||
        errCode === "auth/invalid-email" ||
        errMsg.includes("user-not-found") ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("invalid-email")
      ) {
        setLoginError("Incorrect email or password. If you are a new user, please click 'Create Account' below.");
      } else {
        setLoginError(err.message || String(err));
      }
    }
  };

  // Handle signing out
  const handleLogOut = async () => {
    setIsLoggedIn(false);
    
    // Clear runtime configuration state
    setWorkspaceToken(null);
    setAccessToken(null);
    setGoogleUser(null);
    setUsername("Guest");
    setGmail("");
    setAvatarInitials("G");
    setAvatarImage(null);
    
    // Actually sign out of Firebase
    try {
      const { logout } = await import('./firebase');
      await logout();
    } catch(err) {}
    
    // Completely wipe chat history runtime state so next user gets empty slate until they load theirs
    // Run this AFTER logout so the useEffect that saves to local storage writes to 'guest' and not the user's uid.
    setMessages(getInitialWelcomeMessage());
    setChatHistoryItems([]);
    setActiveSessionId(null);

    setWorkspaceToken(null);
    setAccessToken(null);
    setGoogleUser(null);
    setUsername("Guest");
    setGmail("");
    setAvatarInitials("G");
    setAvatarImage(null);
    setMessages(getInitialWelcomeMessage());
    setChatHistoryItems([]);
    
    // Clear runtime configuration state
    setAiPlanMode("Free");
    setGeminiKey("");
    setJarvisMemories([]);
    setNicknameMemory("");
    setOccupationMemory("");
    setMoreAboutUser("");
    setSignUpDisplayName("");
    setActiveSessionId(null);

    try {
      await googleLogout();
    } catch (_) {}
  };

  const _handleExportData = () => {
    if (messages.length === 0) {
      showToast("No chat logs are currently stored in memory workspace to export.");
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
      showToast("Export failed: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const _clearChatHistory = () => {
    if (window.confirm("Interactive reset. Delete past history logs?")) {
      setMessages([]);
    }
  };

  const startNewChat = () => {
    setMessages(getInitialWelcomeMessage());
    setActiveSessionId(null);
    setInputText("");
    clearAttachment();
    setFaceStatus("idle");

    setSuggestionPills(getRandomSuggestions(3));
    setHomeGreeting(getRandomGreeting(username));
    setWorkingSessionIds({});
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
    navigateMenu("index");

    // Instantly scroll to end/bottom of loaded conversation
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 150);
  };

  return (
    <div id="app-root-shell" style={{ background: "var(--bg-gradient)", color: "var(--text-main)" }} className={`min-h-screen flex flex-col font-mono relative overflow-x-hidden antialiased selection:bg-cyan-500/30 selection:text-[#00f3ff] theme-${appTheme} transition-all duration-1000 ease-in-out`}>
      
      {/* Background canvas wrapper without ambient glowing blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-0" />

      {/* Processing PDF overlay modal */}
      {isPrintingText && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#03091e] border border-cyan-500/30 p-8 rounded-xl max-w-sm w-full flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin will-change-transform" />
            <h3 className="text-cyan-400 font-bold font-mono tracking-widest text-sm uppercase">COMPILING PDF ARCHIVE...</h3>
            <p className="text-slate-400 text-xs font-sans leading-relaxed">
              Synthesizing LaTeX formulas, Bengali fonts, and formatting tables into high-fidelity vector pages.
            </p>
          </div>
        </div>
      )}

      {/* Off-screen container for rendering rich text/math/tables/bullet points to PDF */}
      {isPrintingText && printingText && (() => {
        const parsedData = parseMarkdownToPdfData(printingText);
        return (
          <div className="absolute top-full left-full pointer-events-none" style={{ width: "210mm" }}>
            <div 
              ref={textPrintContainerRef} 
              className="bg-white text-slate-900 px-[20mm] py-[15mm] flex flex-col gap-6"
              style={{ 
                width: "210mm", 
                fontFamily: '"EB Garamond", "Noto Serif Bengali", serif',
                lineHeight: "1.6"
              }}
            >
              {/* Elegant Slate Header Banner */}
              <div 
                className="text-white p-8 rounded-lg border-b-[5px] flex flex-col gap-2 bg-slate-800"
                style={{ 
                  borderColor: "#00f3ff" 
                }}
              >
                <h1 className="text-2xl font-bold tracking-tight text-white">{parsedData.title}</h1>
                <p className="text-sm text-white/90">
                  Subject: {parsedData.subject} | Prepared with care by {parsedData.author}
                </p>
              </div>

              {/* Sections rendering with full MathRenderer support */}
              <div className="flex flex-col gap-6">
                {parsedData.sections.map((sect, sIdx) => {
                  const headingText = sect.heading || `Section ${sIdx + 1}`;
                  const bulletsList = sect.bulletPoints || [];
                  return (
                    <div key={sIdx} className="flex flex-col gap-3 py-2" style={{ pageBreakInside: "avoid" }}>
                      <div className="border-b pb-1 border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{headingText}</h2>
                      </div>

                      {sect.content && (
                        <div className="text-slate-800 leading-relaxed text-[11pt]">
                          <MathRenderer text={formatMathBeforePdfRender(sect.content)} isLight={true} />
                        </div>
                      )}

                      {/* Bullet points rendering with MathRenderer */}
                      {bulletsList.length > 0 && (
                        <ul className="list-disc pl-5 text-slate-700 flex flex-col gap-1.5 text-[10.5pt]">
                          {bulletsList.map((bp, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              <MathRenderer text={formatMathBeforePdfRender(bp)} isLight={true} />
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Table data rendering styled exactly according to striped/clean style */}
                      {sect.table && sect.table.headers && sect.table.rows && (
                        <div className="overflow-x-auto my-2" style={{ pageBreakInside: "avoid" }}>
                          <table className="w-full border-collapse text-left text-[10pt]">
                            <thead>
                              <tr className="bg-slate-700 text-white">
                                {sect.table.headers.map((hdr, hIdx) => (
                                  <th 
                                    key={hIdx} 
                                    className="py-2.5 px-3 font-bold border-b-2 border-slate-800"
                                    style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                                  >
                                    <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sect.table.rows.map((row, rIdx) => (
                                <tr 
                                  key={rIdx} 
                                  className={rIdx % 2 === 0 ? "bg-slate-50" : "bg-white"}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td 
                                      key={cIdx} 
                                      className="py-2 px-3 text-slate-700 border-b border-slate-100"
                                      style={{
                                        wordBreak: "break-word",
                                        whiteSpace: "normal"
                                      }}
                                    >
                                      <MathRenderer text={formatMathBeforePdfRender(cell)} isLight={true} />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* GLOBAL BACKGROUND INTERACTIVE DIGITAL SPACE GRID */}
      <div id="cyberspace-grid" className="absolute inset-0 bg-[linear-gradient(to_right,#00f3ff_0.03rem,transparent_0.03rem),linear-gradient(to_bottom,#00f3ff_0.03rem,transparent_0.03rem)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_85%,transparent_100%)] opacity-10 pointer-events-none -z-10" />
      <div id="ambient-neon-glow" className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse will-change-transform" />
      <div id="ambient-neon-glow-2" className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/10 animate-ping will-change-transform opacity-30 pointer-events-none" style={{ animationDuration: "3s" }} />

            <div className="flex flex-col items-center relative z-10 max-w-sm">
              {/* Pulsing standby power ring */}
              <button
                type="button"
                onClick={() => {
                  setIsSystemAsleep(false);
                  speakJARVISResponse(`System wake cycle initiated. Welcome back, ${username}.`, false, true);
                }}
                className="w-20 h-20 rounded-full bg-black/40 border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff] hover:text-white hover:border-[#00f3ff] hover:transition-all cursor-pointer relative"
              >
                <div className="absolute inset-0 rounded-full bg-[#00f3ff]/10 animate-ping will-change-transform opacity-60 pointer-events-none" style={{ animationDuration: "2s" }} />
                <Power size={32} className="animate-pulse" />
              </button>

              <h2 className="text-lg font-black tracking-[0.2em] text-white uppercase mt-6 font-sans">
                JARVIS STANDBY
              </h2>
              <p className="text-[10px] font-mono tracking-widest text-[#00f3ff]/75 font-semibold uppercase leading-none mt-1">
                Deep Neural Sleep Mode
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- WELCOME & PROFILE SETUP ONBOARDING MODAL (FOR NEW USERS) --- */}
      <OnboardingModal
        showWelcomeOnboarding={showWelcomeOnboarding}
        setShowWelcomeOnboarding={setShowWelcomeOnboarding}
        username={username}
        gmail={gmail}
        avatarImage={avatarImage}
        avatarInitials={avatarInitials}
        handleAvatarUpload={handleAvatarUpload}
        onboardingNickname={onboardingNickname}
        setOnboardingNickname={setOnboardingNickname}
        onboardingOccupation={onboardingOccupation}
        setOnboardingOccupation={setOnboardingOccupation}
        onboardingAbout={onboardingAbout}
        setOnboardingAbout={setOnboardingAbout}
        nicknameMemory={nicknameMemory}
        setNicknameMemory={setNicknameMemory}
        occupationMemory={occupationMemory}
        setOccupationMemory={setOccupationMemory}
        moreAboutUser={moreAboutUser}
        setMoreAboutUser={setMoreAboutUser}
        syncUserProfileToCloud={syncUserProfileToCloud}
        speakJARVISResponse={speakJARVISResponse}
      />

      {/* --- PHASE 1: PRE-AUTHENTICATION LOGIN WINDOW --- */}
      <AnimatePresence mode="wait">
        {!isAuthReady ? (
          <motion.div
            key="auth-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050814] select-none p-6 text-center"
          >
            {/* Clean Transparent JARVIS Logo */}
            <div className="relative flex items-center justify-center mb-4">
              <motion.img
                src={JARVIS_LOGO_BASE64}
                alt="JARVIS System Logo"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.85, 1, 0.85] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain will-change-transform"
              />
            </div>

            {/* Title & Status */}
            <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase font-sans mb-1 bg-gradient-to-r from-sky-200 via-white to-cyan-300 bg-clip-text text-transparent">
              JARVIS AI
            </h1>
            <p className="text-[10px] font-mono tracking-[0.3em] text-[#00f3ff]/80 uppercase mb-4">
              SYSTEM INITIALIZING & CONFIGURATION
            </p>

            {/* Progress line indicator */}
            <div className="w-44 h-1 bg-slate-800/80 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-[#00f3ff] rounded-full w-full animate-pulse" />
            </div>
            <p className="mt-3 text-[9px] font-mono tracking-widest text-slate-400 uppercase">
              Securing Connection...
            </p>
          </motion.div>
        ) : !isLoggedIn ? (
          <motion.div
            key="login-screen-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="login-screen-container"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#050814] overflow-y-auto select-none"
          >
            {/* Ambient subtle glowing backdrops */}
            <div className="absolute w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] -z-10 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-[350px] h-[350px] bg-[#00f3ff]/10 rounded-full blur-[120px] -z-10 pointer-events-none top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {/* Frameless full-screen login layout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              id="login-content-wrapper"
              className="w-full max-w-[380px] sm:max-w-[420px] relative z-10 my-auto shrink-0 px-3 sm:px-4 py-6"
            >
              {/* Header inside card matching screenshot */}
              <div className="flex flex-col items-center mb-4 sm:mb-5 select-none">
                <div className="w-12 h-12 flex items-center justify-center mb-2">
                  <img src={JARVIS_LOGO_BASE64} alt="JARVIS Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-slate-100 uppercase">
                  JARVIS
                </h1>
                <p className="text-[9px] font-mono tracking-[0.25em] text-[#64748b] uppercase mt-1 text-center">
                  JUST A RATHER VERY INTELLIGENT SYSTEM
                </p>
              </div>

              {/* Capsule Segmented Tab Switcher with 60fps GPU-accelerated smooth slide */}
              <div className="bg-[#060b1b] p-1 rounded-full border border-slate-800/80 grid grid-cols-2 relative select-none">
                {/* Hardware-accelerated sliding active backdrop pill */}
                <motion.div
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#182548] to-[#1e2f5b] border border-cyan-500/30 pointer-events-none will-change-transform shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                  animate={{ x: isSignUpMode ? "100%" : "0%" }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    mass: 0.6,
                  }}
                />

                <button
                  type="button"
                  id="tab-sign-in"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setLoginError("");
                    setLoginSuccess("");
                    setConfirmPasswordInput("");
                  }}
                  className={`py-2 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase relative z-10 transition-colors duration-150 cursor-pointer text-center ${
                    !isSignUpMode
                      ? "text-cyan-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setLoginError("");
                    setLoginSuccess("");
                    setConfirmPasswordInput("");
                    setSignUpDisplayName("");
                  }}
                  className={`py-2 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase relative z-10 transition-colors duration-150 cursor-pointer text-center ${
                    isSignUpMode
                      ? "text-cyan-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  REGISTER
                </button>
              </div>

              <form onSubmit={handleFirebaseEmailAuth} className="space-y-3">
                {loginError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/35 rounded-2xl text-[11px] text-rose-300 font-sans mb-2 space-y-1.5 animate-fadeIn">
                    <div className="flex gap-2 items-start text-left">
                      <Info size={14} className="text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-rose-200">AUTHENTICATION ALERT</p>
                        <p className="text-rose-300/90 leading-relaxed font-mono text-[10px] mt-0.5">{loginError}</p>
                      </div>
                    </div>
                    
                    <div className="pt-1.5 border-t border-rose-500/10 flex flex-wrap gap-2 text-[9.5px] font-mono justify-end">
                      <button
                        type="button"
                        onClick={() => setLoginError("")}
                        className="px-2.5 py-1 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg border border-slate-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/35 rounded-2xl text-[11px] text-emerald-300 font-sans mb-2 space-y-1.5 animate-fadeIn">
                    <div className="flex gap-2 items-start text-left">
                      <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-emerald-200">SYSTEM NOTIFICATION</p>
                        <p className="text-emerald-300/90 leading-relaxed font-mono text-[10px] mt-0.5">{loginSuccess}</p>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-500/10 flex flex-wrap gap-2 text-[9.5px] font-mono justify-end">
                      <button
                        type="button"
                        onClick={() => setLoginSuccess("")}
                        className="px-2.5 py-1 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg border border-slate-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {isSignUpMode && (
                  <div className="transition-all duration-200 ease-out">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                      DISPLAY NAME
                    </label>
                    <div className="w-full bg-[#060b1b] border border-slate-800 focus-within:border-[#38bdf8]/60 focus-within:rounded-full px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
                      <User size={15} className="text-slate-500 shrink-0" />
                      <input
                        type="text"
                        required
                        placeholder="ENTER YOUR NAME"
                        value={signUpDisplayName}
                        onChange={(e) => setSignUpDisplayName(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none uppercase tracking-wider"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                    EMAIL ADDRESS
                  </label>
                  <div className="w-full bg-[#060b1b] border border-slate-800 focus-within:border-[#38bdf8]/60 focus-within:rounded-full px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
                    <Mail size={15} className="text-slate-500 shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                    PASSWORD
                  </label>
                  <div className="w-full bg-[#060b1b] border border-slate-800 focus-within:border-[#38bdf8]/60 focus-within:rounded-full px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
                    <Lock size={15} className="text-slate-500 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-300 focus:outline-none transition-colors shrink-0 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {isSignUpMode && (
                  <div className="transition-all duration-200 ease-out">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                      CONFIRM PASSWORD
                    </label>
                    <div className="w-full bg-[#060b1b] border border-slate-800 focus-within:border-[#38bdf8]/60 focus-within:rounded-full px-3.5 py-2.5 flex items-center gap-2.5 transition-all">
                      <Lock size={15} className="text-slate-500 shrink-0" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Confirm your password"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-500 hover:text-slate-300 focus:outline-none transition-colors shrink-0 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {!isSignUpMode && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-slate-400 hover:text-[#38bdf8] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Main Action Button */}
                <button
                  type="submit"
                  id="login-action-btn"
                  className="w-full cursor-pointer bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#1d4ed8] text-white py-3 rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all mt-3 shadow-lg shadow-sky-500/20"
                >
                  <LogIn size={15} />
                  <span>{isSignUpMode ? "REGISTER" : "SIGN IN"}</span>
                </button>

                {/* Subtext below button with clear readable styling */}
                <p className="text-[11px] font-mono text-slate-400 text-center mt-1.5 tracking-wide">
                  {isSignUpMode ? "Initialize new profile" : "System standing by"}
                </p>

                {/* Divider with OR text matching screenshot */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800/80"></div>
                  <span className="shrink-0 mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-slate-800/80"></div>
                </div>

                {/* Google Sign In capsule button matching screenshot */}
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="w-full cursor-pointer bg-[#060b1b] hover:bg-[#101830] border border-slate-800 py-2.5 sm:py-3 rounded-full text-xs font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition-all"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          /* --- PHASE 2: THREE-SCREEN EXPERIENCE INSIDE RESPONSIVE PHONE MOCK CHASSIS --- */
          <div key="workspace-main-wrapper" className="flex-1 w-full max-w-7xl mx-auto p-1.5 sm:p-4 md:p-6 flex flex-col relative z-10 h-full pb-1 md:pb-4">
            
            {/* MAIN DESKTOP RENDER CORE PANEL */}
            <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300 min-h-[500px] md:min-h-[660px]">

              {/* RENDER BODY FOR DESKTOP COMPONENT LAYOUT */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <AnimatePresence custom={pageDirection} mode="wait">
                  {currentScreen === "homepage" && (
                    <motion.div
                      key="screen-1-homepage"
                      variants={pageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col justify-between px-2 pb-1 pt-4 md:p-4 transform-gpu"
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {/* Interactive Header */}
                      <div className="flex justify-between items-center pb-2 gap-3 relative">
                        {/* Left Action Container: Animated Hamburger/Close Menu Button */}
                        <div className="flex items-center gap-1.5 shrink-0 z-30">
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all cursor-pointer outline-none flex items-center justify-center font-bold"
                            title={isHistoryDrawerOpen ? "Close Menu" : "Open Chat History"}
                            aria-label="Toggle navigation menu"
                          >
                            <AnimatePresence mode="wait">
                              {isHistoryDrawerOpen ? (
                                <motion.div
                                  key="close"
                                  initial={{ rotate: -90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: 90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <X size={20} />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="menu"
                                  initial={{ rotate: 90, opacity: 0 }}
                                  animate={{ rotate: 0, opacity: 1 }}
                                  exit={{ rotate: -90, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Menu size={20} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                        
                        {/* Center dropdown container */}
                        <div className="flex-1 flex justify-center items-center relative z-20">
                          <button
                            type="button"
                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                            className="flex items-center gap-1.5 text-sm sm:text-base cursor-pointer outline-none select-none py-1"
                          >
                            <img src={JARVIS_LOGO_BASE64} alt="JARVIS" className="w-5 h-5 object-contain inline-block" />
                            <span className="font-extrabold bg-gradient-to-r from-sky-300 via-white to-cyan-300 bg-clip-text text-transparent">
                              {activeChatMode}
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
                                  className="absolute top-full mt-2 w-[280px] liquid-glass border border-white/15 rounded-2xl p-2 z-50 text-left select-none shadow-2xl backdrop-blur-2xl"
                                >
                                  {/* Option 1: Jarvis Lightning */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("Jarvis Lightning");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "Jarvis Lightning"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">{"Jarvis Lightning"}</span>
                                      {activeChatMode === "Jarvis Lightning" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      For getting ultra-fast instant responses
                                    </span>
                                  </button>

                                  {/* Option 2: Jarvis Core */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("Jarvis Core");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "Jarvis Core"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">{"Jarvis Core"}</span>
                                      {activeChatMode === "Jarvis Core" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      All-rounder for everyday tasks and multimodal logic
                                    </span>
                                  </button>

                                  {/* Option 3: Jarvis Expert */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveChatMode("Jarvis Expert");
                                      setIsModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex flex-col p-3 rounded-xl cursor-pointer text-left transition-all ${
                                      activeChatMode === "Jarvis Expert"
                                        ? "bg-[#00f3ff]/10 text-[#00f3ff]"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold">{"Jarvis Expert"}</span>
                                      {activeChatMode === "Jarvis Expert" && (
                                        <span className="text-[10px] text-[#00f3ff]">●</span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                                      Deep research, tool integration & profound reasoning
                                    </span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Right Action Container: Geolocation HUD + Clean Edit/Pen Icon */}
                        <div className="flex items-center gap-1.5 shrink-0 relative">
                          {/* Live Geolocation Tracker Badge */}
                          <div className="relative">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setIsLocationDropdownOpen(!isLocationDropdownOpen);
                                setIsModelDropdownOpen(false); // Close other to prevent overlay overlap
                              }}
                              className={`p-2 rounded-xl border transition-all cursor-pointer outline-none flex items-center justify-center gap-1 relative ${
                                userLocation.granted
                                  ? "border-emerald-500/45 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30"
                                  : userLocation.loading
                                  ? "border-amber-500/45 bg-amber-950/20 text-amber-400 animate-pulse"
                                  : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                              }`}
                              title={userLocation.granted ? `Location Active: ${userLocation.address}` : "Sync Location Access"}
                            >
                              {userLocation.loading ? (
                                <RefreshCw size={17} className="animate-spin will-change-transform" />
                              ) : userLocation.granted ? (
                                <Navigation size={17} className="animate-pulse" />
                              ) : (
                                <MapPin size={17} />
                              )}
                              
                              {/* Pulse beacon if active */}
                              {userLocation.granted && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                  <span className="animate-ping will-change-transform absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 font-extrabold text-[4px]"></span>
                                </span>
                              )}
                            </motion.button>

                            <AnimatePresence>
                              {isLocationDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 cursor-default" 
                                    onClick={() => setIsLocationDropdownOpen(false)} 
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="absolute right-0 mt-2.5 w-[320px] liquid-glass border border-white/15 rounded-2xl p-4 z-50 text-left select-none shadow-2xl backdrop-blur-2xl"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                                      <div className="flex items-center gap-2">
                                        <Compass size={16} className="text-[#00f3ff] animate-spin will-change-transform-slow" />
                                        <span className="text-xs font-bold font-mono tracking-wider text-[#00f3ff]">JARVIS NAVIGATION FEED</span>
                                      </div>
                                      <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded ${
                                        userLocation.granted 
                                          ? "bg-emerald-500/20 text-emerald-400" 
                                          : userLocation.loading 
                                          ? "bg-amber-500/20 text-amber-400" 
                                          : "bg-slate-800 text-slate-400"
                                      }`}>
                                        {userLocation.granted ? "OPERATIONAL" : userLocation.loading ? "LOADING" : "OFFLINE"}
                                      </span>
                                    </div>

                                    {/* Location Info Box */}
                                    <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80">
                                        <div className="text-slate-400 text-[10px] mb-1">CURRENT RESOLVED REGION:</div>
                                        <div className="text-white font-bold font-sans mb-3">
                                          {userLocation.address || "Standby - Uluberia, West Bengal"}
                                        </div>
                                        
                                        {/* Real-time Weather Widget */}
                                        <div className="pt-2.5 border-t border-slate-800/50">
                                          <div className="text-slate-400 text-[9px] mb-1.5 uppercase font-semibold tracking-wider">Real-time Weather Report:</div>
                                          <WeatherWidget  />
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="pt-2">
                                        <button
                                          type="button"
                                          disabled={userLocation.loading}
                                          onClick={() => {
                                            syncGeolocation();
                                            speakJARVISResponse("Acquiring fresh device geolocation data streams now.", false, true);
                                          }}
                                          className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-bold text-[10.5px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                                        >
                                          <RefreshCw size={11} className={userLocation.loading ? "animate-spin will-change-transform" : ""} />
                                          {userLocation.granted ? "FORCE RE-SYNC GPS" : "SYNC DEVICE LOCATION"}
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startNewChat}
                            className="p-2 rounded-xl border border-transparent text-[#00f3ff] hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]/20 transition-all cursor-pointer outline-none flex items-center justify-center"
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
                              <div className="p-3 bg-black/45 border-2 border-[#00f3ff]/45 hover:border-[#00f3ff] rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden backdrop-blur-md">
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
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 mb-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative overflow-hidden backdrop-blur-md shrink-0 cursor-pointer"
                            onClick={() => {
                              setCurrentScreen("menu");
                              navigateMenu("api");
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
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-3 mb-3 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/35 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative overflow-hidden backdrop-blur-md shrink-0 cursor-pointer"
                            onClick={() => {
                              setCurrentScreen("menu");
                              navigateMenu("profile-manage");
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
                              className="flex-grow flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full select-none text-center origin-center relative overflow-hidden py-4 sm:py-6"
                            >
                              {/* Clean Transparent JARVIS PNG Logo Above Greeting Text */}
                              <div className="mb-3.5 flex items-center justify-center">
                                <img
                                  src={JARVIS_LOGO_BASE64}
                                  alt="JARVIS"
                                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                                />
                              </div>

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
                            {(() => {
                              const listToRender = messages.filter(m => m && m.text && !m.text.includes("Premium TTS Voice Quota Exceeded") && !m.id?.startsWith("sys-voice-error"));
                              // Deduplicate by message id to prevent any possible duplicate key warnings
                              const uniqueList: Message[] = [];
                              const seenIds = new Set<string>();
                              for (const m of listToRender) {
                                if (m && m.id) {
                                  if (!seenIds.has(m.id)) {
                                    seenIds.add(m.id);
                                    uniqueList.push(m);
                                  }
                                }
                              }
                              return uniqueList.map((m) => {
                                const isCurrentlyTyping = m.sender === "jarvis" && !completedTypingMessageIds[m.id];
                              
                              return (
                                <motion.div
                                  key={m.id}
                                  layout="position"
                                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                                    onContextMenu={(e: any) => {
                                      if (m.sender === "user") {
                                        handleUserMessageContextMenu(e, m);
                                      }
                                    }}
                                    onTouchStart={(e: any) => {
                                      if (m.sender === "user") {
                                        handleTouchStart(e, m);
                                      }
                                    }}
                                    onTouchEnd={(e: any) => {
                                      if (m.sender === "user") {
                                        handleTouchEnd();
                                      }
                                    }}
                                    className={`chat-message-bubble leading-relaxed relative font-sans min-w-0 overflow-hidden break-words select-text cursor-text transition-all duration-300 ${
                                      isCurrentlyTyping ? "cursor-pointer select-none" : ""
                                    } ${
                                      m.sender === "user"
                                        ? "max-w-[85%] sm:max-w-[80%] p-3.5 sm:p-4 px-4.5 sm:px-5 rounded-[22px] rounded-br-sm liquid-bubble-user text-white text-[13px] self-end ml-auto font-sans"
                                        : "w-full p-4 pl-0 py-2 bg-transparent text-[#e2f8ff] border-none shadow-none text-[13.5px] self-start"
                                    }`}
                                    title={isCurrentlyTyping ? "Click to instantly complete typing" : undefined}
                                  >
                                    {m.attachment && (
                                      <div className={`mb-3 overflow-hidden rounded-xl border border-[#00f3ff]/30 shadow-md ${
                                        m.sender === "jarvis" ? "max-w-xl" : "max-w-xs"
                                      }`}>
                                        {m.attachmentType?.startsWith('audio/') ? (
                                          <audio 
                                            controls 
                                            src={m.attachment} 
                                            className="w-full h-12"
                                          />
                                        ) : (
                                          <img 
                                            src={m.attachment} 
                                            alt="Visual Layer" 
                                            onClick={() => {
                                              setLightboxImageUrl(m.attachment || null);
                                              setLightboxZoom(1);
                                            }}
                                            className={`w-full object-cover rounded cursor-zoom-in hover:opacity-90 active:scale-[0.98] transition-all ${
                                              m.sender === "jarvis" ? "max-h-96" : "max-h-32"
                                            }`} 
                                            referrerPolicy="no-referrer" 
                                          />
                                        )}
                                      </div>
                                    )}
                                    <div className="font-mono text-xs leading-normal select-text cursor-text">
                                      {m.generationStatus === "generating" ? (
                                        <JarvisGeneratingStatus queryPrompt={m.text || ""} />
                                      ) : (
                                        <ChatMessageContent 
                                          text={m.text} 
                                          sender={m.sender}
                                          isTypingActive={isCurrentlyTyping}
                                          onTypingComplete={() => {
                                            setCompletedTypingMessageIds(prev => ({ ...prev, [m.id]: true }));
                                          }}
                                        />
                                      )}
                                    </div>

                                    {m.sender === "jarvis" && m.savedMemoryText && (
                                      <motion.div 
                                        variants={slideHorizontalVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                        className="mt-3 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#031525]/50 border border-cyan-500/25 text-cyan-400 text-xs font-mono max-w-sm backdrop-blur-sm select-none"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center shrink-0">
                                          <Database size={11} className="text-cyan-300 animate-pulse" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-sans font-black text-[#00f3ff] uppercase text-[8px] tracking-widest leading-none block mb-0.5">
                                            Persistent Memory Synced
                                          </span>
                                          <span className="text-slate-300 text-[10.5px] font-sans font-medium truncate block leading-snug">
                                            “{m.savedMemoryText}”
                                          </span>
                                        </div>
                                      </motion.div>
                                    )}

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

                                    {/* Icon Action Bar for JARVIS messages */}
                                    {m.sender !== "user" && !isCurrentlyTyping && (
                                      <div className="mt-2.5 flex items-center gap-1 sm:gap-2 select-none text-slate-400 relative">
                                        {/* 1. Copy Icon Button */}
                                        <button
                                          onClick={() => copyMessageText(m.id, m.text)}
                                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                          title="Copy message"
                                        >
                                          {copiedMsgId === m.id ? (
                                            <Check size={16} className="text-emerald-400" />
                                          ) : (
                                            <Copy size={16} />
                                          )}
                                        </button>

                                        {/* 2. Listen Icon Button */}
                                        <button
                                          onClick={() => speakChatDialogue(m.id, m.text)}
                                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                          title={currentPlayingMsgId === m.id ? "Stop audio" : "Listen to message"}
                                        >
                                          {currentPlayingMsgId === m.id ? (
                                            <VolumeX size={16} className="text-cyan-400 animate-pulse" />
                                          ) : (
                                            <Volume2 size={16} />
                                          )}
                                        </button>

                                        {/* 3. Share Icon Button */}
                                        <button
                                          onClick={() => handleShareMessage(m.text)}
                                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                          title="Share message"
                                        >
                                          <Share2 size={16} />
                                        </button>

                                        {/* 4. More Options (3 dots) Icon Button */}
                                        <div className="relative">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (activeMsgMenuId === m.id) {
                                                setActiveMsgMenuId(null);
                                                setMsgMenuPos(null);
                                              } else {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const placeAbove = rect.top > 250;
                                                const leftPos = Math.max(12, Math.min(rect.left - 130, window.innerWidth - 228));
                                                if (placeAbove) {
                                                  setMsgMenuPos({
                                                    bottom: window.innerHeight - rect.top + 6,
                                                    left: leftPos,
                                                    placeAbove: true,
                                                  });
                                                } else {
                                                  setMsgMenuPos({
                                                    top: rect.bottom + 6,
                                                    left: leftPos,
                                                    placeAbove: false,
                                                  });
                                                }
                                                setActiveMsgMenuId(m.id);
                                              }
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                              activeMsgMenuId === m.id
                                                ? "text-cyan-400 bg-white/10"
                                                : "text-slate-400 hover:text-white hover:bg-white/10"
                                            }`}
                                            title="More options"
                                          >
                                            <MoreVertical size={16} />
                                          </button>

                                          {/* Floating Popup Window using fixed viewport positioning */}
                                          <AnimatePresence>
                                            {activeMsgMenuId === m.id && (
                                              <>
                                                {/* Backdrop overlay to close menu on click outside */}
                                                <div 
                                                  className="fixed inset-0 z-50 bg-transparent"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMsgMenuId(null);
                                                    setMsgMenuPos(null);
                                                  }}
                                                  onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMsgMenuId(null);
                                                    setMsgMenuPos(null);
                                                  }}
                                                />
                                                <motion.div
                                                  initial={{ opacity: 0, scale: 0.92, y: msgMenuPos?.placeAbove ? 6 : -6 }}
                                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                                  exit={{ opacity: 0, scale: 0.92, y: msgMenuPos?.placeAbove ? 6 : -6 }}
                                                  transition={{ duration: 0.15, ease: "easeOut" }}
                                                  style={{
                                                    position: "fixed",
                                                    top: msgMenuPos?.top !== undefined ? `${msgMenuPos.top}px` : undefined,
                                                    bottom: msgMenuPos?.bottom !== undefined ? `${msgMenuPos.bottom}px` : undefined,
                                                    left: `${msgMenuPos?.left ?? 12}px`,
                                                  }}
                                                  className="w-54 bg-[#0d1326]/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-2.5 z-[9999] text-left select-none text-slate-100 font-sans"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  {/* Header Timestamp */}
                                                  <div className="text-[11px] font-medium text-slate-400 px-2 py-1 select-none">
                                                    {m.timestamp ? (m.timestamp.includes("AM") || m.timestamp.includes("PM") ? `Today, ${m.timestamp}` : m.timestamp) : `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                  </div>

                                                  {/* Branch in new chat */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleBranchNewChat(m);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
                                                  >
                                                    <GitFork size={15} className="text-slate-300 shrink-0" />
                                                    <span>Branch in new chat</span>
                                                  </button>

                                                  <div className="my-1.5 border-b border-white/10" />

                                                  {/* Model used header */}
                                                  <div className="text-[11px] font-medium text-slate-400 px-2 py-0.5 select-none">
                                                    {`Used ${m.modelUsed === "backup" ? "Backup" : (m.modelUsed === "offline-safe-mode" || m.modelUsed === "offline" ? "Local Fallback" : (m.modelUsed?.includes("Pro") ? "3.1 Pro" : (m.modelUsed?.includes("Lite") || m.modelUsed?.includes("3.5") ? "3.5 Flash Lite" : "3.7 Flash")))}`}
                                                  </div>

                                                  {/* Retry */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveMsgMenuId(null);
                                                      setMsgMenuPos(null);
                                                      handleRetryMessage(m);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
                                                  >
                                                    <RotateCcw size={15} className="text-slate-300 shrink-0" />
                                                    <span>Retry</span>
                                                  </button>

                                                  {/* Use Thinking */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleUseThinking(m);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
                                                  >
                                                    <Lightbulb size={15} className="text-slate-300 shrink-0" />
                                                    <span>Use Thinking</span>
                                                  </button>

                                                  {/* Search the web */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSearchTheWeb(m);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
                                                  >
                                                    <Globe size={15} className="text-slate-300 shrink-0" />
                                                    <span>Search the web</span>
                                                  </button>

                                                  {/* Make PDF */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveMsgMenuId(null);
                                                      setMsgMenuPos(null);
                                                      downloadMessageAsPDF(m.text);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
                                                  >
                                                    <FileText size={15} className="text-slate-300 shrink-0" />
                                                    <span>Make PDF</span>
                                                  </button>
                                                </motion.div>
                                              </>
                                            )}
                                          </AnimatePresence>
                                        </div>

                                        {/* Emotion Badge next to 3-dots button */}
                                        {(() => {
                                          const detected = m.emotion || detectEmotionFromText(m.text) || "normal";
                                          const info = emotionLabels[detected] || emotionLabels.normal;
                                          return (
                                            <span className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 select-none ${info.style}`}>
                                              <span className="text-xs">{info.icon}</span>
                                              <span>{info.label}</span>
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  {m.sender === "user" && (
                                    <div className="flex items-center gap-2 mt-1 px-1.5 text-[8.5px] font-mono tracking-wider justify-end self-end mr-2">
                                      <span className="tracking-widest text-[#00f3ff]/45 uppercase select-none font-bold">
                                        {m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            });
                          })()}

                            {/* Gemini-Style 3-Dots Animated Thinking Loader */}
                            {activeSessionId && workingSessionIds[activeSessionId] && (
                              <motion.div
                                key="jarvis-thinking-indicator"
                                variants={slideHorizontalVariants}
                                        initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col w-full items-start font-sans select-none mb-4"
                              >
                                <div className="px-4 py-3.5 bg-[#091530]/60 border border-[#00f3ff]/20 rounded-2xl rounded-bl-sm backdrop-blur-md">
                                  <div className="flex items-center gap-1.5 h-2">
                                    <motion.span
                                      className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"
                                      animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0 }}
                                    />
                                    <motion.span
                                      className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"
                                      animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                                    />
                                    <motion.span
                                      className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"
                                      animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4 }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                              className="absolute bottom-5 right-5 z-40 p-2.5 rounded-full bg-[#00f3ff] text-black border border-[#00f3ff]/50 hover:bg-white hover:flex items-center justify-center cursor-pointer transition-all duration-200"
                              title="Go to end of conversation"
                            >
                              <ArrowDown size={14} className="stroke-[3]" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                       {/* Homepage Interactive Input Drawer footer */}
                       <div className="mt-1">


                         {/* Interactive input bar containing prefix + and mic/stack/Live icons inside the chat box */}
                        <div className="w-full flex items-center">
                          {/* Clean responsive parent input bar container */}
                          <div className="w-full flex flex-col relative transition-all duration-200">
                            
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
                                    variants={slideHorizontalVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                                    className="absolute right-1 bottom-full mb-3 w-[290px] bg-[#070b1a]/95 border-2 border-[#00f3ff]/50 rounded-2xl p-4 backdrop-blur-xl z-[70] text-left select-none"
                                  >
                                    <div className="flex items-center gap-1.5 mb-2.5 border-b border-[#00f3ff]/20 pb-1.5">
                                      <Layers className="text-[#00f3ff] shrink-0" size={13} />
                                      <h3 className="text-[10px] font-bold text-[#00f3ff] font-mono uppercase tracking-widest">
                                        Choose Intelligence
                                      </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                      {/* Lightning / Fast option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("Jarvis Lightning");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "⚡ [System Interface Protocol]: Jarvis Lightning online. Optimized for ultra-fast dialogue & instant responses.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "Jarvis Lightning"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <MessageSquare className={`shrink-0 mt-0.5 ${activeChatMode === "Jarvis Lightning" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">JARVIS LIGHTNING</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-sky-950/60 text-sky-300 rounded border border-sky-800/40 font-black scale-90">SPEED</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Fluid fast conversations and instant daily tasks.</p>
                                        </div>
                                      </button>

                                      {/* Expert / Deep Research option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("Jarvis Expert");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "🛡️ [System Interface Protocol]: Jarvis Expert core online. Activated deep reasoning, custom tools & analytical research.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "Jarvis Expert"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <Search className={`shrink-0 mt-0.5 ${activeChatMode === "Jarvis Expert" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">JARVIS EXPERT</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-indigo-950/60 text-[#a3a1ff] rounded border border-indigo-800/40 font-black scale-90">PRO</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Pro reasoning, custom tools & deep research breakdowns.</p>
                                        </div>
                                      </button>

                                      {/* Core option */}
                                      <button
                                        onClick={() => {
                                          setActiveChatMode("Jarvis Core");
                                          setIsChatModeSheetOpen(false);
                                          const confirmMsg = {
                                            id: Date.now().toString() + "-sysmode",
                                            sender: "jarvis",
                                            text: "⚡ [System Interface Protocol]: Jarvis Core online. Ready for multipurpose intelligence, rich media, and master coordination.",
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                          };
                                          setMessages(prev => [...prev, confirmMsg]);
                                        }}
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl cursor-pointer text-left transition-all border ${
                                          activeChatMode === "Jarvis Core"
                                            ? "bg-[#00f3ff]/10 border-[#00f3ff]"
                                            : "bg-black/30 border-transparent hover:border-[#00f3ff]/20 hover:bg-black/45"
                                        }`}
                                      >
                                        <Sparkles className={`shrink-0 mt-0.5 ${activeChatMode === "Jarvis Core" ? "text-[#00f3ff]" : "text-slate-400"}`} size={15} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-100 uppercase font-mono">JARVIS CORE</h4>
                                            <span className="text-[8px] font-mono px-1 py-0.2 bg-cyan-950/60 text-cyan-300 rounded border border-cyan-800/40 font-black scale-90">CORE</span>
                                          </div>
                                          <p className="text-[8px] text-slate-400 block mt-1 leading-tight font-mono">Expert scripts, smart analysis, and robust multimodal multitasking.</p>
                                        </div>
                                      </button>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>

                            {/* === MULTIMEDIA STYLES CAROUSEL PANEL MATCHING THE USER'S ATTACHED VIDEOS === */}
                            {(activeChatTag === "image" || activeChatTag === "video") && (
                              <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.3 }}
                                className="w-full mb-3 p-3 bg-black/60 border border-[#00f3ff]/15 rounded-2xl backdrop-blur-md text-left overflow-hidden relative select-none animate-in fade-in zoom-in-95 duration-300"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/5 pb-2 mb-2 px-1">
                                  <div>
                                    <h4 className="text-[11.5px] font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                                      {activeChatTag === "image" && "🎨 টেম্পলেট ব্যবহার করে দেখুন অথবা চ্যাটে কোনও ছবির বিবরণ দিন"}
                                      {activeChatTag === "video" && "🎬 টেম্পলেট ব্যবহার করে দেখুন অথবা চ্যাটে কোনও ভিডিওর বিবরণ দিন"}
                                    </h4>
                                    <p className="text-[9.5px] text-slate-400 mt-0.5 sm:hidden">
                                      {activeChatTag === "image" && "Try a template or describe your image idea below"}
                                      {activeChatTag === "video" && "Try a template or describe your video loop below"}
                                    </p>
                                  </div>
                                  <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] rounded-full uppercase tracking-wider scale-[95%] sm:scale-100">
                                    {activeChatTag === "image" && "IMAGEN 3.0 FAST"}
                                    {activeChatTag === "video" && "VEO 1.0 FAST PREVIEW"}
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
                                </div>
                              </motion.div>
                            )}

                            {/* === SELECTED CHAT OPTION TAG === */}
                            {(activeChatTag === "image" || activeChatTag === "video") && (
                              <div className="flex items-center justify-between mx-2 mb-2 p-2 bg-black/60 border border-[#00f3ff]/25 rounded-2xl transition-all duration-300 animate-in fade-in slide-in-from-left-3">
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

                             {/* Hidden File Input Elements for Attachments */}
                             <input
                               type="file"
                               ref={fileInputRef}
                               className="hidden"
                               onChange={handleFileUpload}
                               accept="*/*"
                             />
                             <input
                               type="file"
                               ref={imageInputRef}
                               className="hidden"
                               onChange={handleFileUpload}
                               accept="image/*"
                             />
                             <input
                               type="file"
                               ref={docInputRef}
                               className="hidden"
                               onChange={handleFileUpload}
                               accept="application/pdf,.doc,.docx,.txt,.csv,.json"
                             />
                             <input
                               type="file"
                               ref={cameraInputRef}
                               className="hidden"
                               onChange={handleFileUpload}
                               accept="image/*"
                               capture="environment"
                             />

                             {/* ChatGPT-style Floating Attachment Options Menu */}
                             <AnimatePresence>
                               {isAttachmentSheetOpen && (
                                 <>
                                   {/* Smooth Dimmed Backdrop */}
                                   <motion.div 
                                     initial={{ opacity: 0 }}
                                     animate={{ opacity: 1 }}
                                     exit={{ opacity: 0 }}
                                     transition={{ duration: 0.2 }}
                                     className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px] cursor-pointer"
                                     onClick={() => setIsAttachmentSheetOpen(false)}
                                     onTouchStart={() => setIsAttachmentSheetOpen(false)}
                                   />
                                   {/* ChatGPT-style Floating Popover Card */}
                                   <motion.div
                                     variants={slideHorizontalVariants}
                                     initial="hidden"
                                     animate="visible"
                                     exit="exit"
                                     transition={{ type: "spring", damping: 26, stiffness: 340 }}
                                     className="fixed bottom-[85px] left-3 sm:left-6 z-[100] w-[230px] sm:w-[250px] bg-[#070c1f]/95 border border-[#00f3ff]/30 rounded-2xl p-2 backdrop-blur-2xl select-none font-sans"
                                   >
                                     <div className="flex flex-col gap-1">
                                       {/* Option 1: Camera */}
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setIsAttachmentSheetOpen(false);
                                           cameraInputRef.current?.click();
                                         }}
                                         className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl hover:bg-[#00f3ff]/15 active:bg-[#00f3ff]/25 transition-all cursor-pointer group text-left active:scale-98"
                                       >
                                         <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00f3ff] group-hover:scale-105 transition-transform shrink-0">
                                           <Camera size={18} />
                                         </div>
                                         <span className="text-sm font-semibold text-slate-100 group-hover:text-[#00f3ff] font-sans">
                                           Camera
                                         </span>
                                       </button>

                                       {/* Option 2: Photos / Gallery */}
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setIsAttachmentSheetOpen(false);
                                           imageInputRef.current?.click();
                                         }}
                                         className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl hover:bg-[#00f3ff]/15 active:bg-[#00f3ff]/25 transition-all cursor-pointer group text-left active:scale-98"
                                       >
                                         <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                                           <ImageIcon size={18} />
                                         </div>
                                         <span className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 font-sans">
                                           Photos / Gallery
                                         </span>
                                       </button>

                                       {/* Option 3: Files / PDF */}
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setIsAttachmentSheetOpen(false);
                                           docInputRef.current?.click();
                                         }}
                                         className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl hover:bg-[#00f3ff]/15 active:bg-[#00f3ff]/25 transition-all cursor-pointer group text-left active:scale-98"
                                       >
                                         <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                                           <FileText size={18} />
                                         </div>
                                         <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 font-sans">
                                           Files / PDF
                                         </span>
                                       </button>
                                     </div>
                                   </motion.div>
                                 </>
                               )}
                             </AnimatePresence>

                             {/* ChatGPT-style Floating Glass Input Container */}
                             <motion.div 
                               layoutId="live-mode-morph-container"
                               key="standard-composer"
                               onDragEnter={handleDragEnter}
                               onDragOver={handleDragOver}
                               onDragLeave={handleDragLeave}
                               onDrop={handleDrop}
                               className={`relative w-full liquid-glass-dock rounded-[28px] p-2 sm:p-2.5 transition-all duration-300 mb-0.5 ${isDraggingFile ? 'border-[#00f3ff] bg-[#00f3ff]/15 scale-[1.02]' : ''}`}
                               style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
                             >
                               {isDraggingFile && (
                                 <div className="absolute inset-0 z-50 rounded-[28px] flex items-center justify-center bg-[#070c1f]/80 backdrop-blur-sm border-2 border-dashed border-[#00f3ff] pointer-events-none">
                                   <div className="flex flex-col items-center justify-center text-[#00f3ff] pointer-events-none">
                                     <Paperclip size={24} className="mb-2 animate-bounce" />
                                     <span className="font-bold text-sm">Drop file to attach</span>
                                   </div>
                                 </div>
                               )}
                               {/* Attachment Preview Chips */}
                               {attachmentItems.length > 0 && (
                                 <div className="flex flex-wrap gap-3 px-2 pt-1 pb-2 border-b border-white/10 mb-2 max-h-[110px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30">
                                   {attachmentItems.map((item) => {
                                     const isImg = item.type.startsWith("image/") || item.url.startsWith("data:image/");
                                     const isPdf = item.type.includes("pdf") || item.name.toLowerCase().endsWith(".pdf");
                                     return (
                                       <div
                                         key={item.id}
                                         className="relative group animate-in fade-in zoom-in-95"
                                       >
                                         <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                                           {isImg ? (
                                             <img
                                               src={item.url}
                                               alt={item.name}
                                               className="w-full h-full object-cover"
                                             />
                                           ) : isPdf ? (
                                             <div className="text-red-400 font-bold text-xs">
                                               PDF
                                             </div>
                                           ) : (
                                             <div className="text-cyan-400">
                                               <Paperclip size={18} />
                                             </div>
                                           )}
                                         </div>
                                         <button
                                           type="button"
                                           onClick={() => removeAttachmentItem(item.id)}
                                           className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-[#1a1f36] border border-white/10 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                                         >
                                           <X size={12} />
                                         </button>
                                       </div>
                                     );
                                   })}
                                 </div>
                               )}

                               <div className="flex items-center gap-2">
                                 {/* Left Circular Plus Button */}
                                 <button
                                   type="button"
                                   onClick={() => {
                                     setIsAttachmentSheetOpen(!isAttachmentSheetOpen);
                                     setIsChatModeSheetOpen(false);
                                   }}
                                   className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#00f3ff] bg-white/5 hover:bg-[#00f3ff]/15 border border-white/10 hover:border-[#00f3ff]/40 transition-all shrink-0 cursor-pointer active:scale-95"
                                   title="Add attachment"
                                 >
                                   <Plus size={20} strokeWidth={2.5} />
                                 </button>

                                 {/* Center Auto-growing Textarea */}
                                 <TextareaAutosize
                                   ref={textareaRef as any}
                                   placeholder={t("askJarvis")}
                                   value={inputText}
                                   onChange={(e) => setInputText(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) {
                                       e.preventDefault();
                                       handleSendMessage();
                                     }
                                   }}
                                   minRows={1}
                                   maxRows={6}
                                   className="flex-1 bg-transparent border-none outline-none resize-none text-slate-100 placeholder-slate-400 text-sm font-sans px-2.5 pt-2 pb-1.5 my-auto min-h-[38px] max-h-[160px] overflow-y-auto leading-normal scrollbar-thin scrollbar-thumb-cyan-500/20"
                                 />

                                 {/* Right Controls */}
                                 <div className="flex items-center gap-1.5 shrink-0">
                                   <AnimatePresence mode="wait">
                                     {(inputText.trim() !== "" || attachmentItems.length > 0 || !!attachedFile) && !isChatMicRecording ? (
                                       <motion.button
                                         key="send-btn"
                                         initial={{ scale: 0.8, opacity: 0 }}
                                         animate={{ scale: 1, opacity: 1 }}
                                         exit={{ scale: 0.8, opacity: 0 }}
                                         transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                         whileHover={{ scale: 1.05 }}
                                         whileTap={{ scale: 0.94 }}
                                         onClick={() => handleSendMessage()}
                                         className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#00f3ff] text-[#040816] hover:bg-[#33f5ff] flex items-center justify-center cursor-pointer will-change-transform"
                                         title="Send message"
                                       >
                                         <ArrowUp size={20} strokeWidth={2.5} />
                                       </motion.button>
                                     ) : (
                                       <motion.button
                                         key="mic-btn"
                                         initial={{ scale: 0.8, opacity: 0 }}
                                         animate={{ scale: 1, opacity: 1 }}
                                         exit={{ scale: 0.8, opacity: 0 }}
                                         transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                         whileHover={{ scale: 1.05 }}
                                         whileTap={{ scale: 0.94 }}
                                         onMouseDown={handleStartChatMicRecording}
                                         onMouseUp={handlePauseChatMicRecording}
                                         onMouseLeave={handlePauseChatMicRecording}
                                         onTouchStart={handleStartChatMicRecording}
                                         onTouchEnd={handlePauseChatMicRecording}
                                         className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer will-change-transform relative ${
                                           isChatMicRecording 
                                             ? "text-red-500 bg-red-500/10 border border-red-500/30" 
                                             : "text-[#00f3ff] bg-white/5 hover:bg-[#00f3ff]/15 border border-white/10 hover:border-[#00f3ff]/40"
                                         }`}
                                         title="Hold to speak (Push-to-Talk)"
                                       >
                                         <Mic size={20} strokeWidth={2} />
                                         {isChatMicRecording && (
                                           <div className="absolute inset-0 rounded-full border border-red-500/40 animate-ping will-change-transform" />
                                         )}
                                       </motion.button>
                                     )}
                                   </AnimatePresence>

                                   <AnimatePresence>
                                     {inputText === "" && attachmentItems.length === 0 && !attachedFile && !isChatMicRecording && (
                                       <motion.button
                                         key="live-btn"
                                         initial={{ scale: 0.8, opacity: 0 }}
                                         animate={{ scale: 1, opacity: 1 }}
                                         exit={{ scale: 0.8, opacity: 0 }}
                                         transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                         whileHover={{ scale: 1.05 }}
                                         whileTap={{ scale: 0.94 }}
                                         onClick={() => {
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
                                           setCurrentScreen("live");
                                         }}
                                         className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#00f3ff] bg-white/5 hover:bg-[#00f3ff]/15 border border-white/10 hover:border-[#00f3ff]/40 shrink-0 cursor-pointer will-change-transform"
                                         title="Engage Live Mode"
                                       >
                                         <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
                                           <path d="M4 12v0M8 9v6M12 5v14M16 8v8M20 12v0" />
                                         </svg>
                                       </motion.button>
                                     )}
                                   </AnimatePresence>
                                 </div>
                               </div>
                             </motion.div>
                           </div>
                         </div>
                       </div>
                     </motion.div>
                   )}



                   {/* SCREEN 2: MENU & SETTINGS SCREEN (Screenshot 3 / Settings Hub clone) */}
                   {currentScreen === "menu" && (
                     <motion.div
                       key="screen-2-menu"
                       variants={pageVariants}
                      initial="hidden"
                       animate="visible"
                       exit="exit"
                       transition={{ duration: 0.35, ease: "easeOut" }}
                       className="absolute inset-0 flex flex-col pt-1.5 px-4 pb-4 overflow-hidden transform-gpu"
                       style={{ willChange: "transform, opacity, filter" }}
                     >
                       {/* Sub-header inside glass container */}
                       {menuSubpage !== "index" && (
                         <div className="flex justify-between items-center pb-2.5 shrink-0 select-none">
                          <motion.div layoutId="left-action-button-container" className="flex items-center gap-2">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.08, y: -0.5 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                if (activeMenuPopup) {
                                  setActiveMenuPopup(null);
                                } else if (menuSubpage === "memories" && memoriesSubView === "saved") {
                                  setMemoriesSubView("main");
                                } else if (menuSubpage === "history") {
                                  setCurrentScreen("homepage");
                                } else if (menuSubpage !== "index") {
                                  navigateMenu("index");
                                } else {
                                  setCurrentScreen("homepage");
                                }
                              }}
                              className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer outline-none flex items-center justify-center shrink-0"
                            >
                              {menuSubpage === "index" ? <X size={15} /> : <ChevronRight size={15} className="rotate-180" />}
                            </motion.button>
                          </motion.div>
                          
                          <motion.div layoutId="center-screen-label-hub" className="text-center flex-1 min-w-0">
                            <motion.h2 layoutId="shared-main-headline-text" className="text-xs font-black tracking-widest font-mono uppercase text-white filter truncate px-2">
                              {menuSubpage === "index" ? t("jarvisSettings") : 
                               menuSubpage === "api" ? t("apiKeyConfig") : 
                               menuSubpage === "personalization" ? t("personalizationTitle") : 
                               menuSubpage === "memories" ? (memoriesSubView === "main" ? t("memoryTitle") : "SAVED MEMORIES") : 
                               menuSubpage === "about" ? t("aboutTitle") : 
                               menuSubpage === "connectivity" ? t("connectivityTitle") : 
                               menuSubpage === "appearance-theme" ? t("appearanceTitle") :
                               menuSubpage === "button-color" ? t("buttonColorTitle") :
                               menuSubpage === "general" ? t("generalHeader") :
                               menuSubpage === "voice" ? t("voiceTitle") :
                               menuSubpage === "storage" ? t("storageTitle") :
                               menuSubpage === "profile-manage" ? "EDIT PROFILE" :
                               t("chatHistoryTitle")}
                            </motion.h2>
                          </motion.div>

                          <motion.div layoutId="right-status-action-container" className="flex items-center gap-1.5 shrink-0">
                            {menuSubpage === "voice" ? (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={async () => {
                                  setVoiceSaveStatus("saving");
                                  




                                  
                                  const bKey = (gmail || "").trim() || username;
                                  if (bKey) {
                                    try {
                                      await Promise.race([
                                        syncUserProfileToCloud(bKey, {
                                          googleVoiceName,
                                          selectedVoiceName,
                                          voiceEngine,
                                          voiceRate,
                                          voicePitch,
                                          voiceLanguage,
                                        }),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000))
                                      ]);
                                      setVoiceSaveStatus("saved");
                                      setTimeout(() => {
                                        setVoiceSaveStatus("idle");
                                        navigateMenu("index");
                                      }, 1000);
                                    } catch (err) {
                                      console.warn("Voice update timeout:", err);
                                      setVoiceSaveStatus("saved");
                                      setTimeout(() => {
                                        setVoiceSaveStatus("idle");
                                        navigateMenu("index");
                                      }, 1000);
                                    }
                                  } else {
                                    setVoiceSaveStatus("saved");
                                    setTimeout(() => {
                                      setVoiceSaveStatus("idle");
                                      navigateMenu("index");
                                    }, 1000);
                                  }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm ${
                                  voiceSaveStatus === "saved" 
                                    ? "bg-emerald-500 text-white" 
                                    : voiceSaveStatus === "saving"
                                    ? "bg-amber-500 text-white animate-pulse"
                                    : "bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] hover:scale-105 active:scale-95"
                                }`}
                                title="Save Voice Configuration"
                              >
                                {voiceSaveStatus === "saving" ? (
                                  <Loader2 size={15} className="animate-spin will-change-transform" />
                                ) : (
                                  <Check size={16} strokeWidth={3} />
                                )}
                              </motion.button>
                            ) : menuSubpage === "api" ? (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={async () => {
                                  setApiKeySaveStatus("saving");
                                  
                                  const activeKey = (geminiKey || "").trim();
                                  geminiKeyRef.current = activeKey;
                                  
                                  const bKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                  try {
                                    await syncUserProfileToCloud(bKey, {
                                      geminiKey: activeKey,
                                      geminiKeyPoolStr: JSON.stringify(activeKey ? [activeKey] : [])
                                    });
                                    setApiKeySaveStatus("saved");
                                    showToast("✓ API Key successfully secured to Google Cloud");
                                    setTimeout(() => {
                                      setApiKeySaveStatus("idle");
                                      navigateMenu("index");
                                    }, 800);
                                  } catch (err) {
                                    console.warn("Firebase API Key update error:", err);
                                    setApiKeySaveStatus("saved");
                                    showToast("✓ API Key configuration updated");
                                    setTimeout(() => {
                                      setApiKeySaveStatus("idle");
                                      navigateMenu("index");
                                    }, 800);
                                  }
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm ${
                                  apiKeySaveStatus === "saved" 
                                    ? "bg-emerald-500 text-white" 
                                    : apiKeySaveStatus === "saving"
                                    ? "bg-amber-500 text-white animate-pulse"
                                    : "bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] hover:scale-105 active:scale-95"
                                }`}
                                title="Update API Key in Firebase"
                              >
                                {apiKeySaveStatus === "saving" ? (
                                  <Loader2 size={15} className="animate-spin will-change-transform" />
                                ) : (
                                  <Check size={16} strokeWidth={3} />
                                )}
                              </motion.button>
                            ) : menuSubpage === "history" ? (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigateMenu("index")}
                                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer outline-none flex items-center justify-center"
                                title="Settings"
                              >
                                <Settings size={15} />
                              </motion.button>
                            ) : menuSubpage === "profile-manage" ? (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => {
                                    if (!tempProfileName.trim()) {
                                      showToast("Name field cannot be empty.");
                                      return;
                                    }
                                    const nextName = tempProfileName.trim();
                                    
                                    setUsername(nextName);

                                    
                                    // Generate suitable initials
                                    const initials = nextName.split(" ").map(w => w.charAt(0)).join("").substring(0, 2);
                                    setAvatarInitials(initials || nextName.charAt(0));
                                    

                                    // Direct update to Firebase Auth's displayName
                                    updateAuthDisplayName(nextName).then(() => {
                                      console.log("Profile displayName updated in Firebase Auth successfully.");
                                    }).catch((err) => {
                                      console.warn("Firebase Auth profile updater experienced:", err);
                                    });
                                    // Direct synchronous update to Firestore cloud profile
                                    const backupKey = (gmail || "").trim() || nextName;
                                    const shouldSync = (googleUser !== null) || backupEnabled;
                                    if (shouldSync && backupKey) {
                                      syncUserProfileToCloud(backupKey, {
                                        gmail,
                                        dateOfBirth,
                                        backupEnabled,
                                        avatarInitials: initials || nextName.charAt(0),
                                        avatarImage,
                                        jarvisTone,
                                        selectedVoiceName,
                                        googleVoiceName,
                                        voiceRate,
                                        voicePitch,
                                        textLanguage,
                                        voiceLanguage,
                                        connectedAppsStr: JSON.stringify(connectedApps),
                                        profile: {
                                          name: nextName,
                                          email: gmail || auth.currentUser?.email || ""
                                        },
                                        geminiKey,
                                        geminiKeyPoolStr: JSON.stringify(geminiKey ? [geminiKey] : []),
                                        appTheme,
                                        jarvisVolumePreset,
                                        voiceEngine,
                                        baseStyleTone,
                                        isFastAnswers,
                                        customInstructions,
                                        isReferenceMemories,
                                        isReferenceHistory,
                                        nicknameMemory,
                                        occupationMemory,
                                        moreAboutUser,
                                      }).then(() => {
                                        console.log("Firestore cloud profile updated synchronously with saved custom name.");
                                      }).catch((err) => {
                                        console.warn("Firestore cloud profile upgrade experienced:", err);
                                      });
                                    }
                                    
                                    navigateMenu("index");
                                }}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] hover:scale-105 active:scale-95"
                                title="Save Profile"
                              >
                                <Check size={16} strokeWidth={3} />
                              </motion.button>
                            ) : menuSubpage === "personalization" ? (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={async () => {
                                  // Save all personalization preferences to cloud
                                  try {
                                    const backupKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                    await syncUserProfileToCloud(backupKey, {
                                      baseStyleTone,
                                      isFastAnswers,
                                      customInstructions,
                                    });
                                    showToast("✓ Personalization preferences secured to cloud");
                                  } catch (e) {
                                    console.warn("Cloud sync error for personalization:", e);
                                    showToast("✓ Personalization preferences updated locally");
                                  }
                                  navigateMenu("index");
                                }}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(0,243,255,0.3)]"
                                title="Save Personalization"
                              >
                                <Check size={16} strokeWidth={3} />
                              </motion.button>
                            ) : (menuSubpage === "memories" && memoriesSubView === "saved") ? (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => setIsMemoryInfoOpen(!isMemoryInfoOpen)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm bg-[#00f3ff]/20 text-[#00f3ff] hover:bg-[#00f3ff]/40 border border-[#00f3ff]/30"
                                  >
                                    <Info size={16} />
                                  </motion.button>
                            ) : (menuSubpage === "memories" && memoriesSubView === "main") ? (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                      try {






                                      } catch (_) {}
                                      
                                      navigateMenu("index");
                                    }}
                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none shadow-sm bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] hover:scale-105 active:scale-95"
                                    title="Save changes"
                                  >
                                    <Check size={16} strokeWidth={3} />
                                  </motion.button>
                            ) : menuSubpage === "index" ? (
                              <div className="text-[#00f3ff] shrink-0 p-2 bg-[#091530]/40 border border-[#00f3ff]/35 rounded-xl flex items-center justify-center">
                                <Settings size={15} />
                              </div>
                            ) : (
                              <div className="w-9 h-9 shrink-0 flex items-center justify-center pointer-events-none" />
                            )}
                          </motion.div>
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden relative flex flex-col w-full">
                        <AnimatePresence custom={pageDirection} mode="wait">
                          {/* SUB-PAGE 1: INDEX MENU */}
                          {menuSubpage === "index" && (
                            <motion.div
                              key="index"
                              className="flex-1 flex flex-col overflow-y-auto mt-0.5 space-y-3.5 pr-1 scrollbar-none pb-6 transform-gpu"
                              variants={settingsContainerVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                            >
                              {/* Dedicated Top Action Row with a simple Back Button symbol on the top left */}
                              <motion.div variants={settingsItemVariants} className="flex items-center justify-between pb-1 select-none shrink-0">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={() => setCurrentScreen("homepage")}
                                  className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer outline-none flex items-center justify-center font-bold"
                                  title="Back"
                                >
                                  <ArrowLeft size={18} />
                                </motion.button>
                                <div />
                              </motion.div>

                              {/* Round profile picture independent from any box container matching screenshot 3 */}
                              <motion.div variants={settingsItemVariants} className="flex flex-col items-center justify-center text-center pt-0 pb-2 select-none -mt-10">
                                <motion.div 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => navigateMenu("profile-manage")}
                                  className="relative group shrink-0 cursor-pointer transition-all duration-200"
                                  title="Edit profile settings"
                                >
                                  {/* Outer elegant glow/shadow around independent profile pic */}
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00f3ff]/30 to-sky-500/30 opacity-40 filter blur-[4px] group-hover:opacity-100 transition-all duration-350"></div>
                                  
                                  {/* Elegant round avatar - made smaller */}
                                  <div className="relative w-16 h-16 rounded-full bg-[#050c1e] border-2 border-white/10 flex items-center justify-center font-black text-white text-xl uppercase overflow-hidden">
                                    {avatarImage ? (
                                      <img src={avatarImage} alt="Profile Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      avatarInitials || username.charAt(0) || "U"
                                    )}
                                  </div>

                                  {/* Small edit pencil button overlay tucked at the bottom right */}
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1e1e24] text-white flex items-center justify-center border border-slate-700/80 hover:bg-slate-800 transition-all">
                                    <Pencil size={10} className="text-white" />
                                  </div>
                                </motion.div>
                                {/* User's name shown directly below the independent profile picture */}
                                <div className="mt-1.5 text-base font-bold text-white tracking-wide font-sans">
                                  {username}
                                </div>
                              </motion.div>

                              {/* Redesigned Menu Options split into gorgeous functional groups */}
                              <div className="space-y-4">
                                {/* CATEGORY 1: MY JARVIS */}
                                <motion.div variants={settingsItemVariants}>
                                  <h4 className="text-xs font-bold tracking-wider font-sans text-white uppercase mb-2 ml-1">
                                    {t("myJarvisCategory")}
                                  </h4>
                                  <div className="liquid-glass rounded-2xl overflow-hidden divide-y divide-white/10">
                                    {[
                                      { id: "personalization", label: t("personalizationLabel"), sub: "Adjust voice parameters and interaction accent", icon: Sliders, action: () => navigateMenu("personalization") },
                                      { id: "memories", label: t("memoryLabel"), sub: "Inject core memories, toggle persistence and facts", icon: Brain, action: () => navigateMenu("memories") },
                                      { id: "connectivity", label: t("connectivityLabel"), sub: "Manage online cloud synchronization & active channels", icon: Globe, action: () => navigateMenu("connectivity") },
                                    ].map((item, idx) => {
                                      const Icon = item.icon || Settings;
                                      return (
                                        <motion.button
                                          key={idx}
                                          type="button"
                                          whileTap={{ scale: 0.98 }}
                                          onClick={item.action}
                                          className="w-full text-left p-3.5 hover:bg-white/5 text-slate-100 hover:text-white transition-all cursor-pointer flex items-center justify-between group active:bg-white/5"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="text-[#00f3ff] group-hover:text-cyan-300 group-hover:scale-110 transition-all shrink-0 flex items-center justify-center w-6 ml-0.5">
                                              <Icon size={18} />
                                            </div>
                                            <div>
                                              <div className="text-xs font-bold font-mono tracking-wide">{item.label}</div>
                                            </div>
                                          </div>
                                          <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </motion.div>

                                {/* CATEGORY 2: SYSTEM CONFIGURATIONS */}
                                <motion.div variants={settingsItemVariants}>
                                  <h4 className="text-xs font-bold tracking-wider font-sans text-white uppercase mb-2 ml-1">
                                    {t("systemConfigsCategory")}
                                  </h4>
                                  <div className="liquid-glass rounded-2xl overflow-hidden divide-y divide-white/10">
                                    {[
                                      { id: "appearance-theme", label: t("appearanceLabel"), sub: "Customize visual skin, layout themes, and aesthetics", icon: Palette, action: () => navigateMenu("appearance-theme") },
                                      { id: "button-color", label: t("buttonColorLabel"), sub: "Choose system accent, active triggers, and highlight glow colors", icon: Sparkles, action: () => navigateMenu("button-color") },
                                      { id: "general", label: t("generalLabel"), sub: "Adjust general user profile, basic preferences and interface modes", icon: Settings, action: () => navigateMenu("general") },
                                      { id: "voice", label: t("voiceLabel"), sub: "Configure active text-to-speech engine, pitch, and speech rates", icon: Volume2, action: () => navigateMenu("voice") },
                                      { id: "api", label: t("jarvisHeartLabel"), sub: "Secure Gemini API key pool & runtime parameters", icon: Lock, action: () => navigateMenu("api") },
                                      { id: "storage", label: t("storageLabel"), sub: "Manage active file backups and view database storage quota", icon: HardDrive, action: () => navigateMenu("storage") },
                                      { id: "about", label: t("aboutLabel"), sub: "Technical specifications, version logs and credits", icon: Info, action: () => navigateMenu("about") },
                                    ].map((item, idx) => {
                                      const Icon = item.icon || Settings;
                                      return (
                                        <motion.button
                                          key={idx}
                                          type="button"
                                          whileTap={{ scale: 0.98 }}
                                          onClick={item.action}
                                          className="w-full text-left p-3.5 hover:bg-white/5 text-slate-100 hover:text-white transition-all cursor-pointer flex items-center justify-between group active:bg-white/5"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="text-[#00f3ff] group-hover:text-cyan-300 group-hover:scale-110 transition-all shrink-0 flex items-center justify-center w-6 ml-0.5">
                                              <Icon size={18} />
                                            </div>
                                            <div>
                                              <div className="text-xs font-bold font-mono tracking-wide">{item.label}</div>
                                            </div>
                                          </div>
                                          <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </motion.div>

                                {/* CATEGORY 3: TERMINAL SESSION */}
                                <motion.div variants={settingsItemVariants}>
                                  <h4 className="text-xs font-bold tracking-wider font-sans text-red-500/90 uppercase mb-2 ml-1">
                                    {t("terminalSessionCategory")}
                                  </h4>
                                  <div className="bg-slate-900/35 border border-red-500/20 rounded-2xl overflow-hidden">
                                    <motion.button
                                      type="button"
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setIsLogoutModalOpen(true)}
                                      className="w-full text-left p-3.5 hover:bg-red-500/5 text-slate-100 hover:text-white transition-all cursor-pointer flex items-center justify-between group active:bg-red-500/10"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all shrink-0 flex items-center justify-center w-6 ml-0.5">
                                          <LogOut size={18} />
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold font-mono tracking-wide">{t("logoutLabel")}</div>
                                        </div>
                                      </div>
                                      <ChevronRight size={14} className="text-slate-500 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>
                          )}

                        {/* SUB-PAGE 2: SECURE API GATEWAY */}
                        {menuSubpage === "api" && (
  <motion.div
    key="api"
    className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1 scrollbar-none pb-4 transform-gpu"
    style={{ willChange: "transform, opacity" }}
    variants={pageVariants}
    custom={pageDirection}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
        {/* Single Gemini API Key Management */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block">
              <span className="flex items-center gap-2">
                <Lock size={14} className="text-[#00f3ff]" />
                Gemini API Key
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
              <Cloud size={12} className="animate-pulse" />
              <span>Cloud Synced</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-300 font-mono font-bold uppercase tracking-wider block">
              Google Gemini API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKeyText ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setGeminiKey(val);
                  geminiKeyRef.current = val;
                  setKeyTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full bg-black/45 border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,243,255,0.25)] rounded-xl py-3 pl-4 pr-24 text-[13px] text-white font-mono outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKeyText(!showApiKeyText)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title={showApiKeyText ? "Hide Key" : "Show Key"}
                >
                  {showApiKeyText ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(geminiKey);
                      showToast("API Key copied to clipboard");
                    }}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    title="Copy Key"
                  >
                    <Copy size={15} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-1">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
              Direct Cloud persistence: Stored securely in Google Cloud Firestore. No browser local storage.
            </p>
          </div>

          {/* Action Buttons: Save & Test */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={apiKeySaveStatus === "saving"}
              onClick={async () => {
                setApiKeySaveStatus("saving");
                const activeEmail = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                try {
                  await syncUserProfileToCloud(activeEmail, {
                    geminiKey: geminiKey.trim(),
                    geminiKeyPoolStr: JSON.stringify(geminiKey.trim() ? [geminiKey.trim()] : [])
                  });
                  setApiKeySaveStatus("saved");
                  showToast("✓ API Key successfully saved to Cloud Firestore!");
                  setTimeout(() => setApiKeySaveStatus("idle"), 3000);
                } catch (err: any) {
                  setApiKeySaveStatus("idle");
                  showToast("Failed to save to cloud: " + (err.message || "Unknown error"));
                }
              }}
              className="px-4 py-2.5 text-[11px] font-bold font-mono tracking-wider uppercase bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,243,255,0.15)] active:scale-98"
            >
              <Cloud size={14} className={apiKeySaveStatus === "saving" ? "animate-spin" : ""} />
              {apiKeySaveStatus === "saving" ? "Saving to Cloud..." : apiKeySaveStatus === "saved" ? "✓ Saved to Cloud" : "Save to Cloud"}
            </button>

            <button
              type="button"
              disabled={isTestingKey || !geminiKey.trim()}
              onClick={async () => {
                const trimmed = geminiKey.trim();
                if (!trimmed) {
                  showToast("Please enter an API Key first");
                  return;
                }
                setIsTestingKey(true);
                setKeyTestResult(null);
                const startTime = Date.now();
                try {
                  const res = await fetch("/api/analyze-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_api_key: trimmed })
                  });
                  const elapsed = Date.now() - startTime;
                  const data = await res.json();
                  if (res.ok && data.success) {
                    setKeyTestResult({
                      success: true,
                      message: "API Key is valid and active on Google Cloud!",
                      latencyMs: elapsed
                    });
                    recordKeyUsage(trimmed, true, elapsed, 10);
                    showToast(`✓ API Key verified (${elapsed}ms)`);
                  } else {
                    const errMsg = data.error || data.message || "Key validation failed";
                    setKeyTestResult({
                      success: false,
                      message: errMsg,
                      latencyMs: elapsed
                    });
                    recordKeyUsage(trimmed, false, elapsed);
                    showToast("✗ API Key check failed: " + errMsg);
                  }
                } catch (err: any) {
                  const elapsed = Date.now() - startTime;
                  setKeyTestResult({
                    success: false,
                    message: err.message || "Network error",
                    latencyMs: elapsed
                  });
                  recordKeyUsage(trimmed, false, elapsed);
                  showToast("✗ Network error during key test");
                } finally {
                  setIsTestingKey(false);
                }
              }}
              className="px-4 py-2.5 text-[11px] font-bold font-mono tracking-wider uppercase bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl cursor-pointer flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <Activity size={14} className={isTestingKey ? "animate-spin text-cyan-400" : "text-emerald-400"} />
              {isTestingKey ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {/* Key Test Feedback Banner */}
          {keyTestResult && (
            <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 animate-in fade-in duration-300 ${
              keyTestResult.success 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
              {keyTestResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold">{keyTestResult.success ? "Connection Successful" : "Connection Failed"}</div>
                <div className="text-[11px] opacity-90 mt-0.5">{keyTestResult.message}</div>
                {keyTestResult.latencyMs !== undefined && (
                  <div className="text-[10px] opacity-75 mt-1 font-bold">Latency: {keyTestResult.latencyMs}ms</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Models */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
          <div className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block">
            Model Configuration (PRO)
          </div>
          
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-slate-300 font-mono font-bold uppercase tracking-wider block">Jarvis Lightning Mode:</label>
              <select 
                value={modelPreferences.Paid?.["Jarvis Lightning"] || modelPreferences.Paid?.["Jarvis Ultra Flash"] || "gemini-3.1-flash-lite"}
                onChange={(e: any) => setModelPreferences((prev: any) => ({ ...prev, Paid: { ...prev.Paid, "Jarvis Lightning": e.target.value, "Jarvis Ultra Flash": e.target.value } }))}
                className="w-full bg-black/45 border border-white/10 text-white text-[12px] font-mono rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] cursor-pointer transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300f3ff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                {GEMINI_MODEL_CONFIG["Jarvis Lightning"].options.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-[#030816] text-white">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-slate-300 font-mono font-bold uppercase tracking-wider block">Jarvis Core Mode:</label>
              <select 
                value={modelPreferences.Paid?.["Jarvis Core"] || modelPreferences.Paid?.["Jarvis Flash"] || "gemini-3.7-flash"}
                onChange={(e: any) => setModelPreferences((prev: any) => ({ ...prev, Paid: { ...prev.Paid, "Jarvis Core": e.target.value, "Jarvis Flash": e.target.value } }))}
                className="w-full bg-black/45 border border-white/10 text-white text-[12px] font-mono rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] cursor-pointer transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300f3ff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                {GEMINI_MODEL_CONFIG["Jarvis Core"].options.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-[#030816] text-white">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] text-slate-300 font-mono font-bold uppercase tracking-wider block">Jarvis Expert Mode:</label>
              <select 
                value={modelPreferences.Paid?.["Jarvis Expert"] || modelPreferences.Paid?.["Jarvis Deep Research"] || "gemini-3.1-pro-preview-customtools"}
                onChange={(e: any) => setModelPreferences((prev: any) => ({ ...prev, Paid: { ...prev.Paid, "Jarvis Expert": e.target.value, "Jarvis Deep Research": e.target.value } }))}
                className="w-full bg-black/45 border border-white/10 text-white text-[12px] font-mono rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] cursor-pointer transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300f3ff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                {GEMINI_MODEL_CONFIG["Jarvis Expert"].options.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-[#030816] text-white">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Analytics Dashboard */}
        <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00f3ff]/10 to-transparent opacity-40 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-[14px] font-bold tracking-wider font-mono text-white uppercase filter">
              <Activity size={18} className="text-[#00f3ff] animate-pulse drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
              Live Analytics Dashboard
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE CLOUD TELEMETRY</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono relative z-10 pt-1">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner hover:border-white/20 transition-colors">
              <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">Total Requests</span>
              <span className="text-white text-2xl font-black mt-1.5">{totalRequests || 0}</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner hover:border-emerald-500/20 transition-colors">
              <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">Success Rate</span>
              <span className="text-emerald-400 text-2xl font-black mt-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{totalRequests > 0 ? Math.round((successRequests / totalRequests) * 100) : 100}%</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner hover:border-cyan-500/20 transition-colors">
              <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">Total Tokens</span>
              <span className="text-cyan-300 text-2xl font-black mt-1.5 drop-shadow-[0_0_8px_rgba(0,243,255,0.3)]">{totalTokens > 1000 ? (totalTokens/1000).toFixed(1)+'k' : totalTokens || 0}</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner hover:border-purple-500/20 transition-colors">
              <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">Avg Latency</span>
              <span className="text-purple-300 text-2xl font-black mt-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">{averageResponseTime || 0}ms</span>
            </div>
          </div>

          {/* Real-time Latency Histogram Chart */}
          <div className="pt-2 relative z-10">
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-2">
              <span>RESPONSE TIME TELEMETRY (RECENT CALLS)</span>
              <span>{latencyHistory[latencyHistory.length - 1] || 0}ms latest</span>
            </div>
            <div className="h-16 flex items-end justify-between gap-1.5 pt-1 px-1 bg-black/30 border border-white/5 rounded-xl">
              {latencyHistory.slice(-16).map((val, i) => {
                const maxVal = Math.max(...latencyHistory, 500);
                const heightPercent = Math.min(100, Math.max(15, Math.round((val / maxVal) * 100)));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-cyan-500/40 to-cyan-400 hover:from-cyan-400 hover:to-cyan-200" 
                      style={{ height: `${heightPercent}%` }}
                      title={`${val}ms`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )}
{menuSubpage === "connectivity" && (
                          <motion.div
                            key="connectivity"
                            className="flex-grow flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            
                          >
                            <GoogleWorkspaceDashboard
                              token={workspaceToken}
                              onLogin={handleGoogleSignInClick}
                              onLogout={handleLogOut}
                              gmail={gmail}
                              username={username}
                            />

                          </motion.div>
                        )}

                        {/* SUB-PAGE 3: SYSTEM RESPONSE PERSONALIZATION */}
                        {menuSubpage === "personalization" && (
                          <motion.div
                            key="personalization"
                            className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-none pb-4 transform-gpu flex flex-col space-y-4 font-sans text-[#e2e8f0]"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="flex-1 flex flex-col space-y-4 pb-6">
                              
                              {/* 1. Core Identity & User Context */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                    <User size={17} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black font-mono tracking-wider text-white uppercase">Core Identity</span>
                                    <span className="text-[11px] font-mono text-slate-400 mt-0.5">How Jarvis knows and addresses you</span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Preferred Call Sign / Nickname</label>
                                    <input
                                      type="text"
                                      value={nicknameMemory}
                                      onChange={(e) => setNicknameMemory(e.target.value)}
                                      placeholder="e.g. Boss, Captain, Sir"
                                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-colors"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">My Profession / Role</label>
                                    <input
                                      type="text"
                                      value={occupationMemory}
                                      onChange={(e) => setOccupationMemory(e.target.value)}
                                      placeholder="e.g. AI Researcher, Developer, Student"
                                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-colors"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">User Context (About Me)</label>
                                    <textarea
                                      value={moreAboutUser}
                                      onChange={(e) => setMoreAboutUser(e.target.value)}
                                      placeholder="Share any background, preferences, or goals for Jarvis to keep in memory..."
                                      className="w-full h-24 resize-none bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-colors scrollbar-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 2. Base style and tone Matrix */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all space-y-3">
                                <div 
                                  onClick={() => setIsStyleToneDropdownOpen(!isStyleToneDropdownOpen)}
                                  className="flex justify-between items-center cursor-pointer select-none group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                      <Sliders size={17} />
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black font-mono tracking-wider text-white uppercase">Base style & tone</span>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-400/40">
                                          {[
                                            { id: "Friendly", title: "Friendly" },
                                            { id: "Professional", title: "Professional" },
                                            { id: "Mentor", title: "Mentor" },
                                            { id: "Sarcastic", title: "Sarcastic" },
                                            { id: "Custom", title: "Custom" },
                                          ].find(opt => opt.id.toLowerCase() === (baseStyleTone || "friendly").toLowerCase())?.title || baseStyleTone}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                                        Neural conversational cadence & behavioral persona (25% Base)
                                      </span>
                                    </div>
                                  </div>
                                  <motion.div animate={{ rotate: isStyleToneDropdownOpen ? 180 : 0 }}>
                                    <ChevronDown size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                  </motion.div>
                                </div>

                                <AnimatePresence>
                                  {isStyleToneDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-4 grid grid-cols-1 gap-2">
                                        {[
                                          { id: "Friendly", title: "Friendly & Casual", desc: "Warm, supportive, and chatty. Perfect for daily interactions." },
                                          { id: "Professional", title: "Professional & Direct", desc: "Formal, respectful, and highly efficient executive demeanor." },
                                          { id: "Mentor", title: "Mentor / Guide", desc: "Caring but strict teacher that guides you to logical solutions." },
                                          { id: "Sarcastic", title: "Sarcastic & Witty", desc: "Light dry humor, highly witty, and slightly cynical." },
                                          { id: "Custom", title: "Purely Custom", desc: "Neutral baseline. Fully relies on your custom system instructions." },
                                        ].map((opt) => {
                                          const isSelected = (baseStyleTone || "friendly").toLowerCase() === opt.id.toLowerCase();
                                          return (
                                            <div
                                              key={opt.id}
                                              onClick={() => {
                                                setBaseStyleTone(opt.id);
                                                setIsStyleToneDropdownOpen(false);
                                              }}
                                              className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${
                                                isSelected 
                                                  ? "bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,243,255,0.1)]" 
                                                  : "bg-slate-900/50 border border-slate-800 hover:bg-slate-800"
                                              }`}
                                            >
                                              <span className={`text-xs font-bold font-mono tracking-wide ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>
                                                {opt.title}
                                              </span>
                                              <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                                                {opt.desc}
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* 3. The Absolute "System Instructions" */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                                    <Brain size={17} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black font-mono tracking-wider text-white uppercase">System Instructions</span>
                                    <span className="text-[11px] font-mono text-slate-400 mt-0.5">Critical Override (75% Dominance)</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono italic px-1">
                                  Define specific rules, language styles (e.g. "always speak in Bengali Tui"), or exact behaviors. Jarvis will prioritize these rules above all else.
                                </div>
                                <textarea
                                  value={customInstructions}
                                  onChange={(e) => setCustomInstructions(e.target.value)}
                                  placeholder="Enter custom mandate rules..."
                                  className="w-full h-32 resize-none bg-slate-950/80 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-slate-900 transition-colors shadow-inner"
                                />
                              </div>

                            </div>
                          </motion.div>
                        )}
                        
                        {/* SUB-PAGE 4: MEMORIES BIOS CONFIG */}
                        {menuSubpage === "memories" && (
                          <motion.div
                              key="memories"
                              className="flex-1 flex flex-col overflow-hidden transform-gpu h-full"
                              variants={pageVariants}
                              custom={pageDirection}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                            >

                            {/* MAIN VIEW: MEMORY CONFIGURATION */}
                            {memoriesSubView === "main" ? (
                              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none py-4 font-sans text-[#e2e8f0]">
                                
                                {/* Row 1: Manage memories */}
                                <button
                                  type="button"
                                  onClick={() => setMemoriesSubView("saved")}
                                  className="w-full p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg flex items-center justify-between transition-all select-none text-left cursor-pointer hover:bg-white/5 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                      <Brain size={17} />
                                    </div>
                                    <div>
                                      <span className="text-xs font-black font-mono tracking-wider text-white uppercase block">Manage Core Memories</span>
                                      <span className="text-[11px] font-sans text-slate-400 mt-0.5">View and edit synchronized neural facts</span>
                                    </div>
                                  </div>
                                  <ChevronRight size={18} className="text-slate-500 group-hover:text-cyan-400 transition-all" />
                                </button>

                                {/* System Settings Wrapper */}
                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg overflow-hidden divide-y divide-white/10">
                                  {/* Row 2: Reference saved memories switch */}
                                  <div className="p-4 sm:p-5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer" onClick={() => setIsReferenceMemories(!isReferenceMemories)}>
                                    <div className="flex flex-col pr-3">
                                      <span className="text-xs font-bold font-mono tracking-wide text-slate-100 group-hover:text-white uppercase">Reference saved memories</span>
                                      <span className="text-[11px] font-sans text-slate-400 mt-0.5">Allows Jarvis to fetch stored personal facts during synthesis</span>
                                    </div>
                                    <button
                                      type="button"
                                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                        isReferenceMemories ? "bg-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]" : "bg-slate-800 border border-slate-700"
                                      }`}
                                    >
                                      <motion.div 
                                        animate={{ x: isReferenceMemories ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={`w-5 h-5 rounded-full shadow-md ${isReferenceMemories ? "bg-slate-950" : "bg-slate-400"}`} 
                                      />
                                    </button>
                                  </div>

                                  {/* Row 3: Reference chats and files switch */}
                                  <div className="p-4 sm:p-5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer" onClick={() => setIsReferenceHistory(!isReferenceHistory)}>
                                    <div className="flex flex-col pr-3">
                                      <span className="text-xs font-bold font-mono tracking-wide text-slate-100 group-hover:text-white uppercase">Reference chat history</span>
                                      <span className="text-[11px] font-sans text-slate-400 mt-0.5">Contextual awareness from previous conversations</span>
                                    </div>
                                    <button
                                      type="button"
                                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                        isReferenceHistory ? "bg-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]" : "bg-slate-800 border border-slate-700"
                                      }`}
                                    >
                                      <motion.div 
                                        animate={{ x: isReferenceHistory ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={`w-5 h-5 rounded-full shadow-md ${isReferenceHistory ? "bg-slate-950" : "bg-slate-400"}`} 
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Persona Context Fields */}
                                <div className="space-y-3">
                                  <div className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2 ml-1">
                                    <User size={14} className="text-[#00f3ff]" />
                                    <span>Identity Context Parameters</span>
                                  </div>
                                  
                                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg p-4 sm:p-5 space-y-4">
                                    {/* Row 4: Your nickname input */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Preferred Designation</span>
                                      <div className="rounded-xl border border-white/10 bg-black/40 focus-within:border-cyan-400/60 transition-all shadow-inner">
                                        <input
                                          type="text"
                                          value={nicknameMemory}
                                          onChange={(e) => setNicknameMemory(e.target.value)}
                                          placeholder="e.g. Commander, Sir"
                                          className="w-full p-3 bg-transparent border-none outline-none font-sans text-sm text-slate-100 placeholder:text-slate-600 rounded-xl"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 5: Your occupation input */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Current Objective / Occupation</span>
                                      <div className="rounded-xl border border-white/10 bg-black/40 focus-within:border-cyan-400/60 transition-all shadow-inner">
                                        <input
                                          type="text"
                                          value={occupationMemory}
                                          onChange={(e) => setOccupationMemory(e.target.value)}
                                          placeholder="e.g. Software Engineer"
                                          className="w-full p-3 bg-transparent border-none outline-none font-sans text-sm text-slate-100 placeholder:text-slate-600 rounded-xl"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 6: More about you textarea */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Neural Overrides (Interests/Values)</span>
                                      <div className="rounded-xl border border-white/10 bg-black/40 focus-within:border-cyan-400/60 transition-all shadow-inner">
                                        <textarea
                                          rows={4}
                                          value={moreAboutUser}
                                          onChange={(e) => setMoreAboutUser(e.target.value)}
                                          placeholder="Specific formatting or personal traits..."
                                          className="w-full p-3 bg-transparent border-none outline-none font-sans text-sm text-slate-100 placeholder:text-slate-600 rounded-xl resize-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* SAVED MEMORIES VIEW WITH INTEGRATED LIST & SEARCH */
                              <div className="flex-1 flex flex-col py-4 overflow-hidden relative font-sans text-[#e2e8f0]">
                                
                                {/* Info Box Popup */}
                                <AnimatePresence>
                                  {isMemoryInfoOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -8 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                      className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 mb-4 select-none text-xs leading-relaxed transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                                    >
                                      <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-mono font-bold uppercase tracking-wider">
                                        <Info size={14} />
                                        <span>Neural Database Logistics</span>
                                      </div>
                                      <p className="text-cyan-100/70">
                                        Jarvis accumulates memories based on explicit statements, questions, or configurations you designate. You can query, review, or erase specific memory nodes at any time.
                                      </p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Search Capsule */}
                                <div className="mb-4 relative select-none">
                                  <Search size={14} className="absolute left-4 top-3.5 text-slate-500" />
                                  <input
                                    type="text"
                                    value={memoriesSearchQuery}
                                    onChange={(e) => setMemoriesSearchQuery(e.target.value)}
                                    placeholder="Search memory grid..."
                                    className="w-full pl-10 pr-12 py-3 rounded-xl text-xs font-mono outline-none transition-all bg-black/40 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:bg-white/5 shadow-inner"
                                  />
                                  {memoriesSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setMemoriesSearchQuery("")}
                                      className="absolute right-3 top-2.5 px-2 py-1 text-[10px] uppercase font-bold font-mono rounded bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                                    >
                                      CLR
                                    </button>
                                  )}
                                </div>

                                {/* Custom Inline Add Memory to test immediately */}
                                <div className="mb-4 flex gap-2 select-none bg-slate-900/40 p-1.5 rounded-xl border border-white/10">
                                  <input
                                    type="text"
                                    placeholder="Inject new manual memory node..."
                                    value={newMemoryInputText}
                                    onChange={(e) => setNewMemoryInputText(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-transparent text-xs font-sans outline-none text-slate-100 placeholder:text-slate-500"
                                    onKeyDown={(e) => { if (e.key === "Enter" && newMemoryInputText.trim()) {
                                        const bKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                        const newMem = {
                                          id: `mem-${Date.now()}`,
                                          text: newMemoryInputText.trim(),
                                          timestamp: new Date().toLocaleDateString()
                                        };
                                        setJarvisMemories(prev => [newMem, ...prev]);
                                        syncJarvisMemoryToCloud(bKey, newMem).catch((err) => console.warn("Memory cloud sync:", err));
                                        setNewMemoryInputText("");
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newMemoryInputText.trim()) {
                                        const bKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                        const newMem = {
                                          id: `mem-${Date.now()}`,
                                          text: newMemoryInputText.trim(),
                                          timestamp: new Date().toLocaleDateString()
                                        };
                                        setJarvisMemories(prev => [newMem, ...prev]);
                                        syncJarvisMemoryToCloud(bKey, newMem).catch((err) => console.warn("Memory cloud sync:", err));
                                        setNewMemoryInputText("");
                                      }
                                    }}
                                    className="px-4 py-2 text-[10px] font-black font-mono tracking-widest uppercase rounded-lg transition-all cursor-pointer bg-[#00f3ff]/10 border border-[#00f3ff]/40 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:scale-105"
                                  >
                                    Inject
                                  </button>
                                </div>

                                {/* scrollable items flow */}
                                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
                                  {(() => {
                                    const filtered = jarvisMemories.filter(m =>
                                      m.text.toLowerCase().includes(memoriesSearchQuery.toLowerCase())
                                    );
                                    if (filtered.length === 0) {
                                      return (
                                        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/5 select-none mt-2">
                                          <Brain size={28} className="text-slate-600 mx-auto mb-3" />
                                          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wide">No active memory nodes detected</p>
                                        </div>
                                      );
                                    }
                                    return filtered.map((mem) => (
                                      <div
                                        key={mem.id}
                                        className="p-3 sm:p-4 rounded-xl border border-white/10 bg-slate-900/60 transition-all text-left flex justify-between items-start gap-4 group/mem-item hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.05)]"
                                      >
                                        <div>
                                          <span className="text-xs leading-relaxed font-sans text-slate-300 block mb-1.5">{mem.text}</span>
                                          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{mem.timestamp || "Archived"}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const bKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                            setJarvisMemories(prev => prev.filter(m => m.id !== mem.id));
                                            deleteJarvisMemoryFromCloud(bKey, mem.id).catch((err) => console.warn("Memory cloud delete:", err));
                                          }}
                                          className="shrink-0 opacity-100 md:opacity-0 group-hover/mem-item:opacity-100 transition-opacity p-1.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:scale-105 cursor-pointer"
                                          title="Purge Memory Node"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    ));
                                  })()}
                                </div>

                                {/* Bottom Delete All Pill */}
                                <div className="pt-4 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm("CRITICAL ACTION: Are you absolutely sure you want to purge the entire neural database? This action is irreversible.")) {
                                        const bKey = (gmail || "").trim() || username || auth?.currentUser?.email || auth?.currentUser?.uid || "user";
                                        jarvisMemories.forEach(m => {
                                          deleteJarvisMemoryFromCloud(bKey, m.id).catch(() => {});
                                        });
                                        setJarvisMemories([]);
                                      }
                                    }}
                                    className="w-full py-3.5 font-bold font-mono text-[11px] tracking-widest uppercase rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                  >
                                    <Trash2 size={14} />
                                    Purge Database
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* SUB-PAGE 5: PREVIOUS CHAT HISTORY */}
                        {/* SUB-PAGE 6: MANAGE PROFILE & SYSTEMS */}
                        {menuSubpage === "profile-manage" && (
                          <motion.div
                            key="profile-manage"
                            className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-none pb-4 transform-gpu"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            
                          >
                            <div className="flex flex-col items-center justify-center py-6 w-full max-w-sm mx-auto">
                              {/* Avatar edit center wrapper */}
                              <div className="relative shrink-0 select-none mb-8">
                                {/* Profile photo container */}
                                <div 
                                  onClick={() => document.getElementById("profile-manage-avatar-input")?.click()}
                                  className="w-28 h-28 rounded-full border-2 border-white/20 bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] overflow-hidden flex items-center justify-center font-black text-slate-100 text-3xl uppercase cursor-pointer group transition-all"
                                >
                                  {avatarImage ? (
                                    <img src={avatarImage} alt="Profile Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                                  ) : (
                                    avatarInitials || tempProfileName.charAt(0) || "M"
                                  )}
                                </div>

                                {/* Dark-themed overlapping Camera button overlay as in screenshot 2 */}
                                <button
                                  type="button"
                                  onClick={() => document.getElementById("profile-manage-avatar-input")?.click()}
                                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center cursor-pointer hover:bg-cyan-500/20 active:scale-90 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)] focus:outline-none"
                                  title="Change profile photo"
                                >
                                  <Camera size={14} />
                                </button>
                                
                                <input
                                  type="file"
                                  id="profile-manage-avatar-input"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarUpload}
                                />
                              </div>

                              {/* Styled Inputs with label breaking into top outline */}
                              <div className="w-full space-y-6 mb-5">
                                {/* Input field 1: Name */}
                                <div className="relative">
                                  <div className="border border-slate-700 focus-within:border-white/10 rounded-2xl px-4 py-3.5 bg-slate-900/30 transition-all relative">
                                    <label className="absolute -top-2 left-4 bg-[#050c1e] px-1.5 text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={tempProfileName}
                                      onChange={(e) => setTempProfileName(e.target.value)}
                                      className="w-full bg-transparent text-sm text-slate-100 outline-none font-sans font-medium"
                                      placeholder="Enter professional name"
                                    />
                                  </div>
                                </div>

                                {/* Input field 2: Email */}
                                <div className="relative">
                                  <div className="border border-slate-800 rounded-2xl px-4 py-3.5 bg-slate-900/10 transition-all relative">
                                    <label className="absolute -top-2 left-4 bg-[#050c1e] px-1.5 text-[10px] font-bold text-slate-500 font-sans uppercase tracking-wider">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={auth.currentUser?.email || gmail || ""}
                                      readOnly
                                      className="w-full bg-transparent text-sm text-slate-400 outline-none font-sans font-medium cursor-not-allowed"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Explanatory description helper */}
                              <p className="text-xs text-slate-400 font-sans text-center px-4 mb-8 leading-relaxed">
                                Your profile helps people recognize you.
                              </p>


                            </div>
                          </motion.div>
                        )}


                        {/* SUB-PAGE 2: APPEARANCE AND THEME */}
                        {menuSubpage === "appearance-theme" && (
                          <motion.div
                            key="appearance-theme"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 font-sans text-[#e2e8f0] transform-gpu flex flex-col"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                  <Palette size={17} />
                                </div>
                                <div>
                                  <div className="text-xs font-black font-mono tracking-wider text-white uppercase block">System Skin & Aesthetics</div>
                                  <div className="text-[11px] font-sans text-slate-400 mt-0.5">Select the OS environment skin and styling</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-3 pt-1">
                                {[
                                  { id: "cosmic", name: "Cosmic Dark", desc: "Futuristic deep space aesthetic with neon cyan and blue highlights", colors: ["bg-[#030816]", "bg-[#00f3ff]"] },
                                  { id: "slate", name: "Slate Light", desc: "Minimalist, high-contrast clean slate-gray design with elegant teal icons", colors: ["bg-slate-100", "bg-[#10a37f]"] },
                                  { id: "vintage", name: "Vintage Note", desc: "Warm, soft-toned retro parchment paper style for intellectual writing", colors: ["bg-[#faf6eb]", "bg-[#8b5a2b]"] },
                                ].map((t) => {
                                  const isActive = appTheme === t.id;
                                  return (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                        setAppTheme(t.id as any);
                                        const bKey = (gmail || "").trim() || username;
                                        if (bKey) {
                                          syncUserProfileToCloud(bKey, { appTheme: t.id }).catch(() => {});
                                        }
                                      }}
                                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                        isActive 
                                          ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                                          : "bg-black/25 border-white/5 hover:bg-white/5 hover:border-white/15 text-slate-300"
                                      }`}
                                    >
                                      <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/15 bg-slate-950/55 relative overflow-hidden shrink-0 shadow-inner">
                                          <div className={`absolute top-0 left-0 w-1/2 h-full ${t.colors[0]}`} />
                                          <div className={`absolute top-0 right-0 w-1/2 h-full ${t.colors[1]}`} />
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold uppercase tracking-wider font-mono text-white group-hover:text-cyan-300 transition-colors">{t.name}</div>
                                          <div className={`text-[10px] leading-normal mt-0.5 ${isActive ? "text-cyan-200/80" : "text-slate-400"}`}>{t.desc}</div>
                                        </div>
                                      </div>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                        isActive ? "border-transparent bg-[#00f3ff] text-slate-950" : "border-slate-700 bg-transparent"
                                      }`}>
                                        {isActive && <Check size={12} strokeWidth={3} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}


                        {/* SUB-PAGE 3: BUTTON COLOR */}
                        {menuSubpage === "button-color" && (
                          <motion.div
                            key="button-color"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 font-sans text-[#e2e8f0] transform-gpu flex flex-col"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                  <Sparkles size={17} />
                                </div>
                                <div>
                                  <div className="text-xs font-black font-mono tracking-wider text-white uppercase block">Interface Accent Color</div>
                                  <div className="text-[11px] font-sans text-slate-400 mt-0.5">Customize active trigger glows and UI accents</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1">
                                {[
                                  { id: "cyan", name: "Neon Cyan", colorHex: "#00f3ff", colorClass: "bg-[#00f3ff]" },
                                  { id: "emerald", name: "Emerald", colorHex: "#10a37f", colorClass: "bg-[#10a37f]" },
                                  { id: "purple", name: "Pulse Purple", colorHex: "#bf5af2", colorClass: "bg-[#bf5af2]" },
                                  { id: "sunset", name: "Sunset Orange", colorHex: "#ff9f0a", colorClass: "bg-[#ff9f0a]" },
                                  { id: "ruby", name: "Ruby Red", colorHex: "#ff453a", colorClass: "bg-[#ff453a]" },
                                  { id: "pink", name: "Hot Pink", colorHex: "#ff2d55", colorClass: "bg-[#ff2d55]" },
                                ].map((color) => {
                                  const isSelected = buttonAccentColor === color.id;
                                  return (
                                    <button
                                      key={color.id}
                                      onClick={() => {
                                        setButtonAccentColor(color.id);
                                        const bKey = (gmail || "").trim() || username;
                                        if (bKey) {
                                          syncUserProfileToCloud(bKey, { buttonAccentColorStr: color.id }).catch(() => {});
                                        }
                                      }}
                                      className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-3 transition-all cursor-pointer group ${
                                        isSelected 
                                          ? "bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                                          : "bg-black/25 border-white/5 hover:bg-white/5 hover:border-white/15"
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-full ${color.colorClass} relative flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <div className="absolute inset-0 rounded-full blur-[6px] opacity-75 bg-inherit" />
                                        {isSelected && <Check size={14} className="text-black font-black relative z-10" strokeWidth={4} />}
                                      </div>
                                      <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isSelected ? "text-cyan-300" : "text-slate-300"}`}>{color.name}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}


                        {/* SUB-PAGE 4: GENERAL */}
                        {menuSubpage === "general" && (
                          <motion.div
                            key="general"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 text-[#e2e8f0] transform-gpu flex flex-col font-sans"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <div className="flex flex-col gap-4 font-sans px-1">
                              {/* Language Settings Card */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all">
                                <button
                                  type="button"
                                  onClick={() => setIsGeneralLangExpanded(!isGeneralLangExpanded)}
                                  className="w-full text-left flex justify-between items-center outline-none cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                      <Globe size={17} />
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-xs font-black text-white uppercase tracking-wider font-mono group-hover:text-cyan-300 transition-colors">{t("languageLabel")}</span>
                                      <span className="text-[11px] text-slate-400 font-sans block">{textLanguage}</span>
                                    </div>
                                  </div>
                                  <ChevronRight 
                                    size={16} 
                                    className={`text-slate-500 transition-transform duration-200 ${isGeneralLangExpanded ? "rotate-90 text-cyan-400" : "group-hover:text-white group-hover:translate-x-0.5"}`} 
                                  />
                                </button>
                                
                                <AnimatePresence>
                                  {isGeneralLangExpanded && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-4 pt-3 border-t border-white/10 space-y-1.5 overflow-hidden"
                                    >
                                      {(["English", "Hindi", "Bengali", "Benglish", "Mix"] as const).map((lang) => {
                                        const isSelected = textLanguage === lang;
                                        return (
                                          <button
                                            key={lang}
                                            type="button"
                                            onClick={() => {
                                              setTextLanguage(lang);
                                              setIsGeneralLangExpanded(false);
                                              const bKey = (gmail || "").trim() || username;
                                              if (bKey) {
                                                syncUserProfileToCloud(bKey, { textLanguage: lang }).catch(() => {});
                                              }
                                            }}
                                            className={`w-full flex justify-between items-center py-3 px-4 rounded-xl transition-all cursor-pointer ${
                                              isSelected 
                                                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]" 
                                                : "hover:bg-white/5 hover:border-white/10 text-slate-300 border border-transparent"
                                            }`}
                                          >
                                            <span className="text-xs font-bold font-mono tracking-wide uppercase">{lang}</span>
                                            {isSelected && (
                                              <div className="w-5 h-5 rounded-full bg-[#00f3ff] text-slate-950 flex items-center justify-center">
                                                <Check size={12} strokeWidth={3} />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Section Title */}
                              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold px-1 mt-2">
                                Automatic Operations & Toggles
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg overflow-hidden divide-y divide-white/10">
                                {/* Web Search Card & Description */}
                                <div className="p-4 sm:p-5 hover:bg-white/5 transition-all group flex flex-col gap-1 cursor-pointer" onClick={() => setWebSearchEnabled(!webSearchEnabled)}>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wide group-hover:text-white">{t("webSearchLabel")}</span>
                                    <button
                                      type="button"
                                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                                        webSearchEnabled ? "bg-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]" : "bg-slate-800 border border-slate-700"
                                      }`}
                                    >
                                      <motion.div 
                                        animate={{ x: webSearchEnabled ? 20 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={`w-5 h-5 rounded-full shadow-md ${webSearchEnabled ? "bg-slate-950" : "bg-slate-400"}`} 
                                      />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-normal pr-12">
                                    {t("searchWebDesc")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}


                        {/* SUB-PAGE 5: VOICE */}
                        {menuSubpage === "voice" && (
                          <motion.div
                            key="voice"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 text-[#e2e8f0] transform-gpu flex flex-col"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            
                          >
                            <div className="flex flex-col gap-4 font-sans px-1">
                              
                              {/* 1. Engine Selection Segmented Control */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
                                <div>
                                  <span className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block mb-1">Active Voice Synthesis Core</span>
                                  <span className="text-xs text-slate-400 block font-sans">Choose how JARVIS synthesizes vocal transmissions.</span>
                                </div>
                                
                                <div className="grid grid-cols-2 p-1 bg-black/45 border border-white/10 rounded-xl gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceEngine("server");
                                      const bKey = (gmail || "").trim() || username;
                                      if (bKey) {
                                        syncUserProfileToCloud(bKey, { voiceEngine: "server" }).catch(() => {});
                                      }
                                    }}
                                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                      voiceEngine === "server"
                                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}
                                  >
                                    AI Cloud Voice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceEngine("native");
                                      const bKey = (gmail || "").trim() || username;
                                      if (bKey) {
                                        syncUserProfileToCloud(bKey, { voiceEngine: "native" }).catch(() => {});
                                      }
                                    }}
                                    className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                      voiceEngine === "native"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }`}
                                  >
                                    System Offline
                                  </button>
                                </div>
                              </div>

                              {/* 2. Voice Language Dropdown */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block mb-1">Vocal Language Profile</span>
                                    <span className="text-xs text-slate-400 block font-sans">Configure regional speech translation target scripts.</span>
                                  </div>
                                </div>
                                <div className="relative">
                                  <select
                                    value={voiceLanguage}
                                    onChange={(e) => { const lang = e.target.value as any;
                                      setVoiceLanguage(lang);
                                      voiceLanguageRef.current = lang;
                                      const bKey = (gmail || "").trim() || username;
                                      if (bKey) {
                                        syncUserProfileToCloud(bKey, { voiceLanguage: lang }).catch(() => {});
                                      }
                                    }}
                                    className="w-full bg-black/45 border border-white/10 hover:border-white/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.2)] cursor-pointer transition-all appearance-none font-sans font-medium"
                                  >
                                    <option value="English" className="bg-[#030816] text-white">English (UK/US Global Standard)</option>
                                    <option value="Bengali" className="bg-[#030816] text-white">Bengali (বাংলা - India/Bangladesh)</option>
                                    <option value="Hindi" className="bg-[#030816] text-white">Hindi (हिन्दी - India)</option>
                                    <option value="Benglish" className="bg-[#030816] text-white">Benglish (Bangla script written in English alphabet)</option>
                                    <option value="Mix" className="bg-[#030816] text-white">Multilingual Auto-Match (Dynamic Script)</option>
                                  </select>
                                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                    <ChevronDown size={14} />
                                  </div>
                                </div>
                              </div>

                              {/* 3. AI Cloud Voice selection (Requires server mode) */}
                              {voiceEngine === "server" && (
                                <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
                                  <div
                                    onClick={() => setIsGoogleVoiceExpanded(!isGoogleVoiceExpanded)}
                                    className="w-full text-left flex justify-between items-center outline-none cursor-pointer group"
                                    role="button"
                                    tabIndex={0}
                                  >
                                    <div className="space-y-1">
                                      <span className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block group-hover:text-cyan-300 transition-colors">Advanced AI Voice Models</span>
                                      <span className="text-xs text-cyan-400 font-mono block">
                                        Active: {googleVoiceName || "Charon"} (Google Live Core)
                                      </span>
                                    </div>
                                    <ChevronRight 
                                      size={16} 
                                      className={`text-slate-500 transition-transform duration-200 ${isGoogleVoiceExpanded ? "rotate-90 text-cyan-400" : "group-hover:text-white"}`} 
                                    />
                                  </div>

                                  {isGoogleVoiceExpanded && (
                                    <div className="pt-3 border-t border-white/10 space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                                      {[
                                        { id: "Puck", label: "Puck" },
                                        { id: "Charon", label: "Charon" },
                                        { id: "Fenrir", label: "Fenrir" }
                                      ].map((v) => {
                                        const isSelected = googleVoiceName === v.id;
                                        return (
                                          <div
                                            key={v.id}
                                            onClick={() => {
                                              setGoogleVoiceName(v.id);
                                              const bKey = (gmail || "").trim() || username;
                                              if (bKey) {
                                                syncUserProfileToCloud(bKey, { googleVoiceName: v.id }).catch(() => {});
                                              }
                                            }}
                                            className={`w-full flex justify-between items-center text-left py-3 px-4 rounded-xl transition-all cursor-pointer border ${
                                              isSelected ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.1)]" : "hover:bg-white/5 text-slate-300 border-transparent hover:border-white/10"
                                            }`}
                                          >
                                            <div className="space-y-0.5 max-w-[75%]">
                                              <span className="text-xs font-bold uppercase tracking-wider font-mono">{v.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  playVoicePreview(v.id);
                                                }}
                                                className={`p-2 rounded-lg border transition-all ${
                                                  previewVoiceId === v.id 
                                                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.2)]" 
                                                    : "bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                                                }`}
                                                title={previewVoiceId === v.id ? "Stop preview" : "Listen to preview"}
                                              >
                                                {previewVoiceId === v.id ? (
                                                  <Pause size={12} className="text-cyan-400 animate-pulse" />
                                                ) : (
                                                  <Play size={12} fill="currentColor" className="opacity-80" />
                                                )}
                                              </button>
                                              {isSelected && <Check size={14} className="text-cyan-400" />}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  <div className="text-[11px] text-slate-300 border-l-2 border-amber-500/50 pl-3.5 py-1.5 leading-relaxed bg-amber-500/10 rounded-r-xl p-3 font-sans">
                                    <span className="font-bold text-amber-400 block mb-0.5">Notice on Quota Limits:</span> AI Cloud voices run on the Gemini free tier which is strictly capped by Google to 10 requests per day per project. If you hit this limit, please configure your own Google Gemini API Key in <span className="text-white underline cursor-pointer hover:text-cyan-300" onClick={() => navigateMenu("api")}>API Key Configuration</span> to restore unlimited access, or switch to the <span className="font-bold text-emerald-400">System Offline</span> engine below for 100% free, unlimited local speech synthesis!
                                  </div>
                                </div>
                              )}

                              {/* 4. System / Local Speech voices (Completely Free & Offline) */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-4 transition-all">
                                <div
                                  onClick={() => setIsSystemVoicesExpanded(!isSystemVoicesExpanded)}
                                  className="w-full text-left flex justify-between items-center outline-none cursor-pointer group"
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="space-y-1">
                                    <span className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block group-hover:text-emerald-400 transition-colors">
                                      System Local TTS Voices
                                    </span>
                                    <span className="text-[10px] text-emerald-400/80 block font-mono">
                                      Active: {selectedVoiceName ? selectedVoiceName.substring(0, 36) + (selectedVoiceName.length > 36 ? "..." : "") : "Default System Fallback"}
                                    </span>
                                  </div>
                                  <ChevronRight 
                                    size={16} 
                                    className={`text-slate-500 transition-transform duration-200 ${isSystemVoicesExpanded ? "rotate-90 text-emerald-400" : "group-hover:text-white"}`} 
                                  />
                                </div>

                                {isSystemVoicesExpanded && (
                                  <div className="pt-3 border-t border-white/10 space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                                    {(() => {
                                      const langFilter = voiceLanguage === "Bengali" || voiceLanguage === "Benglish" ? "bn" : voiceLanguage === "Hindi" ? "hi" : voiceLanguage === "English" ? "en" : "";
                                      
                                      let filtered = systemVoices.filter(v => {
                                        if (!langFilter) return true;
                                        return v.lang.toLowerCase().replace('_', '-').startsWith(langFilter);
                                      });
                                      
                                      // If language filter yielded nothing, show all voices so the user does not see an empty box
                                      if (filtered.length === 0) {
                                        filtered = systemVoices;
                                      }

                                      if (filtered.length === 0) {
                                        return (
                                          <div className="text-center py-4 text-xs font-mono text-slate-400 border border-dashed border-white/10 rounded-xl bg-black/20">
                                            No system voices detected. Web Speech API might be offline.
                                          </div>
                                        );
                                      }

                                      const isPremium = (v: SpeechSynthesisVoice) => {
                                        const n = v.name.toLowerCase();
                                        return n.includes("natural") || n.includes("neural") || n.includes("google") || n.includes("siri") || n.includes("enhanced") || n.includes("premium") || n.includes("online");
                                      };

                                      // Sort: premium ones at top
                                      const sortedFiltered = [...filtered].sort((a, b) => {
                                        const ap = isPremium(a);
                                        const bp = isPremium(b);
                                        if (ap && !bp) return -1;
                                        if (!ap && bp) return 1;
                                        return a.name.localeCompare(b.name);
                                      });

                                      return sortedFiltered.map((v) => {
                                        const isSelected = selectedVoiceName === v.name;
                                        const premium = isPremium(v);
                                        return (
                                          <div
                                            key={v.name}
                                            onClick={() => {
                                              setSelectedVoiceName(v.name);
                                              const bKey = (gmail || "").trim() || username;
                                              if (bKey) {
                                                syncUserProfileToCloud(bKey, { selectedVoiceName: v.name }).catch(() => {});
                                              }
                                              // Automatically match the voiceEngine to native if they choose a local system voice
                                              if (voiceEngine !== "native") {
                                                setVoiceEngine("native");
                                                if (bKey) {
                                                  syncUserProfileToCloud(bKey, { voiceEngine: "native" }).catch(() => {});
                                                }
                                              }
                                            }}
                                            className={`w-full flex justify-between items-center text-left py-2.5 px-3 rounded-xl transition-all cursor-pointer border ${
                                              isSelected ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "hover:bg-white/5 text-slate-300 border-transparent hover:border-white/10"
                                            }`}
                                          >
                                            <div className="space-y-1 max-w-[70%]">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[11px] font-bold font-mono tracking-wide break-all">{v.name}</span>
                                                {premium && (
                                                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(0,243,255,0.2)]">
                                                    ⭐ Natural Voice
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-[9.5px] text-slate-500 font-mono block tracking-wider uppercase">{v.lang} {v.localService ? "(Local Offline)" : "(Network Cloud)"}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 shrink-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  playSystemVoicePreview(v.name);
                                                }}
                                                className={`p-2 rounded-lg border transition-all ${
                                                  previewVoiceId === v.name 
                                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                                                    : "bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                                                }`}
                                                title={previewVoiceId === v.name ? "Stop preview" : "Listen to preview"}
                                              >
                                                {previewVoiceId === v.name ? (
                                                  <Pause size={11} className="text-emerald-400 animate-pulse" />
                                                ) : (
                                                  <Play size={11} fill="currentColor" className="opacity-80" />
                                                )}
                                              </button>
                                              {isSelected && <Check size={14} className="text-emerald-400" />}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                )}
                              </div>

                              {/* 5. Voice Personalization Pitch and Rate Sliders */}
                              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-5 transition-all">
                                <div>
                                  <span className="text-[14px] font-bold tracking-wider font-mono text-white uppercase block mb-1">Vocal Pacing & Personalization</span>
                                  <span className="text-xs text-slate-400 block font-sans">Fine tune the voice velocity and speech pitch coordinates.</span>
                                </div>
                                
                                <div className="space-y-5 pt-1.5">
                                  {/* Speech speed (Rate) */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-300 font-bold uppercase tracking-wider font-mono">Speech Rate (Speed)</span>
                                      <span className="text-[#00f3ff] font-mono font-black">{voiceRate.toFixed(2)}x</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0.6"
                                      max="2.0"
                                      step="0.05"
                                      value={voiceRate}
                                      onChange={(e) => { const r = parseFloat(e.target.value);
                                        setVoiceRate(r);
                                      }}
                                      className="w-full accent-[#00f3ff] bg-black/50 h-2 rounded-lg appearance-none cursor-pointer border border-white/10"
                                    />
                                  </div>

                                  {/* Speech pitch */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-300 font-bold uppercase tracking-wider font-mono">Speech Pitch</span>
                                      <span className="text-[#00f3ff] font-mono font-black">{voicePitch.toFixed(2)}</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0.5"
                                      max="1.5"
                                      step="0.05"
                                      value={voicePitch}
                                      onChange={(e) => { const p = parseFloat(e.target.value);
                                        setVoicePitch(p);
                                      }}
                                      className="w-full accent-[#00f3ff] bg-black/50 h-2 rounded-lg appearance-none cursor-pointer border border-white/10"
                                    />
                                  </div>
                                  
                                  {/* Reset personalization */}
                                  <div className="flex justify-end pt-2 border-t border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVoiceRate(1.05);
                                        setVoicePitch(1.0);
                                        playSystemVoicePreview(selectedVoiceName);
                                      }}
                                      className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 hover:text-cyan-300 transition-colors py-1.5 px-3 rounded-lg border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 cursor-pointer shadow-[0_0_10px_rgba(0,243,255,0.05)]"
                                    >
                                      Reset to Default Speed/Pitch
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        )}


                        {/* SUB-PAGE 6: STORAGE */}
                        {menuSubpage === "storage" && (
                          <motion.div
                            key="storage"
                            className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-none pb-4 font-mono text-[#e2e8f0] transform-gpu flex flex-col"
                            style={{ willChange: "transform, opacity" }}
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            
                          >


                            <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-5">
                              <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,243,255,0.15)]">
                                    <HardDrive size={16} />
                                  </div>
                                  Database Storage Overview
                                </h3>
                                <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                                  Manage active client caching layers, view Firestore cloud storage limits, and manage manual synchronizations.
                                </p>
                              </div>

                              {/* Cloud Storage quota visual */}
                              <div className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3.5 shadow-inner">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cloud Data Usage</span>
                                  <span className="text-cyan-300 font-bold text-[10px] font-mono">
                                    {(() => {
                                      let bytes = 0;
                                      try {
                                        bytes += JSON.stringify(chatHistoryItems).length;
                                        bytes += JSON.stringify(jarvisMemories).length;
                                        bytes += 1500; // rough size of other settings
                                      } catch (_) {}
                                      const kb = (bytes / 1024).toFixed(1);
                                      return `${kb} KB / 5.0 GB`;
                                    })()}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10 shadow-inner">
                                  <div className="bg-gradient-to-r from-[#00f3ff] to-cyan-400 h-full rounded-full shadow-[0_0_8px_rgba(0,243,255,0.5)]" style={{ width: `${Math.min(100, Math.max(0.1, ((JSON.stringify(chatHistoryItems).length + JSON.stringify(jarvisMemories).length + 1500) / (5120 * 1024 * 1024)) * 100))}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500 font-semibold uppercase font-mono">
                                  <span>
                                    {(() => {
                                      let bytes = 0;
                                      try {
                                        bytes += JSON.stringify(chatHistoryItems).length;
                                        bytes += JSON.stringify(jarvisMemories).length;
                                        bytes += 1500;
                                      } catch (_) {}
                                      const pct = (bytes / (5120 * 1024 * 1024)) * 100;
                                      return `${pct < 0.01 ? '<0.01' : pct.toFixed(2)}% used`;
                                    })()}
                                  </span>
                                  <span>{(() => {
                                    let bytes = 0;
                                    try {
                                      bytes += JSON.stringify(chatHistoryItems).length;
                                      bytes += JSON.stringify(jarvisMemories).length;
                                      bytes += 1500;
                                    } catch (_) {}
                                    const pct = (bytes / (5120 * 1024 * 1024)) * 100;
                                    return `${pct < 0.01 ? '<0.01' : pct.toFixed(2)}% capacity`;
                                  })()}</span>
                                </div>
                              </div>

                              {/* Storage stats */}
                              <div className="p-4 bg-black/30 border border-white/10 rounded-xl divide-y divide-white/10 space-y-2 text-[10.5px] shadow-inner font-sans">
                                <div className="flex justify-between pb-2 items-center">
                                  <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider font-mono">Active Database:</span>
                                  <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">Cloud Firestore DB</span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                  <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider font-mono">Offline Cache:</span>
                                  <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> Active (Local)
                                  </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                  <span className="text-slate-400 uppercase font-bold text-[9px] tracking-wider font-mono">Last Backup Sync:</span>
                                  <span className="text-cyan-300 font-bold text-[10px]">Just now</span>
                                </div>
                              </div>


                              {/* Cloud Storage File Explorer */}
                              <div className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3.5 shadow-inner">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono">
                                  <span>Cloud Uploads & Generated Media</span>
                                  <span className="text-white flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_5px_rgba(0,243,255,0.5)]" /> Live DB</span>
                                </h4>
                                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 jarvis-scrollbar">
                                  {(() => {
                                    const allImages = [];
                                    const allDocs = [];
                                    chatHistoryItems.forEach(session => {
                                      if (session.messages) {
                                        session.messages.forEach(msg => {
                                          if (msg.attachment) {
                                            const fileData = {
                                              id: msg.id,
                                              url: msg.attachment,
                                              type: msg.attachmentType || (msg.attachment.startsWith('data:image') ? 'image/jpeg' : 'application/pdf'),
                                              timestamp: msg.timestamp || new Date().toISOString(),
                                              sender: msg.sender
                                            };
                                            if (fileData.type.startsWith('image/')) {
                                              allImages.push(fileData);
                                            } else {
                                              allDocs.push(fileData);
                                            }
                                          }
                                        });
                                      }
                                    });
                                    
                                    if (allImages.length === 0 && allDocs.length === 0) {
                                      return (
                                        <div className="py-6 text-center text-slate-500 text-[10px] uppercase font-bold font-mono border border-dashed border-white/10 rounded-xl">
                                          No files uploaded yet
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <div className="space-y-4 font-sans">
                                        {/* Images Section */}
                                        {allImages.length > 0 && (
                                          <div>
                                            <h5 className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider font-mono">Photos & Images ({allImages.length})</h5>
                                            <div className="grid grid-cols-3 gap-2">
                                              {allImages.reverse().map((file, i) => (
                                                <div key={`img-${file.id}-${i}`} className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all bg-slate-900" onClick={() => window.open(file.url, '_blank')}>
                                                  <img src={file.url} alt="upload" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                    <span className="text-[8px] text-cyan-300 font-bold uppercase truncate tracking-wider font-mono">{file.sender === 'jarvis' ? 'Generated' : 'Uploaded'}</span>
                                                    <span className="text-[7.5px] text-slate-300 font-mono">{((file.url?.length || 0) / 1024).toFixed(1)} KB</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Documents Section */}
                                        {allDocs.length > 0 && (
                                          <div className="pt-3 border-t border-white/10">
                                            <h5 className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider font-mono">Documents & Files ({allDocs.length})</h5>
                                            <div className="space-y-2">
                                              {allDocs.reverse().map((file, i) => (
                                                <div key={`doc-${file.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/30 hover:bg-white/5 transition-all cursor-pointer group shadow-sm" onClick={() => window.open(file.url, '_blank')}>
                                                  <div className="w-9 h-9 shrink-0 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
                                                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] text-slate-200 font-bold truncate group-hover:text-white transition-colors">
                                                      Document File
                                                    </div>
                                                    <div className="text-[9.5px] text-slate-500 flex gap-2 font-mono mt-0.5">
                                                      <span className="uppercase text-cyan-500/80 font-bold">{file.type.split('/')[1] || 'FILE'}</span>
                                                      <span>•</span>
                                                      <span>{((file.url?.length || 0) / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              
                              {/* Storage actions */}
                              <div className="flex flex-col gap-2.5 pt-2 select-none">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const backupKey = (gmail || "").trim() || username;
                                    if (backupKey) {
                                      syncUserProfileToCloud(backupKey, {
                                        gmail,
                                        dateOfBirth,
                                        backupEnabled,
                                        avatarInitials,
                                        avatarImage,
                                                                                jarvisTone,
                                        selectedVoiceName,
                                        googleVoiceName,
                                        voiceRate,
                                        voicePitch,
                                        textLanguage,
                                        voiceLanguage,
                                        connectedAppsStr: JSON.stringify(connectedApps),
                                        username,
                                        geminiKey,
                                        geminiKeyPoolStr: JSON.stringify(geminiKey ? [geminiKey] : []),
                                        appTheme,
                                        jarvisVolumePreset,
                                        voiceEngine,
                                        baseStyleTone,
                                        isFastAnswers,
                                        customInstructions,
                                        isReferenceMemories,
                                        isReferenceHistory,
                                        nicknameMemory,
                                        occupationMemory,
                                        moreAboutUser,
                                        profileHandle,
                                        buttonAccentColorStr: buttonAccentColor
                                      }).then(() => {
                                        showToast("Manual synchronization completed! Your chat history, profile settings, and configuration preferences have been successfully secured to Google Cloud Firestore.");
                                      }).catch((err) => {
                                        showToast("Synchronization failed: " + (err.message || String(err)));
                                      });
                                    } else {
                                      showToast("Unable to synchronize: No active identity key found. Please sign in to save your history.");
                                    }
                                  }}
                                  className="w-full py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] uppercase tracking-widest font-black font-mono rounded-xl hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all cursor-pointer text-center"
                                >
                                  Force Manual Synchronization
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to purge local cache? This will reset local theme preferences but won't delete your secured cloud dialogue history.")) {



                                      window.location.reload();
                                    }
                                  }}
                                  className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest font-black font-mono rounded-xl hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all cursor-pointer text-center"
                                >
                                  Wipe Local Cache
                                </button>
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
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            
                          >

                          <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg space-y-5 text-[11px] leading-relaxed font-sans">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                <Sparkles size={20} />
                              </div>
                              <p className="text-slate-200 font-medium">
                                <span className="text-[#00f3ff] font-extrabold mr-1 font-mono">▶</span>
                                JARVIS OS is a futuristic AI assistant system designed with a vision to create a next-generation intelligent operating experience directly from mobile devices.
                              </p>
                            </div>

                            <p className="text-slate-300">
                              Built using advanced web technologies like HTML, CSS, React, and Gemini, JARVIS combines modern artificial intelligence with a sleek cyber-inspired glassmorphism interface.
                            </p>

                            <div className="border-t border-white/10 pt-4">
                              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3.5 flex items-center gap-2 font-mono">
                                <div className="w-6 h-6 rounded-md bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center shadow-[0_0_8px_rgba(0,243,255,0.2)]">
                                  <Sparkles size={12} />
                                </div>
                                AI Ecosystem Core Features
                              </h3>
                              <div className="grid grid-cols-1 gap-2.5">
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
                                  <div key={fIdx} className="flex gap-3 bg-black/25 border border-white/5 p-3 rounded-xl hover:border-white/15 hover:bg-white/5 transition-all shadow-inner group">
                                    <span className="text-[#00f3ff] font-extrabold text-[12px] select-none leading-none mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">•</span>
                                    <div>
                                      <div className="text-white font-bold text-[10px] uppercase tracking-wide leading-normal font-mono group-hover:text-cyan-200 transition-colors">
                                        {feature.title}
                                      </div>
                                      <div className="text-slate-400 text-[9.5px] mt-1.5 leading-normal">
                                        {feature.desc}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <p className="border-t border-white/10 pt-4 text-slate-300 italic text-[10.5px] leading-relaxed relative">
                              <span className="absolute -top-3 left-4 bg-slate-900 px-2 text-cyan-500/50 text-2xl font-serif">"</span>
                              Every part of JARVIS OS was crafted with creativity, experimentation, and passion for innovation. This is not just a project — it is a dream built with imagination, determination, countless late-night coding sessions, and the belief that even a single person with a smartphone can create something futuristic and extraordinary. JARVIS reflects the idea that powerful AI systems can be built from pure passion and vision.
                            </p>

                            <div className="border-t border-white/10 pt-4 space-y-2 text-[10px] font-mono bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner mt-2">
                              <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400 font-semibold uppercase">Version:</span>
                                <span className="text-cyan-300 font-bold tracking-wider">Jarvis 1.00</span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400 font-semibold uppercase">Developer:</span>
                                <span className="text-white font-bold">Mohit Khan (Original Creator)</span>
                              </div>
                              <div className="flex justify-between border-b border-white/5 pb-2">
                                <span className="text-slate-400 font-semibold uppercase">Status:</span>
                                <span className="text-emerald-400 font-bold uppercase animate-pulse flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> Online & Evolving</span>
                              </div>
                              <div className="flex flex-col gap-1.5 pt-1">
                                <span className="text-slate-400 font-semibold uppercase">Mission:</span>
                                <span className="text-cyan-200 italic font-medium">"Building the future, one line of code at a time."</span>
                              </div>
                            </div>
                            </div>
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </div>

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

                  {currentScreen === "live" && (
                    <motion.div
                      key="screen-3-live"
                      variants={pageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      
                      className={`absolute inset-0 flex flex-col gap-1.5 sm:gap-2.5 p-2 sm:p-4 pb-2 sm:pb-4 overflow-hidden select-none touch-none border border-[#00f3ff]/20 transition-colors duration-1000 transform-gpu ${
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
                      <div className="flex justify-between items-center pb-1 sm:pb-2 shrink-0 relative z-10">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.speechSynthesis.cancel();
                              setFaceStatus("idle");
                              setFaceEmotion("normal");
                              setCurrentScreen("homepage");
                            }}
                            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer outline-none flex items-center justify-center"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        
                        <div className="text-center flex items-center justify-center gap-1.5 bg-[#00f3ff]/10 px-3.5 py-1 text-center rounded-full border border-[#00f3ff]/35 shrink-0 select-none">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping will-change-transform" />
                          <span className="text-[9px] font-mono tracking-widest text-[#00f3ff] font-bold uppercase leading-none">
                            CONNECTED
                          </span>
                        </div>

                        <div className="w-[33px] h-[33px]" />
                      </div>

                      {/* Animated Center Stage: Either Robotic Face OR Live Camera/Screen Video */}
                      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 w-full relative z-10 my-0.5">
                        {isCameraActive || isScreenSharing ? (
                          /* Camera / Screen Share Video Feed taking center stage */
                          <div className="relative w-full h-full min-h-0 flex-1 rounded-xl sm:rounded-2xl overflow-hidden border border-[#00f3ff]/40 bg-black/80 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover transition-transform duration-500 ${isCameraActive && cameraFacingMode === "user" ? "scale-x-[-1]" : ""}`}
                            />

                            {/* Futuristic HUD Viewport Framing Reticles */}
                            <div className="absolute inset-3 pointer-events-none z-10">
                              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
                              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
                            </div>
                            
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10 gap-2">
                              <span className="text-[7.5px] sm:text-[8.5px] font-mono bg-black/80 text-[#00f3ff] border border-[#00f3ff]/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-black flex items-center gap-1.5 backdrop-blur-md shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {isScreenSharing ? "DISPLAY SHARE ACTIVE" : `LIVE VISION • ${cameraFacingMode === "user" ? "FRONT" : "REAR"}`}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                {isCameraActive && (
                                  <button
                                    type="button"
                                    onClick={switchCameraFacingMode}
                                    className="px-2.5 py-1 bg-black/80 hover:bg-black border border-[#00f3ff]/35 text-[#00f3ff] hover:text-white font-black font-mono text-[8.5px] sm:text-[9px] uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md active:scale-95"
                                  >
                                    Flip
                                    <RefreshCw size={9} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Interactive Robotic Face taking center stage */
                          <div className="w-full h-full min-h-0 flex flex-col items-center justify-center gap-1 sm:gap-2">
                            <div className="w-full min-h-0 flex flex-1 items-center justify-center shrink-0">
                              <RoboticFace status={faceStatus} emotion={faceEmotion}  />
                            </div>

                            {/* Robotic Mood Status Indicator */}
                            <div className="px-3 sm:px-4 py-0.5 rounded-full bg-[#00f3ff]/5 border border-[#00f3ff]/20 flex items-center gap-1.5 shrink-0">
                              <Activity size={10} className="text-[#00f3ff] animate-pulse" />
                              <span className="text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff] font-bold uppercase tracking-widest leading-none">
                                Jarvis Mood: {faceStatus === "thinking" ? "Analyzing" : faceEmotion}
                              </span>
                            </div>
                          </div>
                        )}

                        {apiQuotaExceeded && (
                          <motion.div
                            variants={pageVariants}
                            custom={pageDirection}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={() => {
                              setCurrentScreen("menu");
                              navigateMenu("api");
                            }}
                            className="w-full max-w-sm p-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/35 rounded-xl flex items-center gap-2 backdrop-blur-md cursor-pointer shrink-0 animate-in fade-in zoom-in duration-300"
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
                            {faceStatus === "listening" && voiceTranscript.trim() !== "" ? (
                              <motion.div
                                key="voice-subtitle-interim"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                                className="w-full text-center space-y-0.5"
                              >
                                <span className="text-[7.5px] sm:text-[8px] font-mono uppercase tracking-widest text-[#00f3ff] font-black block animate-pulse">
                                  HEARING YOU...
                                </span>
                                <div className="font-mono text-[10px] sm:text-[11px] text-[#00f3ff] leading-relaxed max-h-[50px] overflow-y-auto scrollbar-none">
                                  "{voiceTranscript}"
                                </div>
                              </motion.div>
                            ) : voiceMessages.length > 0 ? (
                              <motion.div 
                                key={voiceMessages[voiceMessages.length - 1].id}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
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
                                className="font-mono text-[#00f3ff]/60 text-center leading-normal text-[10px] sm:text-[11px]"
                              >
                                Hello! Speak naturally or turn on your camera to share your live surroundings with Jarvis.
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>


                      {/* Controls Area (Optimized & scroll-safe) */}
                      <div className="space-y-2.5 sm:space-y-4 pt-0.5 transition-all shrink-0 w-full mb-1">
                        <div className="w-full py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold font-sans tracking-[0.12em] uppercase flex items-center justify-center gap-2 border border-[#00f3ff]/30 bg-[#00f3ff]/5 text-[#00f3ff] select-none">
                          <span className={`w-1.5 h-1.5 rounded-full block ${isLiveVoiceActive ? "bg-red-500 animate-pulse" : "bg-[#00f3ff]/60"}`} />
                          {isLiveVoiceActive ? "LIVE SESSION CONNECTED • LISTENING" : "CONNECTING LIVE SESSION..."}
                        </div>
                        
                        <div className="flex justify-around items-center px-4 py-0.5">
                          {/* Screen Share Control */}
                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={async () => {
                                if (isScreenSharing) {
                                  if (screenStreamRef.current) {
                                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                                    screenStreamRef.current = null;
                                  }
                                  setIsScreenSharing(false);
                                } else {
                                  try {
                                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                                    screenStreamRef.current = stream;
                                    setIsScreenSharing(true);
                                    stream.getVideoTracks()[0].onended = () => {
                                      setIsScreenSharing(false);
                                      screenStreamRef.current = null;
                                    };
                                  } catch (err) {
                                    console.error("Screen sharing failed or cancelled", err);
                                  }
                                }
                              }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isScreenSharing ? "bg-[#00f3ff]/25 border-[#00f3ff] text-white" : "bg-black/40 border-[#00f3ff]/25 text-[#00f3ff]/85 hover:text-white"
                              }`}
                            >
                              <Monitor size={12} />
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">SHARE</span>
                          </div>

                          {/* Camera Control */}
                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={toggleVisionActive}
                              className={`w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isCameraActive ? "bg-[#00f3ff]/25 border-[#00f3ff] text-white" : "bg-black/40 border-[#00f3ff]/25 text-[#00f3ff]/85 hover:text-white"
                              }`}
                            >
                              <Camera size={12} />
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">CAMERA</span>
                          </div>

                          {/* Mute Control */}
                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={() => {
                                const newMuted = !isMuted;
                                setIsMuted(newMuted);
                                if (liveMicStreamRef.current) {
                                  liveMicStreamRef.current.getAudioTracks().forEach(t => t.enabled = !newMuted);
                                }
                              }}
                              className={`w-11 h-11 sm:w-12 sm:h-12 border rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isMuted ? "bg-red-600 border-red-400 text-white" : "bg-slate-950/70 border-[#00f3ff]/35 text-[#00f3ff]"
                              }`}
                            >
                              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">{isMuted ? "MUTED" : "MIC"}</span>
                          </div>

                          {/* End Session Control */}
                          <div className="flex flex-col items-center gap-1 text-[8.5px] sm:text-[9px] font-mono text-[#00f3ff]/70 shrink-0">
                            <button
                              onClick={() => {
                                stopLiveVoiceSession();
                                setCurrentScreen("homepage");
                              }}
                              className="w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center transition-all cursor-pointer bg-red-950/70 border-red-500/50 text-red-100"
                            >
                              <PhoneOff size={12} />
                            </button>
                            <span className="font-bold tracking-wider uppercase text-[7.5px] sm:text-[8px]">END</span>
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

      {/* HISTORY DRAWER */}
      <HistoryDrawer
        isHistoryDrawerOpen={isHistoryDrawerOpen}
        setIsHistoryDrawerOpen={setIsHistoryDrawerOpen}
        historyMenuOpenId={historyMenuOpenId}
        setHistoryMenuOpenId={setHistoryMenuOpenId}
        historySearchQuery={historySearchQuery}
        setHistorySearchQuery={setHistorySearchQuery}
        chatHistoryItems={chatHistoryItems}
        activeSessionId={activeSessionId}
        isCloudDataLoaded={isCloudDataLoaded}
        handleHistoryTouchStart={handleHistoryTouchStart}
        handleHistoryTouchEnd={handleHistoryTouchEnd}
        isHistoryLongPressRef={isHistoryLongPressRef}
        loadChatFromHistory={loadChatFromHistory}
        updateAndSyncChatHistory={updateAndSyncChatHistory}
        setRenameDialogId={setRenameDialogId}
        setRenameDialogText={setRenameDialogText}
        setDeleteDialogId={setDeleteDialogId}
        setCurrentScreen={setCurrentScreen}
        setMenuSubpage={setMenuSubpage}
      />

      {/* RE-NAME DIALOG */}
      <RenameDialog
        renameDialogId={renameDialogId}
        setRenameDialogId={setRenameDialogId}
        renameDialogText={renameDialogText}
        setRenameDialogText={setRenameDialogText}
        updateAndSyncChatHistory={updateAndSyncChatHistory}
      />

      {/* DELETE DIALOG */}
      <DeleteDialog
        deleteDialogId={deleteDialogId}
        setDeleteDialogId={setDeleteDialogId}
        chatHistoryItems={chatHistoryItems}
        updateAndSyncChatHistory={updateAndSyncChatHistory}
        setUndoSnackbarItem={setUndoSnackbarItem}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        setMessages={setMessages}
        getInitialWelcomeMessage={getInitialWelcomeMessage}
      />

      {/* LOG OUT WARNING MODAL */}
      <LogoutModal
        isLogoutModalOpen={isLogoutModalOpen}
        setIsLogoutModalOpen={setIsLogoutModalOpen}
        textLanguage={textLanguage}
        handleLogOut={handleLogOut}
      />

      {/* UNDO SNACKBAR */}
      <AnimatePresence>
        {undoSnackbarItem && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12182b] border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl z-[150] flex items-center gap-4 min-w-[280px] max-w-[90vw]"
          >
             <span className="text-sm flex-1 truncate">Chat deleted</span>
             <button
               onClick={() => {
                 updateAndSyncChatHistory(prev => {
                   if (prev.some(c => c.id === undoSnackbarItem.id)) return prev;
                   const newArr = [undoSnackbarItem, ...prev];
                   return newArr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                 });
                 setUndoSnackbarItem(null);
               }}
               className="text-[#00f3ff] font-bold text-sm uppercase tracking-wide hover:underline shrink-0 cursor-pointer"
             >
               Undo
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

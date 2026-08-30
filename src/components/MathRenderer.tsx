import React, { useEffect, useRef, useState, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import MarkdownIt from "markdown-it";
import mermaid from "mermaid";
import Prism from "prismjs";
import { Check, Copy, Play } from "lucide-react";
import { InteractiveSortableTable } from "./InteractiveSortableTable";

// Initialize Mermaid
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
      background: "#030612",
      primaryColor: "#00f3ff",
      primaryTextColor: "#fff",
      lineColor: "#00f3ff",
    }
  });
} catch (e) {
  console.error("Failed to initialize mermaid:", e);
}

// Global math preprocessor to prevent markdown-it from corrupting LaTeX
interface PreprocessedMath {
  text: string;
  blockMath: string[];
  inlineMath: string[];
}

export function preprocessMath(text: string): PreprocessedMath {
  if (!text) return { text: "", blockMath: [], inlineMath: [] };
  
  let s = text;
  
  // Unescape \$ to $ since LLMs often over-escape dollar signs
  s = s.replace(/\\\$/g, "$");

  // 1. Convert standard LaTeX brackets \[ ... \] and \( ... \) to $$ and $
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `\n\n$$${formula.trim()}$$\n\n`);
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => `$${formula.trim()}$`);

  const blockMath: string[] = [];
  const inlineMath: string[] = [];

  // 2. Extract LaTeX block environments (align, equation, cases, matrix, bmatrix, pmatrix, array, split, gather, etc.)
  const envRegex = /\\begin\{(align|equation|cases|matrix|bmatrix|pmatrix|array|split|gather|align\*|equation\*)\}([\s\S]*?)\\end\{\1\}/g;
  s = s.replace(envRegex, (match) => {
    blockMath.push(match.trim());
    const idx = blockMath.length - 1;
    return `\n\n<div class="katex-math-block" data-idx="${idx}"></div>\n\n`;
  });

  // 3. Extract block math $$ ... $$
  s = s.replace(/\s*\$\$([\s\S]*?)\$\$\s*/g, (_, formula) => {
    blockMath.push(formula.trim());
    const idx = blockMath.length - 1;
    return `\n\n<div class="katex-math-block" data-idx="${idx}"></div>\n\n`;
  });

  // 4. Extract inline math $ ... $ (skipping currency or obvious non-math instances)
  s = s.replace(/\$([^$]+?)\$/g, (match, formula) => {
    const trimmed = formula.trim();
    if (!trimmed) return match;
    
    // Skip if it looks like standard currency values (e.g. $10, $9.99, $100,000)
    if (/^\d+([.,]\d+)?$/.test(trimmed)) {
      return match;
    }
    
    // Basic verification for spacing
    if (formula.startsWith(" ") && formula.endsWith(" ")) {
      return match;
    }
    
    inlineMath.push(trimmed);
    const idx = inlineMath.length - 1;
    return `<span class="katex-math-inline" data-idx="${idx}"></span>`;
  });

  return { text: s, blockMath, inlineMath };
}

// Preprocess checklists to make them GFM compatible before markdown-it
export function preprocessChecklists(text: string): string {
  if (!text) return "";
  let s = text;
  s = s.replace(/^\s*[-*+]\s+\[\s*\]\s+(.*)$/gm, "- <input type=\"checkbox\" data-gfm-task /> $1");
  s = s.replace(/^\s*[-*+]\s+\[[xX]\]\s+(.*)$/gm, "- <input type=\"checkbox\" checked data-gfm-task /> $1");
  return s;
}

// Safe Copy helper
async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch (e) {
      console.error("Copy failed:", e);
      return false;
    }
  }
}

interface CodeBlockProps {
  key?: React.Key;
  code: string;
  language: string;
  onRunCode?: (code: string, language: string) => void;
  isLight?: boolean;
}

export function CodeBlock({ code, language, onRunCode, isLight }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const cleanLang = language.toLowerCase().trim();
  const isRunnable = typeof onRunCode === "function" && ["html", "css", "javascript", "js", "python", "py", "json", "svg", "xml", "sql"].includes(cleanLang);

  let prismLang = "markup";
  if (["javascript", "js"].includes(cleanLang)) prismLang = "javascript";
  else if (["typescript", "ts"].includes(cleanLang)) prismLang = "typescript";
  else if (["css"].includes(cleanLang)) prismLang = "css";
  else if (["json"].includes(cleanLang)) prismLang = "json";
  else if (["python", "py"].includes(cleanLang)) prismLang = "python";
  else if (["bash", "sh", "shell"].includes(cleanLang)) prismLang = "bash";
  else if (["sql"].includes(cleanLang)) prismLang = "sql";

  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[prismLang] || Prism.languages.markup;
    try {
      return Prism.highlight(code, grammar, prismLang);
    } catch (err) {
      return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [code, prismLang]);

  const handleCopy = async () => {
    const ok = await safeCopyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`my-2 border rounded-xl overflow-hidden font-mono text-[10.5px] max-w-full text-left ${
      isLight 
        ? "border-slate-300 bg-slate-50 text-slate-800 shadow-sm" 
        : "border-cyan-500/25 bg-[#030612]/95 text-slate-200"
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 select-none ${
        isLight 
          ? "bg-slate-100 border-b border-slate-200 text-slate-700" 
          : "bg-[#070c1e] border-b border-cyan-500/15 text-cyan-400"
      }`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-cyan-400"}`}>
          {language || "code"}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 text-[9px] transition-colors focus:outline-none cursor-pointer font-bold ${
              isLight ? "text-slate-500 hover:text-slate-800" : "text-cyan-400/60 hover:text-cyan-400"
            }`}
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-500 font-extrabold" />
                <span className="text-emerald-500 font-black">COPIED</span>
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
              onClick={() => onRunCode?.(code, language)}
              className={`flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded border transition-all focus:outline-none cursor-pointer font-bold ${
                isLight 
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50" 
                  : "border-cyan-400/40 bg-cyan-400/10 text-cyan-400 hover:text-white hover:bg-cyan-400/20"
              }`}
            >
              <Play size={10} />
              <span>RUN</span>
            </button>
          )}
        </div>
      </div>
      <pre className={`p-3 overflow-x-auto leading-normal font-mono whitespace-pre break-all scrollbar-thin ${isLight ? "text-slate-800" : "text-slate-200"}`}>
        <code className={`language-${prismLang}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
}

let mermaidCounter = 0;

export function Mermaid({ chart }: { chart: string; key?: React.Key }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const chartId = useRef(`mermaid-${++mermaidCounter}`);

  useEffect(() => {
    if (!chart.trim()) return;

    let isMounted = true;
    const renderChart = async () => {
      try {
        setError(null);
        const { svg: renderedSvg } = await mermaid.render(chartId.current, chart);
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error("Mermaid error:", err);
        if (isMounted) {
          setError("Failed to render Mermaid diagram. Check syntax.");
        }
        mermaid.initialize({ startOnLoad: false });
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-3 p-4 rounded-xl border border-red-500/25 bg-red-950/15 text-red-400 font-mono text-[10px] whitespace-pre-wrap">
        <div className="font-bold mb-1">Mermaid Syntax Error:</div>
        {error}
      </div>
    );
  }

  return (
    <div className="my-3 flex justify-center bg-[#030612]/95 border border-cyan-500/20 rounded-2xl p-4 overflow-x-auto scrollbar-thin">
      <div 
        ref={containerRef} 
        className="mermaid-svg-container max-w-full"
        dangerouslySetInnerHTML={{ __html: svg || '<div class="text-xs text-cyan-400/50 animate-pulse">Rendering diagram...</div>' }}
      />
    </div>
  );
}

export function KaTeXBlock({ formula, isLight }: { formula: string; isLight?: boolean; key?: React.Key }) {
  const html = useMemo(() => {
    try {
      // Decode HTML entities (e.g. &amp;, &lt;, &gt;, etc.) that can arise from HTML parsers or markdown compilation
      const decoded = formula
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return katex.renderToString(decoded.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch (e) {
      return formula;
    }
  }, [formula]);

  return (
    <div
      className={`w-full my-3 px-4 py-3 rounded-xl overflow-x-auto text-center scrollbar-thin select-text animate-fade-in ${
        isLight 
          ? "border border-slate-300 bg-slate-50 text-slate-800 shadow-sm" 
          : "border border-cyan-500/25 bg-[#020512]/95"
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function KaTeXInline({ formula }: { formula: string; key?: React.Key }) {
  const html = useMemo(() => {
    try {
      // Decode HTML entities (e.g. &amp;, &lt;, &gt;, etc.) that can arise from HTML parsers or markdown compilation
      const decoded = formula
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return katex.renderToString(decoded.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch (e) {
      return formula;
    }
  }, [formula]);

  return (
    <span
      className="inline-block align-middle mx-1 font-serif select-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface ParseContext {
  blockMathStore: string[];
  inlineMathStore: string[];
  onRunCode?: (code: string, language: string) => void;
  isLight?: boolean;
}

/**
 * Parses inline CSS strings into React-compliant style maps to prevent style prop errors.
 */
function parseStyleString(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleStr) return styles;
  
  styleStr.split(";").forEach(pair => {
    const idx = pair.indexOf(":");
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      if (key && val) {
        // Convert CSS property name to camelCase for React (e.g., text-align -> textAlign)
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelKey] = val;
      }
    }
  });
  return styles;
}

export function htmlToReact(htmlString: string, context: ParseContext): React.ReactNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return domToReact(doc.body, context);
}

function domToReact(node: Node, context: ParseContext): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Intercept body tag and return its children in a Fragment
    if (tagName === "body") {
      const children: React.ReactNode[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        const childNode = el.childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE && !childNode.nodeValue?.trim()) {
          continue;
        }
        const childReact = domToReact(childNode, context);
        if (childReact !== null) {
          children.push(childReact);
        }
      }
      return <React.Fragment key="body-frag">{children}</React.Fragment>;
    }

    // 1. Math Interceptors
    if (tagName === "div" && el.classList.contains("katex-math-block")) {
      const idx = parseInt(el.getAttribute("data-idx") || "-1", 10);
      const formula = idx >= 0 ? context.blockMathStore[idx] : "";
      return <KaTeXBlock key={`math-b-${idx}-${Math.random()}`} formula={formula} isLight={context.isLight} />;
    }

    if (tagName === "span" && el.classList.contains("katex-math-inline")) {
      const idx = parseInt(el.getAttribute("data-idx") || "-1", 10);
      const formula = idx >= 0 ? context.inlineMathStore[idx] : "";
      return <KaTeXInline key={`math-i-${idx}-${Math.random()}`} formula={formula} />;
    }

    // 2. Code Block Interceptors
    if (tagName === "pre" && el.querySelector("code")) {
      const codeEl = el.querySelector("code")!;
      const codeText = codeEl.textContent || "";
      const classList = Array.from(codeEl.classList);
      const langClass = classList.find(c => c.startsWith("language-"));
      const language = langClass ? langClass.replace("language-", "") : "code";

      if (language === "mermaid") {
        return <Mermaid key={Math.random()} chart={codeText} />;
      }

      return (
        <CodeBlock 
          key={Math.random()} 
          code={codeText} 
          language={language} 
          onRunCode={context.onRunCode}
          isLight={context.isLight}
        />
      );
    }

    // 3. Task checkbox
    if (tagName === "input" && el.hasAttribute("data-gfm-task")) {
      const checked = el.hasAttribute("checked");
      return (
        <input 
          key={Math.random()}
          type="checkbox" 
          checked={checked} 
          readOnly 
          className="mr-2 h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 transition-colors inline-block align-middle"
        />
      );
    }

    const attribs: Record<string, any> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      let name = attr.name;
      if (name === "class") {
        name = "className";
      }
      if (name === "style") {
        attribs[name] = parseStyleString(attr.value);
      } else {
        attribs[name] = attr.value;
      }
    }

    const children: React.ReactNode[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      const childNode = el.childNodes[i];
      // Skip text nodes under strict HTML table container elements (table, thead, tbody, tfoot, tr)
      if (childNode.nodeType === Node.TEXT_NODE && ["table", "thead", "tbody", "tfoot", "tr"].includes(tagName)) {
        continue;
      }
      // Skip empty or whitespace-only text nodes under lists to keep rendering clean
      if (childNode.nodeType === Node.TEXT_NODE && ["ul", "ol"].includes(tagName) && !childNode.nodeValue?.trim()) {
        continue;
      }
      const childReact = domToReact(childNode, context);
      if (childReact !== null) {
        children.push(childReact);
      }
    }

    // Apply Tailwind styles
    if (tagName === "table") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl my-4 text-xs font-sans table-auto`
        : `${attribs.className || ""} min-w-full divide-y divide-zinc-800 border border-zinc-800 rounded-xl my-4 text-xs font-sans table-auto`;
      return (
        <InteractiveSortableTable key={Math.random()} isLight={context.isLight}>
          {React.createElement(tagName, attribs, ...children)}
        </InteractiveSortableTable>
      );
    } else if (tagName === "th") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} px-4 py-2 bg-slate-100 text-left font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200`
        : `${attribs.className || ""} px-4 py-2 bg-zinc-950/80 text-left font-bold text-cyan-400 uppercase tracking-wider border-b border-zinc-850`;
    } else if (tagName === "td") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} px-4 py-2 text-slate-700 border-b border-slate-200 bg-white`
        : `${attribs.className || ""} px-4 py-2 text-slate-200 border-b border-zinc-850 bg-[#030612]/30`;
    } else if (tagName === "blockquote") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} border-l-4 border-slate-400 pl-4 py-1 my-2 bg-slate-50 rounded-r-lg italic text-slate-600 text-xs font-sans`
        : `${attribs.className || ""} border-l-4 border-cyan-500/50 pl-4 py-1 my-2 bg-cyan-500/5 rounded-r-lg italic text-slate-300 text-xs font-sans`;
    } else if (tagName === "ul") {
      const isTaskList = el.querySelector("input[data-gfm-task]");
      attribs.className = context.isLight
        ? `${attribs.className || ""} ${isTaskList ? "space-y-1 list-none pl-0.5" : "list-disc pl-5 space-y-1"} my-2 text-slate-800 font-sans`
        : `${attribs.className || ""} ${isTaskList ? "space-y-1 list-none pl-0.5" : "list-disc pl-5 space-y-1"} my-2 text-slate-200 font-sans`;
    } else if (tagName === "ol") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} list-decimal pl-5 space-y-1 my-2 text-slate-800 font-sans`
        : `${attribs.className || ""} list-decimal pl-5 space-y-1 my-2 text-slate-200 font-sans`;
    } else if (tagName === "li") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} text-slate-800 leading-relaxed font-sans text-xs`
        : `${attribs.className || ""} text-slate-200 leading-relaxed font-sans text-xs`;
    } else if (tagName === "p") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} leading-relaxed text-slate-800 font-sans text-xs mb-2 last:mb-0`
        : `${attribs.className || ""} leading-relaxed text-slate-200 font-sans text-xs mb-2 last:mb-0`;
    } else if (tagName === "a") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} text-sky-600 hover:underline underline-offset-4 font-semibold transition-all`
        : `${attribs.className || ""} text-[#00f3ff] hover:underline underline-offset-4 font-semibold transition-all`;
      attribs.target = "_blank";
      attribs.rel = "noopener noreferrer";
    } else if (tagName === "h1") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} text-base font-bold text-slate-900 mt-4 mb-2 font-sans tracking-tight border-b border-slate-200 pb-1`
        : `${attribs.className || ""} text-base font-bold text-white mt-4 mb-2 font-sans tracking-tight border-b border-zinc-800/60 pb-1`;
    } else if (tagName === "h2") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} text-sm font-bold text-slate-900 mt-3 mb-1.5 font-sans tracking-tight`
        : `${attribs.className || ""} text-sm font-bold text-white mt-3 mb-1.5 font-sans tracking-tight`;
    } else if (tagName === "h3") {
      attribs.className = context.isLight
        ? `${attribs.className || ""} text-xs font-semibold text-slate-800 mt-2 mb-1 font-sans`
        : `${attribs.className || ""} text-xs font-semibold text-cyan-300 mt-2 mb-1 font-sans`;
    } else if (tagName === "code" && !el.parentElement?.tagName.toLowerCase().includes("pre")) {
      attribs.className = context.isLight
        ? `${attribs.className || ""} px-1.5 py-0.5 mx-0.5 border border-slate-200 bg-slate-50 text-slate-800 rounded font-mono text-[10px] font-semibold break-all`
        : `${attribs.className || ""} px-1.5 py-0.5 mx-0.5 border border-cyan-500/15 bg-cyan-500/5 text-[#00f3ff] rounded font-mono text-[10px] font-semibold break-all`;
    }

    return React.createElement(tagName, { ...attribs, key: Math.random() }, ...children);
  }

  return null;
}

interface MathRendererProps {
  text: string;
  
  onRunCode?: (code: string, language: string) => void;
  isLight?: boolean;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

export function renderMathAndRichStyles(
  text: string, 
  __undefined ?: boolean, 
  onRunCode?: (code: string, language: string) => void,
  isLight?: boolean
): React.ReactNode {
  if (!text) return "";

  // Step 1: Preprocess LaTeX Math (safe container wrappers)
  const { text: mathParsedText, blockMath, inlineMath } = preprocessMath(text);

  // Step 2: Preprocess Checklists for GFM
  const checklistParsedText = preprocessChecklists(mathParsedText);

  // Step 3: Parse markdown with markdown-it to HTML
  const compiledHtml = md.render(checklistParsedText);

  // Step 4: Parse HTML into highly stylized React elements with embedded components (Mermaid, CodeBlock, etc.)
  return (
    <div className={isLight ? "markdown-content light-theme" : "markdown-content"}>
      {htmlToReact(compiledHtml, { blockMathStore: blockMath, inlineMathStore: inlineMath, onRunCode, isLight })}
    </div>
  );
}

export function MathRenderer({ text, onRunCode, isLight }: MathRendererProps) {
  return <>{renderMathAndRichStyles(text, undefined, onRunCode, isLight)}</>;
}

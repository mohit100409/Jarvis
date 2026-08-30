import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2pdf from "html2pdf.js";
import katex from "katex";
import "katex/dist/katex.min.css";

import { CheckCircle, Download, FileText } from "lucide-react";
import { MathRenderer } from "./MathRenderer";

export interface PDFSection {
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

export interface PDFData {
  title?: string;
  subject?: string;
  author?: string;
  description?: string;
  fileName?: string;
  themeColor?: string;
  secondaryColor?: string;
  tableStyle?: "striped" | "classic" | "modern" | "borderless" | "grid";
  headerStyle?: "banner" | "minimal" | "split" | "neon";
  fontFamily?: string;
  sections?: PDFSection[];
  notes?: PDFSection[];
}

export function normalizeMathForPdf(input: string): string {
  if (!input) return "";
  let s = input;

  // Unescape \$ to $ since LLMs often over-escape dollar signs
  s = s.replace(/\\\$/g, "$");

  // Replace unicode arrow → with \to or ->
  s = s.replace(/→/g, '\\to');
  s = s.replace(/->/g, '\\to');

  // Convert lim x \to a, lim x->a, lim(x->a) to \lim_{x \to a}
  s = s.replace(/lim\s+([a-zA-Z0-9]+)\s*\\to\s*([a-zA-Z0-9]+)/g, '\\lim_{$1 \\to $2}');
  s = s.replace(/lim\s*\(\s*([a-zA-Z0-9]+)\s*\\to\s*([a-zA-Z0-9]+)\s*\)/g, '\\lim_{$1 \\to $2}');
  s = s.replace(/lim\s*\(\s*([a-zA-Z0-9]+)\s*-\s*>\s*([a-zA-Z0-9]+)\s*\)/g, '\\lim_{$1 \\to $2}');
  s = s.replace(/lim\s+([a-zA-Z0-9]+)\s*-\s*>\s*([a-zA-Z0-9]+)/g, '\\lim_{$1 \\to $2}');

  // Convert raw sin(x)/x to \frac{\sin x}{x}, or sin(theta)/theta, or tan(x)/x
  s = s.replace(/sin\s*\(\s*([a-zA-Z0-9\s+*-]+)\s*\)\s*\/\s*([a-zA-Z0-9\s+*-]+)/g, '\\frac{\\sin $1}{$2}');
  s = s.replace(/tan\s*\(\s*([a-zA-Z0-9\s+*-]+)\s*\)\s*\/\s*([a-zA-Z0-9\s+*-]+)/g, '\\frac{\\tan $1}{$2}');
  s = s.replace(/cos\s*\(\s*([a-zA-Z0-9\s+*-]+)\s*\)\s*\/\s*([a-zA-Z0-9\s+*-]+)/g, '\\frac{\\cos $1}{$2}');

  // Convert raw log_e(a) or log_10(b) or log_a(b) to \log_e(a)
  s = s.replace(/log_([a-zA-Z0-9]+)\s*\(([^)]+)\)/g, '\\log_{$1}($2)');

  // Convert fraction-like patterns: e.g. "(x^n - a^n) / (x - a)" -> "\frac{x^n - a^n}{x - a}"
  s = s.replace(/\[([^\]]+)\]\s*\/\s*\[([^\]]+)\]/g, '\\frac{$1}{$2}');
  s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, (match, num, den) => {
    if (/[\u0980-\u09ff]/.test(num) || /[\u0980-\u09ff]/.test(den)) {
      return match;
    }
    return `\\frac{${num}}{${den}}`;
  });

  // Base exponent pattern: base^exponent or base^(exponent) -> base^{exponent}
  s = s.replace(/([a-zA-Z0-9]+)\s*\^\s*\(([^)]+)\)/g, '$1^{$2}');
  s = s.replace(/([a-zA-Z0-9]+)\s*\^\s*([a-zA-Z0-9]+)/g, (match, p1, p2) => {
    if (p2.startsWith("{") && p2.endsWith("}")) {
      return match;
    }
    return `${p1}^{${p2}}`;
  });

  // Convert n * a^(n-1) or n a^(n-1) to n a^{n-1}
  s = s.replace(/([a-zA-Z0-9_}]+)\s*\*\s*([a-zA-Z0-9_{\\]+)/g, '$1 $2');

  // Do not double-wrap if content already contains $ or $$
  if (s.includes("$")) {
    return s;
  }

  // Let's check if the entire string (or parts of it) is a formula-like string.
  const hasMathIndicator = /\\lim|\\frac|\\log|\\to|\^|\\sin|\\cos|\\tan|=|<|>|\+|-|\/|\*|{|}|_/.test(s);
  if (hasMathIndicator) {
    const isPureMath = /^[a-zA-Z0-9\s.+\-*\/^=()\\_{}\[\]\to,]+$/.test(s.trim());
    if (isPureMath) {
      return `$${s.trim()}$`;
    } else {
      // Mixed line: let's identify parts like equations and wrap them with $
      let processed = s;
      
      // Wrap specific limits, fractions, exponents, etc. that aren't wrapped yet:
      processed = processed.replace(/(\\lim_{[^}]+}\s*(?:\\frac{[^}]+}{[^}]+}|[a-zA-Z0-9\s.+\-*\/^=()\\_{}\[\]\to]+))/g, '$$$1$$');
      processed = processed.replace(/(?<![\w$])([a-zA-Z0-9_}\\]+\^{[^}]+})(?![\w$])/g, '$$$1$$');
      processed = processed.replace(/(?<![\w$])(\\frac{[^}]+}{[^}]+})(?![\w$])/g, '$$$1$$');
      processed = processed.replace(/(?<![\w$])(\\lim_{[^}]+})(?![\w$])/g, '$$$1$$');
      return processed;
    }
  }

  return s;
}

export function formatMathBeforePdfRender(text: string): string {
  return normalizeMathForPdf(text);
}

export function InteractivePDFCard({ data }: { data: PDFData }) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const title = data?.title || "JARVIS OS Generated Notes";
  const subject = data?.subject || "General Study";
  const author = data?.author || "JARVIS OS";
  const description = data?.description || "";
  const sections = data?.sections || data?.notes || [];

  const themeColor = data?.themeColor || "#1f2937";
  const secondaryColor = data?.secondaryColor || "#00f3ff";
  const tableStyle = data?.tableStyle || "striped";
  const headerStyle = data?.headerStyle || "banner";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setSuccess(false);

    try {
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = printContainerRef.current;
      if (!element) {
        throw new Error("Print container ref is not available");
      }

      const finalFileName = data?.fileName || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_notes.pdf`;

      const opt = {
        margin:       [18, 0, 22, 0] as [number, number, number, number], // Top, Right, Bottom, Left margins in mm
        filename:     finalFileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to generate PDF document using html2pdf:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -8 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="mt-3 relative overflow-hidden bg-gradient-to-r from-slate-900/95 via-[#080e28]/95 to-slate-900/95 border backdrop-blur-2xl rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-[490px] w-full shadow-[0_0_25px_rgba(0,243,255,0.15)]"
        style={{
          borderColor: `${secondaryColor}50`,
        }}
      >
        {/* Holographic Subtle Shimmer Beam */}
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        />

        {/* Left Side: File Icon & PDF Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
          <div 
            className="relative w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 shadow-md"
            style={{
              backgroundColor: `${secondaryColor}20`,
              borderColor: `${secondaryColor}45`,
            }}
          >
            <FileText style={{ color: secondaryColor }} size={20} className="animate-pulse" />
            <motion.span
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span 
                className="text-[8.5px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.2 rounded"
                style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
              >
                PDF DOCUMENT READY
              </span>
            </div>
            <h4 className="text-white text-xs sm:text-sm font-semibold truncate leading-tight">
              {title}
            </h4>
          </div>
        </div>

        {/* Right Side: Download PDF Button */}
        <motion.button
          type="button"
          whileHover={success ? {} : { scale: 1.03 }}
          whileTap={success ? {} : { scale: 0.97 }}
          onClick={handleDownloadPDF}
          disabled={downloading}
          className={`py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold tracking-wide transition-all duration-200 text-slate-950 shrink-0 cursor-pointer shadow-lg relative z-10 ${
            success 
              ? "bg-emerald-500 text-white font-bold cursor-default shadow-[0_0_15px_#10b981]" 
              : downloading 
                ? "cursor-wait animate-pulse text-slate-900" 
                : "hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          }`}
          style={
            success 
              ? {} 
              : downloading 
                ? { backgroundColor: `${secondaryColor}80` } 
                : { backgroundColor: secondaryColor }
          }
        >
          {success ? (
            <>
              <CheckCircle size={15} className="stroke-[2.5]" />
              <span className="truncate">Downloaded</span>
            </>
          ) : downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full shrink-0" />
              <span className="truncate">Compiling PDF...</span>
            </>
          ) : (
            <>
              <Download size={15} className="stroke-[2.5] shrink-0" />
              <span className="truncate">Download PDF</span>
            </>
          )}
        </motion.button>

        {/* Progress Bar when compiling PDF */}
        {downloading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent shadow-[0_0_8px_#00f3ff]"
            />
          </div>
        )}

        {/* Hidden/Off-screen container rendered purely to capture for high-fidelity multi-page PDF generation */}
        <div className="pointer-events-none" style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -9999, width: "210mm" }}>
            <div 
              ref={printContainerRef} 
              className="bg-white text-slate-900 px-[20mm] py-[10mm] flex flex-col gap-6"
              style={{ 
                width: "210mm", 
                fontFamily: '"EB Garamond", "Noto Serif Bengali", serif',
                lineHeight: "1.6"
              }}
            >
              {/* Header section dynamically styled based on the chosen headerStyle */}
              {headerStyle === "neon" ? (
                <div 
                  className="bg-slate-950 text-white p-8 rounded-lg border-b-[5px] flex flex-col gap-2"
                  style={{ 
                    borderColor: secondaryColor,
                    
                  }}
                >
                  <h1 className="text-3xl font-bold tracking-tight text-white" >{title}</h1>
                  <p className="text-sm font-semibold font-mono" style={{ color: secondaryColor }}>
                    Subject: {subject} | Prepared with care by {author}
                  </p>
                </div>
              ) : headerStyle === "split" ? (
                <div className="flex rounded-lg overflow-hidden border border-slate-200">
                  <div className="w-[40mm] text-white p-6 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: themeColor }}>
                    JARVIS OS
                  </div>
                  <div className="flex-1 p-6 text-white flex flex-col gap-1.5" style={{ backgroundColor: secondaryColor }}>
                    <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                    <p className="text-xs text-white/90">
                      Subject: {subject} | Prepared with care by {author}
                    </p>
                  </div>
                </div>
              ) : headerStyle === "minimal" ? (
                <div className="border-b-2 pb-4 flex flex-col gap-1.5" style={{ borderColor: themeColor }}>
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: themeColor }}>{title}</h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Subject: {subject} | Prepared with care by {author}
                  </p>
                </div>
              ) : (
                // Banner style (default)
                <div 
                  className="text-white p-8 rounded-lg border-b-[5px] flex flex-col gap-2"
                  style={{ 
                    backgroundColor: themeColor,
                    borderColor: secondaryColor 
                  }}
                >
                  <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                  <p className="text-sm text-white/90">
                    Subject: {subject} | Prepared with care by {author}
                  </p>
                </div>
              )}

              {/* Description box */}
              {description && (
                <div 
                  className="p-4 bg-slate-50 italic text-slate-700 rounded-r-lg border-l-4"
                  style={{ 
                    borderColor: themeColor,
                    fontSize: "10.5pt"
                  }}
                >
                  "{description}"
                </div>
              )}

              {/* Sections & Modules rendering */}
              <div className="flex flex-col gap-8">
                {sections.map((sect, sIdx) => {
                  const headingText = sect.heading || sect.title || `Module ${sIdx + 1}`;
                  const bulletsList = sect.bulletPoints || sect.items || [];
                  return (
                    <div key={sIdx} className="flex flex-col gap-3" style={{ pageBreakInside: "avoid" }}>
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: secondaryColor }} />
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{headingText}</h2>
                      </div>

                      {sect.content && (
                        <div className="text-slate-800 leading-relaxed text-[11pt]">
                          <MathRenderer text={formatMathBeforePdfRender(sect.content)} isLight={true} />
                        </div>
                      )}

                      {/* Bullet points rendering */}
                      {bulletsList.length > 0 && (
                        <ul className="list-disc pl-5 text-slate-700 flex flex-col gap-1.5 text-[10.5pt]">
                          {bulletsList.map((bp, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              <MathRenderer text={formatMathBeforePdfRender(bp)} isLight={true} />
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Table data rendering styled exactly according to tableStyle */}
                      {sect.table && sect.table.headers && sect.table.rows && (
                        <div className="overflow-x-auto my-2" style={{ pageBreakInside: "avoid" }}>
                          <table className="w-full border-collapse text-left text-[10pt]">
                            <thead>
                              {tableStyle === "borderless" ? (
                                <tr>
                                  {sect.table.headers.map((hdr, hIdx) => (
                                    <th 
                                      key={hIdx} 
                                      className="py-2.5 px-3 font-bold border-b-2"
                                      style={{ color: themeColor, borderColor: themeColor, wordBreak: "break-word", whiteSpace: "normal" }}
                                    >
                                      <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                    </th>
                                  ))}
                                </tr>
                              ) : tableStyle === "classic" ? (
                                <tr className="bg-slate-700 text-white">
                                  {sect.table.headers.map((hdr, hIdx) => (
                                    <th 
                                      key={hIdx} 
                                      className="py-2.5 px-3 font-bold border-b-2"
                                      style={{ borderColor: themeColor, wordBreak: "break-word", whiteSpace: "normal" }}
                                    >
                                      <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                    </th>
                                  ))}
                                </tr>
                              ) : tableStyle === "modern" ? (
                                <tr style={{ backgroundColor: secondaryColor, color: "#111827" }}>
                                  {sect.table.headers.map((hdr, hIdx) => (
                                    <th key={hIdx} className="py-2.5 px-3 font-bold" style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                                      <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                    </th>
                                  ))}
                                </tr>
                              ) : tableStyle === "grid" ? (
                                <tr className="text-white" style={{ backgroundColor: themeColor }}>
                                  {sect.table.headers.map((hdr, hIdx) => (
                                    <th 
                                      key={hIdx} 
                                      className="py-2.5 px-3 font-bold border"
                                      style={{ borderColor: themeColor, wordBreak: "break-word", whiteSpace: "normal" }}
                                    >
                                      <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                    </th>
                                  ))}
                                </tr>
                              ) : (
                                // Striped / standard
                                <tr className="text-white" style={{ backgroundColor: themeColor }}>
                                  {sect.table.headers.map((hdr, hIdx) => (
                                    <th key={hIdx} className="py-2.5 px-3 font-semibold" style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                                      <MathRenderer text={normalizeMathForPdf(hdr)} isLight={true} />
                                    </th>
                                  ))}
                                </tr>
                              )}
                            </thead>
                            <tbody>
                              {sect.table.rows.map((row, rIdx) => (
                                <tr 
                                  key={rIdx} 
                                  className={
                                    tableStyle === "striped" || tableStyle === "modern" || tableStyle === "grid"
                                      ? rIdx % 2 === 0 ? "bg-slate-50" : "bg-white"
                                      : "bg-white"
                                  }
                                >
                                  {row.map((cell, cIdx) => (
                                    <td 
                                      key={cIdx} 
                                      className={`py-2 px-3 text-slate-700 border-b border-slate-100 ${
                                        tableStyle === "grid" ? "border" : ""
                                      }`}
                                      style={{
                                        borderColor: tableStyle === "grid" ? "#e2e8f0" : undefined,
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
        </motion.div>
    </AnimatePresence>
  );
}


export function HTMLPDFCard({ htmlContent }: { htmlContent: string }) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  // Process raw HTML to render KaTeX math symbols
  const processedHtmlContent = React.useMemo(() => {
    let s = htmlContent;
    
    // Unescape dollar signs
    s = s.replace(/\\\$/g, "$");

    // Block math
    s = s.replace(/\s*\$\$([\s\S]*?)\$\$\s*/g, (_, formula) => {
      try {
        const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        return katex.renderToString(decoded.trim(), { displayMode: true, throwOnError: false });
      } catch (e) {
        return `$$${formula}$$`;
      }
    });

    // Inline math
    s = s.replace(/\$([^$]+?)\$/g, (match, formula) => {
      const trimmed = formula.trim();
      if (!trimmed) return match;
      if (/^\d+([.,]\d+)?$/.test(trimmed)) return match;
      if (formula.startsWith(" ") && formula.endsWith(" ")) return match;
      try {
        const decoded = formula.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        return katex.renderToString(decoded.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Inject CSS to fix blank page and page-break issues
    const injectedCss = `
      <style>
        * { page-break-inside: auto; }
        h1, h2, h3, h4, h5, h6 { page-break-after: avoid; page-break-inside: avoid; }
        table, tr, td, th, tbody, thead, tfoot { page-break-inside: auto !important; }
        p { page-break-inside: avoid; }
        .footer, footer { page-break-before: avoid !important; margin-bottom: 0 !important; margin-top: 20px !important; }
      </style>
    `;

    return injectedCss + s;
  }, [htmlContent]);

  // Try to extract a title from the HTML content
  let docTitle = "Generated PDF Document";
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) || htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch && titleMatch[1]) {
    docTitle = titleMatch[1].trim();
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    setSuccess(false);
    try {
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 300));

      const element = printContainerRef.current;
      if (!element) throw new Error("Print container ref is not available");

      const finalFileName = `${docTitle.replace(/[^a-zA-Z0-9-_\u0980-\u09FF]/g, '_')}.pdf`;

      const opt = {
        margin:       [15, 0, 15, 0] as [number, number, number, number], // Top, Right, Bottom, Left margins in mm
        filename:     finalFileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error("Print/Download failed:", e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="w-full max-w-3xl bg-[#0b1021]/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col mb-4">
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide text-lg line-clamp-1">{docTitle}</h3>
            <p className="text-slate-400 text-sm">Ready for print or download</p>
          </div>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00f3ff] hover:bg-[#33f5ff] text-slate-900 font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto"
        >
          {success ? <CheckCircle size={18} /> : isGenerating ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent animate-spin rounded-full shrink-0" />
          ) : <Download size={18} />}
          <span>{success ? "Success" : isGenerating ? "Preparing..." : "Save PDF"}</span>
        </button>
      </div>
      
      {/* Hidden container just for generating PDF canvas */}
      <div className="pointer-events-none" style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -9999, width: "210mm" }}>
        <div 
          ref={printContainerRef} 
          className="bg-white text-black"
          style={{ width: "210mm", boxSizing: "border-box", padding: "15mm" }}
          dangerouslySetInnerHTML={{ __html: processedHtmlContent }}
        />
      </div>
    </div>
  );
}

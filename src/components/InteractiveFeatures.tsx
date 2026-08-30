import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Sparkles,
  Calculator,
  FileText,
  Terminal,
  Activity,
  Copy,
  Check
} from "lucide-react";

interface InteractiveFeaturesProps {
  onClose: () => void;
  username: string;
  theme: "cosmic" | "slate" | "note";
  initialActivePopup?: string | null;
  onExecutePrompt?: (prompt: string) => void;
}

export default function InteractiveFeatures({
  onClose,
  username,
  theme,
  initialActivePopup = "calculator",
  onExecutePrompt
}: InteractiveFeaturesProps) {
  const [activeTab, setActiveTab] = useState<string>(initialActivePopup || "calculator");
  const [calcInput, setCalcInput] = useState<string>("");
  const [calcResult, setCalcResult] = useState<string>("");
  const [scratchpadNote, setScratchpadNote] = useState<string>(() => {
    return localStorage.getItem("jarvis_scratchpad_draft") || "";
  });
  const [copied, setCopied] = useState(false);

  const isLight = theme === "note";

  // Simple safe calculator evaluator
  const handleCalculate = () => {
    try {
      const sanitized = calcInput.replace(/[^0-9+\-*/().,%^]/g, "");
      if (!sanitized) return;
      // evaluate basic mathematical expressions safely
      const fn = new Function(`return (${sanitized.replace(/\^/g, "**")})`);
      const res = fn();
      setCalcResult(String(res));
    } catch (_) {
      setCalcResult("Syntax Error");
    }
  };

  const handleSaveScratchpad = (val: string) => {
    setScratchpadNote(val);
    localStorage.setItem("jarvis_scratchpad_draft", val);
  };

  const handleCopyScratchpad = async () => {
    try {
      await navigator.clipboard.writeText(scratchpadNote);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          isLight
            ? "bg-white/95 border-slate-200 text-slate-900"
            : "bg-[#080d21]/95 border-cyan-500/30 text-white backdrop-blur-2xl"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isLight ? "border-slate-100 bg-slate-50/80" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center justify-center text-[#00f3ff]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">
                JARVIS Interactive Workspace
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Operator: <span className="font-bold text-cyan-400">{username || "User"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? "border-slate-200 hover:bg-slate-200 text-slate-600"
                : "border-white/10 hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto scrollbar-none shrink-0 ${
            isLight ? "border-slate-100 bg-slate-50/50" : "border-white/5 bg-black/20"
          }`}
        >
          {[
            { id: "calculator", label: "Calculator & Formulas", icon: Calculator },
            { id: "scratchpad", label: "Study Scratchpad", icon: FileText },
            { id: "macros", label: "AI Fast Macros", icon: Terminal },
            { id: "diagnostics", label: "System Telemetry", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? isLight
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-[#00f3ff] text-black shadow-lg shadow-[#00f3ff]/20 font-black"
                    : isLight
                    ? "text-slate-600 hover:bg-slate-200/60"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin space-y-4">
          {/* CALCULATOR */}
          {activeTab === "calculator" && (
            <div className="space-y-3.5">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/40"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Scientific & Algebraic Evaluator
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 24 * (12.5 + 4.2)^2"
                      value={calcInput}
                      onChange={(e) => setCalcInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                        isLight
                          ? "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                          : "bg-[#0b1021] border-white/10 text-white focus:border-cyan-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCalculate}
                      className="px-4 py-2.5 rounded-xl bg-[#00f3ff] hover:bg-[#33f5ff] text-black font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Solve
                    </button>
                  </div>

                  {calcResult && (
                    <div
                      className={`mt-2 p-3 rounded-xl border flex items-center justify-between ${
                        isLight ? "bg-white border-slate-200" : "bg-cyan-500/10 border-cyan-500/30"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Result:</span>
                      <span className="text-sm font-mono font-bold text-cyan-400">{calcResult}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Prompt Math Solvers */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Deep AI Math & Physics Workflows
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Solve step-by-step calculus derivative",
                    "Explain Fourier transform intuition",
                    "Matrix eigenvalue & eigenvector calculator",
                    "Thermodynamics Carnot cycle derivation"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onExecutePrompt) onExecutePrompt(p);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-[11px] font-mono transition-all cursor-pointer ${
                        isLight
                          ? "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-800"
                          : "border-white/5 bg-white/[0.02] hover:border-cyan-500/40 text-slate-300 hover:text-white"
                      }`}
                    >
                      {p} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STUDY SCRATCHPAD */}
          {activeTab === "scratchpad" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Auto-Saving Local Scratchpad
                </div>
                <button
                  type="button"
                  onClick={handleCopyScratchpad}
                  className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copied ? "Copied" : "Copy Notes"}</span>
                </button>
              </div>

              <textarea
                rows={8}
                placeholder="Type temporary formulas, assignment notes, or lecture snippets here..."
                value={scratchpadNote}
                onChange={(e) => handleSaveScratchpad(e.target.value)}
                className={`w-full p-3.5 rounded-2xl border text-xs font-mono outline-none resize-none leading-relaxed ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400"
                    : "bg-black/40 border-white/10 text-slate-200 focus:border-cyan-500/40"
                }`}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (scratchpadNote.trim() && onExecutePrompt) {
                      onClose();
                      onExecutePrompt(`Summarize and organize my study notes:\n\n${scratchpadNote}`);
                    }
                  }}
                  disabled={!scratchpadNote.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[10.5px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                >
                  Organize With JARVIS →
                </button>
              </div>
            </div>
          )}

          {/* AI MACROS */}
          {activeTab === "macros" && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Instant Academic Macros
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    title: "Synthesize Current News & Science Breakthroughs",
                    desc: "Pulls recent world events, research publications, and technological milestones.",
                    prompt: "Search the latest science and technology breakthroughs today and give me an executive brief."
                  },
                  {
                    title: "Generate Complete Study Plan for Exam Week",
                    desc: "Structures daily milestones, active recall slots, and practice tests.",
                    prompt: "Design a high-yield 7-day study plan with active recall intervals and self-testing schedules."
                  },
                  {
                    title: "Code Refactoring & Unit Test Architect",
                    desc: "Analyzes code for edge cases, performance bottlenecks, and generates test suites.",
                    prompt: "Act as a senior software engineer: review my code logic, optimize time complexity, and construct complete unit tests."
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onClose();
                      if (onExecutePrompt) onExecutePrompt(item.prompt);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                      isLight
                        ? "border-slate-200 bg-slate-50 hover:bg-slate-100/80"
                        : "border-white/5 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 mb-0.5">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TELEMETRY */}
          {activeTab === "diagnostics" && (
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Active Client Subsystems
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 uppercase">Engine</div>
                  <div className="font-bold text-cyan-400">Gemini 2.5 Ultra/Pro</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 uppercase">Core Status</div>
                  <div className="font-bold text-emerald-400">Nominal / Online</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 uppercase">Memory Index</div>
                  <div className="font-bold text-purple-400">Active Sync</div>
                </div>
                <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-400 uppercase">Security Layer</div>
                  <div className="font-bold text-sky-400">Encrypted (TLS/SSL)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

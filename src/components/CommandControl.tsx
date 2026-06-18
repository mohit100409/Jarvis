import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Youtube, Search, ArrowRight, AppWindow, EyeOff, LayoutGrid, AlertCircle, Sparkles } from "lucide-react";

interface ActionCommand {
  keyword: string;
  description: string;
  type: "browser" | "youtube" | "app" | "utility";
  icon: any;
  targetUrl?: string;
  responseWords: string;
  detail?: string;
}

export default function CommandControl() {
  const [typedCommand, setTypedCommand] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] JARVIS OS Command Core initialized..."]);
  const [simulatorState, setSimulatorState] = useState<{
    visible: boolean;
    title: string;
    type: "youtube" | "search" | "phone-app" | "utility";
    detail: string;
    url?: string;
  }>({
    visible: false,
    title: "",
    type: "utility",
    detail: "",
  });

  const availableCommands: ActionCommand[] = [
    {
      keyword: "search YouTube math integration",
      description: "Search math tutorials on YouTube",
      type: "youtube",
      icon: Youtube,
      targetUrl: "https://www.youtube.com/results?search_query=calculus+integration+step+by+step",
      responseWords: "Certainly! Open YouTube and listing tutorials explaining mathematical integration...",
    },
    {
      keyword: "search internet for Newton's laws",
      description: "Search scientific concepts in standard search engine",
      type: "browser",
      icon: Search,
      targetUrl: "https://www.google.com/search?q=Newton+laws+of+motion+physics+tutorial",
      responseWords: "Right away, opening the browser with selected resources explaining Newtonian physics...",
    },
    {
      keyword: "open dynamic study scheduler",
      description: "Open mock scheduler application inside workspace",
      type: "app",
      icon: AppWindow,
      responseWords: "Processing... Opening simulated study planner, loading upcoming exams and classes.",
      detail: "Daily Planner - Mon: Physics Exam Review, Tue: Calculus Lab, Wed: Research Paper Draft",
    },
    {
      keyword: "simulate system lock",
      description: "Simulate secure safe screen lock of core",
      type: "utility",
      icon: EyeOff,
      responseWords: "Acknowledge. Setting JARVIS terminal system to locked sleep mode.",
      detail: "STUDY STATE: SLEEP MODE ACTIVE. PRESS ESC OR TAPPING TO UNLOCK.",
    },
  ];

  const handleCommandRun = (cmd: string) => {
    if (!cmd.trim()) return;

    setLogs((prev) => [`> Run: ${cmd}`, ...prev]);

    // Simple search loop
    const matched = availableCommands.find((c) =>
      cmd.toLowerCase().includes(c.keyword.toLowerCase()) || 
      c.keyword.toLowerCase().includes(cmd.toLowerCase())
    );

    if (matched) {
      setLogs((prev) => [`[JARVIS] ${matched.responseWords}`, ...prev]);
      
      // Speach synthesis
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(matched.responseWords);
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      }

      if (matched.type === "youtube" || matched.type === "browser") {
        setSimulatorState({
          visible: true,
          title: matched.type === "youtube" ? "Simulating YouTube Search" : "Simulating Browser Search",
          type: matched.type,
          detail: `Command captured. Launching standard search query redirection. Redirect URL: ${matched.targetUrl}`,
          url: matched.targetUrl,
        });
      } else {
        setSimulatorState({
          visible: true,
          title: matched.keyword.toUpperCase(),
          type: "phone-app",
          detail: matched.detail || "Executed successfully inside JARVIS shell.",
        });
      }
    } else {
      // Dynamic fallback for custom queries (automatic browser/youtube router)
      const isYoutube = cmd.toLowerCase().includes("youtube") || cmd.toLowerCase().includes("playlist");
      const cleanQuery = cmd.replace(/youtube|browser|search|open|simulate/gi, "").trim();
      const targetUrl = isYoutube
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`
        : `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`;

      const responseText = isYoutube 
        ? `Searching YouTube for "${cleanQuery}"` 
        : `Searching browser directory for "${cleanQuery}"`;

      setLogs((prev) => [
        `[JARVIS] Mapping custom command redirection...`,
        `[REDIRECT] ${responseText}`,
        ...prev
      ]);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(responseText));
      }

      setSimulatorState({
        visible: true,
        title: isYoutube ? "YouTube Launcher" : "Smart Web redirection",
        type: isYoutube ? "youtube" : "search",
        detail: `Simulated task: Executed action correctly on request. Direct query: ${cleanQuery}`,
        url: targetUrl,
      });
    }

    setTypedCommand("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md shadow-xl text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMMAND TRIGGER GRID */}
        <div>
          <h3 className="text-sm font-semibold tracking-widest text-slate-400 font-mono mb-4 flex items-center gap-1.5 uppercase">
            <LayoutGrid size={13} className="text-blue-400" /> Command Presets
          </h3>

          <div className="flex flex-col gap-3">
            {availableCommands.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  onClick={() => handleCommandRun(c.keyword)}
                  className="flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 rounded-2xl hover:border-slate-700 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{c.keyword}</h4>
                      <p className="text-xs text-slate-400">{c.description}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE CONSOLE */}
        <div className="flex flex-col justify-between bg-slate-950/60 rounded-2xl border border-slate-800 p-5 font-mono">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 mb-3 border-b border-slate-900 pb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal size={12} className="text-blue-500" /> OS TERMINAL OVERLAY
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 rounded bg-green-500/10 text-green-400 animate-pulse">
                active
              </span>
            </div>

            {/* Custom search launcher form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type command (e.g. open browser to quantum physics)..."
                value={typedCommand}
                onChange={(e) => setTypedCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommandRun(typedCommand);
                }}
                className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600 select-all font-mono"
              />
              <button
                onClick={() => handleCommandRun(typedCommand)}
                className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl text-xs font-bold font-sans tracking-wide transition-colors"
              >
                EXEC
              </button>
            </div>

            {/* Simulated Live Logs */}
            <div className="h-44 overflow-y-auto text-xs space-y-1.5 pr-1 select-text">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed break-all ${
                    log.startsWith(">")
                      ? "text-blue-400"
                      : log.includes("[SYSTEM]") 
                      ? "text-slate-500" 
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
            <span>JARVIS core telemetry v5.0</span>
            <span>Study assist integration online</span>
          </div>
        </div>
      </div>

      {/* DETAILED REDIRECTION MODAL / LIVE SCREEN SIMULATOR */}
      <AnimatePresence>
        {simulatorState.visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl relative"
            >
              <div className="absolute top-4 right-4 text-xs font-mono select-none px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 cursor-pointer hover:bg-slate-700 text-slate-300" onClick={() => setSimulatorState({ ...simulatorState, visible: false })}>
                CLOSE
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center font-bold">
                  {simulatorState.type === "youtube" ? <Youtube size={22} /> : simulatorState.type === "search" ? <Search size={22} /> : <Sparkles size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {simulatorState.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
                    COMPANION TASK SUCCESSFUL
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-sm leading-relaxed text-slate-300 break-words font-mono mb-6">
                {simulatorState.detail}
              </div>

              {simulatorState.url && (
                <div className="flex gap-3">
                  <a
                    href={simulatorState.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg transition-colors border border-blue-500/30"
                  >
                    CONTINUE TO SOURCE TAB
                  </a>
                  <button
                    onClick={() => setSimulatorState({ ...simulatorState, visible: false })}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-sm shadow transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

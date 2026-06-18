import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  HelpCircle,
  Search,
  MessageSquare,
  Play,
  CheckCircle,
  Terminal,
  Cpu,
  Mail,
  Send,
  CloudSun,
  Key,
  Code,
  Music,
  Tv,
  ListRestart,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";

interface CommandItem {
  phrase: string;
  actionDesc: string;
  category: "automation" | "modules" | "screens";
  icon: React.ComponentType<any>;
  details: string;
}

interface CommandGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (commandText: string) => void;
}

const COMMANDS_DATA: CommandItem[] = [
  // 1. SYSTEM AUTOMATION & COMMUNICATIONS
  {
    phrase: "check email",
    actionDesc: "Access Tactical inbox & decrypt SSL signals",
    category: "automation",
    icon: Mail,
    details: "Instructs Jarvis to intercept incoming mail servers, decrypt transmissions, and present an interactive Inbox Automation Card on-screen."
  },
  {
    phrase: "send message",
    actionDesc: "Construct outgoing SMTP communications packet",
    category: "automation",
    icon: Send,
    details: "Spawns a specialized message composer card where you can authorize orbital handshake parameters and broadcast messages to Tony Stark or Sam Altman."
  },
  {
    phrase: "message tony",
    actionDesc: "Compose specific telemetry feed for Stark Core",
    category: "automation",
    icon: Send,
    details: "Autofills the SMTP composer targeting Tony Stark (tony@stark.com) with high-frequency resonance calibrators."
  },
  {
    phrase: "automation task",
    actionDesc: "Initiate smart background scheduled relays",
    category: "automation",
    icon: Cpu,
    details: "Synchronizes with automation scheduled cron daemons and renders the interactive Device Triggers Scheduler."
  },

  // 2. TACTICAL SUB-APP CONTROLS
  {
    phrase: "open weather",
    actionDesc: "Pull up live Weather & climate vectors",
    category: "modules",
    icon: CloudSun,
    details: "Launches the Weather Hub system widget, showing ambient parameters, barometric feeds, and adaptive atmospheric scans."
  },
  {
    phrase: "open todo",
    actionDesc: "View personal agenda & task lists",
    category: "modules",
    icon: CheckCircle,
    details: "Launches the Task Manager node, letting you add, check off, or prune student objectives and homework schedules."
  },
  {
    phrase: "open notes",
    actionDesc: "Toggle secure local scratchpad files",
    category: "modules",
    icon: ListRestart,
    details: "Enables the local Notepad block for recording telemetry logs, memory memos, and structural study reports."
  },
  {
    phrase: "open password",
    actionDesc: "Unlock cryptographic lockkey manager",
    category: "modules",
    icon: Key,
    details: "Accesses the Password Safe portal. Includes continuous strength level scoring matrices and a rapid password generator tool."
  },
  {
    phrase: "open code",
    actionDesc: "Unlock standard algorithmic sandbox scriptor",
    category: "modules",
    icon: Code,
    details: "Fires up the specialized Interactive Code Assistant to write typescript snippets, correct regex, or examine code template packages."
  },
  {
    phrase: "open lofi focus synth",
    actionDesc: "Synthesize ambient study loops & frequencies",
    category: "modules",
    icon: Music,
    details: "Unlocks the custom Lofi Focus Synthesizer, allowing you to synthesize real audio waves and binaural beats while reading."
  },
  {
    phrase: "open diagnostics",
    actionDesc: "Enforce deep system state hardware monitors",
    category: "modules",
    icon: Cpu,
    details: "Toggles full live CPU load graphs, continuous telemetry sweeps, memory leak scanners, and real hardware specifications."
  },
  {
    phrase: "open creator studio",
    actionDesc: "Initialize visual media synthesizer loops",
    category: "modules",
    icon: Sparkles,
    details: "Launches AI Creator Studio for quick image models generation and computer vision prompt drafting."
  },

  // 3. VOICE HUD MODE & ENVIRONMENT CONTROLS
  {
    phrase: "open live",
    actionDesc: "Initiate full interactive voice console",
    category: "screens",
    icon: Terminal,
    details: "Directly triggers full-screen Jarvis voice core mode. Activates continuous microphone speech listeners and begins facial rendering animations."
  },
  {
    phrase: "open settings",
    actionDesc: "Access system profiles, tones & credentials",
    category: "screens",
    icon: Sliders,
    details: "Navigates straight to the main backend settings menu, where you can modify personality schemas, vocal pitches, or register personal cryptographic API keys."
  },
  {
    phrase: "open home",
    actionDesc: "Prune sub-screens & return to primary telemetry",
    category: "screens",
    icon: Layers,
    details: "Shuts down any currently overlaying operations or widgets, pulling you straight back to the central active desktop terminal dialogue feed."
  }
];

export default function CommandGuideModal({ isOpen, onClose, onExecuteCommand }: CommandGuideModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "automation" | "modules" | "screens">("all");
  const [selectedCommand, setSelectedCommand] = useState<CommandItem | null>(null);

  const filteredCommands = COMMANDS_DATA.filter((cmd) => {
    const matchesSearch =
      cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.actionDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmd.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || cmd.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-2xl bg-[#030712]/95 border-2 border-[#00f3ff]/40 shadow-[0_0_35px_rgba(0,243,255,0.25)] rounded-[24px] overflow-hidden flex flex-col relative z-50 h-[85vh] max-h-[640px] font-sans antialiased"
          >
            {/* Grid Pattern Background Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none opacity-20" />
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#00f3ff]/20 bg-[#09132e]/50 flex items-center justify-between shrink-0 relative">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00f3ff]/15 flex items-center justify-center border border-[#00f3ff]/30 text-[#00f3ff]">
                  <HelpCircle size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest font-mono text-[#00f3ff] uppercase leading-none">
                    JARVIS SYSTEMS COMMAND MATRIX
                  </h3>
                  <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wide">
                    Tactical Voice & Keyboard Autopilot Core
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-[#00f3ff]/20 bg-[#0c1530]/65 text-[#00f3ff] hover:text-white hover:border-[#00f3ff] transition-all cursor-pointer outline-none"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sub-Header / Search Filter */}
            <div className="p-4 bg-black/40 border-b border-[#00f3ff]/10 shrink-0 space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f3ff]/60" size={14} />
                <input
                  type="text"
                  placeholder="Scan available vocal phrases (e.g., 'check email', 'open weather')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/70 border border-[#00f3ff]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff]/20 transition-all font-mono"
                />
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Directives" },
                  { id: "automation", label: "Smart Automations" },
                  { id: "modules", label: "Sub-App Modules" },
                  { id: "screens", label: "Console Views" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveCategory(tab.id as any);
                      setSelectedCommand(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                      activeCategory === tab.id
                        ? "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff] font-extrabold shadow-[0_0_8px_rgba(0,243,255,0.15)]"
                        : "bg-[#070b19]/60 border-[#00f3ff]/10 text-slate-400 hover:border-[#00f3ff]/25 hover:text-[#00f3ff]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Core Body (Scrollable Split screen) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#00f3ff]/15 bg-black/20">
              
              {/* Left Column: Command List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-[10px] uppercase">
                    📡 No matching tactical directives found.
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon;
                    const isSelected = selectedCommand?.phrase === cmd.phrase;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCommand(cmd)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 group relative ${
                          isSelected
                            ? "bg-[#00f3ff]/10 border-[#00f3ff] shadow-[0_1px_15px_rgba(0,243,255,0.08)]"
                            : "bg-[#070d22]/40 border-[#00f3ff]/15 hover:border-[#00f3ff]/45 hover:bg-[#09153a]/30"
                        }`}
                      >
                        <div className={`p-2 rounded-lg border shrink-0 ${
                          isSelected
                            ? "bg-[#00f3ff]/15 border-[#00f3ff] text-[#00f3ff]"
                            : "bg-[#0c1530]/50 border-[#00f3ff]/20 text-cyan-400/80 group-hover:text-[#00f3ff] group-hover:border-[#00f3ff]/50"
                        }`}>
                          <Icon size={14} />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black tracking-wide text-white font-mono group-hover:text-[#00f3ff] transition-colors">
                              &quot;{cmd.phrase}&quot;
                            </span>
                            <span className="text-[7.5px] font-mono px-1 bg-black/60 text-[#00f3ff]/70 border border-[#00f3ff]/20 rounded uppercase">
                              {cmd.category}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {cmd.actionDesc}
                          </p>
                        </div>

                        <ChevronRight
                          size={12}
                          className={`text-slate-500 group-hover:text-[#00f3ff] transition-transform duration-250 self-center shrink-0 ${
                            isSelected ? "translate-x-1 text-[#00f3ff]" : ""
                          }`}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Dynamic Instruction Panel */}
              <div className="w-full md:w-[260px] p-4 bg-[#05091a]/80 backdrop-blur-md flex flex-col justify-between shrink-0 h-48 md:h-auto">
                <AnimatePresence mode="wait">
                  {selectedCommand ? (
                    <motion.div
                      key={selectedCommand.phrase}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex-1 flex flex-col justify-between"
                    >
                      {/* Top section details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-[#00f3ff]/10 text-[#00f3ff]">
                            {React.createElement(selectedCommand.icon, { size: 14 })}
                          </div>
                          <span className="text-xs font-black font-mono text-[#00f3ff] uppercase tracking-wider">
                            Directive Info
                          </span>
                        </div>

                        <div className="bg-black/60 p-2.5 rounded-lg border border-[#00f3ff]/20 font-mono">
                          <div className="text-[10px] text-[#00f3ff]/60 uppercase font-bold">Heard voice pattern:</div>
                          <div className="text-white text-xs font-black mt-0.5 tracking-wide">&quot;{selectedCommand.phrase}&quot;</div>
                        </div>

                        <p className="text-[10.5px] leading-relaxed text-slate-300 font-sans">
                          {selectedCommand.details}
                        </p>
                      </div>

                      {/* Launch direct test button */}
                      <button
                        onClick={() => {
                          onExecuteCommand(selectedCommand.phrase);
                          onClose();
                        }}
                        className="w-full py-2.5 mt-4 bg-gradient-to-r from-[#00f3ff] to-[#04bfcf] hover:from-[#40f8ff] hover:to-[#00f0ff] text-slate-900 hover:text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] glow-btn"
                      >
                        <Play size={10} className="fill-current" />
                        <span>Try Directive Now</span>
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-[9px] uppercase space-y-2">
                      <Terminal size={24} className="text-[#00f3ff]/20 animate-pulse" />
                      <span>Select any tactical code from the list to preview telemetry & execute commands.</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 sm:p-3.5 border-t border-[#00f3ff]/20 bg-[#040815] flex items-center justify-between shrink-0 text-[9px] font-mono text-slate-400">
              <span className="text-emerald-400/80 font-black uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Speech Synthesis Ready
              </span>
              <span>
                Say &quot;Jarvis [phrase]&quot; anytime
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

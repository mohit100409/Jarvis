import React, { useState } from "react";
import {
  HardDrive,
  FileSpreadsheet,
  Mail,
  Calendar,
  CheckSquare,
  Users,
  LogOut,
  ChevronRight,
  StickyNote,
  Video,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Globe,
  Radio,
  Copy,
  Check
} from "lucide-react";

interface GoogleWorkspaceDashboardProps {
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  gmail: string;
  username: string;
}

interface ServiceIntegration {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  description: string;
  samplePrompts: string[];
}

const WORKSPACE_SERVICES: ServiceIntegration[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    icon: Mail,
    color: "from-red-500/20 to-rose-600/10 border-red-500/30 text-red-400",
    description: "Read unread transmissions, draft replies, and dispatch secure emails via voice or chat.",
    samplePrompts: [
      "Jarvis, check my unread emails in Gmail",
      "Jarvis, draft an email to my team about tomorrow's update"
    ]
  },
  {
    id: "calendar",
    name: "Google Calendar",
    category: "Scheduling",
    icon: Calendar,
    color: "from-blue-500/20 to-cyan-600/10 border-blue-500/30 text-blue-400",
    description: "Schedule meetings, retrieve today's agenda, and manage synchronized calendar events.",
    samplePrompts: [
      "Jarvis, what is on my schedule today?",
      "Jarvis, schedule a team sync tomorrow at 3 PM on Calendar"
    ]
  },
  {
    id: "drive",
    name: "Google Drive & Docs",
    category: "Documents & Storage",
    icon: HardDrive,
    color: "from-amber-500/20 to-yellow-600/10 border-amber-500/30 text-amber-400",
    description: "Search documents, create formatted text files, and generate cloud documents on demand.",
    samplePrompts: [
      "Jarvis, create a new Google Doc with meeting notes",
      "Jarvis, search my Google Drive for project files"
    ]
  },
  {
    id: "sheets",
    name: "Google Sheets",
    category: "Data & Spreadsheets",
    icon: FileSpreadsheet,
    color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30 text-emerald-400",
    description: "Create spreadsheets, analyze tabular calculations, and inspect connected sheet matrix data.",
    samplePrompts: [
      "Jarvis, create a new budget spreadsheet in Google Sheets",
      "Jarvis, organize this table into a Google Sheet"
    ]
  },
  {
    id: "tasks",
    name: "Google Tasks",
    category: "Productivity",
    icon: CheckSquare,
    color: "from-indigo-500/20 to-violet-600/10 border-indigo-500/30 text-indigo-400",
    description: "Manage to-do lists, log urgent reminders, and cross off completed tasks seamlessly.",
    samplePrompts: [
      "Jarvis, add 'Review client proposal' to my Google Tasks",
      "Jarvis, show my pending tasks checklist"
    ]
  },
  {
    id: "keep",
    name: "Google Keep",
    category: "Notes & Memos",
    icon: StickyNote,
    color: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30 text-yellow-400",
    description: "Fast persistent scratchpad memos synced automatically with your cloud memory.",
    samplePrompts: [
      "Jarvis, save a quick note in Keep about project ideas",
      "Jarvis, read back my saved notes"
    ]
  },
  {
    id: "meet",
    name: "Google Meet",
    category: "Video Conferencing",
    icon: Video,
    color: "from-teal-500/20 to-emerald-600/10 border-teal-500/30 text-teal-400",
    description: "Generate instant Google Meet video conference links and register meetings on the fly.",
    samplePrompts: [
      "Jarvis, generate an instant Google Meet link",
      "Jarvis, schedule a video conference on Meet"
    ]
  },
  {
    id: "contacts",
    name: "Google Contacts",
    category: "Directory",
    icon: Users,
    color: "from-purple-500/20 to-fuchsia-600/10 border-purple-500/30 text-purple-400",
    description: "Look up phone numbers, email addresses, and synchronize verified contact books.",
    samplePrompts: [
      "Jarvis, find the contact details for Rahul",
      "Jarvis, save a new contact in my Google Contacts"
    ]
  }
];

export default function GoogleWorkspaceDashboard({
  token,
  onLogin,
  onLogout,
  gmail,
  username
}: GoogleWorkspaceDashboardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("gmail");

  const isConnected = !!(token || gmail);
  const activeEmail = gmail || "Connected Operator";

  const handleCopyPrompt = (prompt: string) => {
    try {
      navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (_) {}
  };

  return (
    <div id="google-workspace-hub" className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 md:p-6 shadow-lg backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Globe className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black tracking-widest text-cyan-400 uppercase font-mono drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]">
                  Google Workspace Integration Hub
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE SYNC ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed font-sans font-medium">
                Seamlessly connected with your Google Cloud Account. JARVIS executes actions directly across Gmail, Calendar, Drive, Docs, Sheets, Tasks, and Meet through natural voice and chat commands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {isConnected ? (
              <button
                id="btn-disconnect-workspace"
                onClick={onLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold tracking-widest uppercase text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-colors active:scale-95 outline-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                id="btn-connect-workspace"
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase font-mono text-slate-900 bg-cyan-400 hover:bg-cyan-300 border border-transparent shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-all active:scale-95 outline-none"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Connect Google Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Account Profile Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center font-bold font-mono text-slate-900 text-xs shadow-[0_0_10px_rgba(0,243,255,0.4)]">
              {(username || activeEmail || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-bold font-mono uppercase tracking-widest text-slate-200">{username || "Operator"}</div>
              <div className="text-[10px] font-mono tracking-wider text-cyan-400/90">{activeEmail}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              OAuth 2.0 Authenticated
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Chat & Voice Bridged
            </span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-white/10">
          <h3 className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-black flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,243,255,0.4)]">
            <Zap className="w-3.5 h-3.5" />
            Connected Google Services ({WORKSPACE_SERVICES.length})
          </h3>
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-slate-500">
            All services ready for prompt invocation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKSPACE_SERVICES.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedService === service.id;
            return (
              <div
                key={service.id}
                id={`workspace-card-${service.id}`}
                onClick={() => setSelectedService(service.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                    : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg border bg-gradient-to-br ${service.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>

                  <h4 className={`font-black font-mono tracking-wider text-[11px] uppercase mb-1 ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>{service.name}</h4>
                  <p className="text-[10px] font-sans font-medium text-slate-400 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[9px] font-mono font-bold tracking-widest uppercase ${isSelected ? "text-cyan-400 border-cyan-500/20" : "text-slate-500 border-white/5"}`}>
                  <span>View Commands</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Service Quick Command Assistant */}
      {selectedService && (() => {
        const activeSvc = WORKSPACE_SERVICES.find((s) => s.id === selectedService) || WORKSPACE_SERVICES[0];
        const SvcIcon = activeSvc.icon;
        return (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${activeSvc.color} shadow-inner`}>
                <SvcIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black font-mono tracking-widest uppercase text-xs text-white">{activeSvc.name} Assistant Guide</h4>
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                    {activeSvc.category}
                  </span>
                </div>
                <p className="text-[11px] font-sans font-medium text-slate-400 mt-1">
                  Talk to JARVIS via voice or type any of the following natural instructions in chat:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activeSvc.samplePrompts.map((prompt, idx) => {
                const isCopied = copiedPrompt === prompt;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/5 bg-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition-all group shadow-inner"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-mono text-cyan-100 group-hover:text-cyan-300 transition-colors">"{prompt}"</span>
                    </div>

                    <button
                      onClick={() => handleCopyPrompt(prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all active:scale-95 shrink-0 self-end sm:self-auto outline-none"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Requests are authenticated in real-time
              </span>
              <span className="text-cyan-500">
                Powered by JARVIS Intelligent Agent Core
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

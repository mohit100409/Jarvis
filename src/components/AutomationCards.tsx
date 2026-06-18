import React, { useState } from "react";
import { 
  Send, 
  Mail, 
  Check, 
  Clock, 
  Plus, 
  Trash2, 
  Sparkles, 
  Radio 
} from "lucide-react";

// Types
export interface MailItem {
  id: string;
  from: string;
  subject: string;
  body: string;
  time: string;
  read: boolean;
}

// 1. Message Composer Card
export function MessageComposerCard({ payload }: { payload?: any }) {
  const [recipient, setRecipient] = useState(payload?.to || "Alex (alex.shaw@stark-core.net)");
  const [message, setMessage] = useState(payload?.body || "Undergoing structural scan of outer atmospheric nodes. Stand by.");
  const [status, setStatus] = useState<"draft" | "sending" | "sent">("draft");
  const [useOAuth, setUseOAuth] = useState(false);

  const handleTransmit = () => {
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
    }, 2800);
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl border border-[#00f3ff]/35 bg-[#040c24]/80 text-white font-mono space-y-3 shadow-[0_0_15px_rgba(0,243,255,0.08)]">
      <div className="flex items-center justify-between border-b border-[#00f3ff]/20 pb-2">
        <span className="text-[9.5px] text-[#00f3ff] uppercase font-black tracking-widest flex items-center gap-1.5 animate-pulse">
          <Radio size={12} className="text-[#00f3ff]" />
          Outbound Communications Vector
        </span>
        <span className="text-[8px] opacity-50 bg-[#00f3ff]/10 text-[#00f3ff] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
          SMTP Portal
        </span>
      </div>

      {status === "draft" && (
        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[8.5px] uppercase font-bold text-[#00f3ff]/75">Recipient Address:</label>
            <input 
              type="text" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#020614] border border-[#00f3ff]/25 focus:border-[#00f3ff] text-[10.5px] rounded px-2.5 py-1 text-sky-200 outline-none leading-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8.5px] uppercase font-bold text-[#00f3ff]/75">Secure Payload Body:</label>
            <textarea 
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#020614] border border-[#00f3ff]/25 focus:border-[#00f3ff] text-[10.5px] rounded p-2 text-sky-200 outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[#00f3ff]/10">
            <span className="text-[8.5px] text-slate-300 font-bold uppercase leading-none">Bridge Google OAuth:</span>
            <button
              onClick={() => setUseOAuth(!useOAuth)}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                useOAuth ? "bg-[#00f3ff]" : "bg-slate-800"
              }`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                useOAuth ? "translate-x-3" : "translate-x-0"
              }`} />
            </button>
          </div>

          <button
            onClick={handleTransmit}
            className="w-full py-2 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-black font-black uppercase text-[10px] tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,195,255,0.2)]"
          >
            <Send size={11} className="stroke-[2.5]" />
            Authorize & Transmit Dispatch
          </button>
        </div>
      )}

      {status === "sending" && (
        <div className="py-4 space-y-3 text-center">
          <div className="relative w-8 h-8 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-[#00f3ff]/20 border-t-[#00f3ff] rounded-full animate-spin" />
            <Radio size={14} className="text-[#00f3ff] animate-ping" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-[#00f3ff] font-extrabold tracking-widest uppercase">TRANSMITTING SIGNAL WAVE</p>
            <p className="text-[8.5px] text-slate-400">Tunneling through satellite SMTP protocol nodes...</p>
          </div>
        </div>
      )}

      {status === "sent" && (
        <div className="py-3 px-2 border border-emerald-500/25 bg-emerald-950/25 rounded-lg space-y-2 text-center">
          <div className="w-7 h-7 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Check size={14} className="stroke-[3]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest leading-none">DISPATCH TRANSMITTED SUCCESSFULLY</p>
            <p className="text-[8px] text-zinc-400 leading-normal">
              Transaction Hash: <strong>STK-{Math.floor(Math.random() * 899 + 100)}-COM</strong> | Security Handshake: Verified
            </p>
          </div>
          <p className="text-[9px] text-emerald-300 leading-relaxed max-w-xs mx-auto pt-1.5 border-t border-emerald-950/40 font-mono">
            The signal was successfully broadcast to receptors. Encryption tunnels stable.
          </p>
        </div>
      )}
    </div>
  );
}

// 2. Email Box Card
export function EmailBoxCard() {
  const [emails, setEmails] = useState<MailItem[]>([
    {
      id: "m-1",
      from: "Google Cloud Platform <security@google.com>",
      subject: "Cognitive Application Credentials Verified",
      body: "Your Cloud Run deployment for JARVIS Multi-API Client Hub has successfully bypassed security checks. Traffic routing on Port 3000 verified. Session parameters: STABLE.",
      time: "Just Now",
      read: false
    },
    {
      id: "m-2",
      from: "Stark Industries Intelligence <tony@stark.com>",
      subject: "RE: Nano-particle Core Resonation Blueprint",
      body: "Mohit, look into the harmonic oscillation patterns of the latest titanium-alloy lattice. Resonation values on high frequencies need to be capped at 4.2 THz limit. Let Jarvis configure the simulation profiles.",
      time: "25M Ago",
      read: false
    },
    {
      id: "m-3",
      from: "Google AI Studio <build@aistudio.com>",
      subject: "Vite Project Live Build Report",
      body: "Vite structural compiler report: 0 compilation failures. Hot-module reloading deactivated. Client elements binding seamlessly to process.env parameters. Dynamic rotating keys online.",
      time: "1H Ago",
      read: true
    }
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRead = (id: string) => {
    setEmails(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteEmail = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEmails(prev => prev.filter(m => m.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl border border-[#00f3ff]/35 bg-[#040c24]/85 text-white font-mono space-y-3.5 shadow-[0_0_15px_rgba(0,243,255,0.08)]">
      <div className="flex items-center justify-between border-b border-[#00f3ff]/20 pb-2">
        <span className="text-[9.5px] text-[#00f3ff] uppercase font-black tracking-widest flex items-center gap-1.5">
          <Mail size={12} className="text-[#00f3ff]" />
          Secure Decrypted Inbox Stream
        </span>
        <span className="text-[8px] bg-[#00f3ff]/10 text-[#00f3ff] px-2 py-0.5 rounded uppercase font-bold">
          {emails.filter(m => !m.read).length} Unread
        </span>
      </div>

      <div className="space-y-2">
        {emails.length === 0 ? (
          <div className="text-center py-6 text-[9.5px] text-slate-500 uppercase">
            No active encrypted signals in inbox
          </div>
        ) : (
          emails.map((m) => (
            <div 
              key={m.id}
              onClick={() => toggleRead(m.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col gap-1.5 ${
                expandedId === m.id 
                  ? "bg-[#00f3ff]/10 border-[#00f3ff]" 
                  : m.read 
                    ? "bg-black/20 border-white/5 hover:border-white/10" 
                    : "bg-[#091838]/40 border-[#00f3ff]/20 hover:border-[#00f3ff]/45"
              }`}
            >
              {!m.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />
              )}
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black text-sky-200 truncate pr-5 uppercase tracking-wide">
                  {m.from.split(" <")[0]}
                </span>
                <span className="text-[8px] opacity-45 shrink-0 whitespace-nowrap">
                  {m.time}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <h4 className={`text-[10px] truncate leading-tight flex-1 ${!m.read ? "text-cyan-200 font-extrabold" : "text-white"}`}>
                  {m.subject}
                </h4>
                <button
                  type="button"
                  onClick={(e) => deleteEmail(e, m.id)}
                  className="p-1 opacity-45 hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0 cursor-pointer"
                  title="Archive signal"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {expandedId === m.id && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 text-[9.5px] leading-relaxed text-slate-300">
                  <p className="whitespace-pre-line select-text cursor-text">{m.body}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 4. Automation Rule Task Scheduler
interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "standby";
  count: number;
}

export function AutomationScheduleCard() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "rule-1",
      name: "Dialogue Cloud Database Backup Sync",
      trigger: "On chat dialogue session message dispatch",
      status: "active",
      count: 14
    },
    {
      id: "rule-2",
      name: "Automatic Cache Garbage Purge Profile",
      trigger: "Every Sunday at 00:00 UTC clock cycle",
      status: "active",
      count: 2
    },
    {
      id: "rule-3",
      name: "Cognitive Load Monitor Rescale Telemetry",
      trigger: "When device hosting memory exceeds 80%",
      status: "standby",
      count: 0
    }
  ]);

  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("Every Hour");
  const [isAdding, setIsAdding] = useState(false);

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: newName.trim(),
      trigger: newTrigger,
      status: "active",
      count: 0
    };

    setRules(prev => [...prev, newRule]);
    setNewName("");
    setIsAdding(false);
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "active" ? "standby" : "active" } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl border border-[#00f3ff]/35 bg-[#040c24]/85 text-white font-mono space-y-3.5 shadow-[0_0_15px_rgba(0,243,255,0.08)]">
      <div className="flex items-center justify-between border-b border-[#00f3ff]/20 pb-2">
        <span className="text-[9.5px] text-[#00f3ff] uppercase font-black tracking-widest flex items-center gap-1.5 font-bold">
          <Sparkles size={12} className="text-[#00f3ff]" />
          Robot Command Automation System
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-2 py-0.5 border border-[#00f3ff]/30 text-[#00f3ff] hover:text-white hover:border-[#00f3ff] bg-[#00f3ff]/5 text-[8.5px] rounded uppercase font-bold font-mono transition-colors cursor-pointer"
        >
          {isAdding ? "Cancel" : "Add Task"}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={addRule} className="p-3 bg-black/40 rounded-lg border border-[#00f3ff]/10 space-y-3.5">
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-wider text-white/70 block font-bold">Automation Task Name:</label>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sync Notes with Stark Servers"
              className="w-full bg-[#03081a] border border-[#00f3ff]/25 focus:border-[#00f3ff] rounded p-1.5 text-xs text-sky-200 outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-wider text-white/70 block font-bold">Execution Trigger Event:</label>
            <select
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              className="w-full bg-[#03081a] border border-[#00f3ff]/25 focus:border-[#00f3ff] rounded p-1.5 text-xs text-sky-200 outline-none cursor-pointer"
            >
              <option value="Every Hour">Every Hour (Continuous Cycle)</option>
              <option value="Daily at Midnight">Daily at Midnight (00:00 UTC)</option>
              <option value="When Voice Session Starts">On Background Speech Wakeup</option>
              <option value="Weekly Sync Sequence">Weekly Core Calibration</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-[#00f3ff]/15 hover:bg-[#00f3ff]/25 border border-[#00f3ff] text-[#00f3ff] rounded text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            Register Automation Core
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div 
              key={r.id}
              className={`p-2.5 rounded-lg border text-left flex flex-col gap-1.5 transition-all duration-200 ${
                r.status === "active" 
                  ? "bg-[#091838]/20 border-[#00f3ff]/15" 
                  : "bg-black/20 border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`text-[10px] font-bold flex-1 tracking-wide ${r.status === "active" ? "text-cyan-200" : "text-stone-400"}`}>
                  {r.name}
                </span>

                <button
                  type="button"
                  onClick={() => toggleRule(r.id)}
                  className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                    r.status === "active" ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                  title={r.status === "active" ? "Deactivate" : "Activate"}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-all ${
                    r.status === "active" ? "translate-x-3 shadow-md" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[8px] opacity-65 border-t border-white/[0.04] pt-1.5">
                <span>Trigger: <strong>{r.trigger}</strong></span>
                <span className="shrink-0 flex items-center gap-1">
                  <span>Runs: <strong>{r.count}</strong></span>
                  <button 
                    type="button"
                    onClick={() => deleteRule(r.id)}
                    className="p-0.5 hover:text-red-400 text-slate-500 rounded cursor-pointer transition-colors"
                    title="Delete automation"
                  >
                    <Trash2 size={8} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

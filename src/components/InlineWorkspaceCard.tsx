import React, { useState } from "react";
import { 
  Sparkles, 
  Video, 
  Code, 
  Download, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  FileText, 
  Monitor, 
  ArrowRight,
  RefreshCw,
  Plus
} from "lucide-react";
import { Message } from "../types";

interface InlineWorkspaceCardProps {
  message: Message;
  setAttachedFile: (file: string | null) => void;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const InlineWorkspaceCard: React.FC<InlineWorkspaceCardProps> = ({ 
  message, 
  setAttachedFile,
  setMessages: _setMessages 
}) => {
  const { 
    generationType, 
    generationStatus, 
    generationPrompt, 
    generationResultUrl,
    videoDuration,
    videoMotion,
    canvasCodeText,
    canvasWritingText,
    canvasSlides 
  } = message;

  // Local state for Canvas sub-tabs
  const [activeCanvasTab, setActiveCanvasTab] = useState<"coding" | "writing" | "slides">("coding");
  
  // Local state for slide presenting
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Big screen Slide Projector Lightbox Mode
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [projectorIndex, setProjectorIndex] = useState(0);
  
  // Success copy feedback state
  const [copiedCodeStr, setCopiedCodeStr] = useState(false);
  const [copiedWriteStr, setCopiedWriteStr] = useState(false);
  
  // Slide Export Success flow
  const [isSlidesExported, setIsSlidesExported] = useState(false);

  if (generationStatus === "generating") {
    return (
      <div className="w-full max-w-xl bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-6 flex flex-col items-center justify-center my-4 relative overflow-hidden backdrop-blur-md">
        
        {/* Premium Neon Spinning Halo */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#00f3ff]/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-t-2 border-[#00f3ff] animate-spin" />
          {generationType === "image" && <Sparkles className="text-[#00f3ff] absolute animate-pulse" size={24} />}
          {generationType === "video" && <Video className="text-[#00f3ff] absolute animate-pulse" size={24} />}
          {generationType === "canvas" && <Code className="text-[#00f3ff] absolute animate-pulse" size={24} />}
        </div>

        {/* Loading Logs Tracing */}
        <div className="text-center">
          <h4 className="text-xs font-bold font-mono tracking-widest text-slate-200 uppercase mb-1">
            JARVIS Assembly Engaged
          </h4>
          <p className="text-[10px] font-mono text-cyan-400/70 animate-pulse">
            {generationType === "image" && "Formatting spatial vectors & cinematic style filters..."}
            {generationType === "video" && "Synthesizing dynamic camera motion profiles..."}
            {generationType === "canvas" && "Configuring coding compiler, editorial workspace, and slide templates..."}
          </p>
        </div>
      </div>
    );
  }

  if (generationStatus !== "success") return null;

  // 1. FAST IMAGE GENERATION DISPLAY BOARD
  if (generationType === "image") {
    return (
      <div className="w-full max-w-xl bg-gradient-to-br from-[#060b1e]/90 to-[#020512]/95 border-2 border-cyan-500/30 rounded-[24px] p-5 my-3 relative overflow-hidden text-left flex flex-col gap-4 font-sans backdrop-blur-md">
        
        {/* Dynamic Image Canvas Box */}
        <div className="relative group overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/60 aspect-video flex items-center justify-center">
          <img 
            src={generationResultUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"} 
            alt="AI Compiled Layer" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Dark Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <button 
              onClick={() => {
                if (generationResultUrl) {
                  setAttachedFile(generationResultUrl);
                  alert("Asset attached to message chat input successfully!");
                }
              }}
              className="px-3 py-1.5 bg-[#00f3ff] hover:bg-[#00d8e6] text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus size={12} strokeWidth={2.5} />
              Attach to Chat
            </button>
            <a 
              href={generationResultUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-all active:scale-90"
              title="Download High-Res"
            >
              <Download size={14} />
            </a>
          </div>
        </div>

        {/* Prompt details panel */}
        <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-3">
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold mb-1">
            Prompt Specification:
          </p>
          <p className="text-xs font-sans text-slate-200 italic leading-snug">
            "{generationPrompt}"
          </p>
        </div>
      </div>
    );
  }

  // 2. VIDEO GENERATION DISPLAY BOARD
  if (generationType === "video") {
    return (
      <div className="w-full max-w-xl bg-gradient-to-br from-[#060b1e]/90 to-[#020512]/95 border-2 border-cyan-500/30 rounded-[24px] p-5 my-3 relative overflow-hidden text-left flex flex-col gap-4 font-sans backdrop-blur-md">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Video size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black font-sans uppercase tracking-widest text-[#00f3ff]">
                Video Generation
              </h3>
              <p className="text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest mt-0.5">
                Motion Synthesis Engine
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-cyan-950/50 text-cyan-400 rounded-full border border-cyan-800/30 font-black">
            {videoDuration || "4s"} • {videoMotion || "Cinematic Orbit"}
          </span>
        </div>

        {/* Dynamic Video Player */}
        <div className="relative group overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/70 aspect-video">
          <video 
            src={generationResultUrl || "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4"}
            autoPlay 
            loop 
            muted 
            playsInline
            controls
            className="w-full h-full object-cover rounded-xl"
          />
        </div>

        {/* Prompt detail panel */}
        <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-3">
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold mb-1">
            Motion Specification:
          </p>
          <p className="text-xs font-sans text-slate-200 italic leading-snug">
            "{generationPrompt}"
          </p>
        </div>

        {/* Interactions */}
        <div className="flex gap-2">
          <a
            href={generationResultUrl}
            download="jarvis-video.mp4"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 bg-[#00f3ff] hover:bg-[#00d8e6] text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-md"
          >
            <Download size={13} />
            Download MP4 (High-Res)
          </a>
          
          <button 
            type="button"
            onClick={() => {
              alert("Synthesizing dynamic revision parameter sequence - processing pipeline re-allocated in chat background.");
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <RefreshCw size={13} />
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  // 3. CANVAS WORKSPACE INTEGRATION BOARD
  // Includes Coding, Writing, & Presentations Slide Layout Dashboard Nested Right Inside Message!
  return (
    <div className="w-full max-w-xl bg-gradient-to-br from-[#060b1e]/95 to-[#020512]/98 border-2 border-[#00f3ff]/30 rounded-[28px] p-5 my-4 relative overflow-hidden text-left flex flex-col gap-4 font-sans backdrop-blur-md">
      
      {/* Header and Control Tabs Block */}
      <div className="flex flex-col gap-3 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00f3ff]/15 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center">
              <Code size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black font-sans uppercase tracking-widest text-[#00f3ff]">
                Canvas Document
              </h3>
              <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                Integrated Interactive Workspace
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-cyan-950/40 text-cyan-300 rounded-full border border-cyan-800/30">
            Real-time Sync
          </span>
        </div>

        {/* 3 Nav Tabs matching user's layout perfectly */}
        <div className="grid grid-cols-3 gap-1 bg-black/40 border border-cyan-500/20 rounded-xl p-1">
          <button
            onClick={() => setActiveCanvasTab("coding")}
            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCanvasTab === "coding"
                ? "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code size={12} />
            Coding
          </button>
          <button
            onClick={() => setActiveCanvasTab("writing")}
            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCanvasTab === "writing"
                ? "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText size={12} />
            Writing
          </button>
          <button
            onClick={() => setActiveCanvasTab("slides")}
            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCanvasTab === "slides"
                ? "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor size={12} />
            Present Slides
          </button>
        </div>
      </div>

      {/* Dynamic Content Panel View */}
      <div className="min-h-[220px] max-h-[380px] bg-black/45 border border-cyan-500/20 rounded-2xl overflow-y-auto p-4 relative scrollbar-thin">
        
        {/* TAB 1: CODING WORKSPACE VIEW */}
        {activeCanvasTab === "coding" && (
          <div className="flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between bg-slate-950/80 px-3 py-1.5 rounded-lg border border-cyan-500/20 text-[10px] text-slate-400">
              <span>server.ts</span>
              <button
                onClick={() => {
                  if (canvasCodeText) {
                    navigator.clipboard.writeText(canvasCodeText);
                    setCopiedCodeStr(true);
                    setTimeout(() => setCopiedCodeStr(false), 2000);
                  }
                }}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedCodeStr ? <Check size={12} className="text-[#00f3ff]" /> : <Copy size={12} />}
                {copiedCodeStr ? "Copied" : "Copy Source"}
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed text-slate-300 bg-black/50 p-3 rounded-xl overflow-x-auto border border-cyan-500/10 font-mono">
              <code>{canvasCodeText || "// Compilation failed or no text generated."}</code>
            </pre>
          </div>
        )}

        {/* TAB 2: WRITING EXTEMPORE VIEW */}
        {activeCanvasTab === "writing" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/80 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
              <span className="font-mono">document.md</span>
              <button
                onClick={() => {
                  if (canvasWritingText) {
                    navigator.clipboard.writeText(canvasWritingText);
                    setCopiedWriteStr(true);
                    setTimeout(() => setCopiedWriteStr(false), 2000);
                  }
                }}
                className="hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedWriteStr ? <Check size={12} className="text-cyan-400" /> : <Copy size={12} />}
                {copiedWriteStr ? "Copied" : "Copy Prose"}
              </button>
            </div>
            
            {/* Elegant notebook margins text container */}
            <div className="p-1 prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans space-y-4">
              <h2 className="text-sm font-bold border-b border-cyan-500/20 pb-1.5 text-cyan-400">
                JARVIS Notebook Draft
              </h2>
              <div className="whitespace-pre-wrap leading-relaxed">
                {canvasWritingText || "Document prose currently building..."}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SLIDES PRESENTATION VIEW */}
        {activeCanvasTab === "slides" && (
          <div className="flex flex-col gap-4">
            {/* Slide Box Preview Card */}
            {canvasSlides && canvasSlides.length > 0 ? (
              <div className="flex flex-col gap-3">
                {/* Active Slide Sheet */}
                <div className="aspect-video bg-slate-950/90 border-2 border-cyan-500/30 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
                  
                  {/* Neon slide dot and spec badge */}
                  <div className="absolute top-3 right-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black">
                      Slide {currentSlideIndex + 1} of {canvasSlides.length}
                    </span>
                  </div>

                  {/* Slide Content */}
                  <div className="flex flex-col gap-2 pt-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-100 border-b border-cyan-500/20 pb-1 mr-12 text-left">
                      {canvasSlides[currentSlideIndex].title}
                    </h3>
                    <ul className="list-disc pl-4 space-y-1.5 text-left text-[10px] text-slate-300 mt-1">
                      {canvasSlides[currentSlideIndex].bullets.map((bullet, idx) => (
                        <li key={idx} className="leading-snug">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Slide Branding footer */}
                  <div className="text-[7.5px] font-mono tracking-wider text-slate-500 flex justify-between uppercase mt-2">
                    <span>JARVIS Presentation Layer</span>
                    <span>Systems Compiled</span>
                  </div>
                </div>

                {/* Slides Navigator */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                      className="w-8 h-8 rounded-full bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 text-slate-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex(prev => Math.min(canvasSlides.length - 1, prev + 1))}
                      disabled={currentSlideIndex === canvasSlides.length - 1}
                      className="w-8 h-8 rounded-full bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 text-slate-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setProjectorIndex(currentSlideIndex);
                        setIsProjectorOpen(true);
                      }}
                      className="ml-1 px-2.5 h-8 rounded-lg bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-[9px] font-black uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                      title="Present Slides in Fullscreen Projector"
                    >
                      <Monitor size={11} />
                      Fullscreen
                    </button>
                  </div>

                  {/* Elegant micro slide circles index */}
                  <div className="flex gap-1.5">
                    {canvasSlides.map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          idx === currentSlideIndex ? "w-4 bg-[#00f3ff]" : "w-1 bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500">No presentation slides configured in compiler.</p>
            )}
          </div>
        )}
      </div>

      {/* Action triggers bottom bar */}
      <div className="flex items-center gap-2 border-t border-cyan-500/20 pt-3">
        {activeCanvasTab === "slides" ? (
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => {
                setProjectorIndex(currentSlideIndex);
                setIsProjectorOpen(true);
              }}
              className="flex-1 py-2.5 bg-[#00f3ff] hover:bg-[#00d8e6] text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Monitor size={13} strokeWidth={2.5} />
              Open Presentation Link
            </button>
            <button
              onClick={() => {
                setIsSlidesExported(true);
                setTimeout(() => setIsSlidesExported(false), 2400);
              }}
              className="px-3 py-2.5 bg-slate-900 border border-cyan-500/30 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Send to Google Slides"
            >
              {isSlidesExported ? <Check size={12} className="text-cyan-400" /> : <ArrowRight size={12} />}
              <span>Sync Google</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const textToCopy = activeCanvasTab === "coding" ? canvasCodeText : canvasWritingText;
              if (textToCopy) {
                navigator.clipboard.writeText(textToCopy);
                alert(`${activeCanvasTab === "coding" ? "Code" : "Document text"} copied to clipboard!`);
              }
            }}
            className="flex-1 py-2.5 bg-[#00f3ff] hover:bg-[#00d8e6] text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            Copy Current Document
          </button>
        )}
        
        <button
          onClick={() => {
            alert("Workspace active pipeline synchronization completed successfully.");
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Check Sync
        </button>
      </div>

      {/* Cinematic Fullscreen Presentation Projector Overlay */}
      {isProjectorOpen && canvasSlides && canvasSlides.length > 0 && (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-6 sm:p-12 text-white font-sans overflow-hidden animate-in fade-in duration-300">
          
          {/* Header controls */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
                <Monitor size={18} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#00f3ff]">
                  JARVIS Cinematic Projector
                </h2>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none mt-1">
                  Active Presentation: {generationPrompt}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsProjectorOpen(false)}
              className="p-2.5 rounded-full bg-slate-900 border border-cyan-500/30 hover:bg-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90 flex items-center justify-center"
              title="Close System Projector"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Slide Stage */}
          <div className="flex-1 flex items-center justify-center py-6">
            <div className="w-full max-w-4xl aspect-[16/10] bg-slate-950/80 border-2 border-[#00f3ff]/30 rounded-[32px] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Subtle tech grid lines in background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
              
              {/* Slide Counter Info Badge */}
              <div className="absolute top-6 right-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-extrabold bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-full">
                  Slide {projectorIndex + 1} of {canvasSlides.length}
                </span>
              </div>

              {/* Main Text Content */}
              <div className="flex flex-col gap-6 text-left max-w-3xl">
                <h1 className="text-xl sm:text-3xl font-black font-mono tracking-tight text-white border-b border-cyan-500/20 pb-3 uppercase pr-20 leading-tight">
                  {canvasSlides[projectorIndex].title}
                </h1>
                
                <ul className="space-y-4 sm:space-y-6 text-left pl-2 mt-4">
                  {canvasSlides[projectorIndex].bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-sm sm:text-lg text-slate-200 font-sans leading-relaxed animate-in slide-in-from-left-4 duration-300 delay-75">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-500 border-t border-cyan-500/20 pt-4 uppercase">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" /> JARVIS NEURAL SYNTAX</span>
                <span>GLOBAL COMPILATION MATRIX</span>
              </div>
            </div>
          </div>

          {/* Bottom Controls Panel */}
          <div className="flex items-center justify-between border-t border-cyan-500/20 pt-4 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setProjectorIndex(prev => Math.max(0, prev - 1))}
                disabled={projectorIndex === 0}
                className="px-5 py-3 rounded-2xl bg-slate-900 border border-cyan-500/20 text-slate-300 hover:text-white disabled:opacity-20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider font-mono">Previous</span>
              </button>
              
              <button
                onClick={() => setProjectorIndex(prev => Math.min(canvasSlides.length - 1, prev + 1))}
                disabled={projectorIndex === canvasSlides.length - 1}
                className="px-5 py-3 rounded-2xl bg-slate-900 border border-cyan-500/20 text-slate-300 hover:text-white disabled:opacity-20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:pointer-events-none"
              >
                <span className="text-[11px] font-black uppercase tracking-wider font-mono">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Middle Slide indicator dots */}
            <div className="hidden sm:flex gap-2">
              {canvasSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setProjectorIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === projectorIndex ? "w-8 bg-[#00f3ff]" : "w-2.5 bg-slate-800 hover:bg-slate-700"
                  }`}
                  title={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setIsProjectorOpen(false)}
              className="px-6 py-3 rounded-2xl bg-rose-600/10 border border-rose-500/30 text-rose-400 hover:bg-rose-600/20 text-[11px] font-black uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95"
            >
              Exit Projector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

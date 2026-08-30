import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Youtube,
  Globe,
  Scan,
  ExternalLink,
  X,
  Cpu,
  Eye,
  Activity,
  Maximize2,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// 1. PDF READING & ANALYSIS ANIMATION
// ==========================================
export interface PDFAnalysisProps {
  fileName?: string;
  pageCount?: number;
  isProcessing?: boolean;
  statusText?: string;
  onCancel?: () => void;
}

export function PDFAnalysisAnimation({
  fileName = "document.pdf",
  pageCount = 3,
  isProcessing = true,
  statusText = "Extracting semantic tokens & OCR structure...",
  onCancel,
}: PDFAnalysisProps) {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Reading binary stream & metadata headers",
    "Parsing vector fonts & LaTeX equations",
    "Extracting semantic sections & tables",
    "Generating high-fidelity neural summary"
  ];

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isProcessing, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-[#0c0512]/90 via-[#0a0f24]/90 to-[#03091e]/90 p-4 shadow-2xl backdrop-blur-xl max-w-lg w-full my-2 text-slate-100"
    >
      {/* Laser Scanner Line traversing document */}
      <motion.div
        animate={{ y: ["-10%", "280%"] }}
        transition={{
          repeat: Infinity,
          duration: 2.4,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-0 right-0 top-0 h-16 bg-gradient-to-b from-transparent via-red-500/20 to-transparent z-10"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-400 to-transparent shadow-[0_0_12px_#ef4444]" />
      </motion.div>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3 relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <FileText size={18} className="animate-pulse" />
            <motion.span
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-black shadow-[0_0_8px_#ef4444]"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold tracking-widest text-red-400 uppercase">
                PDF NEURAL PARSER
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-red-500/20 text-red-300 font-mono">
                {isProcessing ? "SCANNING" : "SYNTHESIZED"}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold truncate text-white">
              {fileName}
            </h4>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Holographic Document Layout Blueprint Animation */}
      <div className="relative rounded-xl border border-white/10 bg-black/40 p-3 overflow-hidden mb-3">
        <div className="grid grid-cols-12 gap-2 relative z-10">
          {/* Animated Page Thumbnails / Slices */}
          {Array.from({ length: Math.min(pageCount, 3) }).map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="col-span-4 rounded-lg bg-slate-900/90 border border-red-500/20 p-2 flex flex-col gap-1.5 relative overflow-hidden"
            >
              {/* Animated text skeletons representing OCR recognition */}
              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: idx * 0.2 }}
                className="h-1.5 w-3/4 rounded bg-red-400/40"
              />
              <div className="h-1 w-full rounded bg-slate-700/60" />
              <div className="h-1 w-5/6 rounded bg-slate-700/60" />
              <div className="h-1 w-2/3 rounded bg-slate-700/60" />

              {/* Formula detection highlight */}
              <motion.div
                animate={{
                  borderColor: ["rgba(239,68,68,0.2)", "rgba(0,243,255,0.6)", "rgba(239,68,68,0.2)"],
                  backgroundColor: ["rgba(239,68,68,0.05)", "rgba(0,243,255,0.1)", "rgba(239,68,68,0.05)"]
                }}
                transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
                className="mt-1 h-3 w-full rounded border border-dashed flex items-center justify-between px-1"
              >
                <span className="text-[6.5px] font-mono text-cyan-300">LaTeX $\int$</span>
                <span className="text-[6px] font-mono text-emerald-400">99.4%</span>
              </motion.div>

              <span className="text-[7.5px] font-mono text-slate-400 mt-auto text-right">
                P.{idx + 1}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Floating Scanner Nodes */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:12px_12px] opacity-15" />
      </div>

      {/* Progress Status Ticker */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full shrink-0"
          />
          <span className="truncate text-red-300">
            {steps[activeStep] || statusText}
          </span>
        </div>
        <span className="text-slate-400 font-bold shrink-0 ml-2">
          {Math.round(((activeStep + 1) / steps.length) * 100)}%
        </span>
      </div>

      {/* Animated Bottom Progress Line */}
      <div className="w-full bg-slate-800/80 rounded-full h-1 mt-2.5 overflow-hidden">
        <motion.div
          animate={{
            width: [`${((activeStep) / steps.length) * 100}%`, `${((activeStep + 1) / steps.length) * 100}%`]
          }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-red-500 via-rose-400 to-cyan-400 shadow-[0_0_8px_#ef4444]"
        />
      </div>
    </motion.div>
  );
}


// ==========================================
// 2. PHOTO & IMAGE VISION SCANNER ANIMATION
// ==========================================
export interface PhotoAnalysisScannerProps {
  imageUrl?: string;
  isScanning?: boolean;
  label?: string;
  detectedObjects?: { name: string; confidence: string; box?: { top: number; left: number; width: number; height: number } }[];
  onOpenViewer?: () => void;
}

export function PhotoAnalysisScanner({
  imageUrl,
  isScanning = true,
  label = "Neural Vision Matrix",
  detectedObjects = [
    { name: "PRIMARY SUBJECT", confidence: "99.4%", box: { top: 20, left: 25, width: 50, height: 55 } },
    { name: "TEXT // OCR", confidence: "98.7%", box: { top: 78, left: 15, width: 70, height: 18 } }
  ],
  onOpenViewer,
}: PhotoAnalysisScannerProps) {
  const [scanMode, setScanMode] = useState<"standard" | "thermal" | "wireframe">("standard");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl border border-[#00f3ff]/40 bg-[#040816]/95 shadow-[0_0_25px_rgba(0,243,255,0.15)] backdrop-blur-2xl max-w-md w-full my-2 select-none"
    >
      {/* Top HUD Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#00f3ff]/20 bg-black/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#00f3ff] uppercase flex items-center gap-1">
            <Eye size={12} className="text-[#00f3ff]" />
            {label}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1">
          {(["standard", "thermal", "wireframe"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all ${
                scanMode === mode
                  ? "bg-[#00f3ff] text-black shadow-[0_0_8px_#00f3ff]"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
          {onOpenViewer && (
            <button
              onClick={onOpenViewer}
              className="p-1 text-slate-400 hover:text-[#00f3ff] transition-colors ml-1"
              title="Maximize scan view"
            >
              <Maximize2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Image Viewport with HUD Overlays */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Analysis target"
            className={`w-full h-full object-cover transition-all duration-500 ${
              scanMode === "thermal"
                ? "hue-rotate-180 saturate-200 contrast-150"
                : scanMode === "wireframe"
                ? "invert contrast-200 grayscale"
                : ""
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
            <Scan size={36} className="text-[#00f3ff]/40 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Awaiting Optical Stream
            </span>
          </div>
        )}

        {/* Animated Cyber Grid Matrix */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(0,243,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,243,255,0.06)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* High Precision Corner Reticles */}
        <div className="absolute inset-2 pointer-events-none">
          {/* Top Left */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
          />
          {/* Top Right */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
          />
          {/* Bottom Left */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
          />
          {/* Bottom Right */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
          />
        </div>

        {/* Sweeping Laser Scan Beam */}
        {isScanning && (
          <motion.div
            animate={{ y: ["-10%", "190%"] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-transparent via-[#00f3ff]/25 to-transparent z-10"
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent shadow-[0_0_15px_#00f3ff]" />
          </motion.div>
        )}

        {/* Dynamic Object Recognition Bounding Boxes */}
        {isScanning && detectedObjects.map((obj, i) => {
          const box = obj.box || { top: 25 + i * 20, left: 20 + i * 15, width: 45, height: 40 };
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.7, 1, 0.7], scale: 1 }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
              className="absolute pointer-events-none border border-[#00f3ff] bg-[#00f3ff]/10 rounded-sm"
              style={{
                top: `${box.top}%`,
                left: `${box.left}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {/* Object Tag Tagline */}
              <div className="absolute -top-4 left-0 bg-black/80 border border-[#00f3ff]/60 px-1 py-0.2 rounded text-[7.5px] font-mono text-[#00f3ff] flex items-center gap-1 shadow-md whitespace-nowrap">
                <span className="font-bold">{obj.name}</span>
                <span className="text-emerald-400 font-bold">{obj.confidence}</span>
              </div>
            </motion.div>
          );
        })}

        {/* Center Optical Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-[#00f3ff]/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]" />
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Metrics Bar */}
      <div className="px-3 py-2 bg-slate-950/90 border-t border-[#00f3ff]/15 flex items-center justify-between text-[8.5px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-[#00f3ff] flex items-center gap-1">
            <Activity size={10} className="animate-pulse" />
            LIVE RES: 1080P
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">FPS: 60</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-200">LAYERS: 128</span>
        </div>

        {/* Live Audio/Frequency equalizer animation */}
        <div className="flex items-end gap-0.5 h-3">
          {[8, 14, 6, 12, 16, 9, 13, 7].map((height, idx) => (
            <motion.div
              key={idx}
              animate={{ height: [height * 0.3, height, height * 0.4] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: idx * 0.1 }}
              className="w-1 bg-[#00f3ff] rounded-xs"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}


// ==========================================
// 3. YOUTUBE SEARCH & STREAM ANIMATION
// ==========================================
export interface YouTubeSearchCardProps {
  query: string;
  onDismiss?: () => void;
}

export function YouTubeSearchEnhancedCard({ query, onDismiss }: YouTubeSearchCardProps) {
  const handleOpen = () => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="mt-3 relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-br from-[#12050c]/95 via-[#080d21]/95 to-[#040816]/95 p-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] backdrop-blur-2xl max-w-[430px] w-full"
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all z-20 cursor-pointer"
          title="Dismiss card"
        >
          <X size={13} />
        </button>
      )}

      {/* Card Header with Glowing YouTube Hub */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="relative w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)] shrink-0 overflow-hidden">
          <Youtube size={22} className="stroke-[2.2] relative z-10" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/30 to-transparent"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold tracking-widest text-red-400 uppercase">
              YOUTUBE MEDIA FEED
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <h4 className="text-white text-xs sm:text-sm font-semibold truncate leading-tight mt-0.5">
            Synchronized Stream Protocol
          </h4>
        </div>
      </div>

      {/* Parameter Box with Equalizer Wave */}
      <div className="my-3 rounded-xl border border-red-500/20 bg-black/50 p-3 flex flex-col gap-1.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono text-red-400/80 uppercase tracking-widest font-bold">
            SEARCH INGESTION:
          </span>
          {/* Animated Visualizer Spectrum */}
          <div className="flex items-end gap-0.5 h-2.5">
            {[4, 8, 12, 6, 10, 5, 9, 3].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: [h * 0.4, h, h * 0.3] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.08 }}
                className="w-0.5 bg-red-400 rounded-full"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-100 font-medium font-sans italic leading-relaxed">
          "{query}"
        </p>
      </div>

      {/* Action Launch Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_28px_rgba(239,68,68,0.7)] cursor-pointer"
      >
        <Youtube size={16} className="stroke-[2.5]" />
        <span>CONNECT TO YOUTUBE STREAM</span>
        <ExternalLink size={13} className="ml-0.5 opacity-80" />
      </motion.button>
    </motion.div>
  );
}


// ==========================================
// 4. BROWSER & WEB SEARCH ANIMATION
// ==========================================
export interface BrowserSearchCardProps {
  url: string;
  title?: string;
  onDismiss?: () => void;
}

export function BrowserSearchEnhancedCard({ url, title, onDismiss }: BrowserSearchCardProps) {
  const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  const displayTitle = title || url.replace(/^https?:\/\/(www\.)?/, "");

  const handleOpen = () => {
    window.open(formattedUrl, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="mt-3 relative overflow-hidden rounded-2xl border border-[#00f3ff]/40 bg-gradient-to-br from-[#020b1f]/95 via-[#06122d]/95 to-[#040816]/95 p-4 shadow-[0_0_30px_rgba(0,243,255,0.15)] backdrop-blur-2xl max-w-[430px] w-full"
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-white/5 transition-all z-20 cursor-pointer"
          title="Dismiss card"
        >
          <X size={13} />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="relative w-11 h-11 rounded-xl bg-[#00f3ff]/15 border border-[#00f3ff]/50 flex items-center justify-center text-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.3)] shrink-0 overflow-hidden">
          <Globe size={22} className="stroke-[2.2] animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#00f3ff]/20 to-transparent"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#00f3ff] uppercase">
              WEB ROUTE SECURED
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
          </div>
          <h4 className="text-white text-xs sm:text-sm font-semibold truncate leading-tight mt-0.5">
            {displayTitle}
          </h4>
        </div>
      </div>

      {/* Route URI Data Box */}
      <div className="my-3 rounded-xl border border-[#00f3ff]/20 bg-black/50 p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-mono text-[#00f3ff]/80 uppercase tracking-widest font-bold">
            REMOTE ENDPOINT URI:
          </span>
          <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={9} /> TLS 1.3
          </span>
        </div>
        <p className="text-xs text-slate-200 font-mono truncate">
          {formattedUrl}
        </p>
      </div>

      {/* Launch Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase transition-all duration-300 text-black bg-gradient-to-r from-[#00f3ff] via-[#38bdf8] to-[#00e5ff] shadow-[0_0_20px_rgba(0,243,255,0.35)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] cursor-pointer"
      >
        <ExternalLink size={15} className="stroke-[2.5]" />
        <span>LAUNCH EXTERNAL WEB ROUTE</span>
      </motion.button>
    </motion.div>
  );
}


// ==========================================
// 5. JARVIS CONTEXTUAL GENERATING / THINKING ANIMATION
// ==========================================
export interface JarvisGeneratingStatusProps {
  queryPrompt?: string;
  intent?: "general" | "pdf" | "image" | "youtube" | "web_search";
}

export function JarvisGeneratingStatus({
  intent = "general",
  queryPrompt = ""
}: JarvisGeneratingStatusProps) {
  // Determine intent from text if not explicitly provided
  let activeIntent = intent;
  if (intent === "general" && queryPrompt) {
    const p = queryPrompt.toLowerCase();
    if (p.includes("youtube") || p.includes("video") || p.includes("song") || p.includes("play")) {
      activeIntent = "youtube";
    } else if (p.includes("pdf") || p.includes("document") || p.includes("notes")) {
      activeIntent = "pdf";
    } else if (p.includes("image") || p.includes("photo") || p.includes("picture") || p.includes("look") || p.includes("see")) {
      activeIntent = "image";
    } else if (p.includes("search") || p.includes("google") || p.includes("news") || p.includes("latest") || p.includes("weather") || p.includes("who") || p.includes("what")) {
      activeIntent = "web_search";
    }
  }

  const intentPhrases = {
    pdf: [
      "Extracting structural tables & mathematics...",
      "Running deep OCR context analysis...",
      "Synthesizing document hierarchy...",
      "Loading high-density textual matrices..."
    ],
    image: [
      "Detecting biometric features & objects...",
      "Scanning optical matrix composition...",
      "Cross-referencing visual databases...",
      "Applying multi-layered spatial filters..."
    ],
    youtube: [
      "Querying multimedia video endpoints...",
      "Analyzing audio channel spectrograms...",
      "Indexing stream metadata & captions...",
      "Synchronizing playback telemetry..."
    ],
    web_search: [
      "Scanning real-time intelligence feeds...",
      "Establishing global satellite uplink...",
      "Querying live global web indexes...",
      "Verifying source citations & accuracy..."
    ],
    general: [
      "Synthesizing neural model weights...",
      "Accessing operator contextual memory...",
      "Formulating optimal logic architecture...",
      "Compiling advanced response vectors..."
    ]
  };

  const phrases = intentPhrases[activeIntent as keyof typeof intentPhrases] || intentPhrases.general;
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex flex-col gap-2.5 py-2 px-3.5 rounded-2xl bg-black/60 border border-[#00f3ff]/30 shadow-[0_0_20px_rgba(0,243,255,0.1)] backdrop-blur-xl max-w-md w-full my-1"
    >
      {activeIntent === "pdf" ? (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <FileText size={16} className="animate-pulse" />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-lg border border-red-400/30 border-t-red-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-red-300 font-mono flex items-center gap-1.5">
              <span>READING & SYNTHESIZING PDF</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            </div>
            <motion.div 
              key={phraseIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-[9.5px] text-slate-400 font-sans truncate"
            >
              {phrases[phraseIndex]}
            </motion.div>
          </div>
        </div>
      ) : activeIntent === "image" ? (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Scan size={16} className="animate-pulse" />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-lg border border-cyan-400/30 border-t-cyan-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <span>SCANNING OPTICAL MATRIX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <motion.div 
              key={phraseIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-[9.5px] text-slate-400 font-sans truncate"
            >
              {phrases[phraseIndex]}
            </motion.div>
          </div>
        </div>
      ) : activeIntent === "youtube" ? (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
            <Youtube size={16} className="animate-pulse" />
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-lg border border-red-500/30"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-red-400 font-mono flex items-center gap-1.5">
              <span>INDEXING YOUTUBE STREAMS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <motion.div 
              key={phraseIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-[9.5px] text-slate-400 font-sans truncate"
            >
              {phrases[phraseIndex]}
            </motion.div>
          </div>
        </div>
      ) : activeIntent === "web_search" ? (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-[#00f3ff]/15 border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff] shrink-0">
            <Globe size={16} className="animate-pulse" />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 rounded-lg border border-[#00f3ff]/30 border-t-[#00f3ff]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[#00f3ff] font-mono flex items-center gap-1.5">
              <span>LIVE WEB RADAR SEARCH</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
            </div>
            <motion.div 
              key={phraseIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-[9.5px] text-slate-400 font-sans truncate"
            >
              {phrases[phraseIndex]}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-[#00f3ff]/15 border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff] shrink-0">
            <Cpu size={16} className="animate-pulse" />
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-lg border border-[#00f3ff]/30 border-t-[#00f3ff]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[#00f3ff] font-mono flex items-center gap-1.5">
              <span>JARVIS QUANTUM SYNAPSE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
            </div>
            <motion.div 
              key={phraseIndex}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              className="text-[9.5px] text-slate-400 font-sans truncate"
            >
              {phrases[phraseIndex]}
            </motion.div>
          </div>
        </div>
      )}

      {/* Fluid Shimmer Wave */}
      <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden relative">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className={`h-full w-1/2 rounded-full ${
            activeIntent === "pdf" || activeIntent === "youtube"
              ? "bg-gradient-to-r from-transparent via-red-500 to-transparent"
              : "bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent"
          }`}
        />
      </div>
    </motion.div>
  );
}

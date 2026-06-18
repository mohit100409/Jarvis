import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Image as ImageIcon, Video as VideoIcon, Download, Loader2, Info, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";
import { CreatorAsset } from "../types";

export default function CreatorSuite() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  
  // Image Generator state variables
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [imageModel, setImageModel] = useState("imagen-3.0-fast-001");
  const [imageSize, setImageSize] = useState("1K");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // Video Generator state variables
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoModel, setVideoModel] = useState("veo-1.0-fast-preview");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<"idle" | "submitted" | "rendering" | "downloading" | "completed">("idle");
  const [activeOperationName, setActiveOperationName] = useState("");
  const [videoError, setVideoError] = useState("");

  const [assets, setAssets] = useState<CreatorAsset[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_creator_assets");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("jarvis_creator_assets", JSON.stringify(assets));
  }, [assets]);

  // Video Polling Loop
  useEffect(() => {
    if (!activeOperationName || videoProgress === "completed") return;

    let pollInterval: any;

    const pollStatus = async () => {
      try {
        const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
        const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

        const response = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operationName: activeOperationName,
            user_api_key: savedGeminiKey,
          }),
        });
        const data = await response.json();

        if (data.status === "success") {
          if (data.done) {
            setVideoProgress("downloading");
            clearInterval(pollInterval);
            downloadVideoBinary();
          } else {
            setVideoProgress("rendering");
          }
        }
      } catch (err: any) {
        console.error("Polling video error:", err);
      }
    };

    pollInterval = setInterval(pollStatus, 4000);
    return () => clearInterval(pollInterval);
  }, [activeOperationName, videoProgress]);

  // Download video binary once status returns done: true
  const downloadVideoBinary = async () => {
    try {
      const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
      const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

      const response = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: activeOperationName,
          user_api_key: savedGeminiKey,
        }),
      });

      if (response.status === 200) {
        const blob = await response.blob();
        const base64Url = URL.createObjectURL(blob);

        const newAsset: CreatorAsset = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          type: "video",
          prompt: videoPrompt,
          url: base64Url,
          timestamp: new Date().toLocaleTimeString(),
        };

        setAssets([newAsset, ...assets]);
        setVideoProgress("completed");
        setIsGeneratingVideo(false);
        setActiveOperationName("");
        setVideoPrompt("");
      } else {
        throw new Error("Unable to retrieve video stream from Google Veo buffers.");
      }
    } catch (err: any) {
      setVideoError("Error grabbing generated video file: " + err.message);
      setIsGeneratingVideo(false);
      setVideoProgress("idle");
    }
  };

  // Trigger Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError("");

    try {
      const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
      const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspectRatio,
          user_api_key: savedGeminiKey,
          model: imageModel,
          imageSize: imageSize
        }),
      });
      const data = await res.json();

      if (data.status === "success" && data.imageUrl) {
        const newAsset: CreatorAsset = {
          id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
          type: "image",
          prompt: imagePrompt,
          url: data.imageUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        setAssets([newAsset, ...assets]);
        setImagePrompt("");
      } else {
        setImageError(data.message || "Failed to generate image. Try using a personal API core.");
      }
    } catch (err: any) {
      setImageError("Server request failed. Double-check your API configurations.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Trigger Video Generation
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoProgress("submitted");
    setVideoError("");

    try {
      const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
      const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

      const res = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspectRatio,
          user_api_key: savedGeminiKey,
          model: videoModel,
          resolution: videoResolution
        }),
      });
      const data = await res.json();

      if (data.status === "success" && data.operationName) {
        setActiveOperationName(data.operationName);
      } else {
        setIsGeneratingVideo(false);
        setVideoProgress("idle");
        setVideoError(data.message || "Video generator unavailable on standard quotas.");
      }
    } catch (err: any) {
      setVideoError("Server request execution timed out.");
      setIsGeneratingVideo(false);
      setVideoProgress("idle");
    }
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter((as) => as.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-5 bg-gradient-to-b from-[#0a0f28]/80 to-[#030612]/95 border border-[#00f3ff]/20 rounded-3xl backdrop-blur-xl shadow-[0_12px_40px_rgba(0,243,255,0.1)] text-slate-100 select-none">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-[#00f3ff]/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff]">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-widest font-mono text-white">Media Generator Suite</h2>
            <p className="text-[10px] text-slate-400 font-mono">Select and trigger advanced vision & video models</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#020512]/90 p-1 rounded-2xl border border-[#00f3ff]/20 gap-1 min-w-[240px]">
          <button
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "image"
                ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/35"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon size={12} /> Image Studio
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "video"
                ? "bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/35"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <VideoIcon size={12} /> Video Studio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CREATOR FORM */}
        <div className="md:col-span-1 bg-[#020514]/70 p-5 rounded-2xl border border-[#00f3ff]/15 flex flex-col justify-between text-left relative overflow-hidden">
          <div className="space-y-4">
            <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest text-[#00f3ff] font-bold">
              <Sparkles size={11} className="animate-spin text-cyan-400" /> Parameter Matrix
            </span>

            {activeTab === "image" ? (
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Image Prompt</label>
                  <textarea
                    placeholder="Describe your creative photo vision in detail..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#00f3ff]/60 transition-colors leading-relaxed placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Model Engine</label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-[#00f3ff] font-mono outline-none focus:border-[#00f3ff]/60"
                  >
                    <option value="imagen-3.0-fast-001">Google Imagen 3.0 Fast (Ultra-Realism & Text)</option>
                    <option value="gemini-3.1-flash-image">Gemini 3.1 Flash Image (Recommended)</option>
                    <option value="gemini-3-pro-image">Gemini 3.0 Pro Image (Supreme Fidelity)</option>
                    <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Draft Mode)</option>
                  </select>
                </div>

                {imageModel !== "gemini-2.5-flash-image" && imageModel !== "imagen-3.0-fast-001" && (
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Output Size</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-350 outline-none focus:border-[#00f3ff]/60 font-mono"
                    >
                      <option value="1K">1K High Resolution (Default)</option>
                      <option value="2K">2K Ultra HD (Advanced Model)</option>
                      <option value="4K">4K Master Cinema (Pro Model)</option>
                      <option value="512px">512px (Thumbnail Draft)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Aspect Ratio</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e) => setImageAspectRatio(e.target.value)}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-[#00f3ff]/60"
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Story/Mobile)</option>
                    <option value="4:3">4:3 (Traditional Card)</option>
                    <option value="3:4">3:4 (Portrait)</option>
                    <option value="1:4">1:4 (Panoramic Narrow)</option>
                    <option value="8:1">8:1 (Skyline Strip)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Video Motion Prompt</label>
                  <textarea
                    placeholder="Describe visual physics, actions or cinematic pans..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#00f3ff]/60 transition-colors leading-relaxed placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium font-mono">Video Model</label>
                  <select
                    value={videoModel}
                    onChange={(e) => setVideoModel(e.target.value)}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-[#00f3ff] font-mono outline-none focus:border-[#00f3ff]/60"
                  >
                    <option value="veo-1.0-fast-preview">Google Veo 1.0 Fast Preview (Default)</option>
                    <option value="veo-3.1-generate-preview">Google Veo 3.1 Pro (4K Cinema Support)</option>
                    <option value="veo-3.1-lite-generate-preview">Google Veo 3.1 Lite (Fast Delivery)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Output Resolution</label>
                  <select
                    value={videoResolution}
                    onChange={(e) => setVideoResolution(e.target.value)}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-350 outline-none focus:border-[#00f3ff]/60 font-mono"
                  >
                    <option value="1080p">1080p Full High Definition</option>
                    <option value="720p">720p Standard Draft</option>
                    {videoModel === "veo-3.1-generate-preview" && (
                      <option value="4k">4K Ultra Cinematic (Veo Pro)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-medium">Aspect Ratio</label>
                  <select
                    value={videoAspectRatio}
                    onChange={(e) => setVideoAspectRatio(e.target.value)}
                    className="w-full bg-[#030718] border border-[#00f3ff]/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-[#00f3ff]/60"
                  >
                    <option value="16:9">16:9 (Widescreen Cinema)</option>
                    <option value="9:16">9:16 (Vertical Reel)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={activeTab === "image" ? handleGenerateImage : handleGenerateVideo}
              disabled={activeTab === "image" ? (isGeneratingImage || !imagePrompt.trim()) : (isGeneratingVideo || !videoPrompt.trim())}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-[#00f3ff]/80 hover:from-blue-600 hover:to-[#00f3ff] text-white font-extrabold text-[11px] font-mono uppercase tracking-widest rounded-xl border border-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_15px_rgba(0,243,255,0.15)]"
            >
              {activeTab === "image" ? (
                isGeneratingImage ? (
                  <>
                    <Loader2 className="animate-spin text-cyan-200" size={13} /> Synthesizing...
                  </>
                ) : (
                  <>
                    <ImageIcon size={12} /> Paint Custom Canvas
                  </>
                )
              ) : isGeneratingVideo ? (
                <>
                  <Loader2 className="animate-spin text-cyan-200" size={13} /> {videoProgress.toUpperCase()}...
                </>
              ) : (
                <>
                  <VideoIcon size={12} /> Render Veo Stream
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: GALLERY */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div className="w-full text-left">
            
            {/* Display Video error or Image error feedback */}
            <AnimatePresence>
              {((activeTab === "image" && imageError) || (activeTab === "video" && videoError)) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5"
                >
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                  <div className="text-[10px] font-mono leading-relaxed text-red-300">
                    <span className="font-bold block text-red-400 capitalize">{activeTab} Generation Exception:</span>
                    {activeTab === "image" ? imageError : videoError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Video Progress Bar Card */}
            {isGeneratingVideo && videoProgress !== "idle" && (
              <div className="mb-4 bg-[#03081e] border-2 border-[#1eecfe]/30 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 h-0.5 bg-cyan-400 animate-pulse w-full" />
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="absolute inset-x-0 bg-cyan-500/30 rounded-full blur animate-ping h-8 w-8" />
                    <div className="w-9 h-9 border border-[#00f3ff]/40 rounded-full flex items-center justify-center bg-slate-950">
                      <VideoIcon className="text-cyan-400 animate-bounce" size={14} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black font-mono text-cyan-300 uppercase tracking-widest">Veo Cinematic Processor</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 leading-normal">
                      {videoProgress === "submitted" && "Transmitting job blueprint configurations to server..."}
                      {videoProgress === "rendering" && "Synthesizing AI frames in supercomputer (Takes 1-3 mins)..."}
                      {videoProgress === "downloading" && "Retrieving binary chunks from cluster databases..."}
                    </p>
                  </div>
                </div>
                <div className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#00f3ff]/10 border border-[#00f3ff]/20 text-cyan-400 animate-pulse">
                  Rendering
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3 border-b border-[#00f3ff]/10 pb-2">
              <h3 className="text-[11px] font-black tracking-widest text-[#00f3ff] font-mono uppercase flex items-center gap-1.5">
                Saved Creative Nodes ({assets.length})
              </h3>
            </div>

            {assets.length === 0 ? (
              <div className="h-[280px] flex flex-col justify-center items-center gap-2 bg-[#020512]/30 rounded-2xl border border-dashed border-[#00f3ff]/10 text-slate-500">
                <Sparkles size={24} className="opacity-40 animate-pulse text-cyan-500" />
                <p className="text-[11px] uppercase font-mono tracking-wider font-bold text-slate-400">Library Empty</p>
                <p className="text-[10px] max-w-xs text-center text-slate-600 px-6 font-mono leading-relaxed">
                  Compose prompts inside the left matrix editor. Trigger Paint or Render buttons to synthesize state.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 text-left">
                {assets.map((as) => (
                  <div
                    key={as.id}
                    className="bg-[#020615] rounded-xl border border-[#00f3ff]/10 overflow-hidden shadow-md flex flex-col group hover:border-[#00f3ff]/30 transition-all duration-300 relative"
                  >
                    <div className="aspect-video w-full relative bg-slate-950 overflow-hidden flex items-center justify-center">
                      {as.type === "image" ? (
                        <img
                          src={as.url}
                          alt={as.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <video
                          src={as.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Overlays with prompt summary */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350 p-2.5 flex flex-col justify-end">
                        <p className="font-mono text-[9px] text-slate-300 leading-normal line-clamp-2">
                          "{as.prompt}"
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-black/50 border-t border-[#00f3ff]/10 flex justify-between items-center text-[10px] font-mono shrink-0">
                      <span className="text-slate-500 uppercase flex items-center gap-1">
                        {as.type === "image" ? <ImageIcon size={10} className="text-cyan-400" /> : <VideoIcon size={10} className="text-orange-400" />}
                        {as.type} • {as.timestamp}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteAsset(as.id)}
                          className="text-red-400 hover:text-red-300 font-extrabold uppercase text-[9px] px-1 hover:bg-red-950/30 rounded"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

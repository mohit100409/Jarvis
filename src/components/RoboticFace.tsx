import React, { useEffect, useState } from "react";
import { motion} from "motion/react";

interface RoboticFaceProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  emotion?: "normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical";
  
}

export default function RoboticFace({ status, emotion: propEmotion = "normal"}: RoboticFaceProps) {
  const [blink, setBlink] = useState(false);
  const [localEmotion, setLocalEmotion] = useState<"normal" | "happy" | "angry" | "cry" | "laughing" | "surprised" | "disturbed" | "sleepy" | "love" | "contemplative" | "bored" | "skeptical">("normal");
  const [speechVolume, setSpeechVolume] = useState(0);
  const [simulatedVolume, setSimulatedVolume] = useState(0);

  // Listen to real-time custom volume events
  useEffect(() => {
    const handleVolume = (e: any) => {
      if (e.detail && typeof e.detail.volume === "number") {
        setSpeechVolume(e.detail.volume);
      }
    };
    window.addEventListener("jarvis-speech-volume", handleVolume);
    return () => {
      window.removeEventListener("jarvis-speech-volume", handleVolume);
    };
  }, []);

  // Simulated lip sync loop when real-time volume analysis isn't active or during fallback synthesis speaking
  useEffect(() => {
    if (status !== "speaking") {
      setSimulatedVolume(0);
      return;
    }

    let frameId: number;
    let time = 0;

    const tick = () => {
      time += 0.22;
      // Synthesize realistic vowel changes
      const base = Math.sin(time) * 0.45 + 0.55;
      const sub = Math.sin(time * 2.4) * 0.25;
      const noise = Math.random() * 0.18;
      let level = Math.max(0.1, base + sub + noise);

      // Create natural gaps to mimic word pauses
      if (Math.sin(time * 0.75) < -0.55) {
        level = 0.02;
      }
      setSimulatedVolume(Math.min(1, level));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  // Read actual frequency volume, fall back to simulated wave when speaking
  const activeLevel = speechVolume > 0.012 ? Math.min(1.0, speechVolume * 2.5) : (status === "speaking" ? simulatedVolume : 0);

  // Keep local action synced with properties
  useEffect(() => {
    setLocalEmotion(propEmotion);
  }, [propEmotion]);

  // Trigger eyes blinking naturally at random intervals
  useEffect(() => {
    if (status !== "idle" || localEmotion !== "normal") return;
    
    let timeoutId: NodeJS.Timeout;
    
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      
      // Next blink between 2s and 6s
      const nextInterval = Math.random() * 4000 + 2000;
      timeoutId = setTimeout(triggerBlink, nextInterval);
    };
    
    // Initial random delay before first blink
    timeoutId = setTimeout(triggerBlink, Math.random() * 3000 + 1000);
    
    return () => clearTimeout(timeoutId);
  }, [status, localEmotion]);

  // Determine robot face colors and styles depending on the active state and emotion
  const getThemeColors = () => {
    if (localEmotion === "angry") {
      return {
        glow: "rgba(239, 68, 68, 0.45)", // red
        stroke: "#ef4444",
        pulse: "animate-pulse",
        subtitle: "💢 JARVIS IS COLD & ANGRY OS Mode",
      };
    }
    if (localEmotion === "cry") {
      return {
        glow: "rgba(37, 99, 235, 0.45)", // deep blue
        stroke: "#3b82f6",
        pulse: "animate-pulse",
        subtitle: "💧 Glistening virtual tear modules...",
      };
    }
    if (localEmotion === "laughing") {
      return {
        glow: "rgba(234, 179, 8, 0.45)", // gold / yellow
        stroke: "#eab308",
        pulse: "animate-bounce",
        subtitle: "😂 Joyous laughter matrix online!",
      };
    }
    if (localEmotion === "happy") {
      return {
        glow: "rgba(16, 185, 129, 0.45)", // emerald
        stroke: "#10b981",
        pulse: "animate-pulse",
        subtitle: "✨ Smiling with delightful sparks!",
      };
    }
    if (localEmotion === "surprised") {
      return {
        glow: "rgba(168, 85, 247, 0.5)", // neon purple
        stroke: "#a855f7",
        pulse: "animate-pulse",
        subtitle: "😮 Giga-computation SURPRISE modules",
      };
    }
    if (localEmotion === "disturbed") {
      return {
        glow: "rgba(245, 158, 11, 0.5)", // Amber
        stroke: "#f59e0b",
        pulse: "animate-bounce",
        subtitle: "⚠️ DISTURBED: Cognitive flux detected",
      };
    }
    if (localEmotion === "sleepy") {
      return {
        glow: "rgba(56, 189, 248, 0.5)", // Sky blue
        stroke: "#38bdf8",
        pulse: "",
        subtitle: "💤 Sleep cycle algorithm: Deep sleep...",
      };
    }
    if (localEmotion === "love") {
      return {
        glow: "rgba(236, 72, 153, 0.55)", // Pink
        stroke: "#ec4899",
        pulse: "animate-pulse",
        subtitle: "💖 Heartbeat synchronization mode active",
      };
    }
    if (localEmotion === "contemplative") {
      return {
        glow: "rgba(168, 85, 247, 0.45)", // premium violet/amethyst glow
        stroke: "#c084fc",
        pulse: "animate-pulse",
        subtitle: "🤔 CONTEMPLATING: Deep cognitive processing active...",
      };
    }
    if (localEmotion === "bored") {
      return {
        glow: "rgba(148, 163, 184, 0.35)", // quiet slate glow
        stroke: "#94a3b8",
        pulse: "",
        subtitle: "🥱 BORED: Processing low-stimulation parameters...",
      };
    }
    if (localEmotion === "skeptical") {
      return {
        glow: "rgba(251, 146, 60, 0.4)", // amber/orange glow
        stroke: "#fb923c",
        pulse: "",
        subtitle: "🤨 SKEPTICAL: Verifying contextual consensus...",
      };
    }

    switch (status) {
      case "listening":
        return {
          glow: "rgba(0, 243, 255, 0.45)", // Neon Blue
          stroke: "#00f3ff",
          pulse: "animate-ping",
          subtitle: "🎧 LISTENING TO TRANSCRIPTION LINE...",
        };
      case "thinking":
        return {
          glow: "rgba(168, 85, 247, 0.45)", // neon purple
          stroke: "#a855f7",
          pulse: "animate-pulse",
          subtitle: "🧠 CONTEMPLATING DEEP STUDY RESPONSE...",
        };
      case "speaking":
        return {
          glow: "rgba(0, 243, 255, 0.55)", // Neon Blue
          stroke: "#00f3ff",
          pulse: "",
          subtitle: "🔊 TRANSMITTING COMPANION VOICE...",
        };
      case "idle":
      default:
        return {
          glow: "rgba(0, 243, 255, 0.35)", // Neon Blue
          stroke: "#00f3ff",
          pulse: "",
          subtitle: "🎙️ OS TERMINAL ONLINE & READY",
        };
    }
  };

  const currentTheme = getThemeColors();

  // Pulse animation definition based on emotion
  const getPulseAnimation = () => {
    switch (localEmotion) {
      case "angry":
        return {
          scale: [1, 1.03, 1],
          opacity: [0.3, 0.6, 0.3],
        };
      case "happy":
        return {
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.5, 0.2],
        };
      case "laughing":
        return {
          y: [0, -5, 0],
          opacity: [0.3, 0.7, 0.3],
        };
      case "love":
        return {
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.8, 0.4],
        };
      case "surprised":
        return {
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.6, 0.3],
        };
      case "disturbed":
        return {
          x: [-2, 2, -2],
          opacity: [0.3, 0.5, 0.3],
        };
      case "contemplative":
        return {
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        };
      case "bored":
        return {
          scale: [0.98, 1, 0.98],
          opacity: [0.22, 0.32, 0.22],
        };
      case "skeptical":
        return {
          rotate: [-1, 1, -1],
          opacity: [0.3, 0.45, 0.3],
        };
      default:
        return {
          opacity: [0.2, 0.35, 0.2],
        };
    }
  };

  const renderEyes = () => {
    if (localEmotion === "angry") {
      return (
        <g>
          {/* Angry eyebrows / slanted eye rectangles - Pure Emo Robot Style */}
          <motion.path
            d="M 40 68 L 82 82 L 78 96 L 40 82 Z"
            fill="#ef4444"
            animate={{ scale: status === "speaking" ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          <motion.path
            d="M 160 68 L 118 82 L 122 96 L 160 82 Z"
            fill="#ef4444"
            animate={{ scale: status === "speaking" ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          {/* Glowing angry eye accessories */}
          <line x1="45" y1="58" x2="80" y2="72" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
          <line x1="155" y1="58" x2="120" y2="72" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    }

    if (localEmotion === "cry") {
      return (
        <g>
          {/* Sad slanted teardrop eyes */}
          <motion.path
            d="M 42 90 Q 60 76 78 90 Q 60 102 42 90 Z"
            fill="#3b82f6"
          />
          <motion.path
            d="M 122 90 Q 140 76 158 90 Q 140 102 122 90 Z"
            fill="#3b82f6"
          />
          {/* Blue digital tear marks */}
          <path d="M 40 78 Q 60 88 80 78" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 120 78 Q 140 88 160 78" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Dripping virtual tear beads */}
          <motion.circle
            cx="55"
            cy="100"
            r="4"
            fill="#60a5fa"
            animate={{ y: [0, 28, 0], opacity: [1, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeIn" }}
          />
          <motion.circle
            cx="145"
            cy="100"
            r="4"
            fill="#60a5fa"
            animate={{ y: [0, 28, 0], opacity: [1, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.6, ease: "easeIn" }}
          />
        </g>
      );
    }

    if (localEmotion === "laughing") {
      return (
        <g>
          {/* Happily squeezed upward eye lines */}
          <motion.path
            d="M 38 95 Q 60 62 82 95"
            stroke="#eab308"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
          <motion.path
            d="M 118 95 Q 140 62 162 95"
            stroke="#eab308"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
          {/* Cyber sparkles */}
          <path d="M 60 45 L 60 55 M 55 50 L 65 50" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
          <path d="M 140 45 L 140 55 M 135 50 L 145 50" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    }

    if (localEmotion === "happy") {
      return (
        <g>
          {/* Cheerful upward arcs with green spark centers */}
          <motion.ellipse
            cx="65"
            cy="85"
            rx="15"
            ry={blink ? "2" : "15"}
            fill="#10b981"
          />
          <path d="M 65 75 L 65 95 M 55 85 L 75 85" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
          <motion.ellipse
            cx="135"
            cy="85"
            rx="15"
            ry={blink ? "2" : "15"}
            fill="#10b981"
          />
          <path d="M 135 75 L 135 95 M 125 85 L 145 85" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    }

    if (localEmotion === "surprised") {
      return (
        <motion.g
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          {/* Widened shocked eyes */}
          <motion.circle cx="65" cy="85" r="17" fill="none" stroke="#a855f7" strokeWidth="4" animate={{ r: [15, 18, 17] }} transition={{ duration: 0.3 }} />
          <motion.circle cx="65" cy="85" r="6" fill="#00f3ff" animate={{ r: [4, 7, 6] }} transition={{ duration: 0.3 }} />
          <motion.circle cx="135" cy="85" r="17" fill="none" stroke="#a855f7" strokeWidth="4" animate={{ r: [15, 18, 17] }} transition={{ duration: 0.3 }} />
          <motion.circle cx="135" cy="85" r="6" fill="#00f3ff" animate={{ r: [4, 7, 6] }} transition={{ duration: 0.3 }} />
        </motion.g>
      );
    }

    if (localEmotion === "disturbed") {
      return (
        <g>
          {/* Concentric swirling spiral lines or crosses */}
          <motion.g
            animate={{ rotate: [0, 360] }}
            style={{ transformOrigin: "65px 85px" }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <path d="M 50 70 L 80 100 M 80 70 L 50 100" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
          </motion.g>
          <motion.g
            animate={{ rotate: [360, 0] }}
            style={{ transformOrigin: "135px 85px" }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <path d="M 120 70 L 150 100 M 150 70 L 120 100" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
          </motion.g>
        </g>
      );
    }

    if (localEmotion === "sleepy") {
      return (
        <g>
          {/* Flat lazy lines representing closed/drooped eyes */}
          <line x1="50" y1="85" x2="80" y2="85" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          <line x1="120" y1="85" x2="150" y2="85" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          {/* Small floating Z's */}
          <motion.text
            x="160"
            y="60"
            fill="#38bdf8"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="bold"
            animate={{ y: [60, 45, 60], x: [160, 168, 160], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            z
          </motion.text>
          <motion.text
            x="170"
            y="45"
            fill="#38bdf8"
            fontSize="18"
            fontFamily="monospace"
            fontWeight="bold"
            animate={{ y: [45, 25, 45], x: [170, 180, 170], opacity: [0.1, 1, 0.1] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.8, ease: "easeInOut" }}
          >
            Z
          </motion.text>
        </g>
      );
    }

    if (localEmotion === "love") {
      return (
        <g>
          {/* Heart shaped eye designs */}
          <motion.path
            d="M 65 77 C 58 69 51 79 65 89 C 79 79 72 69 65 77 Z"
            fill="#ec4899"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ transformOrigin: "65px 83px" }}
          />
          <motion.path
            d="M 135 77 C 128 69 121 79 135 89 C 149 79 142 69 135 77 Z"
            fill="#ec4899"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
            style={{ transformOrigin: "135px 83px" }}
          />
        </g>
      );
    }

    if (localEmotion === "contemplative") {
      return (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* contemplative eye design */}
          <ellipse cx="65" cy="85" rx="14" ry={blink ? "1" : "10"} fill="#c084fc" />
          <motion.circle cx="65" cy="85" r="3" fill="#000" className="opacity-80" animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
          <ellipse cx="135" cy="85" rx="14" ry={blink ? "1" : "13"} fill="#c084fc" />
          <motion.circle cx="135" cy="85" r="4" fill="#000" className="opacity-80" animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
          {/* Thinking overlay paths */}
          <motion.path d="M 52 68 Q 65 65 78 68" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.path d="M 122 65 Q 135 62 148 65" stroke="#e9d5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
        </motion.g>
      );
    }

    if (localEmotion === "bored") {
      return (
        <g>
          {/* bored eye design */}
          <ellipse cx="65" cy="87" rx="14" ry={blink ? "1" : "6"} fill="#94a3b8" />
          <circle cx="65" cy="87" r="2.5" fill="#000" className="opacity-70" />
          <ellipse cx="135" cy="87" rx="14" ry={blink ? "1" : "6"} fill="#94a3b8" />
          <circle cx="135" cy="87" r="2.5" fill="#000" className="opacity-70" />
          {/* Heavy flat eyelids */}
          <path d="M 46 76 Q 65 82 84 76" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 116 76 Q 135 82 154 76" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    }

    if (localEmotion === "skeptical") {
      return (
        <motion.g
          initial={{ y: -5 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {/* skeptical 🤨 asymmetrical design */}
          <ellipse cx="65" cy="85" rx="14" ry={blink ? "1" : "6"} fill="#fb923c" />
          <circle cx="65" cy="85" r="2.5" fill="#000" className="opacity-80" />
          <motion.path d="M 48 72 L 80 75" stroke="#ffedd5" strokeWidth="3" strokeLinecap="round" animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }} />

          <ellipse cx="135" cy="85" rx="14" ry={blink ? "1" : "15"} fill="#fb923c" />
          <circle cx="135" cy="85" r="4.5" fill="#000" className="opacity-80" />
          <motion.path d="M 120 62 Q 135 50 150 62" stroke="#ffedd5" strokeWidth="3.5" fill="none" strokeLinecap="round" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
        </motion.g>
      );
    }

    // Default conditions based on status
    if (status === "listening") {
      return (
        <>
          <circle cx="65" cy="90" r="15" fill="none" stroke={currentTheme.stroke} strokeWidth="3" />
          <circle cx="65" cy="90" r="6" fill={currentTheme.stroke} />
          <circle cx="135" cy="90" r="15" fill="none" stroke={currentTheme.stroke} strokeWidth="3" />
          <circle cx="135" cy="90" r="6" fill={currentTheme.stroke} />
        </>
      );
    }

    if (status === "thinking") {
      return (
        <>
          <defs>
            <linearGradient id="thinking-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentTheme.stroke} />
              <motion.stop
                offset="50%"
                stopColor="#f3e8ff"
                animate={{
                  offset: ["0%", "100%"]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear"
                }}
              />
              <stop offset="100%" stopColor={currentTheme.stroke} />
            </linearGradient>
          </defs>
          <path d="M50,92 L80,88" stroke="url(#thinking-shimmer)" strokeWidth="5" strokeLinecap="round" />
          <path d="M120,88 L150,92" stroke="url(#thinking-shimmer)" strokeWidth="5" strokeLinecap="round" />
          
          {/* Subtle horizontal laser/scanline overlay sweeping vertically over the eyes */}
          <motion.line
            x1="45"
            y1="0"
            x2="155"
            y2="0"
            animate={{ y: [84, 96, 84] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.8"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 2px #fff)" }}
          />

          <circle
            cx="100"
            cy="50"
            r="12"
            fill="none"
            stroke={currentTheme.stroke}
            strokeWidth="2.5"
            strokeDasharray="18 6"
            className="animate-spin"
            style={{ transformOrigin: "100px 50px" }}
          />
        </>
      );
    }

    if (status === "speaking") {
      // Speak eyes dynamically scale with active speech amplitude levels for natural charm!
      const eyeHeight = 5 + (activeLevel * 6);
      return (
        <>
          {/* Symmetrical glowing pupils resizing with sound */}
          <ellipse cx="65" cy="90" rx="14" ry={eyeHeight} fill={currentTheme.stroke} />
          <circle cx="65" cy="90" r="3.5" fill="#000" opacity="0.65" />
          
          <ellipse cx="135" cy="90" rx="14" ry={eyeHeight} fill={currentTheme.stroke} />
          <circle cx="135" cy="90" r="3.5" fill="#000" opacity="0.65" />
        </>
      );
    }

    // Default regular Emo study client eyes
    return (
      <>
        <ellipse cx="65" cy="85" rx="14" ry={blink ? "1" : "14"} fill={currentTheme.stroke} className="transition-all duration-150" />
        <circle cx="65" cy="85" r="4" fill="#000" className="opacity-80" />
        <ellipse cx="135" cy="85" rx="14" ry={blink ? "1" : "14"} fill={currentTheme.stroke} className="transition-all duration-150" />
        <circle cx="135" cy="85" r="4" fill="#000" className="opacity-80" />
      </>
    );
  };

  const renderCheekBlush = () => {
    // Elegant blushing cheeks under the eyes to make the face incredibly cute
    const blushColor = localEmotion === "love" ? "#ec4899" : localEmotion === "happy" || localEmotion === "laughing" ? "#10b981" : "#f472b6";
    const opacityValue = localEmotion === "love" ? 0.45 : localEmotion === "normal" ? 0.22 : 0.35;
    
    return (
      <g opacity={opacityValue} className="pointer-events-none">
        {/* Left Blush Bubble */}
        <motion.circle
          cx="54"
          cy="110"
          r="8"
          fill={blushColor}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [opacityValue, opacityValue * 1.3, opacityValue]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          style={{ filter: "blur(2px)" }}
        />
        {/* Right Blush Bubble */}
        <motion.circle
          cx="146"
          cy="110"
          r="8"
          fill={blushColor}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [opacityValue, opacityValue * 1.3, opacityValue]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
            delay: 0.3
          }}
          style={{ filter: "blur(2px)" }}
        />
      </g>
    );
  };

  const renderThinkingHand = () => {
    if (status !== "thinking") return null;

    const strokeColor = currentTheme.stroke;

    return (
      <motion.g>
        {/* Sleek abstract rotating orbital loading ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="86"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray="40 120"
          fill="none"
          opacity="0.5"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <motion.circle
          cx="100"
          cy="100"
          r="86"
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray="10 90"
          fill="none"
          opacity="0.3"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />
      </motion.g>
    );
  };

  const renderMouth = () => {
    const strokeColor = currentTheme.stroke;
    const fillColor = "rgba(10, 18, 42, 0.95)";

    if (status === "speaking") {
      // 1. Sad / crying sound mouth
      if (localEmotion === "cry") {
        const topY = 138;
        const bottomY = 138 + (activeLevel * 14);
        const controlY = 138 - (activeLevel * 6);
        return (
          <g>
            <path
              d={`M 82 ${topY} Q 100 ${controlY} 118 ${topY} Q 100 ${bottomY} 82 ${topY} Z`}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx="100" cy={138 + (activeLevel * 5)} r="2" fill="#60a5fa" opacity="0.8" />
          </g>
        );
      }

      // 2. Angry sound mouth
      if (localEmotion === "angry") {
        const midY = 138;
        const heightDev = activeLevel * 9;
        return (
          <g>
            <path
              d={`M 84 ${midY} Q 100 ${midY - heightDev} 116 ${midY} Q 100 ${midY + heightDev} 84 ${midY} Z`}
              fill={fillColor}
              stroke="#ef4444"
              strokeWidth="4.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <line x1="86" y1="138" x2="114" y2="138" stroke="#ef4444" strokeWidth="1.5" />
          </g>
        );
      }

      // 3. Surprised speaking mouth
      if (localEmotion === "surprised") {
        const radiusY = 12 + (activeLevel * 9);
        const radiusX = 10 + (activeLevel * 3.5);
        return (
          <g>
            <ellipse
              cx="100"
              cy="138"
              rx={radiusX}
              ry={radiusY}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4.5"
            />
          </g>
        );
      }

      // 4. Default / happy / laughing / love elegant speaking mouth with dynamic lip-sync shape
      const bottomY = 134 + (activeLevel * 19);
      const innerY = 134 + (activeLevel * 14);

      return (
        <g>
          {/* Main filled cute talking smile body */}
          <path
            d={`M 82 134 Q 100 ${innerY} 118 134 Q 100 ${bottomY} 82 134 Z`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Adorable bouncing pink tongue inside her talking mouth dynamically proportional to active sound level */}
          <path
            d={`M 88 ${134 + (activeLevel * 11)} Q 100 ${134 + (activeLevel * 7.5)} 112 ${134 + (activeLevel * 11)} Q 100 ${134 + (activeLevel * 17.5)} 88 ${134 + (activeLevel * 11)} Z`}
            fill="#fb7185"
            opacity="0.95"
          />

          {/* Cute digital speech waves emanating beside her cheeks to represent active sound transmission */}
          <motion.path
            d="M 68 132 Q 62 132 64 126"
            stroke={strokeColor}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.15, 0.95, 0.15], scale: [0.9, 1.25, 0.9] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
            style={{ transformOrigin: "100px 132px" }}
          />
          <motion.path
            d="M 132 132 Q 138 132 136 126"
            stroke={strokeColor}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.15, 0.95, 0.15], scale: [0.9, 1.25, 0.9] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }}
            style={{ transformOrigin: "100px 132px" }}
          />
        </g>
      );
    }

    if (localEmotion === "angry") {
      return (
        <motion.path
          d="M 80 142 Q 100 128 120 142"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    if (localEmotion === "cry") {
      return (
        <motion.ellipse
          cx="100"
          cy="140"
          rx="12"
          ry="6"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
        />
      );
    }

    if (localEmotion === "laughing") {
      return (
        <g>
          {/* Open laughing mouth with bouncing animation */}
          <motion.path
            d="M 75 130 C 75 158 125 158 125 130 Z"
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          {/* Tongue inside */}
          <path
            d="M 88 142 C 94 135 106 135 112 142 Q 100 154 88 142"
            fill="#f87171"
          />
        </g>
      );
    }

    if (localEmotion === "happy") {
      return (
        <motion.path
          d="M 74 132 Q 100 152 126 132"
          stroke="#10b981"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }

    if (localEmotion === "surprised") {
      return (
        <g transform="translate(100, 140)">
          <ellipse rx="13" ry="18" fill="none" stroke="#a855f7" strokeWidth="4" />
        </g>
      );
    }

    if (localEmotion === "disturbed") {
      return (
        <motion.path
          d="M 75 138 Q 85 130 95 138 T 115 138 T 125 138"
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={{ x: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 0.15 }}
        />
      );
    }

    if (localEmotion === "sleepy") {
      return (
        <g>
          <circle cx="100" cy="140" r="5" fill="none" stroke="#38bdf8" strokeWidth="3" />
          {/* Yawn bubble blowing */}
          <motion.circle
            cx="108"
            cy="134"
            r="3"
            fill="#0ea5e9"
            opacity="0.6"
            animate={{ scale: [1, 2.5, 1], x: [108, 114, 108], y: [134, 126, 134] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          />
        </g>
      );
    }

    if (localEmotion === "love") {
       return (
         <path
           d="M 74 130 C 85 152 115 152 126 130"
           stroke="#ec4899"
           strokeWidth="5"
           fill="none"
           strokeLinecap="round"
         />
       );
    }

    if (localEmotion === "contemplative") {
      return (
        <path
          d="M 85 138 Q 95 133 115 136"
          stroke="#c084fc"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    if (localEmotion === "bored") {
      return (
        <line
          x1="85"
          y1="140"
          x2="115"
          y2="140"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    }

    if (localEmotion === "skeptical") {
      return (
        <path
          d="M 82 142 Q 100 134 118 132"
          stroke="#fb923c"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }

    // Default status mouths
    if (status === "listening") {
      return (
        <g transform="translate(100, 138)">
          <circle r="8" fill="none" stroke={currentTheme.stroke} strokeWidth="2.5" />
          <circle r="14" fill="none" stroke={currentTheme.stroke} strokeWidth="1.5" strokeDasharray="4 4" className="animate-spin" />
        </g>
      );
    }

    if (status === "thinking") {
      return (
        <line
          x1="80"
          y1="135"
          x2="120"
          y2="135"
          stroke={currentTheme.stroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    }

    // IDLE Symmetrical digital arc
    return (
      <path
        d="M75,135 C85,148 115,148 125,135"
        stroke={currentTheme.stroke}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    );
  };


    return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -15 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="flex flex-col items-center justify-center p-1 relative overflow-visible max-w-xs sm:max-w-sm mx-auto w-full group transition-all duration-300"
    >
      {/* Robotic Face Frame container */}

      {/* Animated Face Frame with fixed borders sync with theme colors */}
      <motion.div
        animate={{
          y: status === "speaking" ? [0, -5, 0] : [0, -2, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: status === "speaking" ? 1.4 : 3,
          ease: "easeInOut",
        }}
        className="w-32 h-32 xs:w-36 xs:h-36 sm:w-44 sm:h-44 flex items-center justify-center relative transition-all duration-300"
      >
        {/* Radar Ring indicator during listening */}
        {status === "listening" && (
          <div 
            className="absolute inset-0 rounded-full scale-125 animate-ping opacity-30 pointer-events-none" 
            style={{ backgroundColor: `${currentTheme.stroke}` }}
          />
        )}

        <svg
          viewBox="0 0 200 200"
          className="w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36"
          style={{ filter: `drop-shadow(0 0 12px ${currentTheme.stroke}77)` }}
        >
          {/* Cheek Blush */}
          {renderCheekBlush()}

          {/* Eyes Group with seamless transitions */}
          <motion.g
            key="stable-eyes"
            animate={{
              scale: status === "speaking" ? [1, 1.02, 1] : 1
            }}
            transition={{
              repeat: status === "speaking" ? Infinity : 0,
              duration: 1.4,
              ease: "easeInOut"
            }}
          >
            {renderEyes()}
          </motion.g>

          {/* Mouth/Mouthwave Group with seamless transitions */}
          <motion.g
            key="stable-mouth"
          >
            {renderMouth()}
          </motion.g>

          {/* Thinking hand gesture 🤔 */}
          {renderThinkingHand()}

          {/* Electronic wiring cyber paths */}
          <path
            d="M30,10 L30,40 L15,50"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M170,10 L170,40 L185,50"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

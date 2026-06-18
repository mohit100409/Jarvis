import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface AudioReactiveBackgroundProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  emotion: string;
}

export default function AudioReactiveBackground({ status, emotion }: AudioReactiveBackgroundProps) {
  const [speechVolume, setSpeechVolume] = useState(0);
  const [simulatedVolume, setSimulatedVolume] = useState(0);
  const [time, setTime] = useState(0);

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

  // Simulated lip sync / voice loop when real-time volume analysis isn't active
  useEffect(() => {
    if (status !== "speaking") {
      setSimulatedVolume(0);
      return;
    }

    let frameId: number;
    let localTime = 0;

    const tick = () => {
      localTime += 0.22;
      const base = Math.sin(localTime) * 0.45 + 0.55;
      const sub = Math.sin(localTime * 2.4) * 0.25;
      const noise = Math.random() * 0.18;
      let level = Math.max(0.1, base + sub + noise);

      if (Math.sin(localTime * 0.75) < -0.55) {
        level = 0.02;
      }
      setSimulatedVolume(Math.min(1, level));
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  // Read actual frequency volume, fallback to simulated wave when speaking
  const activeLevel = speechVolume > 0.015 ? speechVolume : (status === "speaking" ? simulatedVolume : 0);

  // Animation ticks for wave movement
  useEffect(() => {
    let animFrame: number;
    const updateTime = () => {
      setTime((prev) => prev + 0.03 + activeLevel * 0.12); // waves move faster when speaking/louder
      animFrame = requestAnimationFrame(updateTime);
    };
    animFrame = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animFrame);
  }, [activeLevel]);

  // Color selection based on emotion and activeLevel
  const getWaveColors = () => {
    const baseOpacity = 0.04 + activeLevel * 0.55; // goes up to 0.6 opacity
    const glowIntensity = Math.floor(activeLevel * 25); // px glow radius

    switch (emotion) {
      case "angry":
        return {
          stroke1: `rgba(239, 68, 68, ${baseOpacity})`,
          stroke2: `rgba(185, 28, 28, ${baseOpacity * 0.75})`,
          stroke3: `rgba(248, 113, 113, ${baseOpacity * 0.45})`,
          glow: `rgba(239, 68, 68, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "cry":
        return {
          stroke1: `rgba(59, 130, 246, ${baseOpacity})`,
          stroke2: `rgba(29, 78, 216, ${baseOpacity * 0.75})`,
          stroke3: `rgba(96, 165, 250, ${baseOpacity * 0.45})`,
          glow: `rgba(59, 130, 246, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "happy":
      case "laughing":
        return {
          stroke1: `rgba(234, 179, 8, ${baseOpacity})`,
          stroke2: `rgba(161, 98, 7, ${baseOpacity * 0.75})`,
          stroke3: `rgba(253, 224, 71, ${baseOpacity * 0.45})`,
          glow: `rgba(234, 179, 8, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "love":
        return {
          stroke1: `rgba(236, 72, 153, ${baseOpacity})`,
          stroke2: `rgba(190, 24, 74, ${baseOpacity * 0.75})`,
          stroke3: `rgba(244, 114, 182, ${baseOpacity * 0.45})`,
          glow: `rgba(236, 72, 153, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "surprised":
        return {
          stroke1: `rgba(168, 85, 247, ${baseOpacity})`,
          stroke2: `rgba(109, 40, 217, ${baseOpacity * 0.75})`,
          stroke3: `rgba(192, 132, 252, ${baseOpacity * 0.45})`,
          glow: `rgba(168, 85, 247, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "disturbed":
        return {
          stroke1: `rgba(202, 138, 4, ${baseOpacity})`,
          stroke2: `rgba(113, 63, 18, ${baseOpacity * 0.75})`,
          stroke3: `rgba(234, 179, 8, ${baseOpacity * 0.45})`,
          glow: `rgba(202, 138, 4, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
      case "sleepy":
        return {
          stroke1: `rgba(71, 85, 105, ${baseOpacity * 0.5})`,
          stroke2: `rgba(30, 41, 59, ${baseOpacity * 0.35})`,
          stroke3: `rgba(148, 163, 184, ${baseOpacity * 0.25})`,
          glow: `rgba(71, 85, 105, ${activeLevel * 0.35})`,
          glowRadius: glowIntensity * 0.5
        };
      default: // Connected / Default cyan
        return {
          stroke1: `rgba(0, 243, 255, ${baseOpacity})`,
          stroke2: `rgba(0, 163, 255, ${baseOpacity * 0.75})`,
          stroke3: `rgba(165, 243, 252, ${baseOpacity * 0.45})`,
          glow: `rgba(0, 243, 255, ${activeLevel * 0.75})`,
          glowRadius: glowIntensity
        };
    }
  };

  const colors = getWaveColors();

  // Create SVG paths on-the-fly dynamically based on amplitude (activeLevel) and phase (time)
  const generateWavePath = (offsetY: number, frequency: number, amplitude: number, phase: number) => {
    const points = [];
    const steps = 40; // optimized resolution for high-FPS rendering
    const amplitudeFactor = amplitude * (1.1 + activeLevel * 3.5);

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 100;
      const y = offsetY + Math.sin(i * frequency + phase) * amplitudeFactor + Math.cos(i * (frequency * 0.6) - phase * 1.1) * (amplitudeFactor * 0.4);
      points.push(`${x},${y}`);
    }

    return `M 0,${offsetY} ` + points.map(p => `L ${p}`).join(" ") + ` L 100,100 L 0,100 Z`;
  };

  const path1 = generateWavePath(45, 0.2, 3, time);
  const path2 = generateWavePath(51, 0.16, 4.5, time * 0.85 + 2.5);
  const path3 = generateWavePath(57, 0.25, 2, time * 1.15 - 1.5);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none">
      {/* Background Radial Glow */}
      {activeLevel > 0.015 && (
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] transition-opacity duration-150 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, rgba(5, 9, 23, 0) 70%)`,
            opacity: activeLevel * 0.85,
          }}
        />
      )}

      {/* Reactive SVGs */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[70%] opacity-90 transition-all duration-300"
        style={{
          filter: colors.glowRadius > 0 ? `drop-shadow(0 0 ${colors.glowRadius}px ${colors.stroke1})` : "none"
        }}
      >
        <defs>
          <linearGradient id="wave-grad-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke1} stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(4, 8, 22, 0)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke2} stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgba(4, 8, 22, 0)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-grad-3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke3} stopOpacity="0.6" />
            <stop offset="100%" stopColor="rgba(4, 8, 22, 0)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={path3}
          fill="url(#wave-grad-3)"
          stroke={colors.stroke3}
          strokeWidth="0.15"
          className="transition-colors duration-500"
        />

        <motion.path
          d={path2}
          fill="url(#wave-grad-2)"
          stroke={colors.stroke2}
          strokeWidth="0.2"
          className="transition-colors duration-500"
        />

        <motion.path
          d={path1}
          fill="url(#wave-grad-1)"
          stroke={colors.stroke1}
          strokeWidth="0.25"
          className="transition-colors duration-500"
        />
      </svg>
      
      {/* Audio reactive Telemetric HUD Grid */}
      <div 
        className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[7.5px] tracking-wider text-[#00f3ff]/40 transition-opacity duration-300"
        style={{ opacity: status === "speaking" ? 0.75 + activeLevel * 0.25 : 0.35 }}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-1 h-1 bg-[#00f3ff] rounded-full ${status === "speaking" ? "animate-pulse" : ""}`} />
          SPEECH FREQUENCY: {Math.floor((activeLevel * 100))}%
        </span>
        <span>
          GAIN CALIBRATION: {activeLevel > 0 ? "LIVE_SPEAKER" : "STANDBY"}
        </span>
      </div>
    </div>
  );
}

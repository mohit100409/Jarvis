import React from "react";
import { motion } from "motion/react";

export function JarvisCoreLogo() {
  return (
    <div 
      draggable="false"
      className="flex flex-col items-center justify-center select-none relative z-10 w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] pointer-events-none"
    >
      {/* 3D Arc Reactor Holographic Container */}
      <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center">
        
        {/* Reactor Core Central Blueprint SVG */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
        >
          <defs>
            {/* Neon Linear metal bevel gradient */}
            <linearGradient id="metalBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="30%" stopColor="#475569" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Glowing inner triangle gradient */}
            <linearGradient id="crystalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0077b6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#03045e" stopOpacity="0.9" />
            </linearGradient>

            {/* Inverted central core white-hot glare */}
            <radialGradient id="sunburst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#d8f3dc" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00f3ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Bezel Ring Shadow */}
            <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Paths for standard top-arc curved text wrapping */}
            {/* We start at 215 degrees and sweep to -35 degrees (clockwise) representing the top-half arch */}
            <path
              id="topTextPath"
              d="M 60,200 A 140,140 0 0,1 340,200"
              fill="none"
            />
          </defs>

          {/* LAYER 1: Ambient outer dark structural ring */}
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="url(#metalBevel)"
            strokeWidth="3.5"
            strokeOpacity="0.4"
          />

          {/* LAYER 2: Highly technical tick marks on outer bezel */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const r1 = 175;
            const r2 = i % 3 === 0 ? 168 : 171;
            const x1 = 200 + r1 * Math.cos(angle);
            const y1 = 200 + r1 * Math.sin(angle);
            const x2 = 200 + r2 * Math.cos(angle);
            const y2 = 200 + r2 * Math.sin(angle);
            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 3 === 0 ? "#00f3ff" : "#1e293b"}
                strokeWidth={i % 3 === 0 ? "1.5" : "1"}
                strokeOpacity={i % 3 === 0 ? "0.6" : "0.3"}
              />
            );
          })}

          {/* LAYER 3: Outer Blue Laser Bezel Line */}
          <circle
            cx="200"
            cy="200"
            r="160"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />

          {/* LAYER 4: Tech Bezels & Curved Labels along path from the PNG */}
          <g>
            {/* The Curved Text along Vector Path */}
            <text className="font-sans text-[9px] font-black tracking-[0.22em] fill-slate-300 uppercase">
              {/* Left-aligned text: AI_OS // CORE v.2.4 */}
              <textPath href="#topTextPath" startOffset="8%">
                AI_OS // CORE v.2.4
              </textPath>
            </text>

            <text className="font-sans text-[9px] font-black tracking-[0.22em] fill-[#00f3ff] uppercase">
              {/* Right-aligned text: STATUS // OPTIMAL */}
              <textPath href="#topTextPath" startOffset="57%">
                STATUS // OPTIMAL
              </textPath>
            </text>
          </g>

          {/* LAYER 5: Holographic Rotating Tech Ring (Dashed/Animated) */}
          <motion.circle
            cx="200"
            cy="200"
            r="135"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="3.5"
            strokeDasharray="18 10 4 10 35 15"
            strokeOpacity="0.5"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            style={{ transformOrigin: "200px 200px" }}
          />

          {/* LAYER 6: Hexagonal / Decagonal Metallic Heavy Core Frame */}
          <polygon
            points="200,85 270,105 315,160 315,240 270,295 200,315 130,295 85,240 85,160 130,105"
            fill="none"
            stroke="url(#metalBevel)"
            strokeWidth="5.5"
            filter="url(#shadowGlow)"
          />
          <polygon
            points="200,85 270,105 315,160 315,240 270,295 200,315 130,295 85,240 85,160 130,105"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* LAYER 7: Floating Concentric Support Rings */}
          <circle
            cx="200"
            cy="200"
            r="105"
            fill="none"
            stroke="#0096c7"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeOpacity="0.3"
          />

          <motion.circle
            cx="200"
            cy="200"
            r="95"
            fill="none"
            stroke="#00f3ff"
            strokeWidth="1"
            strokeDasharray="40 10 15 8"
            strokeOpacity="0.6"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{ transformOrigin: "200px 200px" }}
          />

          {/* LAYER 8: The Outer Heavy Inverted Energy Triangle (Reactor Chamber) */}
          {/* Coordinates centered cleanly: top left index (110, 140), top right (290, 140), bottom center (200, 296) */}
          <polygon
            points="110,135 290,135 200,291"
            fill="url(#crystalGlow)"
            stroke="#00f3ff"
            strokeWidth="2.5"
            className="opacity-90"
          />

          {/* LAYER 9: Embedded Tech dot matrix within the glowing delta chamber */}
          <g opacity="0.45">
            {/* Standard coordinate mapping for technical dots inside the triangle */}
            <circle cx="200" cy="160" r="1.5" fill="#ffffff" />
            <circle cx="180" cy="175" r="1.5" fill="#ffffff" />
            <circle cx="200" cy="175" r="1.5" fill="#ffffff" />
            <circle cx="220" cy="175" r="1.5" fill="#ffffff" />
            <circle cx="165" cy="195" r="1.5" fill="#ffffff" />
            <circle cx="185" cy="195" r="1.5" fill="#ffffff" />
            <circle cx="200" cy="195" r="1.5" fill="#ffffff" />
            <circle cx="215" cy="195" r="1.5" fill="#ffffff" />
            <circle cx="235" cy="195" r="1.5" fill="#ffffff" />
            <circle cx="178" cy="215" r="1.5" fill="#ffffff" />
            <circle cx="200" cy="215" r="1.5" fill="#ffffff" />
            <circle cx="222" cy="215" r="1.5" fill="#ffffff" />
            <circle cx="190" cy="235" r="1.5" fill="#ffffff" />
            <circle cx="210" cy="235" r="1.5" fill="#ffffff" />
            <circle cx="200" cy="255" r="1.5" fill="#ffffff" />
          </g>

          {/* LAYER 10: Inverted Inner Energy Triangle */}
          <polygon
            points="132,148 268,148 200,266"
            fill="#03045e"
            fillOpacity="0.75"
            stroke="#00ffff"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />

          {/* LAYER 11: The Core Element Sparkler (Bright White-Hot Central Triangle Core) */}
          <motion.polygon
            points="155,160 245,160 200,238"
            fill="url(#crystalGlow)"
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />

          {/* Central supercharged flare sphere */}
          <motion.circle
            cx="200"
            cy="186"
            r="42"
            fill="url(#sunburst)"
            className="pointer-events-none mix-blend-screen"
            animate={{ scale: [0.94, 1.06, 0.94] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          {/* Concentric ultra-bright crystal refraction lines */}
          <g stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1">
            <line x1="200" y1="186" x2="110" y2="135" /> {/* Top left vertex link */}
            <line x1="200" y1="186" x2="290" y2="135" /> {/* Top right vertex link */}
            <line x1="200" y1="186" x2="200" y2="291" /> {/* Bottom center vertex link */}
            
            {/* Concentric metallic ribs holding the triangular crystal core */}
            <line x1="200" y1="85" x2="200" y2="135" stroke="#00f3ff" strokeOpacity="0.5" strokeWidth="2" />
            <line x1="270" y1="295" x2="200" y2="210" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" />
            <line x1="130" y1="295" x2="200" y2="210" stroke="#00f3ff" strokeOpacity="0.2" strokeWidth="1" />
          </g>

          {/* Micro dots of energy swirling outside triangle */}
          <circle cx="160" cy="118" r="3" fill="#00f3ff" className="animate-pulse" />
          <circle cx="240" cy="118" r="3" fill="#00f3ff" className="animate-pulse animate-delay-150" />
          <circle cx="200" cy="328" r="3.5" fill="#00f3ff" className="animate-pulse animate-delay-300" />
        </svg>
      </div>
    </div>
  );
}

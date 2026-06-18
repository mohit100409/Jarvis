import React, { useMemo } from "react";
import { motion } from "motion/react";

interface FluidTypewriterProps {
  text: string;
  speedMultiplier?: number;
  className?: string;
  glow?: boolean;
}

export default function FluidTypewriter({ 
  text, 
  speedMultiplier = 1, 
  className = "", 
  glow = false 
}: FluidTypewriterProps) {
  // Handle empty or falsy text values gracefully
  if (!text) return null;

  // Split words or characters
  const words = useMemo(() => text.split(" "), [text]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.045 / speedMultiplier,
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 6,
      scale: 0.93,
      filter: glow ? "blur(3px) brightness(1.3)" : "blur(0px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      filter: "blur(0px) brightness(1)",
      transition: {
        type: "spring",
        stiffness: 180,
        damping: 18,
      }
    }
  };

  return (
    <motion.span 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap gap-x-1 sm:gap-x-1.5 ${className}`}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={wordVariants}
          className="inline-block transform-gpu origin-center"
          style={{
            textShadow: glow ? "0 0 8px rgba(0, 243, 255, 0.3)" : "none",
            willChange: "transform, opacity"
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

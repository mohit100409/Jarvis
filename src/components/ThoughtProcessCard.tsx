import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface ThoughtProcessCardProps {
  thoughtProcess: string;
  isTypingActive: boolean;
}

export function ThoughtProcessCard({ thoughtProcess, isTypingActive }: ThoughtProcessCardProps) {
  const [isOpen, setIsOpen] = useState(isTypingActive);

  // Auto-collapse when typing finishes
  useEffect(() => {
    if (!isTypingActive) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isTypingActive]);

  if (!thoughtProcess) return null;

  return (
    <div className="mb-3 w-full border border-slate-700/50 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isTypingActive ? (
            <div className="relative w-5 h-5 flex items-center justify-center text-[#00f3ff]">
              <Brain size={14} className="animate-pulse" />
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-[#00f3ff]/30 border-t-[#00f3ff]"
              />
            </div>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          )}
          <span className={`text-[11px] font-mono font-medium ${isTypingActive ? 'text-[#00f3ff]' : 'text-slate-400'}`}>
            {isTypingActive ? 'AGENTIC REASONING IN PROGRESS' : 'THOUGHT PROCESS'}
          </span>
        </div>
        {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-1 text-[13px] text-slate-300 font-sans border-t border-slate-700/30">
              <div className="whitespace-pre-wrap leading-relaxed opacity-80">
                {thoughtProcess}
              </div>
              {isTypingActive && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                  className="inline-block w-1.5 h-3 bg-[#00f3ff] rounded-xs ml-1 align-middle"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

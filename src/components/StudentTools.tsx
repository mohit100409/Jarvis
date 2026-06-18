import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, Timer, HelpCircle, Save, Plus, Check, Trash2, RotateCw } from "lucide-react";
import { Flashcard, StudyTask } from "../types";

function cleanMathLaTeX(text: string): string {
  if (!text) return "";
  let s = text;
  
  // Handle fractions recursively to resolve nested \frac{}{}
  let prev;
  do {
    prev = s;
    s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");
  } while (s !== prev);

  // Handle square roots recursively
  do {
    prev = s;
    s = s.replace(/\\sqrt\s*\{([^{}]+)\}/g, "√($1)");
  } while (s !== prev);
  s = s.replace(/\\sqrt\b/g, "√");

  // Subscript conversion for common characters
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
  };
  s = s.replace(/_([0-9aehijklmnoprstuvx])/g, (_, char) => subscriptMap[char] || `_${char}`);

  // Common mathematical symbols
  s = s.replace(/\\cdot\b/g, " • ");
  s = s.replace(/\\times\b/g, " × ");
  s = s.replace(/\\div\b/g, " ÷ ");
  s = s.replace(/\\int\b/g, "∫");
  s = s.replace(/\\ln\b/g, "ln");
  s = s.replace(/\\sin\b/g, "sin");
  s = s.replace(/\\cos\b/g, "cos");
  s = s.replace(/\\tan\b/g, "tan");
  s = s.replace(/\\sec\b/g, "sec");
  s = s.replace(/\\pi\b/g, "π");
  s = s.replace(/\\Delta\b/g, "∆");
  s = s.replace(/\\theta\b/g, "θ");
  s = s.replace(/\\alpha\b/g, "α");
  s = s.replace(/\\beta\b/g, "β");
  s = s.replace(/\\gamma\b/g, "γ");
  s = s.replace(/\\infty\b|\\infinity\b/g, "∞");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\neq\b/g, "≠");
  s = s.replace(/\\le\b|\\leq\b/g, "≤");
  s = s.replace(/\\ge\b|\\geq\b/g, "≥");
  s = s.replace(/\\deg\b/g, "°");

  // Super-script conversion for common characters
  const superscriptMap: Record<string, string> = {
    '2': '²', '3': '³', 'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ'
  };
  s = s.replace(/\^([23nxy])/g, (_, char) => superscriptMap[char] || `^${char}`);

  // Strip LaTeX double backslashes
  s = s.replace(/\\([a-zA-Z]+)\b/g, "$1");
  
  // Remove the $ signs if they surround equations
  s = s.replace(/\$([^$]+)\$/g, "$1");

  return s;
}

export default function StudentTools() {
  const [activeTab, setActiveTab] = useState<"timer" | "flashcards" | "math">("timer");

  // State for Pomodoro Focus timer
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusType, setFocusType] = useState<"Focus" | "Short Break" | "Long Break">("Focus");

  // State for Flashcards creator
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: "1", front: "What is Mitosis?", back: "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus." },
    { id: "2", front: "What is the formula for Einstein's mass-energy equivalence?", back: "E = mc²" },
  ]);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

  // State for Math expression input & LaTeX visualization
  const [mathQuery, setMathQuery] = useState("");
  const [mathSolution, setMathSolution] = useState("");
  const [mathLoading, setMathLoading] = useState(false);

  // Focus Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      // alert mock or sound
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.play().catch(() => {});
      if (focusType === "Focus") {
        setFocusType("Short Break");
        setTimeLeft(5 * 60);
      } else {
        setFocusType("Focus");
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, focusType]);

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(focusType === "Focus" ? 25 * 60 : focusType === "Short Break" ? 5 * 60 : 15 * 60);
  };

  const handleFocusTypeChange = (type: "Focus" | "Short Break" | "Long Break") => {
    setFocusType(type);
    setTimerRunning(false);
    setTimeLeft(type === "Focus" ? 25 * 60 : type === "Short Break" ? 5 * 60 : 15 * 60);
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Add customized Flashcard
  const handleAddFlashcard = () => {
    if (!newFront.trim() || !newBack.trim()) return;
    const item: Flashcard = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 9),
      front: newFront.trim(),
      back: newBack.trim(),
    };
    setFlashcards([item, ...flashcards]);
    setNewFront("");
    setNewBack("");
  };

  const deleteFlashcard = (id: string) => {
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  // Simulate solving mathematical equations beautifully
  const handleSolveMath = async () => {
    if (!mathQuery.trim()) return;
    setMathLoading(true);
    setMathSolution("");
    try {
      const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
      const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";
      
      const response = await fetch("/api/jarvis-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Explain and solve this math step-by-step. Render formulas in clear text or simple math symbols. Problem: ${mathQuery}`,
          mode: "All Rounder",
          user_api_key: savedGeminiKey,
          systemPrompt: "You are an expert Math tutor. Break down calculations into clear, readable, logical equations for the operator.",
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setMathSolution(data.reply);
      } else {
        setMathSolution("Sorry, I could not solve this equation. Please check your Gemini API key configuration.");
      }
    } catch (e: any) {
      setMathSolution("An error occurred connecting to the helper backend solver.");
    } finally {
      setMathLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md shadow-xl text-slate-100">
      {/* Category Selection Tabs */}
      <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6 gap-1 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("timer")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "timer"
              ? "bg-blue-600 shadow-md text-white border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Timer size={16} /> Pomodoro Timer
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "flashcards"
              ? "bg-blue-600 shadow-md text-white border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen size={16} /> Flashcards
        </button>
        <button
          onClick={() => setActiveTab("math")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "math"
              ? "bg-blue-600 shadow-md text-white border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <HelpCircle size={16} /> Math Solver
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="min-h-[300px]">
        {/* TAB 1: Pomodoro Study Focus Timer */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {/* Break selection options */}
            <div className="flex gap-2 mb-8 bg-slate-950/40 p-1 rounded-xl">
              {(["Focus", "Short Break", "Long Break"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleFocusTypeChange(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    focusType === type ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Glowing Big Digital Clock */}
            <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse -z-10" />
              <div className="w-56 h-56 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950/60 text-slate-100 shadow-inner group-hover:border-blue-500/40 transition-colors duration-300">
                <span className="font-mono text-5xl font-bold tracking-tight text-blue-400">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs uppercase font-mono tracking-widest text-slate-500 mt-2">
                  {focusType} TIME
                </span>
              </div>
            </div>

            {/* Play, Stop, and Refresh actions */}
            <div className="flex gap-4 items-center justify-center">
              <button
                onClick={toggleTimer}
                className={`px-8 py-3 rounded-full text-base font-bold shadow-md transition-all active:scale-95 ${
                  timerRunning
                    ? "bg-red-500 hover:bg-red-600 text-white border border-red-400/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30"
                }`}
              >
                {timerRunning ? "PAUSE FOCUS" : "START FOCUS"}
              </button>
              <button
                onClick={resetTimer}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700/60 active:scale-95 transition-all"
              >
                <RotateCw size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-6 max-w-sm">
              Use this Pomodoro tool to organize work & productivity sessions into productive chunks. Alarm rings when finished.
            </p>
          </div>
        )}

        {/* TAB 2: Dynamic Flashcards System */}
        {activeTab === "flashcards" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Creator form */}
              <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-300 mb-1">Create Recall Flashcard</h4>
                <input
                  type="text"
                  placeholder="Question / Front Concept..."
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500/50 transition-colors"
                />
                <textarea
                  placeholder="Answer / Solution..."
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  onClick={handleAddFlashcard}
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold leading-none flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Plus size={14} /> Add Card to Deck
                </button>
              </div>

              {/* Tips for study */}
              <div className="flex flex-col justify-center p-5 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
                <p className="font-semibold text-slate-300 mb-2">💡 Quick Flashcard Tips</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Write short questions for better recall.</li>
                  <li>Click cards to reveal the answers.</li>
                  <li>Incorporate equations, definitions, & dates.</li>
                  <li>Delete old cards to keep decks customized.</li>
                </ul>
              </div>
            </div>

            {/* Deck visualization */}
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              📖 Active Deck ({flashcards.length})
            </h3>

            {flashcards.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-950/10 rounded-2xl border border-dashed border-slate-800">
                Deck is empty. Create flashcards above to begin reviewing.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {flashcards.map((card) => {
                  const isRevealed = revealedCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setRevealedCardId(isRevealed ? null : card.id)}
                      className={`min-h-[140px] p-5 rounded-2xl border cursor-pointer select-none relative transition-all duration-300 flex flex-col justify-between ${
                        isRevealed
                          ? "bg-slate-800/80 border-emerald-500/50 shadow-emerald-500/5"
                          : "bg-slate-950/60 border-slate-800 shadow-md hover:border-slate-700"
                      }`}
                    >
                      {/* Badge identifier */}
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full w-fit ${
                        isRevealed ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {isRevealed ? "Answer / Solution" : "Concept / Question"}
                      </span>

                      <div className="my-3 text-sm font-semibold text-slate-200 leading-relaxed text-center">
                        {isRevealed ? card.back : card.front}
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-900/40">
                        <span>Click to Flip</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFlashcard(card.id);
                          }}
                          className="hover:text-red-400 p-1 rounded transition-colors text-slate-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Advanced math step solver */}
        {activeTab === "math" && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
                🧮 LaTeX & Algebraic Math Solver
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Need to understand complex math steps? Enter any calculus, algebra, or geometry question (including formulas like dx/dy or matrix multiplications). JARVIS will explain the theory and solve it.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Integrate 3x^2 dx, Solve for x: 5x + 12 = 32..."
                  value={mathQuery}
                  onChange={(e) => setMathQuery(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500/60 transition-colors"
                />
                <button
                  onClick={handleSolveMath}
                  disabled={mathLoading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 rounded-xl font-bold text-sm tracking-wide text-white transition-colors flex items-center justify-center gap-2"
                >
                  {mathLoading ? "SOLVING..." : "SOLVE"}
                </button>
              </div>
            </div>

            {/* Answer display box */}
            {mathSolution && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl font-sans"
              >
                <h5 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1.5 flex justify-between">
                  <span>Step-by-Step Breakdown</span>
                  <span className="text-slate-400">MATH INTEGRATION</span>
                </h5>
                <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {cleanMathLaTeX(mathSolution)}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

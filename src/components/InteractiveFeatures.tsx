import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { safeCopyToClipboard } from "../firebase";
import {
  X,
  CloudSun,
  CheckCircle2,
  FileText,
  Key,
  Code,
  ListRestart,
  Music,
  Smile,
  RotateCcw,
  Calculator,
  Timer,
  BookOpen,
  Calendar,
  Layers,
  Search,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  BadgeAlert,
  Cpu,
  Tv,
  ExternalLink,
  Sparkles,
  Bell,
  Clock
} from "lucide-react";

interface InteractiveFeaturesProps {
  onClose: () => void;
  username: string;
  theme: "cosmic" | "slate" | "note";
  initialActivePopup?: string | null;
}

export default function InteractiveFeatures({ onClose, username, theme, initialActivePopup = null }: InteractiveFeaturesProps) {
  const [activePopup, setActivePopup] = useState<string | null>(initialActivePopup);

  useEffect(() => {
    if (initialActivePopup) {
      setActivePopup(initialActivePopup);
    } else {
      onClose();
    }
  }, [initialActivePopup, onClose]);

  useEffect(() => {
    if (!activePopup) {
      onClose();
    }
  }, [activePopup, onClose]);

  if (!activePopup) {
    return null;
  }

  return (
    <ModulePopup
      id={activePopup}
      onClose={() => setActivePopup(null)}
      username={username}
      theme={theme}
    />
  );
}

interface ModulePopupProps {
  id: string;
  onClose: () => void;
  username: string;
  theme: "cosmic" | "slate" | "note";
}

function ModulePopup({ id, onClose, username, theme }: ModulePopupProps) {
  // 1. Weather State
  const [city, setCity] = useState("San Francisco");
  const [temp, setTemp] = useState(72);
  
  // 2. Todo State
  interface TodoItem {
    id: number;
    text: string;
    done: boolean;
    priority: "high" | "medium" | "low";
    category: string;
    reminderTime?: string;
    reminderTriggered?: boolean;
  }

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_todos_list");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 1, text: "Revise university study notes", done: false, priority: "high", category: "Study" },
      { id: 2, text: "Configure Google API authorization keys", done: true, priority: "medium", category: "Development" },
      { id: 3, text: "Verify robotic emotional rendering logic", done: false, priority: "low", category: "Personal" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("jarvis_todos_list", JSON.stringify(todos));
  }, [todos]);

  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newCategory, setNewCategory] = useState<string>("Study");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [todoReminder, setTodoReminder] = useState(""); // HH:MM
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);

  // 3. Notes State
  const [noteTitle, setNoteTitle] = useState("Algebra Summary Log");
  const [noteBody, setNoteBody] = useState("JARVIS Companion notes. Remember to study limits, derivative sequences, and polynomial equations this afternoon.");
  const [savingNotes, setSavingNotes] = useState(false);

  // 4. Password State
  const [passLength, setPassLength] = useState(16);
  const [passValue, setPassValue] = useState("jA9$eW2!oP9_lK1*");
  const [copiedPass, setCopiedPass] = useState(false);

  // 5. Code State
  const [codeLang, setCodeLang] = useState("TypeScript");
  const [generatedCode, setGeneratedCode] = useState(`// Infinite Sliding Window Algorithm in ${codeLang}
function findMaxSubarraySum(arr: number[], k: number): number {
  let maxSum = 0, windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`);

  // 6. Summarizer State
  const [sumText, setSumText] = useState("Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence of human beings. Web API algorithms help synchronize text-to-speech with natural physical mouth animation coordinates recursively across full stack servers.");
  const [summaryBullet, setSummaryBullet] = useState("- AI opposes human natural cognition.\n- Synchronizes TTS modules with robot graphics.\n- Runs on full stack sandboxed dev interfaces.");

  // 7. Oracle Guess Game State
  const [secretNum] = useState(37);
  const [userGuess, setUserGuess] = useState("");
  const [oracleHint, setOracleHint] = useState("Give a number input between 1 and 100 to challenge Jarvis!");

  // 8. Jokes State
  const [currentJoke, setCurrentJoke] = useState("Why do programmers wear glasses? Because they cannot C#!");

  // 9. Converter Real-Time Bidirectional State
  const [tempCelsius, setTempCelsius] = useState("100");
  const [tempFahrenheit, setTempFahrenheit] = useState("212");
  const [distMiles, setDistMiles] = useState("10");
  const [distKm, setDistKm] = useState("16.09");
  const [weightKg, setWeightKg] = useState("5");
  const [weightLbs, setWeightLbs] = useState("11.02");

  const handleCelsiusChange = (val: string) => {
    setTempCelsius(val);
    if (val === "" || isNaN(Number(val))) {
      setTempFahrenheit("");
    } else {
      const converted = (Number(val) * 9) / 5 + 32;
      setTempFahrenheit(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleFahrenheitChange = (val: string) => {
    setTempFahrenheit(val);
    if (val === "" || isNaN(Number(val))) {
      setTempCelsius("");
    } else {
      const converted = ((Number(val) - 32) * 5) / 9;
      setTempCelsius(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleMilesChange = (val: string) => {
    setDistMiles(val);
    if (val === "" || isNaN(Number(val))) {
      setDistKm("");
    } else {
      const converted = Number(val) * 1.609344;
      setDistKm(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleKmChange = (val: string) => {
    setDistKm(val);
    if (val === "" || isNaN(Number(val))) {
      setDistMiles("");
    } else {
      const converted = Number(val) / 1.609344;
      setDistMiles(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleKgChange = (val: string) => {
    setWeightKg(val);
    if (val === "" || isNaN(Number(val))) {
      setWeightLbs("");
    } else {
      const converted = Number(val) * 2.20462;
      setWeightLbs(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  const handleLbsChange = (val: string) => {
    setWeightLbs(val);
    if (val === "" || isNaN(Number(val))) {
      setWeightKg("");
    } else {
      const converted = Number(val) / 2.20462;
      setWeightKg(converted.toFixed(2).replace(/\.00$/, ""));
    }
  };

  // 10. Timer Custom Countdown State
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min default
  const [timerHoursInput, setTimerHoursInput] = useState(0);
  const [timerMinutesInput, setTimerMinutesInput] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinishedMessage, setTimerFinishedMessage] = useState("");

  const syncCustomTimer = (hours: number, minutes: number) => {
    setTimerHoursInput(hours);
    setTimerMinutesInput(minutes);
    setTimerSeconds((hours * 3600) + (minutes * 60));
    setTimerFinishedMessage("");
  };

  const handleTimerExpiration = () => {
    setTimerFinishedMessage("Timer reaches zero! Task Session complete.");
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (_) {}

    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Attention, custom countdown timer reaches zero! Take a break now.");
        window.speechSynthesis.speak(utterance);
      }
    } catch (_) {}
  };

  // 11. Wikipedia Real-Time Scholar
  const [wikiQuery, setWikiQuery] = useState("Machine Learning");
  const [wikiResult, setWikiResult] = useState("Machine learning is a field of study in artificial intelligence concerned with the development and study of statistical algorithms that can learn from data and generalize to unseen tasks.");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState("");

  const triggerWikiSearch = async () => {
    if (!wikiQuery.trim()) return;
    setWikiLoading(true);
    setWikiError("");
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery.trim())}`);
      if (!res.ok) {
        throw new Error("Page not found");
      }
      const data = await res.json();
      if (data.extract) {
        setWikiResult(data.extract);
      } else {
        setWikiResult("No summary details found for this topic.");
      }
    } catch (err: any) {
      setWikiResult("Could not fetch scholar details. Search query might be too specific or misspelled. Try 'Artificial Intelligence', 'DNA', or 'Physics'.");
      setWikiError(err.message || "Error");
    } finally {
      setWikiLoading(false);
    }
  };

  // 12. Student Briefings live task reminders
  const [briefings, setBriefings] = useState<{ id: string; time: string; task: string; enabled: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_schedule_briefings");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: "b-1", time: "09:00 AM", task: "Analyze machine learning derivative math sheets", enabled: true },
      { id: "b-2", time: "11:30 AM", task: "Submit active software deployment logs", enabled: true },
      { id: "b-3", time: "02:00 PM", task: "JARVIS live core synthetic dialogue evaluation", enabled: true },
      { id: "b-4", time: "05:00 PM", task: "Evening physical exercise training session", enabled: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem("jarvis_schedule_briefings", JSON.stringify(briefings));
  }, [briefings]);

  const [newBriefingTime, setNewBriefingTime] = useState("09:00");
  const [newBriefingTask, setNewBriefingTask] = useState("");
  const [triggeredIds, setTriggeredIds] = useState<string[]>([]);

  const formatTime12Hour = (timeString: string) => {
    if (!timeString) return "";
    const [hourStr, minStr] = timeString.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    const formattedMin = minute < 10 ? "0" + minute : minute;
    return `${hour}:${formattedMin} ${ampm}`;
  };

  const addBriefing = () => {
    if (!newBriefingTask.trim()) return;
    const formattedTime = formatTime12Hour(newBriefingTime);
    const newB = {
      id: `b-${Date.now()}`,
      time: formattedTime,
      task: newBriefingTask.trim(),
      enabled: true
    };
    setBriefings(prev => [...prev, newB]);
    setNewBriefingTask("");
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (_) {}
  };

  const deleteBriefing = (id: string) => {
    setBriefings(prev => prev.filter(b => b.id !== id));
  };

  const toggleBriefing = (id: string) => {
    setBriefings(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  // Check reminder alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      let hour = now.getHours();
      const minute = now.getMinutes();
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      hour = hour ? hour : 12;
      const formattedTimeStr = `${hour}:${minute < 10 ? "0" + minute : minute} ${ampm}`;

      // 24-hr format comparison for Todo Items
      const currentHHMM = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      briefings.forEach((b) => {
        if (b.enabled && b.time === formattedTimeStr && !triggeredIds.includes(b.id)) {
          setTriggeredIds(prev => [...prev, b.id]);
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("JARVIS Reminder Log", { body: b.task });
          } else {
            alert(`⏰ REMINDER: ${b.task}`);
          }

          try {
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(`Reminder, it's now ${b.time}. Time for ${b.task}`);
              window.speechSynthesis.speak(utterance);
            }
          } catch (_) {}
        }
      });

      // Check Todo reminders
      todos.forEach((t) => {
        if (!t.done && t.reminderTime && t.reminderTime === currentHHMM && !t.reminderTriggered) {
          // Mark as triggered so we only alert once in that minute block
          setTodos(prev => prev.map(item => item.id === t.id ? { ...item, reminderTriggered: true } : item));

          // HTML5 System Notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("JARVIS Task Reminder", { body: `Master, it's time to do: "${t.text}"` });
          } else if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("JARVIS Task Reminder", { body: `Master, it's time to do: "${t.text}"` });
              }
            });
          }

          // Spoken notification
          try {
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(`Excuse me, this is a scheduled reminder for you. It is time to complete ${t.text}`);
              window.speechSynthesis.speak(utterance);
            }
          } catch (_) {}

          // Audio chime trigger
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.value = 587.33; // D5 pitch chime
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.6);
          } catch (_) {}
        }
      });
    };
    const interval = setInterval(checkAlarms, 15000);
    return () => clearInterval(interval);
  }, [briefings, triggeredIds, todos]);

  // 13. System Metrics State
  const [cpuUsage, setCpuUsage] = useState(34);
  const [memUsage, setMemUsage] = useState(58);

  // 14. AI Creator Studio States
  const [creatorTab, setCreatorTab] = useState<"image" | "video">("image");
  const [creatorImagePrompt, setCreatorImagePrompt] = useState("");
  const [creatorImageAspect, setCreatorImageAspect] = useState("1:1");
  const [creatorImageUrl, setCreatorImageUrl] = useState<string | null>(null);
  const [creatorImageGenerating, setCreatorImageGenerating] = useState(false);
  const [creatorImageError, setCreatorImageError] = useState("");
  const [creatorImageModel, setCreatorImageModel] = useState("imagen-3.0-fast-001");
  const [creatorImageSize, setCreatorImageSize] = useState("1K");

  const [creatorVideoPrompt, setCreatorVideoPrompt] = useState("");
  const [creatorVideoAspect, setCreatorVideoAspect] = useState("16:9");
  const [creatorVideoUrl, setCreatorVideoUrl] = useState<string | null>(null);
  const [creatorVideoGenerating, setCreatorVideoGenerating] = useState(false);
  const [creatorVideoError, setCreatorVideoError] = useState("");
  const [creatorVideoStatusText, setCreatorVideoStatusText] = useState("");
  const [creatorVideoModel, setCreatorVideoModel] = useState("veo-1.0-fast-preview");
  const [creatorVideoResolution, setCreatorVideoResolution] = useState("1080p");

  // Handler for Image Generation using Best-in-Class Imagen Model
  const handleGenerateImage = async () => {
    if (!creatorImagePrompt.trim()) return;
    setCreatorImageGenerating(true);
    setCreatorImageError("");
    setCreatorImageUrl(null);

    const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
    const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

    try {
      const response = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: creatorImagePrompt.trim(),
          aspectRatio: creatorImageAspect,
          user_api_key: savedGeminiKey,
          model: creatorImageModel,
          imageSize: creatorImageSize
        })
      });

      const data = await response.json();
      if (!response.ok || data.status === "error") {
        throw new Error(data.message || `HTTP Server Error ${response.status}`);
      }

      if (data.imageUrl) {
        setCreatorImageUrl(data.imageUrl);
      } else {
        throw new Error("Invalid response format: No image payload received.");
      }
    } catch (error: any) {
      console.error("Image generation failed:", error);
      setCreatorImageError(error.message || "An unexpected error occurred during synthesis.");
    } finally {
      setCreatorImageGenerating(false);
    }
  };

  // Handler for Video Generation using Best-in-Class Veo Model
  const handleGenerateVideo = async () => {
    if (!creatorVideoPrompt.trim()) return;
    setCreatorVideoGenerating(true);
    setCreatorVideoError("");
    setCreatorVideoUrl(null);
    setCreatorVideoStatusText("JARVIS Enqueueing video synthesis vector operation...");

    const keys = JSON.parse(localStorage.getItem("jarvis_api_keys") || "{}");
    const savedGeminiKey = keys.gemini || localStorage.getItem("jarvis_gemini_key") || "";

    try {
      // 1. Trigger the video generate endpoint
      const response = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: creatorVideoPrompt.trim(),
          aspectRatio: creatorVideoAspect,
          user_api_key: savedGeminiKey,
          model: creatorVideoModel,
          resolution: creatorVideoResolution
        })
      });

      const data = await response.json();
      if (!response.ok || data.status === "error") {
        throw new Error(data.message || `HTTP Server Error ${response.status}`);
      }

      const operationName = data.operationName;
      if (!operationName) {
        throw new Error("No operationName returned from Video API.");
      }

      setCreatorVideoStatusText("Operation enqueued. Polling synthesis coordinates...");

      // 2. Poll status recursively
      let attempts = 0;
      const maxAttempts = 25; // Loop for up to 100 seconds

      const pollStatus = async () => {
        attempts++;
        setCreatorVideoStatusText(`Synthesizing motion frames... [Step ${attempts}/${maxAttempts}]`);

        try {
          const statusRes = await fetch("/api/video-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              operationName,
              user_api_key: savedGeminiKey
            })
          });

          const statusData = await statusRes.json();
          if (!statusRes.ok) {
            throw new Error(statusData.message || "Emanated operation poll failures.");
          }

          if (statusData.done) {
            setCreatorVideoStatusText("Frames synthesized! Creating secure streaming link...");
            
            // Re-download and create a local client Object URL for real-time video playback HTML tags!
            const downloadRes = await fetch("/api/video-download", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                operationName,
                user_api_key: savedGeminiKey
              })
            });

            if (!downloadRes.ok) {
              throw new Error("Failed to stream compiled visual files from proxy server.");
            }

            const videoBlob = await downloadRes.blob();
            const localObjUrl = URL.createObjectURL(videoBlob);

            setCreatorVideoUrl(localObjUrl);
            setCreatorVideoGenerating(false);
            setCreatorVideoStatusText("");
          } else {
            if (attempts >= maxAttempts) {
              setCreatorVideoGenerating(false);
              setCreatorVideoError("Compilation taking too long. Try refreshing coordinates!");
            } else {
              setTimeout(pollStatus, 4000);
            }
          }
        } catch (pollErr: any) {
          console.error("Polling compilation step error:", pollErr);
          setCreatorVideoGenerating(false);
          setCreatorVideoError(pollErr.message || "Video compile operation broke.");
        }
      };

      // Trigger first poll delayed
      setTimeout(pollStatus, 4000);

    } catch (err: any) {
      console.error("Video synthesis failed:", err);
      setCreatorVideoError(err.message || "Could not instantiate video generation request.");
      setCreatorVideoGenerating(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      handleTimerExpiration();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Handle weather refresh
  const triggerWeatherRefresh = () => {
    const randomTemp = Math.floor(Math.random() * 45) + 40; // 40-85
    setTemp(randomTemp);
  };

  // Handle todo toggle
  const toggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : { ...t })));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: newTodo.trim(),
        done: false,
        priority: newPriority,
        category: newCategory,
        reminderTime: todoReminder || undefined,
        reminderTriggered: false
      }
    ]);
    setNewTodo("");
    setTodoReminder("");
    
    // Request permission if they specify a reminder time
    if (todoReminder) {
      try {
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
      } catch (_) {}
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const triggerPasswordGen = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let output = "";
    for (let i = 0; i < passLength; i++) {
      output += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassValue(output);
    setCopiedPass(false);
  };

  const triggerCopyPassword = async () => {
    try {
      const ok = await safeCopyToClipboard(passValue);
      if (ok) {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleGuessSubmit = () => {
    const guess = parseInt(userGuess);
    if (isNaN(guess)) {
      setOracleHint("Please provide a valid integer number!");
      return;
    }
    if (guess === secretNum) {
      setOracleHint("🏆 Sparkles! You guessed it right! The Oracle Matrix is fully cracked.");
    } else if (guess < secretNum) {
      setOracleHint("💧 Too LOW! Try a higher value. Emo robot is whispering clues.");
    } else {
      setOracleHint("💢 Too HIGH! Seek a lower key. Keep going!");
    }
    setUserGuess("");
  };

  const jokes = [
    "Why do programmers wear glasses? Because they cannot C#!",
    "There are 10 kinds of people: those who understand binary, and those who do not.",
    "A SQL query walks into a bar, walks up to two tables and asks: Can I join you?",
    "How many programmers does it take to change a light bulb? None, that is a hardware issue!",
    "What is a programmer's favorite place? The slide-menu workspace."
  ];

  const triggerJokeGen = () => {
    const jokesList = jokes.filter(j => j !== currentJoke);
    const chosen = jokesList[Math.floor(Math.random() * jokesList.length)];
    setCurrentJoke(chosen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`absolute inset-0 z-50 flex flex-col p-4 ${
        theme === "note" ? "bg-[#fffdf4] text-[#3d382d]" : theme === "slate" ? "bg-slate-900 text-slate-100" : "bg-[#050a18] text-[#edf2f7]"
      }`}
    >
      {/* Modal Inner Title */}
      <div className={`pb-3 mb-4 flex justify-between items-center border-b ${
        theme === "note" ? "border-[#e0d9bf]" : "border-slate-800"
      }`}>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
          SYSTEM ACTIVE // {id.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded ${
            theme === "note" ? "hover:bg-slate-200" : "hover:bg-slate-800"
          }`}
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        
        {/* === FEATURE 1: WEATHER HUB === */}
        {id === "weather" && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/20 max-w-xs mx-auto">
              <CloudSun size={36} className="text-amber-400 mx-auto animate-pulse" />
              <h3 className="text-sm font-black mt-2 uppercase">{city}</h3>
              <div className="text-3xl font-extrabold text-white mt-1">{temp}°F</div>
              <p className="text-[10px] font-mono text-slate-400 mt-2">Partly Sunny • Winds NW 12mph</p>
            </div>
            
            <div className="space-y-2 max-w-xs mx-auto text-left">
              <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Change Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 bg-[#020512] border border-sky-500/10 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={triggerWeatherRefresh}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-xl"
                >
                  ROLL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === FEATURE 2: TODO CHECKLIST === */}
        {id === "tools" && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Personal Agenda & Priority Tasks</h3>
            
            {/* Summary Header of remaining High Priority status */}
            {(() => {
              const pendingHighCount = todos.filter((t) => t.priority === "high" && !t.done).length;
              const isNote = theme === "note";
              return (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  isNote 
                    ? "bg-red-50 border-red-200 text-red-700" 
                    : "bg-red-950/25 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                }`}>
                  <span className={`font-mono text-[9px] uppercase tracking-wider font-extrabold ${isNote ? "text-red-800" : "text-red-400/80"}`}>
                    Attention Required
                  </span>
                  <span className="font-bold">
                    {pendingHighCount} High Priority Task{pendingHighCount !== 1 ? "s" : ""} Pending
                  </span>
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Type dynamic action item..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                className="flex-1 bg-[#020512] border border-sky-500/15 rounded-xl px-3 py-2 text-xs text-white"
              />
              <div className="flex gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 bg-[#020512] border border-sky-500/15 rounded-xl px-2.5">
                  <Clock size={11} className="text-[#00f3ff]" />
                  <input
                    type="time"
                    value={todoReminder}
                    onChange={(e) => {
                      setTodoReminder(e.target.value);
                      if ("Notification" in window && Notification.permission === "default") {
                        Notification.requestPermission();
                      }
                    }}
                    className="bg-transparent border-none text-[10.5px] text-[#00f3ff] outline-none w-18 h-full font-mono focus:ring-0 p-0"
                    title="Set Daily Reminder Time"
                  />
                  {todoReminder && (
                    <button 
                      type="button"
                      onClick={() => setTodoReminder("")} 
                      className="text-red-400 font-bold text-[10px] hover:text-red-300 ml-0.5 cursor-pointer"
                      title="Clear Reminder"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  onClick={addTodo}
                  className="px-3 py-2 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-bold font-mono text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Priority Selector segment controller */}
            <div className="flex items-center gap-3 py-1 bg-slate-950/20 backdrop-blur-sm px-3 rounded-xl border border-sky-500/5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">Set Priority:</span>
              <div className="flex gap-1.5 flex-1 justify-end">
                {(["low", "medium", "high"] as const).map((level) => {
                  const isActive = newPriority === level;
                  let colorClass = "";
                  if (isActive) {
                    if (level === "low") colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.15)]";
                    else if (level === "medium") colorClass = "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
                    else colorClass = "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]";
                  } else {
                    colorClass = "bg-transparent text-slate-500 border-transparent hover:border-slate-800 hover:text-slate-400";
                  }
                  
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewPriority(level)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${colorClass}`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Selector segment controller */}
            <div className="flex items-center gap-3 py-1 bg-slate-950/20 backdrop-blur-sm px-3 rounded-xl border border-sky-500/5 mt-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">Set Category:</span>
              <div className="flex gap-1.5 flex-1 justify-end">
                {(["Study", "Personal", "Development"] as const).map((cat) => {
                  const isActive = newCategory === cat;
                  let colorClass = "";
                  if (isActive) {
                    colorClass = "bg-cyan-500/20 text-[#00f3ff] border-[#00f3ff]/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]";
                  } else {
                    colorClass = "bg-transparent text-slate-500 border-transparent hover:border-slate-800 hover:text-slate-400";
                  }
                  
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${colorClass}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Dropdown Area */}
            <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-950/40 border border-[#00f3ff]/15 mt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-ping" />
                Category Filter:
              </span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#020512] border border-[#00f3ff]/20 text-slate-300 hover:text-white rounded-lg px-2 py-1 text-[10px] font-mono outline-none focus:border-[#00f3ff] transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Study">Study Only</option>
                <option value="Personal">Personal Only</option>
                <option value="Development">Development Only</option>
              </select>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto pr-0.5 scrollbar-thin">
              <motion.div
                key={filterCategory + "-" + todos.filter((t) => filterCategory === "All" || t.category === filterCategory).length}
                layout
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
                  {todos
                    .filter((t) => filterCategory === "All" || t.category === filterCategory)
                    .map((t) => {
                      let priorityBorder = "border-slate-200 dark:border-slate-800";
                      let priorityBg = "bg-slate-500/[0.02]";
                      let badgeClass = "";
                      
                      if (t.priority === "high") {
                        priorityBorder = theme === "note" ? "border-red-200" : "border-red-500/20";
                        priorityBg = theme === "note" ? "bg-red-50/50" : "bg-red-500/[0.04]";
                        badgeClass = "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20";
                      } else if (t.priority === "medium") {
                        priorityBorder = theme === "note" ? "border-amber-200" : "border-amber-500/20";
                        priorityBg = theme === "note" ? "bg-amber-50/50" : "bg-amber-500/[0.04]";
                        badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
                      } else {
                        priorityBorder = theme === "note" ? "border-blue-200" : "border-blue-500/20";
                        priorityBg = theme === "note" ? "bg-blue-50/50" : "bg-blue-500/[0.04]";
                        badgeClass = "bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20";
                      }

                      return (
                        <motion.div
                          key={t.id}
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 12, scale: 0.96 },
                            show: { 
                              opacity: 1, 
                              y: 0, 
                              scale: 1,
                              transition: { type: "spring", stiffness: 350, damping: 25 }
                            },
                            exit: { 
                              opacity: 0, 
                              x: -15, 
                              scale: 0.95,
                              transition: { duration: 0.15 } 
                            }
                          }}
                          className={`p-3 rounded-xl flex items-center justify-between gap-3 border transition-all ${priorityBg} ${priorityBorder}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={() => toggleTodo(t.id)}
                              className="cursor-pointer h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-400"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`text-xs truncate font-medium ${t.done ? "line-through opacity-50 text-slate-400 dark:text-slate-500" : theme === "note" ? "text-slate-800" : "text-slate-200"}`}>
                                {t.text}
                              </span>
                              {t.reminderTime && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-bold rounded-md flex items-center gap-1 leading-none ${
                                    t.reminderTriggered 
                                      ? "bg-slate-500/10 text-slate-400/80 border border-slate-500/15" 
                                      : "bg-amber-400/10 text-amber-400 border border-amber-400/20 animate-pulse"
                                  }`}>
                                    <Bell size={8} className={t.reminderTriggered ? "" : "animate-bounce text-amber-400"} />
                                    Reminder: {t.reminderTime} {t.reminderTriggered ? "(Armed/Fired)" : "(Pending)"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.category && (
                              <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-wide rounded bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20">
                                {t.category}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.5 text-[8px] font-mono font-black tracking-widest rounded-md uppercase leading-none ${badgeClass}`}>
                              {t.priority}
                            </span>
                            <button 
                              onClick={() => setTodoToDelete(t.id)} 
                              className="p-1 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="Delete task safely"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Custom Safeguard Confirmation Modal to avoid accidental data loss */}
            <AnimatePresence>
              {todoToDelete !== null && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-3xl">
                  <motion.div
                    initial={{ scale: 0.9, y: 15, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 15, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="w-full max-w-xs p-5 rounded-2xl border border-red-500/30 bg-[#070b19]/98 text-center space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
                      <Trash2 size={22} className="animate-pulse text-red-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-sans font-extrabold text-slate-100 uppercase tracking-widest">Delete Action Item?</h4>
                      <p className="text-[10px] font-mono text-slate-400 leading-relaxed break-words px-2 bg-black/40 py-2 rounded-lg border border-white/5 max-h-20 overflow-y-auto">
                        "{todos.find(t => t.id === todoToDelete)?.text}"
                      </p>
                      <p className="text-[8.5px] font-mono text-red-400 font-bold uppercase tracking-wider block mt-1">
                        ⚠️ This action is irreversible.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setTodoToDelete(null)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (todoToDelete !== null) {
                            deleteTodo(todoToDelete);
                            setTodoToDelete(null);
                          }
                        }}
                        className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* === FEATURE 3: NOTEBOOK scratchPad === */}
        {id === "notes" && (
          <div className="space-y-3 flex flex-col h-full">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full bg-[#020512] border border-sky-500/10 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-inner"
            />
            <textarea
              rows={8}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className="w-full flex-1 bg-[#020512] border border-sky-500/10 rounded-xl p-3 text-xs text-slate-300 font-sans outline-none leading-relaxed"
            />
            <button
              onClick={() => {
                setSavingNotes(true);
                setTimeout(() => setSavingNotes(false), 800);
              }}
              className="w-full py-2.5 bg-sky-500 text-slate-950 font-bold rounded-xl text-xs uppercase"
            >
              {savingNotes ? "Saving into sandboxed storage..." : "Save Notes"}
            </button>
          </div>
        )}

        {/* === FEATURE 4: PASSWORD SAFE === */}
        {id === "password" && (
          <div className="space-y-4 max-w-xs mx-auto">
            <div className="p-3 bg-[#020512] border border-indigo-500/20 rounded-xl text-center select-all">
              <span className="font-mono text-xs font-bold block text-indigo-400 tracking-wider">
                {passValue}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Passphrase length:</span>
                <span className="text-white font-bold">{passLength} chars</span>
              </div>
              <input
                type="range"
                min="8"
                max="32"
                value={passLength}
                onChange={(e) => setPassLength(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={triggerPasswordGen}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-xl text-xs font-mono uppercase"
              >
                GENERATE
              </button>
              <button
                onClick={triggerCopyPassword}
                className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs flex items-center justify-center"
              >
                {copiedPass ? "COPIED" : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}

        {/* === FEATURE 5: CODE ALGORITHMS === */}
        {id === "code" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono uppercase text-slate-400">Select Language</label>
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="bg-[#020512] border border-sky-500/10 rounded px-2 py-1 text-xs text-[#a5f3fc]"
              >
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="C++">C++</option>
              </select>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed text-[#5af78e] select-all max-h-80">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}

        {/* === FEATURE 6: SUMMARIZER TEXTS === */}
        {id === "summarizer" && (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={sumText}
              onChange={(e) => setSumText(e.target.value)}
              className="w-full bg-[#020512] border border-sky-500/10 rounded-xl p-3 text-xs text-slate-400 outline-none"
            />
            <div className="p-3 bg-slate-950/70 border border-sky-500/5 rounded-xl text-xs leading-relaxed">
              <span className="font-mono text-[9px] text-cyan-400 block mb-2 uppercase tracking-wide">
                🏆 Bullet Summarized
              </span>
              <pre className="font-sans whitespace-pre-wrap">{summaryBullet}</pre>
            </div>
          </div>
        )}

        {/* === FEATURE 7: THE GUESING MATRIX === */}
        {id === "puzzle" && (
          <div className="space-y-4 max-w-sm mx-auto text-center">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p className="text-xs transition-colors duration-300 leading-normal">
                {oracleHint}
              </p>
            </div>
            
            <div className="flex justify-center gap-2">
              <input
                type="number"
                placeholder="TypeGuess"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuessSubmit()}
                className="bg-[#020512] border border-sky-500/15 rounded-xl px-4 py-2 text-xs text-center w-24 outline-none"
              />
              <button
                onClick={handleGuessSubmit}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold font-mono text-xs rounded-xl"
              >
                SUBMIT
              </button>
            </div>
          </div>
        )}

        {/* === FEATURE 8: ADAPTIVE JOKES === */}
        {id === "jokes" && (
          <div className="space-y-4 text-center max-w-xs mx-auto py-4">
            <p className="text-xs leading-relaxed font-serif tracking-normal text-[#e2e8f0]">
              "{currentJoke}"
            </p>
            <button
              onClick={triggerJokeGen}
              className="px-4 py-2.5 bg-yellow-405 bg-yellow-500 text-slate-950 font-bold font-mono text-[10px] rounded-xl uppercase tracking-wider"
            >
              REFRESH LAUGH MATRIX
            </button>
          </div>
        )}

        {/* === FEATURE 9: UNIT CONVERTER === */}
        {id === "converter" && (
          <div className="space-y-4 max-w-xs mx-auto">
            <div className="p-3 bg-[#020512]/60 border border-teal-500/15 rounded-xl space-y-2">
              <h4 className="text-[10px] font-mono uppercase text-teal-400 font-bold block">Celsius &harr; Fahrenheit</h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={tempCelsius}
                    onChange={(e) => handleCelsiusChange(e.target.value)}
                    placeholder="°C"
                    className="w-full bg-black/65 border border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">°C</span>
                </div>
                <span className="text-white font-mono font-bold">&larr;&rarr;</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={tempFahrenheit}
                    onChange={(e) => handleFahrenheitChange(e.target.value)}
                    placeholder="°F"
                    className="w-full bg-black/65 border border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">°F</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#020512]/60 border border-teal-500/15 rounded-xl space-y-2">
              <h4 className="text-[10px] font-mono uppercase text-teal-400 font-bold block">Miles &harr; Kilometers</h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={distMiles}
                    onChange={(e) => handleMilesChange(e.target.value)}
                    placeholder="Miles"
                    className="w-full bg-black/65 border border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">Mi</span>
                </div>
                <span className="text-white font-mono font-bold">&larr;&rarr;</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={distKm}
                    onChange={(e) => handleKmChange(e.target.value)}
                    placeholder="KM"
                    className="w-full bg-black/65 border border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">KM</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#020512]/60 border border-teal-500/15 rounded-xl space-y-2">
              <h4 className="text-[10px] font-mono uppercase text-teal-400 font-bold block">Kilograms &harr; Pounds</h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => handleKgChange(e.target.value)}
                    placeholder="KG"
                    className="w-full bg-black/65 border border-teal-550 border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">KG</span>
                </div>
                <span className="text-white font-mono font-bold">&larr;&rarr;</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={weightLbs}
                    onChange={(e) => handleLbsChange(e.target.value)}
                    placeholder="Lbs"
                    className="w-full bg-black/65 border border-teal-550 border-teal-500/20 focus:border-teal-400 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  />
                  <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold font-mono">Lbs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === FEATURE 10: Visual Stopwatch === */}
        {id === "timer" && (
          <div className="space-y-4 text-center max-w-sm mx-auto">
            {isTimerRunning ? (
              <div className="text-4xl font-extrabold font-mono tracking-widest text-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {Math.floor(timerSeconds / 3600).toString().padStart(2, "0")}:
                {Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, "0")}:
                {(timerSeconds % 60).toString().padStart(2, "0")}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Set Custom Timer Duration</p>
                <div className="flex justify-center items-center gap-2 text-xl font-mono font-bold text-white max-w-[200px] mx-auto p-2 bg-black/55 rounded-xl border border-red-500/15">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] uppercase font-mono text-rose-400 font-bold">Hours</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={timerHoursInput}
                      onChange={(e) => {
                        const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                        syncCustomTimer(h, timerMinutesInput);
                      }}
                      className="w-12 bg-[#020512] border border-red-500/20 text-center text-base font-extrabold text-red-400 p-1 rounded-md outline-none focus:border-red-450 focus:border-red-400"
                    />
                  </div>
                  <span className="text-lg text-slate-500 mt-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] uppercase font-mono text-rose-400 font-bold">Minutes</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timerMinutesInput}
                      onChange={(e) => {
                        const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                        syncCustomTimer(timerHoursInput, m);
                      }}
                      className="w-12 bg-[#020512] border border-red-500/20 text-center text-base font-extrabold text-red-400 p-1 rounded-md outline-none focus:border-red-450 focus:border-red-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {timerFinishedMessage && (
              <div className="p-2 border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded-lg animate-pulse">
                ⏰ {timerFinishedMessage}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  if (timerSeconds <= 0 && !isTimerRunning) {
                    setTimerSeconds(timerHoursInput * 3600 + timerMinutesInput * 60);
                  }
                  setIsTimerRunning(!isTimerRunning);
                  if (timerFinishedMessage) setTimerFinishedMessage("");
                }}
                className={`px-4 py-2 hover:opacity-95 text-white font-bold font-mono rounded-lg text-xs tracking-wider transition-all cursor-pointer ${
                  isTimerRunning ? "bg-amber-600" : "bg-red-650 bg-red-600"
                }`}
              >
                {isTimerRunning ? "PAUSE" : "START"}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerHoursInput * 3600 + timerMinutesInput * 60);
                  setTimerFinishedMessage("");
                }}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold font-mono rounded-lg text-xs uppercase cursor-pointer"
              >
                RELOAD
              </button>
            </div>
          </div>
        )}

        {/* === FEATURE 11: WIKIPEDIA CORE === */}
        {id === "wikipedia" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={wikiQuery}
                placeholder="Search raw scholar query..."
                onChange={(e) => setWikiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && triggerWikiSearch()}
                className="flex-1 bg-[#020512] border border-sky-500/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00f3ff]"
              />
              <button
                onClick={triggerWikiSearch}
                disabled={wikiLoading}
                className="px-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {wikiLoading ? <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <Search size={12} />}
              </button>
            </div>
            <div className="p-3.5 bg-sky-950/20 border border-sky-500/10 rounded-2xl text-xs leading-normal leading-relaxed text-[#cffafe]">
              <h4 className="font-bold underline uppercase text-[10px] mb-1.5 text-[#00f3ff]">Scholar feedback</h4>
              <p className="whitespace-pre-line">{wikiResult}</p>
            </div>
          </div>
        )}

        {/* === FEATURE 12: STUDENT BRIEFING === */}
        {id === "briefing" && (
          <div className="space-y-3.5">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Dynamic Reminder system</h3>
            
            {/* Form to add a new briefing reminder */}
            <div className="p-3 bg-[#020512]/60 border border-rose-500/10 rounded-xl space-y-2 shrink-0">
              <span className="text-[9px] uppercase font-mono text-[#ff4c74]/80 font-black tracking-widest block">Add Task Reminder Alert</span>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newBriefingTime}
                    onChange={(e) => setNewBriefingTime(e.target.value)}
                    className="bg-black/60 border border-rose-500/20 text-xs text-rose-300 rounded-lg p-1.5 outline-none focus:border-rose-400"
                  />
                  <input
                    type="text"
                    placeholder="Reminder description details..."
                    value={newBriefingTask}
                    onChange={(e) => setNewBriefingTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addBriefing()}
                    className="flex-1 bg-black/60 border border-rose-500/20 text-xs text-white rounded-lg px-2.5 outline-none focus:border-rose-400 placeholder-slate-600"
                  />
                </div>
                <button
                  onClick={addBriefing}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer"
                >
                  ADD TASK NOTIFIER
                </button>
              </div>
            </div>

            {/* List of active notifications/reminders */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {briefings.length === 0 ? (
                <p className="text-slate-500 text-[10px] font-mono text-center py-4 uppercase">No current active briefing logs.</p>
              ) : (
                briefings.map((b) => (
                  <div key={b.id} className="p-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl flex items-center justify-between text-xs transition-all gap-1.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={() => toggleBriefing(b.id)}
                        className="cursor-pointer h-3.5 w-3.5 rounded border-rose-500/25 text-rose-500 focus:ring-rose-400 bg-black/60"
                        title="Toggle alarm state"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={`font-mono font-bold ${b.enabled ? "text-rose-400" : "text-slate-500 line-through"}`}>{b.time}</span>
                        <span className={`text-slate-200 truncate ${b.enabled ? "" : "text-slate-500 line-through"}`} title={b.task}>{b.task}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBriefing(b.id)}
                      className="p-1 rounded text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                      title="Remove reminder"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === FEATURE 13: MEDITATE guided breathe === */}
        {id === "meditate" && (
          <div className="space-y-6 text-center py-6">
            <div className="relative flex justify-center items-center">
              {/* Expanding breathe visual ring */}
              <div className="w-28 h-28 rounded-full bg-cyan-500/20 border border-cyan-400/40 animate-ping absolute" />
              <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center relative">
                <span className="text-[10px] font-mono tracking-widest text-[#a5f3fc] font-bold">BREATHE</span>
              </div>
            </div>
            <p className="text-[11px] font-mono leading-none text-slate-400 uppercase tracking-widest">
              Guided Meditations Loops Active (Inhale... Exhale...)
            </p>
          </div>
        )}

        {/* === FEATURE 14: SYSTEM TELEMETRY DIAGNOSTICS === */}
        {id === "diagnostics" && (
          <div className="space-y-3.5 max-w-xs mx-auto mt-2">
            <div className="p-3.5 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-2xl space-y-3">
              <div className="flex justify-between text-[11px] font-mono">
                <span>CPU load tracking</span>
                <span className="text-fuchsia-400 font-bold">{cpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-fuchsia-400 h-full rounded" style={{ width: `${cpuUsage}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-2xl space-y-3">
              <div className="flex justify-between text-[11px] font-mono">
                <span>Virtual RAM memory usage</span>
                <span className="text-cyan-400 font-bold">{memUsage}%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                <div className="bg-cyan-450 bg-cyan-400 h-full rounded" style={{ width: `${memUsage}%` }} />
              </div>
            </div>
            
            <p className="text-[9px] font-mono text-center text-slate-500 leading-normal uppercase">
              All diagnostic core matrices are fully operational
            </p>
          </div>
        )}

        {/* === FEATURE 16: AI CREATOR STUDIO === */}
        {id === "creator" && (
          <div className="space-y-4">
            {/* Creator Segmented Tab controls */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-purple-500/10 gap-1.5">
              <button
                type="button"
                onClick={() => setCreatorTab("image")}
                className={`flex-1 py-1.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  creatorTab === "image"
                    ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(147,51,234,0.35)]"
                    : "bg-transparent text-slate-450 text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Sparkles size={13} />
                Image Studio (Imagen 4)
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab("video")}
                className={`flex-1 py-1.5 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  creatorTab === "video"
                    ? "bg-orange-600 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]"
                    : "bg-transparent text-slate-450 text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Tv size={13} />
                Video Studio (Veo 3)
              </button>
            </div>

            {/* TAB CONTENT: IMAGE STUDIO */}
            {creatorTab === "image" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-purple-400 font-extrabold tracking-widest block">
                    Write Synthesis Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={creatorImagePrompt}
                    onChange={(e) => setCreatorImagePrompt(e.target.value)}
                    placeholder="Describe what you want to synthesize (e.g., 'Retro cyberpunk desk overlooking a rainy Neo-Tokyo, neon holograms, cozy 3d render')..."
                    className="w-full bg-[#020512] border border-purple-500/20 focus:border-purple-500 rounded-xl p-3 text-xs outline-none leading-relaxed text-slate-200"
                  />
                </div>

                {/* Quick-Prompt Suggestions */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                    Quick-Prompt Seeds:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Cyberpunk Terminal", prompt: "A futuristic holographic workstation, neon cyan wireframes, immersive screen, cinematic cozy lighting" },
                      { label: "Vintage Library", prompt: "An ancient mystic library, golden dust motes, glowing spellbook lying open on desk, warm medieval painting style" },
                      { label: "Quantum Core", prompt: "Floating metallic orb in a laboratory glowing with violet electric arcs, tech-noir detailed render" },
                      { label: "Glassmorphic Desktop", prompt: "Sleek minimal workspace with clean widgets and dark translucent panels, elegant soft orange glow, 4k" }
                    ].map((seed, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCreatorImagePrompt(seed.prompt)}
                        className="px-2 py-1 text-[8px] font-mono border border-purple-500/10 hover:border-purple-500/30 rounded bg-purple-500/[0.03] text-purple-300 transition-colors cursor-pointer"
                      >
                        {seed.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced configuration options */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                      Generator Model:
                    </span>
                    <select
                      value={creatorImageModel}
                      onChange={(e) => setCreatorImageModel(e.target.value)}
                      className="w-full bg-[#030718] border border-purple-500/20 rounded-lg p-1.5 text-[10px] text-purple-300 font-mono outline-none"
                    >
                      <option value="imagen-3.0-fast-001">Imagen 3.0 Fast</option>
                      <option value="gemini-3.1-flash-image">Gemini 3.1 Flash</option>
                      <option value="gemini-3-pro-image">Gemini 3.0 Pro</option>
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                      Dimension Sizing:
                    </span>
                    <select
                      value={creatorImageSize}
                      onChange={(e) => setCreatorImageSize(e.target.value)}
                      disabled={creatorImageModel === "gemini-2.5-flash-image" || creatorImageModel === "imagen-3.0-fast-001"}
                      className="w-full bg-[#030718] border border-purple-500/20 rounded-lg p-1.5 text-[10px] text-slate-300 font-mono outline-none disabled:opacity-40"
                    >
                      <option value="1K">1K Standard HD</option>
                      <option value="2K">2K Cinema</option>
                      <option value="4K">4K Professional</option>
                    </select>
                  </div>
                </div>

                {/* Aspect Ratio configuration */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-purple-500/10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">
                    Aspect Ratio:
                  </span>
                  <div className="flex gap-1">
                    {(["1:1", "16:9", "9:16", "4:3"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCreatorImageAspect(r)}
                        className={`px-2 py-0.5 text-[9px] font-mono border rounded-md cursor-pointer transition-colors ${
                          creatorImageAspect === r
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                            : "bg-transparent text-slate-500 border-transparent hover:text-slate-400"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button trigger */}
                <button
                  onClick={handleGenerateImage}
                  disabled={creatorImageGenerating || !creatorImagePrompt.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-605 from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creatorImageGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Synthesizing pixels...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Image with Imagen
                    </>
                  )}
                </button>

                {/* Error Banner */}
                {creatorImageError && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono text-center">
                    {creatorImageError}
                  </div>
                )}

                {/* Display Output Image */}
                {creatorImageUrl && (
                  <div className="space-y-2 p-2 bg-black/40 rounded-2xl border border-purple-500/10">
                    <div className="relative rounded-xl overflow-hidden border border-purple-500/20 shadow-lg">
                      <img
                        src={creatorImageUrl}
                        alt="Generated Vector Asset"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto rounded-xl object-contain"
                      />
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={creatorImageUrl}
                        download="jarvis_generated_image.jpeg"
                        className="flex-1 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-[10px] font-mono uppercase tracking-wider font-extrabold text-center block"
                      >
                        Source Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: VIDEO STUDIO */}
            {creatorTab === "video" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-orange-400 font-extrabold tracking-widest block">
                    Write Synthesis Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={creatorVideoPrompt}
                    onChange={(e) => setCreatorVideoPrompt(e.target.value)}
                    placeholder="Describe motion dynamics (e.g., 'Cinematic panning camera of a glowing quantum server cluster, colorful laser sparks shooting off chips, high detail photorealistic, 4k')..."
                    className="w-full bg-[#020512] border border-orange-500/20 focus:border-orange-500 rounded-xl p-3 text-xs outline-none leading-relaxed text-slate-200"
                  />
                </div>

                {/* Quick-Prompt Suggestions */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                    Quick-Prompt Seeds:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Sparks Flight", prompt: "Hyperlapse flying through futuristic glass-and-steel neon skybridge, soft lens flares" },
                      { label: "Galactic Observ", prompt: "Time-lapse of starry galaxy swirl above a vintage observatory tower on a dark hill" },
                      { label: "Digital Matrix", prompt: "Slow camera crawl into green falling digital binary rain matrix screen, holographic terminal glow" }
                    ].map((seed, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCreatorVideoPrompt(seed.prompt)}
                        className="px-2 py-1 text-[8px] font-mono border border-orange-500/10 hover:border-orange-500/30 rounded bg-orange-500/[0.03] text-orange-300 transition-colors cursor-pointer"
                      >
                        {seed.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced configuration options */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                      Video Engine Model:
                    </span>
                    <select
                      value={creatorVideoModel}
                      onChange={(e) => setCreatorVideoModel(e.target.value)}
                      className="w-full bg-[#030718] border border-orange-500/20 rounded-lg p-1.5 text-[10px] text-orange-300 font-mono outline-none"
                    >
                      <option value="veo-1.0-fast-preview">Veo 1.0 Fast</option>
                      <option value="veo-3.1-generate-preview">Veo 3.1 Pro (Cinematic)</option>
                      <option value="veo-3.1-lite-generate-preview">Veo 3.1 Lite (Rapid Sketch)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">
                      Target Resolution:
                    </span>
                    <select
                      value={creatorVideoResolution}
                      onChange={(e) => setCreatorVideoResolution(e.target.value)}
                      className="w-full bg-[#030718] border border-orange-500/20 rounded-lg p-1.5 text-[10px] text-slate-300 font-mono outline-none"
                    >
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD Draft</option>
                      {creatorVideoModel === "veo-3.1-generate-preview" && (
                        <option value="4k">4K Cinema (Pro)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Aspect Ratio configuration */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-orange-500/10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">
                    Aspect Ratio:
                  </span>
                  <div className="flex gap-1">
                    {(["16:9", "9:16"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCreatorVideoAspect(r)}
                        className={`px-3 py-0.5 text-[9px] font-mono border rounded-md cursor-pointer transition-colors ${
                          creatorVideoAspect === r
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                            : "bg-transparent text-slate-500 border-transparent hover:text-slate-400"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button trigger */}
                <button
                  onClick={handleGenerateVideo}
                  disabled={creatorVideoGenerating || !creatorVideoPrompt.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-605 from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creatorVideoGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Compiling video...
                    </>
                  ) : (
                    <>
                      <Tv size={14} />
                      Generate Video with Veo
                    </>
                  )}
                </button>

                {/* Status Logs during Polling */}
                {creatorVideoGenerating && (
                  <div className="p-3 bg-slate-900/60 border border-orange-500/10 rounded-xl space-y-1.5">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-orange-400 font-black block animate-pulse">
                      ● JARVIS SYSTEM ENGAGED
                    </span>
                    <p className="text-[10px] font-mono text-slate-300">{creatorVideoStatusText}</p>
                  </div>
                )}

                {/* Error Banner */}
                {creatorVideoError && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono text-center">
                    {creatorVideoError}
                  </div>
                )}

                {/* Display Output Video */}
                {creatorVideoUrl && (
                  <div className="space-y-2 p-2 bg-black/40 rounded-2xl border border-orange-500/10">
                    <div className="relative rounded-xl overflow-hidden border border-orange-500/20 shadow-lg">
                      <video
                        src={creatorVideoUrl}
                        controls
                        playsInline
                        className="w-full rounded-xl"
                      />
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={creatorVideoUrl}
                        download="jarvis_generated_video.mp4"
                        className="flex-1 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 rounded-xl text-[10px] font-mono uppercase tracking-wider font-extrabold text-center block"
                      >
                        Client Blob Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === FEATURE 15: LOFI FOCUS SYNTH === */}
        {id === "music" && (
          <div className="space-y-4 max-w-sm mx-auto text-center">
            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-[28px] max-w-xs mx-auto">
              <Music size={32} className="text-orange-400 mx-auto animate-bounce" />
              <h3 className="text-xs font-black mt-2.5 uppercase dark:text-white">LOFI CONCENTRATE MODULE</h3>
              <p className="text-[10.5px] font-mono text-slate-500 mt-1 uppercase">Ambient synthesis generator online</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-[10px] rounded-xl uppercase">PLAY ALPHA</button>
              <button className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-350 font-bold font-mono text-[10px] rounded-xl uppercase text-slate-300">STOP CHORD</button>
            </div>
          </div>
        )}

      </div>

      <div className={`mt-4 pt-3 border-t uppercase text-[9px] font-mono text-center opacity-60 flex justify-center items-center gap-1.5 ${
        theme === "note" ? "border-[#e0d9bf]" : "border-slate-800"
      }`}>
        <CheckCircle2 size={11} className="text-emerald-400" /> JARVIS SECURED SANDBOX ENGINE
      </div>
    </motion.div>
  );
}

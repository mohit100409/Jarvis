import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Check } from "lucide-react";
import { JARVIS_LOGO_BASE64 } from "../../assets/logo";

interface OnboardingModalProps {
  showWelcomeOnboarding: boolean;
  setShowWelcomeOnboarding: (val: boolean) => void;
  username: string;
  gmail: string;
  avatarImage: string;
  avatarInitials: string;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onboardingNickname: string;
  setOnboardingNickname: (val: string) => void;
  onboardingOccupation: string;
  setOnboardingOccupation: (val: string) => void;
  onboardingAbout: string;
  setOnboardingAbout: (val: string) => void;
  nicknameMemory: string;
  setNicknameMemory: (val: string) => void;
  occupationMemory: string;
  setOccupationMemory: (val: string) => void;
  moreAboutUser: string;
  setMoreAboutUser: (val: string) => void;
  syncUserProfileToCloud: (key: string, data: any) => Promise<any>;
  speakJARVISResponse: (text: string, isAudioOnly?: boolean, isDirect?: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  showWelcomeOnboarding,
  setShowWelcomeOnboarding,
  username,
  gmail,
  avatarImage,
  avatarInitials,
  handleAvatarUpload,
  onboardingNickname,
  setOnboardingNickname,
  onboardingOccupation,
  setOnboardingOccupation,
  onboardingAbout,
  setOnboardingAbout,
  nicknameMemory,
  setNicknameMemory,
  occupationMemory,
  setOccupationMemory,
  moreAboutUser,
  setMoreAboutUser,
  syncUserProfileToCloud,
  speakJARVISResponse,
}) => {
  return (
    <AnimatePresence>
      {showWelcomeOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#030712]/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto select-none"
        >
          {/* Backdrop container */}

          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            className="w-full max-w-md bg-[#0b1228]/90 border border-slate-800 rounded-[28px] p-6 sm:p-8 backdrop-blur-2xl relative z-10 shadow-2xl my-auto"
          >
            {/* Header with JARVIS Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 flex items-center justify-center mb-3">
                <img src={JARVIS_LOGO_BASE64} alt="JARVIS Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-slate-100 uppercase text-center bg-gradient-to-r from-sky-200 via-white to-cyan-300 bg-clip-text text-transparent">
                WELCOME TO JARVIS
              </h1>
              <p className="text-[10px] font-mono tracking-[0.25em] text-[#00f3ff]/80 uppercase mt-1 text-center">
                OPERATOR PROFILE & MEMORY CONFIGURATION
              </p>
            </div>

            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative shrink-0 select-none">
                <div
                  onClick={() => document.getElementById("welcome-avatar-input")?.click()}
                  className="w-24 h-24 rounded-full border-2 border-cyan-500/40 bg-slate-900/80 hover:border-cyan-400 overflow-hidden flex items-center justify-center font-black text-slate-100 text-2xl uppercase cursor-pointer group transition-all shadow-inner"
                >
                  {avatarImage ? (
                    <img src={avatarImage} alt="Profile Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  ) : (
                    avatarInitials || username.charAt(0) || "U"
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById("welcome-avatar-input")?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00f3ff] text-slate-950 flex items-center justify-center cursor-pointer hover:bg-cyan-300 active:scale-90 transition-all shadow-lg font-bold"
                  title="Upload Profile Picture"
                >
                  <Camera size={14} />
                </button>
                <input
                  type="file"
                  id="welcome-avatar-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2">TAP TO SET PROFILE PHOTO</span>
            </div>

            {/* Core Memories & Personalization Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                  PREFERRED NICKNAME / CALL SIGN (NICKNAME MEMORY)
                </label>
                <input
                  type="text"
                  value={onboardingNickname}
                  onChange={(e) => setOnboardingNickname(e.target.value)}
                  placeholder="e.g. Boss, Captain, Sir"
                  className="w-full bg-[#060b1b] border border-slate-800 focus:border-[#38bdf8]/60 rounded-full px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                  PROFESSION / ROLE (OCCUPATION MEMORY)
                </label>
                <input
                  type="text"
                  value={onboardingOccupation}
                  onChange={(e) => setOnboardingOccupation(e.target.value)}
                  placeholder="e.g. AI Researcher, Developer, Engineer"
                  className="w-full bg-[#060b1b] border border-slate-800 focus:border-[#38bdf8]/60 rounded-full px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 block">
                  MORE ABOUT YOU (LONG-TERM MEMORY)
                </label>
                <textarea
                  value={onboardingAbout}
                  onChange={(e) => setOnboardingAbout(e.target.value)}
                  placeholder="Share any background, preferences, or goals for Jarvis to keep in memory..."
                  rows={2}
                  className="w-full bg-[#060b1b] border border-slate-800 focus:border-[#38bdf8]/60 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Action Buttons: Save & Enter vs Skip */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onboardingNickname.trim()) setNicknameMemory(onboardingNickname.trim());
                  if (onboardingOccupation.trim()) setOccupationMemory(onboardingOccupation.trim());
                  if (onboardingAbout.trim()) setMoreAboutUser(onboardingAbout.trim());

                  // Sync to cloud
                  const activeEmail = (gmail || "").trim() || username;
                  if (activeEmail) {
                    syncUserProfileToCloud(activeEmail, {
                      nicknameMemory: onboardingNickname.trim() || nicknameMemory,
                      occupationMemory: onboardingOccupation.trim() || occupationMemory,
                      moreAboutUser: onboardingAbout.trim() || moreAboutUser,
                      avatarImage,
                      avatarInitials
                    }).catch(() => {});
                  }

                  setShowWelcomeOnboarding(false);
                  speakJARVISResponse(`Profile configured successfully. All systems online, ${username}.`, false, true);
                }}
                className="w-full cursor-pointer bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#1d4ed8] text-white py-3 rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Check size={15} />
                <span>SAVE & ENTER JARVIS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowWelcomeOnboarding(false);
                  speakJARVISResponse(`Welcome to Jarvis, ${username}.`, false, true);
                }}
                className="w-full cursor-pointer bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all"
              >
                Skip for now
              </button>
            </div>

            <p className="text-[10px] font-mono text-slate-500 text-center mt-3">
              You can always update your profile & memories later in Settings.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

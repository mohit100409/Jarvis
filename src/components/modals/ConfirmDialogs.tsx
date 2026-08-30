import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { slideHorizontalVariants } from "../../lib/motion";

interface ChatHistoryItem {
  id: string;
  text: string;
  messages: any[];
  isPinned?: boolean;
  actualTs?: number;
}

interface RenameDialogProps {
  renameDialogId: string | null;
  setRenameDialogId: (id: string | null) => void;
  renameDialogText: string;
  setRenameDialogText: (text: string) => void;
  updateAndSyncChatHistory: (fn: (prev: ChatHistoryItem[]) => ChatHistoryItem[]) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  renameDialogId,
  setRenameDialogId,
  renameDialogText,
  setRenameDialogText,
  updateAndSyncChatHistory,
}) => {
  return (
    <AnimatePresence>
      {renameDialogId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            variants={slideHorizontalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[#0b1021]/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-5 w-full max-w-sm flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-40" />
            
            <h3 className="text-white font-bold tracking-wide text-sm uppercase">Rename Chat</h3>
            
            <input
              type="text"
              value={renameDialogText}
              onChange={(e) => setRenameDialogText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameDialogText.trim()) {
                  updateAndSyncChatHistory((prev) =>
                    prev.map((c) => (c.id === renameDialogId ? { ...c, text: renameDialogText.trim() } : c))
                  );
                  setRenameDialogId(null);
                }
              }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/30 transition-all font-sans text-sm"
              placeholder="Conversation name..."
              autoFocus
            />

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setRenameDialogId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (renameDialogText.trim()) {
                    updateAndSyncChatHistory((prev) =>
                      prev.map((c) => (c.id === renameDialogId ? { ...c, text: renameDialogText.trim() } : c))
                    );
                    setRenameDialogId(null);
                  }
                }}
                disabled={!renameDialogText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#00f3ff] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#33f5ff] disabled:opacity-50 transition-all cursor-pointer"
              >
                Rename
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface DeleteDialogProps {
  deleteDialogId: string | null;
  setDeleteDialogId: (id: string | null) => void;
  chatHistoryItems: ChatHistoryItem[];
  updateAndSyncChatHistory: (fn: (prev: ChatHistoryItem[]) => ChatHistoryItem[]) => void;
  setUndoSnackbarItem: (item: ChatHistoryItem | null) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  setMessages: (msgs: any[]) => void;
  getInitialWelcomeMessage: () => any[];
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  deleteDialogId,
  setDeleteDialogId,
  chatHistoryItems,
  updateAndSyncChatHistory,
  setUndoSnackbarItem,
  activeSessionId,
  setActiveSessionId,
  setMessages,
  getInitialWelcomeMessage,
}) => {
  return (
    <AnimatePresence>
      {deleteDialogId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            variants={slideHorizontalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[#0b1021]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl p-5 w-full max-w-sm flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-40" />
            
            <div className="flex flex-col gap-2 text-center items-center mt-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-white font-bold tracking-wide text-lg">Delete this chat?</h3>
              <p className="text-slate-400 text-sm">This action cannot be undone.</p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeleteDialogId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const itemToDelete = chatHistoryItems.find((c) => c.id === deleteDialogId);
                  if (itemToDelete) {
                    updateAndSyncChatHistory((prev) => prev.filter((c) => c.id !== deleteDialogId));
                    setUndoSnackbarItem(itemToDelete);
                    if (activeSessionId === deleteDialogId) {
                      setActiveSessionId(null);
                      setMessages(getInitialWelcomeMessage());
                    }
                    
                    // Auto-hide snackbar after 5 seconds
                    setTimeout(() => {
                      setUndoSnackbarItem(null);
                    }, 5000);
                  }
                  setDeleteDialogId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-400 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface LogoutModalProps {
  isLogoutModalOpen: boolean;
  setIsLogoutModalOpen: (val: boolean) => void;
  textLanguage: string;
  handleLogOut: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isLogoutModalOpen,
  setIsLogoutModalOpen,
  textLanguage,
  handleLogOut,
}) => {
  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            variants={slideHorizontalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-sm bg-[#080d21] border border-red-500/40 rounded-3xl p-6 text-center relative overflow-hidden"
          >
            {/* Background container */}

            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
              <LogOut size={26} />
            </div>

            <h3 className="text-base font-bold text-white mb-2 tracking-wide font-sans uppercase">
              {textLanguage === "Bengali" ? "লগ আউট নিশ্চিতকরণ" : textLanguage === "Hindi" ? "लॉग आउट की पुष्टि" : "Log Out Confirmation"}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
              {textLanguage === "Bengali"
                ? "আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে লগ আউট করতে চান? সমস্ত তথ্য নিরাপদ থাকবে।"
                : textLanguage === "Hindi"
                ? "क्या आप निश्चित रूप से अपने खाते से लॉग आउट करना चाहते हैं? सभी जानकारी सुरक्षित रहेगी।"
                : "Are you sure you want to log out of your JARVIS session? All active cloud synchronization and memories will remain safely backed up."}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                {textLanguage === "Bengali" ? "বাতিল" : textLanguage === "Hindi" ? "रद्द करें" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogOut();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                {textLanguage === "Bengali" ? "লগ আউট করুন" : textLanguage === "Hindi" ? "लॉग आउट करें" : "Log Out"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

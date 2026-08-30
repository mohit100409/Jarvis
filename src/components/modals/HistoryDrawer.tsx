import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Pin, MessageSquare, Edit3, Trash2, Settings } from "lucide-react";
import { JARVIS_LOGO_BASE64 } from "../../assets/logo";

interface ChatHistoryItem {
  id: string;
  text: string;
  messages: any[];
  isPinned?: boolean;
  timestamp?: number;
  actualTs?: number;
}

interface HistoryDrawerProps {
  isHistoryDrawerOpen: boolean;
  setIsHistoryDrawerOpen: (val: boolean) => void;
  historyMenuOpenId: string | null;
  setHistoryMenuOpenId: (id: string | null) => void;
  historySearchQuery: string;
  setHistorySearchQuery: (query: string) => void;
  chatHistoryItems: ChatHistoryItem[];
  activeSessionId: string | null;
  isCloudDataLoaded: boolean;
  handleHistoryTouchStart: (id: string) => void;
  handleHistoryTouchEnd: () => void;
  isHistoryLongPressRef: React.MutableRefObject<boolean>;
  loadChatFromHistory: (item: ChatHistoryItem) => void;
  updateAndSyncChatHistory: (fn: (prev: ChatHistoryItem[]) => ChatHistoryItem[]) => void;
  setRenameDialogId: (id: string | null) => void;
  setRenameDialogText: (text: string) => void;
  setDeleteDialogId: (id: string | null) => void;
  setCurrentScreen: (screen: "homepage" | "menu" | "live") => void;
  setMenuSubpage: (page: string) => void;
}

const drawerPanelVariants = {
  closed: {
    x: "-100%",
    opacity: 0.8,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 38,
      mass: 0.8,
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 340,
      damping: 32,
      mass: 0.8,
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
};

const navItemVariants = {
  closed: {
    opacity: 0,
    x: -24,
    filter: "blur(6px)",
  },
  open: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 26,
    },
  },
};

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isHistoryDrawerOpen,
  setIsHistoryDrawerOpen,
  historyMenuOpenId,
  setHistoryMenuOpenId,
  historySearchQuery,
  setHistorySearchQuery,
  chatHistoryItems,
  activeSessionId,
  isCloudDataLoaded,
  handleHistoryTouchStart,
  handleHistoryTouchEnd,
  isHistoryLongPressRef,
  loadChatFromHistory,
  updateAndSyncChatHistory,
  setRenameDialogId,
  setRenameDialogText,
  setDeleteDialogId,
  setCurrentScreen,
  setMenuSubpage,
}) => {
  return (
    <AnimatePresence>
      {isHistoryDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsHistoryDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            variants={drawerPanelVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-y-0 left-0 w-[280px] bg-[#040816]/85 backdrop-blur-2xl shadow-2xl z-50 flex flex-col border-r border-white/15"
          >
            {/* Overlay backdrop to dismiss context menu when clicking anywhere on screen */}
            {historyMenuOpenId && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setHistoryMenuOpenId(null);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setHistoryMenuOpenId(null);
                }}
              />
            )}

            {/* Header */}
            <motion.div variants={navItemVariants} className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img src={JARVIS_LOGO_BASE64} alt="JARVIS Logo" className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold text-white tracking-wide font-sans">Chat History</span>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </motion.button>
            </motion.div>

            {/* Real-Time Filter Search Input */}
            <motion.div variants={navItemVariants} className="px-3 pt-3 pb-2 border-b border-white/5 shrink-0">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-white/5 border border-white/10 focus:border-[#00f3ff]/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 scrollbar-none pb-4">
              {(() => {
                const getTimestamp = (id: string, ts?: number) =>
                  ts || (id.startsWith("s-") ? parseInt(id.split("-")[1]) || Date.now() : Date.now());
                const validItems = chatHistoryItems
                  .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
                  .filter((item) => (item.messages && item.messages.length > 0) || item.id === activeSessionId)
                  .filter((item) => !historySearchQuery || item.text.toLowerCase().includes(historySearchQuery.toLowerCase()))
                  .map((item) => ({ ...item, actualTs: getTimestamp(item.id, item.timestamp) }))
                  .sort((a, b) => (b.actualTs || 0) - (a.actualTs || 0));

                if (!isCloudDataLoaded) {
                  return (
                    <div className="px-2 py-4 space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="w-full h-10 rounded-xl bg-slate-800/50 animate-pulse border border-white/5" />
                      ))}
                    </div>
                  );
                }

                if (validItems.length === 0) {
                  return <p className="text-sm text-slate-500 px-4 py-6 text-center font-mono tracking-widest">NO HISTORY LOGS</p>;
                }

                const pinnedItems = validItems.filter((item) => item.isPinned);
                const normalItems = validItems.filter((item) => !item.isPinned);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const todayTs = now.getTime();
                const yesterdayTs = todayTs - 86400000;
                const weekTs = todayTs - 86400000 * 7;

                const grouped: Record<string, typeof validItems> = {
                  Today: [],
                  Yesterday: [],
                  "Previous 7 Days": [],
                  Older: [],
                };

                normalItems.forEach((item) => {
                  const ts = item.actualTs || 0;
                  if (ts >= todayTs) grouped.Today.push(item);
                  else if (ts >= yesterdayTs) grouped.Yesterday.push(item);
                  else if (ts >= weekTs) grouped["Previous 7 Days"].push(item);
                  else grouped.Older.push(item);
                });

                const renderItem = (item: typeof validItems[0]) => {
                  const isSelected = activeSessionId === item.id;
                  const isMenuOpen = historyMenuOpenId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      variants={navItemVariants}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative flex items-center justify-between px-2.5 py-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer select-none ${
                        isSelected ? "bg-[#00f3ff]/10 border border-[#00f3ff]/30" : "border border-transparent"
                      }`}
                      onMouseDown={() => handleHistoryTouchStart(item.id)}
                      onMouseUp={handleHistoryTouchEnd}
                      onMouseLeave={handleHistoryTouchEnd}
                      onTouchStart={() => handleHistoryTouchStart(item.id)}
                      onTouchEnd={handleHistoryTouchEnd}
                      onTouchMove={handleHistoryTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setHistoryMenuOpenId(item.id);
                      }}
                      onClick={() => {
                        if (historyMenuOpenId) {
                          setHistoryMenuOpenId(null);
                          return;
                        }
                        if (isHistoryLongPressRef.current) {
                          isHistoryLongPressRef.current = false;
                          return;
                        }
                        loadChatFromHistory(item);
                        setIsHistoryDrawerOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        {item.isPinned ? (
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-[#00f3ff]/20 text-[#00f3ff] shrink-0 border border-[#00f3ff]/30">
                            <Pin size={12} className="text-[#00f3ff]" />
                          </span>
                        ) : (
                          <MessageSquare size={16} className={isSelected ? "text-[#00f3ff] shrink-0" : "text-slate-400 shrink-0"} />
                        )}
                        <div className={`truncate text-sm font-sans ${isSelected ? "text-white font-bold" : "text-slate-200"}`}>
                          {item.text}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -5 }}
                            className="absolute right-2 top-8 w-40 bg-[#0d1326] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryMenuOpenId(null);
                                updateAndSyncChatHistory((prev) =>
                                  prev.map((c) => (c.id === item.id ? { ...c, isPinned: !c.isPinned } : c))
                                );
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#00f3ff]/15 hover:text-[#00f3ff] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Pin size={13} className={item.isPinned ? "text-[#00f3ff]" : "text-slate-400"} />
                              <span>{item.isPinned ? "Unpin Chat" : "Pin Chat"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryMenuOpenId(null);
                                setRenameDialogId(item.id);
                                setRenameDialogText(item.text);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#00f3ff]/15 hover:text-[#00f3ff] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Edit3 size={13} className="text-slate-400" />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistoryMenuOpenId(null);
                                setDeleteDialogId(item.id);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={13} className="text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                };

                return (
                  <div className="flex flex-col gap-4 mt-2">
                    {pinnedItems.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        <motion.div variants={navItemVariants} className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Pinned
                        </motion.div>
                        {pinnedItems.map(renderItem)}
                      </div>
                    )}
                    {Object.entries(grouped).map(([groupName, items]) => {
                      if (items.length === 0) return null;
                      return (
                        <div key={groupName} className="flex flex-col gap-0.5">
                          <motion.div variants={navItemVariants} className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {groupName}
                          </motion.div>
                          {items.map(renderItem)}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer / Settings */}
            <motion.div variants={navItemVariants} className="flex-shrink-0 border-t border-white/10 p-2 pb-[max(12px,env(safe-area-inset-bottom))] bg-[#040816]">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setIsHistoryDrawerOpen(false);
                  setCurrentScreen("menu");
                  setMenuSubpage("index");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-slate-200 font-sans cursor-pointer text-sm"
              >
                <span className="w-8 h-8 rounded bg-[#00f3ff]/10 flex items-center justify-center text-[#00f3ff] shrink-0">
                  <Settings size={16} />
                </span>
                <span className="font-medium">Settings</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

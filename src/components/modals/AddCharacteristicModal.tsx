import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X } from "lucide-react";

interface Characteristic {
  id: string;
  title: string;
  desc: string;
  enabled?: boolean;
}

interface AddCharacteristicModalProps {
  isAddCharModalOpen: boolean;
  setIsAddCharModalOpen: (val: boolean) => void;
  editingCharId: string | null;
  setEditingCharId: (id: string | null) => void;
  newCharTitleInput: string;
  setNewCharTitleInput: (val: string) => void;
  newCharDescInput: string;
  setNewCharDescInput: (val: string) => void;
  setCustomCharacteristics: React.Dispatch<React.SetStateAction<Characteristic[]>>;
}

export const AddCharacteristicModal: React.FC<AddCharacteristicModalProps> = ({
  isAddCharModalOpen,
  setIsAddCharModalOpen,
  editingCharId,
  setEditingCharId,
  newCharTitleInput,
  setNewCharTitleInput,
  newCharDescInput,
  setNewCharDescInput,
  setCustomCharacteristics,
}) => {
  return (
    <AnimatePresence>
      {isAddCharModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            className="w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 bg-[#081026]/95 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(0,243,255,0.15)]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 font-mono text-sm font-black uppercase text-[#00f3ff] tracking-wider">
                <Sparkles size={16} />
                <span>{editingCharId ? "Edit Characteristic" : "Add Characteristic"}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCharModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-mono font-bold">
                  Title / Identifier
                </label>
                <input
                  type="text"
                  value={newCharTitleInput}
                  onChange={(e) => setNewCharTitleInput(e.target.value)}
                  placeholder="e.g. Benglish Phrasing, Sarcastic Wit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-black/40 focus:border-cyan-400 text-xs text-white placeholder:text-slate-600 outline-none font-sans transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-mono font-bold">
                  Behavioral Description
                </label>
                <input
                  type="text"
                  value={newCharDescInput}
                  onChange={(e) => setNewCharDescInput(e.target.value)}
                  placeholder="e.g. Add a touch of Bengali warmth to responses"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-black/40 focus:border-cyan-400 text-xs text-white placeholder:text-slate-600 outline-none font-sans transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddCharModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCharTitleInput.trim()) return;
                  if (editingCharId) {
                    setCustomCharacteristics((prev) =>
                      prev.map((c) =>
                        c.id === editingCharId
                          ? { ...c, title: newCharTitleInput.trim(), desc: newCharDescInput.trim() }
                          : c
                      )
                    );
                  } else {
                    setCustomCharacteristics((prev) => [
                      ...prev,
                      {
                        id: "char-" + Date.now(),
                        title: newCharTitleInput.trim(),
                        desc: newCharDescInput.trim() || "Custom characteristic",
                        enabled: true,
                      },
                    ]);
                  }
                  setIsAddCharModalOpen(false);
                  setNewCharTitleInput("");
                  setNewCharDescInput("");
                  setEditingCharId(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-mono font-black uppercase bg-[#00f3ff] text-slate-950 hover:bg-[#33f5ff] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] cursor-pointer"
              >
                Save Parameter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

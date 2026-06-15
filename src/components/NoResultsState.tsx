"use client";

import { MapPin, Settings2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface NoResultsStateProps {
  onOpenSettings: () => void;
  onReset: () => void;
}

export default function NoResultsState({
  onOpenSettings,
  onReset,
}: NoResultsStateProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-0 left-0 right-0 px-5 z-30"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 40px)" }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <div
          className="rounded-3xl p-6 flex flex-col items-center gap-4 text-center"
          style={{
            background: "rgba(22,27,34,0.97)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <MapPin size={22} color="#8B949E" />
          </div>
          <div>
            <p className="font-semibold text-[15px]" style={{ color: "#F0F6FC" }}>
              No lots found nearby
            </p>
            <p className="text-[13px] mt-1.5" style={{ color: "#8B949E" }}>
              Try expanding your search radius or adjusting filters in Settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: "rgba(45,185,106,0.1)",
              color: "#2DB96A",
              border: "1px solid rgba(45,185,106,0.22)",
            }}
          >
            <Settings2 size={14} />
            Open Settings
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-sm"
            style={{ color: "rgba(139,148,158,0.5)" }}
          >
            Back to map
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

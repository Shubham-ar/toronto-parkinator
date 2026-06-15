"use client";

import { AnimatePresence, motion } from "motion/react";

export default function LoadingState() {
  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 flex items-end justify-center z-30"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 52px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center gap-4 px-10 py-7 rounded-3xl"
          style={{
            background: "rgba(10,16,28,0.9)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          initial={{ y: 28, scale: 0.96 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 40 }}
        >
          <div className="relative w-12 h-12">
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: "rgba(45,185,106,0.18)",
                borderTopColor: "#2DB96A",
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center font-extrabold text-[13px]"
              style={{ background: "rgba(45,185,106,0.1)", color: "#2DB96A" }}
            >
              P
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[15px]" style={{ color: "#F0F6FC" }}>
              Finding nearby Green P lots…
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "#8B949E", fontFamily: "DM Mono, monospace" }}
            >
              Checking rates and distances
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { LocateFixed } from "lucide-react";
import { motion } from "motion/react";

interface LocateButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function LocateButton({ onClick, disabled }: LocateButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-[18px] rounded-2xl font-bold text-[17px] disabled:opacity-60"
      style={{
        background: "#2DB96A",
        color: "#071410",
        boxShadow: "0 8px 36px rgba(45,185,106,0.42)",
        letterSpacing: "-0.01em",
      }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      <LocateFixed size={21} strokeWidth={2.5} />
      Find Parking Near Me
    </motion.button>
  );
}

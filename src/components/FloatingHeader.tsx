"use client";

import { Settings2 } from "lucide-react";

interface FloatingHeaderProps {
  onOpenSettings: () => void;
}

export default function FloatingHeader({ onOpenSettings }: FloatingHeaderProps) {
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
      style={{ paddingTop: "max(env(safe-area-inset-top), 16px)", zIndex: 30 }}
    >
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
        style={{
          background: "rgba(10,16,28,0.82)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg font-extrabold text-sm"
          style={{
            background: "#2DB96A",
            color: "#071410",
            letterSpacing: "-0.02em",
          }}
        >
          P
        </div>
        <span
          className="font-bold text-[15px] tracking-tight"
          style={{ color: "#F0F6FC" }}
        >
          Toronto Parkinator
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="flex items-center justify-center w-11 h-11 rounded-2xl active:scale-95 transition-transform"
        style={{
          background: "rgba(10,16,28,0.82)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
        aria-label="Open settings"
      >
        <Settings2 size={19} color="#8B949E" />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertCircle, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { DEMO_LOCATION } from "@/types/parking";
import LocateButton from "./LocateButton";

interface LocationFallbackProps {
  onTryAgain: () => void;
  onUseDemoLocation: () => void;
  onManualLocation: (lat: number, lng: number) => void;
  errorMessage?: string;
}

export default function LocationFallback({
  onTryAgain,
  onUseDemoLocation,
  onManualLocation,
  errorMessage,
}: LocationFallbackProps) {
  const [showManual, setShowManual] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const handleManualSubmit = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setManualError("Enter valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }

    setManualError(null);
    onManualLocation(lat, lng);
  };

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 px-5 flex flex-col items-center gap-3"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 36px)", zIndex: 30 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 420, damping: 42 }}
    >
      <div
        className="w-full rounded-2xl p-4 flex gap-3"
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <AlertCircle size={17} color="#F59E0B" className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>
            Location unavailable
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(245,158,11,0.65)" }}>
            {errorMessage ??
              "We couldn't access your location. Try again or use the demo location downtown."}
          </p>
        </div>
      </div>

      <LocateButton onClick={onTryAgain} />

      <button
        type="button"
        onClick={onUseDemoLocation}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#F0F6FC",
        }}
      >
        <MapPin size={16} color="#2DB96A" />
        Use demo location (Eaton Centre)
      </button>

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="text-sm pb-1"
        style={{ color: "rgba(139,148,158,0.55)" }}
      >
        {showManual ? "Hide manual coordinates" : "Enter coordinates manually"}
      </button>

      {showManual && (
        <div className="w-full space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Latitude"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="flex-1 rounded-xl px-3 py-3 text-sm outline-none"
              style={{
                background: "rgba(22,27,34,0.96)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#F0F6FC",
              }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Longitude"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              className="flex-1 rounded-xl px-3 py-3 text-sm outline-none"
              style={{
                background: "rgba(22,27,34,0.96)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#F0F6FC",
              }}
            />
          </div>
          {manualError && (
            <p className="text-xs" style={{ color: "#F85149" }}>
              {manualError}
            </p>
          )}
          <button
            type="button"
            onClick={handleManualSubmit}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#2DB96A", color: "#071410" }}
          >
            Search this location
          </button>
          <p
            className="text-[10px] text-center"
            style={{ color: "rgba(139,148,158,0.4)", fontFamily: "DM Mono, monospace" }}
          >
            Demo: {DEMO_LOCATION.lat}, {DEMO_LOCATION.lng}
          </p>
        </div>
      )}
    </motion.div>
  );
}

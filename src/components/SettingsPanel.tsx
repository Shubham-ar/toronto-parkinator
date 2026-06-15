"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SearchSettings, SortPreference } from "@/types/parking";

interface SettingsPanelProps {
  open: boolean;
  settings: SearchSettings;
  onClose: () => void;
  onChange: (settings: SearchSettings) => void;
  onSearchAgain: () => void;
  canSearchAgain: boolean;
}

const SORT_OPTIONS: { value: SortPreference; label: string }[] = [
  { value: "cheapest", label: "Cheapest" },
  { value: "shortest_walk", label: "Closest" },
  { value: "balanced", label: "Balanced" },
];

const DURATION_OPTIONS = [60, 120, 240, 480] as const;

export default function SettingsPanel({
  open,
  settings,
  onClose,
  onChange,
  onSearchAgain,
  canSearchAgain,
}: SettingsPanelProps) {
  const update = (partial: Partial<SearchSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const monoLabel = { color: "#8B949E", fontFamily: "DM Mono, monospace" } as const;
  const monoValue = { color: "#2DB96A", fontFamily: "DM Mono, monospace" } as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.65)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden"
            style={{
              background: "#161B22",
              maxHeight: "90vh",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 42 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.14)" }}
              />
            </div>

            <div className="flex items-center justify-between px-5 pb-4">
              <span className="font-bold text-[17px]" style={{ color: "#F0F6FC" }}>
                Preferences
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Close settings"
              >
                <X size={16} color="#8B949E" />
              </button>
            </div>

            <div
              className="overflow-y-auto px-5 space-y-8"
              style={{
                maxHeight: "calc(90vh - 88px)",
                paddingBottom: "max(env(safe-area-inset-bottom), 40px)",
              }}
            >
              {/* Sort */}
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-wider mb-3"
                  style={monoLabel}
                >
                  Sort results by
                </label>
                <div className="flex gap-2">
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update({ sortPreference: value })}
                      className="flex-1 py-3 rounded-2xl text-[13px] font-semibold transition-colors"
                      style={{
                        background:
                          settings.sortPreference === value
                            ? "#2DB96A"
                            : "rgba(255,255,255,0.05)",
                        color:
                          settings.sortPreference === value ? "#071410" : "#8B949E",
                        border: `1px solid ${settings.sortPreference === value ? "#2DB96A" : "rgba(255,255,255,0.07)"}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max drive time */}
              <div>
                <div className="flex justify-between mb-3">
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={monoLabel}
                  >
                    Max Drive Time
                  </label>
                  <span className="text-sm font-medium" style={monoValue}>
                    {settings.maxDriveMinutes} min
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={settings.maxDriveMinutes}
                  onChange={(e) =>
                    update({ maxDriveMinutes: Number(e.target.value) })
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#2DB96A" }}
                />
                <div className="flex justify-between mt-2">
                  <span style={{ ...monoLabel, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>2 min</span>
                  <span style={{ ...monoLabel, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>30 min</span>
                </div>
              </div>

              {/* Max walk time */}
              <div>
                <div className="flex justify-between mb-3">
                  <label
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={monoLabel}
                  >
                    Max Walk Time
                  </label>
                  <span className="text-sm font-medium" style={monoValue}>
                    {settings.maxWalkMinutes} min
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={settings.maxWalkMinutes}
                  onChange={(e) =>
                    update({ maxWalkMinutes: Number(e.target.value) })
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#2DB96A" }}
                />
                <div className="flex justify-between mt-2">
                  <span style={{ ...monoLabel, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>2 min</span>
                  <span style={{ ...monoLabel, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>30 min</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-wider mb-3"
                  style={monoLabel}
                >
                  Parking Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => update({ parkingDurationMinutes: minutes })}
                      className="py-3 rounded-2xl text-[13px] font-semibold transition-colors"
                      style={{
                        background:
                          settings.parkingDurationMinutes === minutes
                            ? "#2DB96A"
                            : "rgba(255,255,255,0.05)",
                        color:
                          settings.parkingDurationMinutes === minutes
                            ? "#071410"
                            : "#8B949E",
                        border: `1px solid ${settings.parkingDurationMinutes === minutes ? "#2DB96A" : "rgba(255,255,255,0.07)"}`,
                      }}
                    >
                      {minutes >= 480 ? "All day" : `${minutes / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot preferences */}
              <div className="space-y-3">
                <label
                  className="block text-[11px] font-bold uppercase tracking-wider"
                  style={monoLabel}
                >
                  Lot preferences
                </label>

                <button
                  type="button"
                  onClick={() =>
                    update({ preferGarages: !settings.preferGarages })
                  }
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-semibold"
                  style={{
                    background: settings.preferGarages
                      ? "rgba(45,185,106,0.1)"
                      : "rgba(255,255,255,0.05)",
                    color: settings.preferGarages ? "#2DB96A" : "#8B949E",
                    border: `1px solid ${settings.preferGarages ? "rgba(45,185,106,0.32)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  Prefer garages
                  <span>{settings.preferGarages ? "On" : "Off"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    update({ showSurfaceLots: !settings.showSurfaceLots })
                  }
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-semibold"
                  style={{
                    background: settings.showSurfaceLots
                      ? "rgba(45,185,106,0.1)"
                      : "rgba(255,255,255,0.05)",
                    color: settings.showSurfaceLots ? "#2DB96A" : "#8B949E",
                    border: `1px solid ${settings.showSurfaceLots ? "rgba(45,185,106,0.32)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  Show surface lots
                  <span>{settings.showSurfaceLots ? "On" : "Off"}</span>
                </button>
              </div>

              {canSearchAgain && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchAgain();
                    onClose();
                  }}
                  className="w-full py-4 rounded-2xl font-bold text-[15px]"
                  style={{
                    background: "#2DB96A",
                    color: "#071410",
                  }}
                >
                  Search again
                </button>
              )}

              <p
                className="text-center text-[11px] pt-2"
                style={{
                  color: "rgba(139,148,158,0.3)",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                Toronto Parkinator · Green P data
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

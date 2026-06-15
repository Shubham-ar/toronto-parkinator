"use client";

import { Car, Navigation2 } from "lucide-react";
import { motion } from "motion/react";
import { formatEstimatedPrice, formatRateHalfHour } from "@/lib/pricing";
import type { SearchResult } from "@/types/parking";
import { WalkIcon, carparkTypeLabel } from "./icons";

interface ResultCardProps {
  result: SearchResult;
  variant?: "best" | "list";
  animationDelay?: number;
  isSelected?: boolean;
}

function TimeBadge({ isTrafficAware }: { isTrafficAware: boolean }) {
  if (isTrafficAware) {
    return (
      <span
        className="text-[9px] font-bold px-1.5 py-[1px] rounded-full"
        style={{
          background: "rgba(59,130,246,0.12)",
          color: "#60A5FA",
          fontFamily: "DM Mono, monospace",
        }}
      >
        Traffic-aware
      </span>
    );
  }
  return (
    <span
      className="text-[9px] px-1.5 py-[1px] rounded-full"
      style={{
        background: "rgba(255,255,255,0.04)",
        color: "rgba(139,148,158,0.5)",
        fontFamily: "DM Mono, monospace",
      }}
    >
      Rough est.
    </span>
  );
}

export default function ResultCard({
  result,
  variant = "list",
  animationDelay = 0,
  isSelected = false,
}: ResultCardProps) {
  const { lot, isBest, estimatedPrice, estimatedDriveMinutes, estimatedWalkMinutes, isTrafficAware } =
    result;
  const isBestVariant = variant === "best" || isBest;

  const priceDisplay = formatEstimatedPrice(estimatedPrice);
  const halfHourRate = formatRateHalfHour(lot.rateHalfHour);
  const driveLabel = `~${estimatedDriveMinutes} min`;
  const walkLabel = `~${estimatedWalkMinutes} min`;

  if (variant === "best") {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl transition-colors"
        style={
          isSelected
            ? {
                boxShadow: "0 0 0 2px rgba(45,185,106,0.45)",
                padding: 4,
                margin: -4,
              }
            : undefined
        }
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[11px] font-bold px-2.5 py-[3px] rounded-full"
              style={{
                background: "rgba(45,185,106,0.13)",
                color: "#2DB96A",
                fontFamily: "DM Mono, monospace",
                letterSpacing: "0.02em",
              }}
            >
              ★ Best Nearby
            </span>
            <TimeBadge isTrafficAware={isTrafficAware} />
            {lot.isUnderConstruction && (
              <span
                className="text-[10px] px-2 py-[2px] rounded-full"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  color: "#F59E0B",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                Under construction
              </span>
            )}
          </div>

          <h3
            className="font-bold text-[15px] truncate"
            style={{ color: "#F0F6FC" }}
          >
            {lot.name}
          </h3>
          {lot.address && (
            <p
              className="text-[12px] mt-0.5 truncate"
              style={{ color: "#8B949E" }}
            >
              {lot.address}
            </p>
          )}

          <div className="flex items-end gap-3 mt-2.5">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[32px] font-bold leading-none"
                style={{ color: "#F0F6FC", fontFamily: "DM Mono, monospace" }}
              >
                {priceDisplay}
              </span>
              {estimatedPrice != null && (
                <span
                  className="text-[11px] leading-tight mb-0.5"
                  style={{ color: "#8B949E", fontFamily: "DM Mono, monospace" }}
                >
                  est.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-1.5">
                <Car size={12} color="#8B949E" />
                <span
                  style={{
                    color: "#8B949E",
                    fontFamily: "DM Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {driveLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <WalkIcon size={12} color="#8B949E" />
                <span
                  style={{
                    color: "#8B949E",
                    fontFamily: "DM Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {walkLabel}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "#8B949E" }}>
            {halfHourRate !== "—" ? `${halfHourRate} / 30 min` : lot.rate ?? "Rate unavailable"}
          </p>
        </div>

        <motion.button
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl font-bold text-[13px] shrink-0 mt-1"
          style={{
            background: "#2DB96A",
            color: "#071410",
            boxShadow: "0 4px 18px rgba(45,185,106,0.38)",
          }}
          whileTap={{ scale: 0.95 }}
          aria-label="Directions (coming soon)"
          onClick={() => {}}
        >
          <Navigation2 size={14} strokeWidth={2.5} />
          Go
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-2xl p-4"
      style={{
        background: isBestVariant
          ? "rgba(45,185,106,0.07)"
          : "rgba(255,255,255,0.03)",
        border: isSelected
          ? "2px solid rgba(45,185,106,0.55)"
          : `1px solid ${isBestVariant ? "rgba(45,185,106,0.18)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isSelected ? "0 0 0 1px rgba(45,185,106,0.2)" : undefined,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {isBest && (
              <span
                className="text-[10px] font-bold px-2 py-[2px] rounded-full"
                style={{
                  background: "rgba(45,185,106,0.18)",
                  color: "#2DB96A",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                Best pick
              </span>
            )}
            <span
              className="text-[10px] px-2 py-[2px] rounded-full"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#8B949E",
                fontFamily: "DM Mono, monospace",
              }}
            >
              {carparkTypeLabel(lot.carparkType)}
            </span>
            <TimeBadge isTrafficAware={isTrafficAware} />
            {lot.isUnderConstruction && (
              <span
                className="text-[10px] px-2 py-[2px] rounded-full"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  color: "#F59E0B",
                  fontFamily: "DM Mono, monospace",
                }}
              >
                Construction
              </span>
            )}
          </div>

          <h4
            className="font-bold text-[14px] leading-snug truncate"
            style={{ color: "#F0F6FC" }}
          >
            {lot.name}
          </h4>
          {lot.address && (
            <p
              className="text-[12px] mt-0.5 truncate"
              style={{ color: "#8B949E" }}
            >
              {lot.address}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[20px] font-bold leading-none"
                style={{ color: "#F0F6FC", fontFamily: "DM Mono, monospace" }}
              >
                {priceDisplay}
              </span>
              {estimatedPrice != null && (
                <span
                  className="text-[10px]"
                  style={{ color: "#8B949E", fontFamily: "DM Mono, monospace" }}
                >
                  est.
                </span>
              )}
            </div>
            <div
              className="h-3 w-px"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div className="flex items-center gap-1.5">
              <Car size={11} color="#8B949E" />
              <span
                style={{
                  color: "#8B949E",
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                }}
              >
                {driveLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <WalkIcon size={11} color="#8B949E" />
              <span
                style={{
                  color: "#8B949E",
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                }}
              >
                {walkLabel}
              </span>
            </div>
            {lot.capacity != null && (
              <span
                style={{
                  color: "rgba(139,148,158,0.45)",
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10,
                }}
              >
                {lot.capacity} spaces
              </span>
            )}
          </div>
        </div>

        <motion.button
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl font-bold text-[13px] shrink-0 mt-1"
          style={{
            background: isBestVariant ? "#2DB96A" : "rgba(255,255,255,0.06)",
            color: isBestVariant ? "#071410" : "#8B949E",
            border: isBestVariant ? "none" : "1px solid rgba(255,255,255,0.08)",
          }}
          whileTap={{ scale: 0.95 }}
          aria-label="Directions (coming soon)"
          onClick={() => {}}
        >
          <Navigation2 size={14} strokeWidth={2.5} />
          Go
        </motion.button>
      </div>
    </motion.div>
  );
}

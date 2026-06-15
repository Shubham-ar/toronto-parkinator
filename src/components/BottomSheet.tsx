"use client";

import { ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { SearchResult } from "@/types/parking";
import ResultCard from "./ResultCard";
import ResultsList from "./ResultsList";

interface BottomSheetProps {
  results: SearchResult[];
  best: SearchResult | null;
  selectedResultId?: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onSearchAgain?: () => void;
  dataNote?: string;
}

export default function BottomSheet({
  results,
  best,
  selectedResultId,
  expanded,
  onToggleExpand,
  onSearchAgain,
  dataNote,
}: BottomSheetProps) {
  const otherCount = Math.max(0, results.length - 1);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden"
        style={{
          zIndex: 40,
          height: "78vh",
          background: "#161B22",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.65)",
          overscrollBehavior: "contain",
        }}
        initial={{ y: "100%" }}
        animate={{ y: expanded ? "0%" : "calc(78vh - 232px)" }}
        transition={{ type: "spring", stiffness: 420, damping: 46 }}
      >
        <div
          className="flex justify-center pt-3 pb-1 cursor-pointer"
          onClick={onToggleExpand}
          onKeyDown={(e) => e.key === "Enter" && onToggleExpand()}
          role="button"
          tabIndex={0}
          aria-label={expanded ? "Collapse results" : "Expand results"}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.14)" }}
          />
        </div>

        <div className="px-5 pt-1">
          {best && (
            <ResultCard
              result={best}
              variant="best"
              isSelected={selectedResultId === best.lot.id}
            />
          )}

          {otherCount > 0 && !expanded && (
            <motion.button
              type="button"
              className="w-full flex items-center justify-center gap-2 mt-4 py-[10px] rounded-xl text-[13px] font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#8B949E",
              }}
              onClick={onToggleExpand}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronUp size={14} />
              {otherCount} more lot{otherCount === 1 ? "" : "s"} nearby
            </motion.button>
          )}

          {dataNote && (
            <p
              className="text-center text-[10px] mt-3 pb-1"
              style={{ color: "rgba(139,148,158,0.45)", fontFamily: "DM Mono, monospace" }}
            >
              {dataNote}
            </p>
          )}
        </div>

        <div
          style={{
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? "auto" : "none",
            transition: "opacity 0.18s 0.08s",
          }}
        >
          <ResultsList
            results={results}
            selectedResultId={selectedResultId}
            onCollapse={onToggleExpand}
            onSearchAgain={onSearchAgain}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { ChevronDown } from "lucide-react";
import type { SearchResult } from "@/types/parking";
import ResultCard from "./ResultCard";

interface ResultsListProps {
  results: SearchResult[];
  selectedResultId?: string | null;
  onCollapse: () => void;
  onSearchAgain?: () => void;
}

export default function ResultsList({
  results,
  selectedResultId,
  onCollapse,
  onSearchAgain,
}: ResultsListProps) {
  return (
    <div
      style={{
        height: "calc(78vh - 232px)",
        overflowY: "auto",
      }}
    >
      <div className="flex items-center justify-between px-5 pt-5 mb-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "#8B949E", fontFamily: "DM Mono, monospace" }}
        >
          All nearby lots ({results.length})
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="flex items-center gap-1 text-[12px]"
          style={{ color: "rgba(139,148,158,0.55)" }}
        >
          <ChevronDown size={13} />
          Collapse
        </button>
      </div>

      <div
        className="px-5 space-y-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 32px)" }}
      >
        {results.map((result, index) => (
          <ResultCard
            key={result.lot.id}
            result={result}
            variant="list"
            animationDelay={index * 0.055}
            isSelected={selectedResultId === result.lot.id}
          />
        ))}

        {onSearchAgain && (
          <button
            type="button"
            onClick={onSearchAgain}
            className="w-full text-center text-[12px] py-3"
            style={{ color: "rgba(139,148,158,0.4)" }}
          >
            Search again
          </button>
        )}
      </div>
    </div>
  );
}

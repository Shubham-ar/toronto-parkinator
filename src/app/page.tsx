"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import BottomSheet from "@/components/BottomSheet";
import FloatingHeader from "@/components/FloatingHeader";
import LoadingState from "@/components/LoadingState";
import LocateButton from "@/components/LocateButton";
import LocationFallback from "@/components/LocationFallback";
import MapView from "@/components/MapView";
import NoResultsState from "@/components/NoResultsState";
import SettingsPanel from "@/components/SettingsPanel";
import type {
  AppState,
  Coordinates,
  SearchResponse,
  SearchResult,
  SearchSettings,
} from "@/types/parking";
import {
  DEFAULT_SEARCH_SETTINGS,
  DEMO_LOCATION,
} from "@/types/parking";

const GEO_TIMEOUT_MS = 10_000;

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [settings, setSettings] = useState<SearchSettings>(
    DEFAULT_SEARCH_SETTINGS
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [best, setBest] = useState<SearchResult | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const [dataNote, setDataNote] = useState<string>("Results from Green P data");
  const [locationError, setLocationError] = useState<string | undefined>();

  const runSearch = useCallback(
    async (location: Coordinates) => {
      setAppState((prev) => {
        if (prev === "locating") return prev;
        return "locating";
      });
      setSheetExpanded(false);
      setUserLocation(location);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentLocation: location,
            settings,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Search request failed");
        }

        const data = (await response.json()) as SearchResponse;
        setResults(data.results);
        setBest(data.best);
        setSelectedResult(data.best);

        const noteParts = ["Results from Green P data"];
        if (data.meta.note) noteParts.push(data.meta.note);
        setDataNote(noteParts.join(" · "));

        setAppState(data.results.length > 0 ? "results" : "no-results");
      } catch (error) {
        console.error("[page] search failed:", error);
        setLocationError(
          error instanceof Error ? error.message : "Search failed. Please try again."
        );
        setAppState("location-failed");
      }
    },
    [settings]
  );

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      setAppState("location-failed");
      return;
    }

    setAppState("locating");
    setLocationError(undefined);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void runSearch({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied."
            : error.code === error.TIMEOUT
              ? "Location request timed out."
              : "Unable to determine your location.";
        setLocationError(message);
        setAppState("location-failed");
      },
      {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }, [runSearch]);

  const handleSearchAgain = useCallback(() => {
    if (userLocation) {
      void runSearch(userLocation);
    }
  }, [runSearch, userLocation]);

  const handleReset = () => {
    setAppState("idle");
    setSheetExpanded(false);
    setResults([]);
    setBest(null);
    setSelectedResult(null);
    setUserLocation(null);
    setLocationError(undefined);
  };

  const hasAutoLocated = useRef(false);
  useEffect(() => {
    if (hasAutoLocated.current) return;
    hasAutoLocated.current = true;
    requestGeolocation();
  }, [requestGeolocation]);

  // Rough visual radius for map placeholder fallback (convert max drive minutes to km)
  const maxRadiusKm = (settings.maxDriveMinutes / 60) * 30;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#060C14" }}
    >
      <div
        className="fixed inset-0 pointer-events-none hidden sm:block"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(18,30,48,0.35) 79px, rgba(18,30,48,0.35) 80px),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(18,30,48,0.35) 79px, rgba(18,30,48,0.35) 80px)
          `,
        }}
      />

      <div
        className="relative w-full max-w-[430px] mx-auto overflow-hidden"
        style={{
          height: "100dvh",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <MapView
          userLocation={userLocation}
          results={results}
          best={best}
          showPins={appState === "results"}
          selectedResultId={selectedResult?.lot.id ?? best?.lot.id ?? null}
          onSelectResult={(result) => {
            setSelectedResult(result);
            setSheetExpanded(true);
          }}
          maxRadiusKm={maxRadiusKm}
        />

        <FloatingHeader
          onOpenSettings={() => setSettingsOpen(true)}
          onReset={handleReset}
          showReset={appState !== "idle" && appState !== "locating"}
        />

        <AnimatePresence>
          {appState === "idle" && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 px-5 flex flex-col items-center"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom), 36px)",
                zIndex: 30,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 420, damping: 42 }}
            >
              <LocateButton onClick={requestGeolocation} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appState === "location-failed" && (
            <LocationFallback
              onTryAgain={requestGeolocation}
              onUseDemoLocation={() => void runSearch(DEMO_LOCATION)}
              onManualLocation={(lat, lng) => void runSearch({ lat, lng })}
              errorMessage={locationError}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {appState === "locating" && <LoadingState key="loading" />}
        </AnimatePresence>

        <AnimatePresence>
          {appState === "no-results" && (
            <NoResultsState
              key="no-results"
              onOpenSettings={() => setSettingsOpen(true)}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>

        {appState === "results" && best && (
          <BottomSheet
            results={results}
            best={best}
            selectedResultId={selectedResult?.lot.id ?? best.lot.id}
            expanded={sheetExpanded}
            onToggleExpand={() => setSheetExpanded((v) => !v)}
            onSearchAgain={handleSearchAgain}
            dataNote={dataNote}
          />
        )}

        <SettingsPanel
          open={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onChange={setSettings}
          onSearchAgain={handleSearchAgain}
          canSearchAgain={userLocation != null && appState !== "locating"}
        />
      </div>
    </div>
  );
}

// TODO: separate destination from current location

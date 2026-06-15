"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import type { Coordinates, SearchResult } from "@/types/parking";
import { DEMO_LOCATION } from "@/types/parking";

type TomTomModule = typeof import("@tomtom-international/web-sdk-maps");
type TomTomMap = ReturnType<TomTomModule["map"]>;
type TomTomMarker = InstanceType<TomTomModule["Marker"]>;

const DEFAULT_CENTER = DEMO_LOCATION;
const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY?.trim() ?? "";

interface MapViewProps {
  userLocation: Coordinates | null;
  results: SearchResult[];
  best: SearchResult | null;
  showPins: boolean;
  selectedResultId?: string | null;
  onSelectResult?: (result: SearchResult) => void;
  maxRadiusKm?: number;
}

function clampPercent(value: number): number {
  return Math.min(92, Math.max(8, value));
}

function projectPin(
  lotLat: number,
  lotLng: number,
  center: Coordinates,
  maxRadiusKm: number
): { x: number; y: number } {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  const targetPercent = 38;

  const scaleLng = targetPercent / (maxRadiusKm / kmPerDegLng);
  const scaleLat = targetPercent / (maxRadiusKm / kmPerDegLat);

  const x = clampPercent(50 + (lotLng - center.lng) * scaleLng);
  const y = clampPercent(50 - (lotLat - center.lat) * scaleLat);

  return { x, y };
}

function createParkingMarkerElement(
  result: SearchResult,
  isSelected: boolean,
  onClick?: () => void
): HTMLDivElement {
  const hi = result.isBest;
  const pinSize = hi || isSelected ? 40 : 28;
  const stemHeight = hi || isSelected ? 10 : 7;
  const totalHeight = pinSize + stemHeight - 1;

  // Use a fixed-size wrapper so TomTom anchor: "center" lands on the
  // geographic point at the bottom-center of the visible pin.
  // We double totalHeight so the pin sits in the top half, and the
  // center of the wrapper aligns with the tip of the stem.
  const wrapperSize = Math.max(pinSize, totalHeight * 2);

  const root = document.createElement("div");
  root.style.cssText = `
    width: ${wrapperSize}px;
    height: ${wrapperSize}px;
    cursor: pointer;
    z-index: ${isSelected || hi ? 22 : 12};
    pointer-events: none;
  `;

  // Inner container holds the visible pin, positioned so its bottom
  // sits at the vertical center of root (= the anchor point).
  const inner = document.createElement("div");
  inner.style.cssText = `
    position: absolute;
    bottom: ${wrapperSize / 2}px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;
  `;

  if (hi || isSelected) {
    const pulseSize = isSelected ? 64 : 56;
    const pulseOffset = (pulseSize - pinSize) / 2;
    const pulse = document.createElement("div");
    pulse.style.cssText = `
      position: absolute;
      width: ${pulseSize}px;
      height: ${pulseSize}px;
      top: ${-pulseOffset}px;
      left: ${-pulseOffset}px;
      border-radius: 9999px;
      background: rgba(45,185,106,${isSelected ? 0.28 : 0.18});
      animation: parkinator-pulse 2.2s ease-in-out infinite;
      pointer-events: none;
    `;
    inner.appendChild(pulse);
  }

  const pin = document.createElement("div");
  pin.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    font-weight: 700;
    user-select: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -0.01em;
    width: ${pinSize}px;
    height: ${pinSize}px;
    background: ${hi || isSelected ? "#2DB96A" : "#141C28"};
    color: ${hi || isSelected ? "#071410" : "#3E5878"};
    font-size: ${hi || isSelected ? 16 : 11}px;
    border: ${isSelected ? "3px solid #F0F6FC" : `2px solid ${hi ? "#2DB96A" : "#1C3050"}`};
    box-shadow: ${
      hi || isSelected
        ? "0 4px 20px rgba(45,185,106,0.55)"
        : "0 2px 10px rgba(0,0,0,0.55)"
    };
  `;
  pin.textContent = "P";
  inner.appendChild(pin);

  const stem = document.createElement("div");
  stem.style.cssText = `
    margin: -1px auto 0;
    border-radius: 0 0 9999px 9999px;
    width: ${hi || isSelected ? 3 : 2}px;
    height: ${stemHeight}px;
    background: ${hi || isSelected ? "#2DB96A" : "#1C3050"};
  `;
  inner.appendChild(stem);

  root.appendChild(inner);

  if (onClick) {
    inner.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });
  }

  return root;
}

function createUserMarkerElement(): HTMLDivElement {
  const root = document.createElement("div");
  root.style.cssText = `
    width: 48px;
    height: 48px;
    position: relative;
    z-index: 25;
    pointer-events: none;
  `;

  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: rgba(59,130,246,0.18);
    animation: parkinator-pulse 2.6s ease-in-out infinite;
  `;
  root.appendChild(pulse);

  const dot = document.createElement("div");
  dot.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    border: 2.5px solid white;
    background: #3B82F6;
    box-shadow: 0 0 16px rgba(59,130,246,0.75);
  `;
  root.appendChild(dot);

  return root;
}

function PlaceholderMap({
  userLocation,
  results,
  showPins,
  maxRadiusKm = 5,
}: Pick<MapViewProps, "userLocation" | "results" | "showPins" | "maxRadiusKm">) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "#0C1420" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 67px, rgba(24,38,62,0.75) 67px, rgba(24,38,62,0.75) 69px),
            repeating-linear-gradient(90deg, transparent, transparent 52px, rgba(24,38,62,0.75) 52px, rgba(24,38,62,0.75) 54px)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 203px, rgba(30,52,92,0.85) 203px, rgba(30,52,92,0.85) 207px),
            repeating-linear-gradient(90deg, transparent, transparent 158px, rgba(30,52,92,0.85) 158px, rgba(30,52,92,0.85) 162px)
          `,
        }}
      />
      <div
        className="absolute rounded-lg"
        style={{
          top: "10%",
          left: "3%",
          width: "24%",
          height: "18%",
          background: "#0C1F12",
          border: "1px solid #122018",
        }}
      />
      <div
        className="absolute rounded"
        style={{
          top: "70%",
          left: "26%",
          width: "40%",
          height: "7%",
          background: "#091A0F",
          border: "1px solid #0E1E14",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "19%",
          left: 0,
          right: 0,
          height: "5px",
          background: "rgba(38,65,118,0.55)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "22%",
          background:
            "linear-gradient(to top, #06101C 0%, #0A1627 55%, transparent 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "19.5%",
          left: "5%",
          right: "5%",
          height: "1px",
          background: "rgba(30,75,140,0.35)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, transparent 22%, rgba(0,0,0,0.52) 100%)",
        }}
      />

      {showPins && userLocation && (
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "46%",
            transform: "translate(-50%, -50%)",
            zIndex: 25,
          }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 48,
              height: 48,
              top: -16,
              left: -16,
              background: "rgba(59,130,246,0.18)",
            }}
            animate={{ scale: [1, 1.7, 1], opacity: [0.9, 0.2, 0.9] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
          />
          <div
            className="relative rounded-full border-[2.5px] border-white"
            style={{
              width: 16,
              height: 16,
              background: "#3B82F6",
              boxShadow: "0 0 16px rgba(59,130,246,0.75)",
            }}
          />
        </div>
      )}

      {showPins &&
        userLocation &&
        results.map((result) => {
          const { x, y } = projectPin(
            result.lot.lat,
            result.lot.lng,
            userLocation,
            maxRadiusKm
          );
          const hi = result.isBest;

          return (
            <div
              key={result.lot.id}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -100%)",
                zIndex: hi ? 22 : 12,
              }}
            >
              {hi && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 56,
                    height: 56,
                    top: -12,
                    left: -12,
                    background: "rgba(45,185,106,0.18)",
                  }}
                  animate={{ scale: [1, 1.55, 1], opacity: [0.85, 0.25, 0.85] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: "easeInOut",
                  }}
                />
              )}
              <div
                className="flex items-center justify-center rounded-full font-bold select-none"
                style={{
                  width: hi ? 40 : 28,
                  height: hi ? 40 : 28,
                  background: hi ? "#2DB96A" : "#141C28",
                  color: hi ? "#071410" : "#3E5878",
                  fontSize: hi ? 16 : 11,
                  border: `2px solid ${hi ? "#2DB96A" : "#1C3050"}`,
                  boxShadow: hi
                    ? "0 4px 20px rgba(45,185,106,0.55)"
                    : "0 2px 10px rgba(0,0,0,0.55)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                P
              </div>
              <div
                className="mx-auto rounded-b-full"
                style={{
                  width: hi ? 3 : 2,
                  height: hi ? 10 : 7,
                  background: hi ? "#2DB96A" : "#1C3050",
                  marginTop: -1,
                }}
              />
            </div>
          );
        })}
    </div>
  );
}

function MissingKeyMessage() {
  return (
    <div
      className="absolute left-4 right-4 top-[72px] z-[5] rounded-xl px-3 py-2 text-center text-[12px] leading-snug"
      style={{
        background: "rgba(12,20,32,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#8B949E",
        backdropFilter: "blur(8px)",
      }}
    >
      TomTom map key missing. Add{" "}
      <code className="text-[11px]" style={{ color: "#C9D1D9" }}>
        NEXT_PUBLIC_TOMTOM_API_KEY
      </code>{" "}
      to <code className="text-[11px]" style={{ color: "#C9D1D9" }}>.env.local</code>.
    </div>
  );
}

function coordsEqual(a: Coordinates | null, b: Coordinates | null): boolean {
  if (!a || !b) return a === b;
  return a.lat === b.lat && a.lng === b.lng;
}

export default function MapView({
  userLocation,
  results,
  best: _best,
  showPins,
  selectedResultId,
  onSelectResult,
  maxRadiusKm = 5,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<TomTomMap | null>(null);
  const ttRef = useRef<TomTomModule | null>(null);
  const parkingMarkersRef = useRef<TomTomMarker[]>([]);
  const userMarkerRef = useRef<TomTomMarker | null>(null);
  const onSelectResultRef = useRef(onSelectResult);
  const lastCameraTargetRef = useRef<Coordinates | null>(null);
  const lastResultsKeyRef = useRef<string>("");

  const [mapReady, setMapReady] = useState(false);

  onSelectResultRef.current = onSelectResult;

  const initialCenter = userLocation ?? DEFAULT_CENTER;
  const hasApiKey = Boolean(TOMTOM_API_KEY);

  const syncParkingMarkers = useCallback(() => {
    const map = mapRef.current;
    const tt = ttRef.current;
    if (!map || !tt || !mapReady) return;

    parkingMarkersRef.current.forEach((marker) => marker.remove());
    parkingMarkersRef.current = [];

    if (!showPins) return;

    for (const result of results) {
      const isSelected = selectedResultId === result.lot.id;
      const marker = new tt.Marker({
        element: createParkingMarkerElement(result, isSelected, () => {
          onSelectResultRef.current?.(result);
        }),
        anchor: "center",
      })
        .setLngLat([result.lot.lng, result.lot.lat])
        .addTo(map);

      parkingMarkersRef.current.push(marker);
    }
  }, [mapReady, results, showPins, selectedResultId]);

  const syncUserMarker = useCallback(() => {
    const map = mapRef.current;
    const tt = ttRef.current;
    if (!map || !tt || !mapReady) return;

    if (!userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      return;
    }

    userMarkerRef.current = new tt.Marker({
      element: createUserMarkerElement(),
      anchor: "center",
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);
  }, [mapReady, userLocation]);

  const syncCamera = useCallback(() => {
    const map = mapRef.current;
    const tt = ttRef.current;
    if (!map || !tt || !mapReady || !userLocation) return;

    const resultsKey = results.map((r) => r.lot.id).join(",");
    const locationChanged = !coordsEqual(userLocation, lastCameraTargetRef.current);
    const resultsChanged = resultsKey !== lastResultsKeyRef.current;

    if (showPins && results.length > 0 && (locationChanged || resultsChanged)) {
      const bounds = new tt.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      for (const result of results) {
        bounds.extend([result.lot.lng, result.lot.lat]);
      }
      map.fitBounds(bounds, { padding: 72, maxZoom: 15, duration: 600 });
      lastCameraTargetRef.current = userLocation;
      lastResultsKeyRef.current = resultsKey;
      return;
    }

    if (!showPins && locationChanged) {
      map.easeTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
        duration: 500,
      });
      lastCameraTargetRef.current = userLocation;
    }
  }, [mapReady, results, showPins, userLocation]);

  useEffect(() => {
    if (!hasApiKey || !mapContainerRef.current) return;

    let cancelled = false;

    void (async () => {
      const ttModule = await import("@tomtom-international/web-sdk-maps");
      const tt = (ttModule.default ?? ttModule) as TomTomModule;
      if (cancelled || !mapContainerRef.current) return;

      ttRef.current = tt;

      const map = tt.map({
        key: TOMTOM_API_KEY,
        container: mapContainerRef.current,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 14,
        dragPan: true,
        scrollZoom: true,
        stylesVisibility: {
          trafficFlow: false,
          trafficIncidents: false,
        },
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        map.resize();
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      parkingMarkersRef.current.forEach((marker) => marker.remove());
      parkingMarkersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      ttRef.current = null;
      lastCameraTargetRef.current = null;
      lastResultsKeyRef.current = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once per mount when key exists
  }, [hasApiKey]);

  useEffect(() => {
    syncUserMarker();
  }, [syncUserMarker]);

  useEffect(() => {
    syncParkingMarkers();
  }, [syncParkingMarkers]);

  useEffect(() => {
    syncCamera();
  }, [syncCamera]);

  if (!hasApiKey) {
    return (
      <div className="absolute inset-0">
        <PlaceholderMap
          userLocation={userLocation}
          results={results}
          showPins={showPins}
          maxRadiusKm={maxRadiusKm}
        />
        <MissingKeyMessage />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes parkinator-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.55);
            opacity: 0.25;
          }
        }
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-logo {
          opacity: 0.65;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        aria-label="Interactive parking map"
      />
    </>
  );
}

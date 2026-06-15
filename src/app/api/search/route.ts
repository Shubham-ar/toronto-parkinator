import { NextResponse } from "next/server";
import { fetchGreenPLots } from "@/lib/greenp";
import {
  searchParking,
  getMatrixCandidates,
  type MatrixDriveTimeMap,
} from "@/lib/parkingSearch";
import {
  fetchMatrixDriveTimes,
  USE_TOMTOM_MATRIX,
} from "@/lib/tomtomMatrix";
import type {
  SearchRequest,
  SearchSettings,
  SortPreference,
} from "@/types/parking";

const VALID_SORT: SortPreference[] = [
  "cheapest",
  "shortest_walk",
  "balanced",
];

function isValidCoordinates(
  value: unknown
): value is { lat: number; lng: number } {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Record<string, unknown>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function isValidSettings(value: unknown): value is SearchSettings {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;

  return (
    typeof s.maxDriveMinutes === "number" &&
    s.maxDriveMinutes > 0 &&
    typeof s.maxWalkMinutes === "number" &&
    s.maxWalkMinutes > 0 &&
    typeof s.parkingDurationMinutes === "number" &&
    s.parkingDurationMinutes > 0 &&
    typeof s.sortPreference === "string" &&
    VALID_SORT.includes(s.sortPreference as SortPreference) &&
    typeof s.preferGarages === "boolean" &&
    typeof s.showSurfaceLots === "boolean"
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const { currentLocation, settings } = body as SearchRequest;

  if (!isValidCoordinates(currentLocation)) {
    return NextResponse.json(
      { error: "currentLocation.lat and currentLocation.lng are required and must be valid" },
      { status: 400 }
    );
  }

  if (!isValidSettings(settings)) {
    return NextResponse.json(
      { error: "settings object is invalid or missing required fields" },
      { status: 400 }
    );
  }

  try {
    const { lots, meta } = await fetchGreenPLots();

    let matrixDriveTimes: MatrixDriveTimeMap | null = null;

    if (USE_TOMTOM_MATRIX) {
      const candidates = getMatrixCandidates(
        lots,
        currentLocation,
        settings.maxDriveMinutes
      );

      if (candidates.length > 0) {
        const matrixResults = await fetchMatrixDriveTimes(
          currentLocation,
          candidates
        );
        if (matrixResults) {
          matrixDriveTimes = {};
          for (const r of matrixResults) {
            matrixDriveTimes[r.lotId] = r.driveMinutes;
          }
        }
      }
    }

    const { results, best, isTrafficAware } = searchParking(
      lots,
      currentLocation,
      settings,
      matrixDriveTimes
    );

    return NextResponse.json({
      results,
      best,
      meta: {
        dataSource: meta.source,
        total: results.length,
        routingProvider: isTrafficAware ? "tomtom_matrix_v2" : null,
        liveTrafficEnabled: isTrafficAware,
        distanceNote: isTrafficAware
          ? "Drive times are traffic-aware via TomTom. Walk times are rough estimates."
          : "Drive and walk times are rough estimates based on straight-line distance.",
        cached: meta.cached,
        note: meta.note,
      },
    });
  } catch (error) {
    console.error("[api/search] unexpected error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}

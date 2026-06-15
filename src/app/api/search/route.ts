import { NextResponse } from "next/server";
import { fetchGreenPLots } from "@/lib/greenp";
import { searchParking } from "@/lib/parkingSearch";
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
    typeof s.maxDrivingRadiusKm === "number" &&
    s.maxDrivingRadiusKm > 0 &&
    typeof s.maxWalkingRadiusKm === "number" &&
    s.maxWalkingRadiusKm > 0 &&
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
    const { results, best } = searchParking(lots, currentLocation, settings);

    return NextResponse.json({
      results,
      best,
      meta: {
        dataSource: meta.source,
        total: results.length,
        cached: meta.cached,
        note: meta.note,
        distanceNote:
          "Distances are straight-line estimates. Drive and walk times are approximate.",
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

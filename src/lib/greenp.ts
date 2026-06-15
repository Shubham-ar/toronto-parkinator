import { fallbackGreenPLots } from "@/data/fallbackGreenPLots";
import type { CarparkType, GreenPLot } from "@/types/parking";

const DEFAULT_API_KEY =
  "eedeab41c581e6883cd4eb349fdea8329dc450479b7f686dff292b5bf2de6f5b";

const GREENP_BASE_URL = "https://parking.greenp.com/api/carparks/";

function getApiKey(): string {
  return process.env.GREENP_API_KEY ?? DEFAULT_API_KEY;
}

function extractRawLots(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.carparks)) return obj.carparks;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.results)) return obj.results;
  }
  return [];
}

function parseFloatSafe(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed =
    typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntSafe(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed =
    typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapCarparkType(raw: unknown): CarparkType {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("garage") || value === "1") return "garage";
  if (value.includes("surface") || value === "2") return "surface";
  return "unknown";
}

function normalizeLot(raw: Record<string, unknown>): GreenPLot | null {
  const lat = parseFloatSafe(raw.lat ?? raw.latitude);
  const lng = parseFloatSafe(raw.lng ?? raw.longitude ?? raw.long);

  if (
    lat == null ||
    lng == null ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  const address = String(raw.address ?? "").trim();
  const name = String(
    raw.name ?? raw.carpark_name ?? (address || "Green P Lot")
  ).trim();

  return {
    id: String(raw.id ?? raw.slug ?? `${lat},${lng}`),
    name,
    address,
    lat,
    lng,
    rate: raw.rate != null ? String(raw.rate) : null,
    rateHalfHour: parseFloatSafe(raw.rate_half_hour ?? raw.rateHalfHour),
    capacity: parseIntSafe(raw.capacity),
    carparkType: mapCarparkType(raw.carpark_type ?? raw.carparkType),
    isUnderConstruction: Boolean(
      raw.is_under_construction ?? raw.isUnderConstruction
    ),
    sourceUrl: raw.slug != null ? String(raw.slug) : undefined,
    rateDetails: raw.rate_details,
    paymentMethods: raw.payment_methods,
    paymentOptions: raw.payment_options,
  };
}

export interface GreenPFetchMeta {
  source: "greenp" | "fallback";
  cached: boolean;
  note?: string;
}

export async function fetchGreenPLots(): Promise<{
  lots: GreenPLot[];
  meta: GreenPFetchMeta;
}> {
  // TODO: robust caching (Redis/KV)
  try {
    const url = new URL(GREENP_BASE_URL);
    url.searchParams.set("api_key", getApiKey());
    url.searchParams.set("filter", "1,2");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "TorontoParkinator/1.0 (+https://github.com/toronto-parkinator)",
      },
    });

    if (!response.ok) {
      throw new Error(`Green P API returned ${response.status}`);
    }

    const json: unknown = await response.json();
    const rawLots = extractRawLots(json);
    const lots = rawLots
      .filter(
        (item): item is Record<string, unknown> =>
          item != null && typeof item === "object" && !Array.isArray(item)
      )
      .map(normalizeLot)
      .filter((lot): lot is GreenPLot => lot != null);

    if (lots.length === 0) {
      throw new Error("No valid lots parsed from Green P response");
    }

    return {
      lots,
      meta: { source: "greenp", cached: true },
    };
  } catch (error) {
    console.error("[greenp] fetch failed:", error);
    return {
      lots: fallbackGreenPLots,
      meta: {
        source: "fallback",
        cached: false,
        note: "Live Green P data unavailable; showing sample downtown lots",
      },
    };
  }
}

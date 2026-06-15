import { fallbackGreenPLots } from "@/data/fallbackGreenPLots";
import type { CarparkType, GreenPLot } from "@/types/parking";

const OPENDATA_URL =
  "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/b66466c3-69c8-4825-9c8b-04b270069193/resource/8549d588-30b0-482e-b872-b21beefdda22/download/green-p-parking-2019.json";

const GREENP_DIRECT_URL = "https://parking.greenp.com/api/carparks/";

function getApiKey(): string {
  return (
    process.env.GREENP_API_KEY ??
    "eedeab41c581e6883cd4eb349fdea8329dc450479b7f686dff292b5bf2de6f5b"
  );
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

async function fetchJson(url: string, label: string): Promise<unknown> {
  console.info(`[greenp] Trying ${label}: ${url.slice(0, 80)}...`);
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`${label} returned ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    throw new Error(`${label} returned non-JSON (${contentType})`);
  }

  const json: unknown = await response.json();
  console.info(`[greenp] ${label} succeeded`);
  return json;
}

async function fetchWithFallback(): Promise<unknown> {
  // Primary: Toronto Open Data Portal (no WAF)
  try {
    return await fetchJson(OPENDATA_URL, "Toronto Open Data");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[greenp] Open Data failed: ${msg}, trying Green P direct...`);
  }

  // Fallback: Green P direct API (may be blocked by Incapsula WAF)
  const url = new URL(GREENP_DIRECT_URL);
  url.searchParams.set("api_key", getApiKey());
  return await fetchJson(url.toString(), "Green P direct");
}

export async function fetchGreenPLots(): Promise<{
  lots: GreenPLot[];
  meta: GreenPFetchMeta;
}> {
  // TODO: robust caching (Redis/KV)
  try {
    const json = await fetchWithFallback();
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
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[greenp] Using fallback data: ${msg}`);
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

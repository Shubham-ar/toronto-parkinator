import type { Coordinates } from "@/types/parking";

const TOMTOM_MATRIX_URL =
  "https://api.tomtom.com/routing/matrix/2";

export const USE_TOMTOM_MATRIX =
  process.env.USE_TOMTOM_MATRIX === "true";

function getServerApiKey(): string {
  return process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "";
}

export interface MatrixDriveTime {
  lotId: string;
  driveMinutes: number;
}

/**
 * Call TomTom Matrix Routing v2 to get traffic-aware drive times
 * from origin to multiple parking lot destinations.
 *
 * Returns drive times in minutes, or null on failure (caller should
 * fall back to rough estimates).
 */
export async function fetchMatrixDriveTimes(
  origin: Coordinates,
  destinations: { id: string; lat: number; lng: number }[]
): Promise<MatrixDriveTime[] | null> {
  const apiKey = getServerApiKey();
  if (!apiKey) {
    console.warn("[tomtom-matrix] TOMTOM_API_KEY not set, skipping matrix call");
    return null;
  }

  if (destinations.length === 0) return [];

  // TomTom Matrix v2 accepts up to ~700 routes per call (1 origin x N destinations)
  // Batch if needed, but for MVP we cap at 100 destinations
  const batch = destinations.slice(0, 100);

  try {
    const url = `${TOMTOM_MATRIX_URL}?key=${encodeURIComponent(apiKey)}`;

    const body = {
      origins: [{ point: { latitude: origin.lat, longitude: origin.lng } }],
      destinations: batch.map((d) => ({
        point: { latitude: d.lat, longitude: d.lng },
      })),
      options: {
        travelMode: "car",
        traffic: "live",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[tomtom-matrix] API returned ${response.status}: ${text.slice(0, 200)}`
      );
      return null;
    }

    const data = (await response.json()) as TomTomMatrixResponse;

    const results: MatrixDriveTime[] = [];
    for (let i = 0; i < batch.length; i++) {
      const cell = data?.data?.[i];
      if (!cell || cell.detour?.travelTimeInSeconds == null) {
        // Also check routeSummary for v2 response variations
        const travelTime =
          cell?.routeSummary?.travelTimeInSeconds ??
          cell?.detour?.travelTimeInSeconds;
        if (travelTime != null) {
          results.push({
            lotId: batch[i].id,
            driveMinutes: Math.max(1, Math.round(travelTime / 60)),
          });
        }
        continue;
      }
      results.push({
        lotId: batch[i].id,
        driveMinutes: Math.max(
          1,
          Math.round(cell.detour.travelTimeInSeconds / 60)
        ),
      });
    }

    console.info(
      `[tomtom-matrix] Got ${results.length}/${batch.length} drive times`
    );
    return results;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[tomtom-matrix] Failed: ${msg}`);
    return null;
  }
}

// TomTom Matrix v2 response shape (partial)
interface TomTomMatrixResponse {
  data?: Array<{
    detour?: { travelTimeInSeconds?: number };
    routeSummary?: { travelTimeInSeconds?: number };
    statusCode?: number;
  }>;
}

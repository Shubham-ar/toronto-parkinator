import {
  estimateDriveMinutes,
  estimateWalkMinutes,
  haversineKm,
} from "@/lib/geo";
import { estimateParkingPrice } from "@/lib/pricing";
import type {
  Coordinates,
  GreenPLot,
  SearchResult,
  SearchSettings,
} from "@/types/parking";

const GARAGE_BONUS = 0.05;

// Generous pre-filter radius: 30 km/h avg × maxDriveMinutes → km, with 1.4× buffer for road winding
function preFilterRadiusKm(maxDriveMinutes: number): number {
  return (maxDriveMinutes / 60) * 30 * 1.4;
}

export interface SearchParkingResult {
  results: SearchResult[];
  best: SearchResult | null;
  isTrafficAware: boolean;
}

export interface MatrixDriveTimeMap {
  [lotId: string]: number; // minutes
}

export function searchParking(
  lots: GreenPLot[],
  currentLocation: Coordinates,
  settings: SearchSettings,
  matrixDriveTimes?: MatrixDriveTimeMap | null
): SearchParkingResult {
  const destination = currentLocation;
  const useMatrix = matrixDriveTimes != null && Object.keys(matrixDriveTimes).length > 0;
  const haversinePreFilterKm = preFilterRadiusKm(settings.maxDriveMinutes);

  const candidates: SearchResult[] = [];

  for (const lot of lots) {
    const lotCoords = { lat: lot.lat, lng: lot.lng };
    const distanceKm = haversineKm(currentLocation, lotCoords);

    // Generous pre-filter to avoid processing obviously far-away lots
    if (distanceKm > haversinePreFilterKm) continue;

    if (!settings.showSurfaceLots && lot.carparkType === "surface") continue;

    const walkMinutes = estimateWalkMinutes(
      haversineKm(destination, lotCoords)
    );
    if (walkMinutes > settings.maxWalkMinutes) continue;

    let driveMinutes: number;
    let isTrafficAware = false;

    if (useMatrix && matrixDriveTimes[lot.id] != null) {
      driveMinutes = matrixDriveTimes[lot.id];
      isTrafficAware = true;
    } else {
      driveMinutes = estimateDriveMinutes(distanceKm);
    }

    if (driveMinutes > settings.maxDriveMinutes) continue;

    candidates.push({
      lot,
      distanceKm,
      estimatedPrice: estimateParkingPrice(
        lot.rateHalfHour,
        settings.parkingDurationMinutes
      ),
      estimatedDriveMinutes: driveMinutes,
      estimatedWalkMinutes: walkMinutes,
      isTrafficAware,
      isBest: false,
    });
  }

  const results = sortResults(candidates, settings);

  if (results.length > 0) {
    results[0].isBest = true;
  }

  return {
    results,
    best: results[0] ?? null,
    isTrafficAware: useMatrix,
  };
}

/**
 * Returns lot IDs + coords for matrix routing pre-filter.
 * Only lots within generous haversine radius.
 */
export function getMatrixCandidates(
  lots: GreenPLot[],
  currentLocation: Coordinates,
  maxDriveMinutes: number
): { id: string; lat: number; lng: number }[] {
  const radiusKm = preFilterRadiusKm(maxDriveMinutes);
  return lots
    .filter((lot) => {
      const d = haversineKm(currentLocation, { lat: lot.lat, lng: lot.lng });
      return d <= radiusKm;
    })
    .map((lot) => ({ id: lot.id, lat: lot.lat, lng: lot.lng }));
}

function sortResults(
  results: SearchResult[],
  settings: SearchSettings
): SearchResult[] {
  const sorted = [...results];

  if (settings.sortPreference === "cheapest") {
    sorted.sort((a, b) => {
      const priceA = a.estimatedPrice ?? Infinity;
      const priceB = b.estimatedPrice ?? Infinity;
      if (priceA !== priceB) return priceA - priceB;
      return a.distanceKm - b.distanceKm;
    });
    return sorted;
  }

  if (settings.sortPreference === "shortest_walk") {
    sorted.sort((a, b) => {
      if (a.estimatedWalkMinutes !== b.estimatedWalkMinutes) {
        return a.estimatedWalkMinutes - b.estimatedWalkMinutes;
      }
      return (a.estimatedPrice ?? Infinity) - (b.estimatedPrice ?? Infinity);
    });
    return sorted;
  }

  // balanced
  const finitePrices = sorted
    .map((r) => r.estimatedPrice)
    .filter((p): p is number => p != null);
  const distances = sorted.map((r) => r.distanceKm);
  const minPrice = finitePrices.length > 0 ? Math.min(...finitePrices) : 0;
  const maxPrice = finitePrices.length > 0 ? Math.max(...finitePrices) : 1;
  const minDist = distances.length > 0 ? Math.min(...distances) : 0;
  const maxDist = distances.length > 0 ? Math.max(...distances) : 1;

  const score = (result: SearchResult): number => {
    const normPrice =
      result.estimatedPrice == null
        ? 1
        : maxPrice === minPrice
          ? 0
          : (result.estimatedPrice - minPrice) / (maxPrice - minPrice);

    const normDist =
      maxDist === minDist
        ? 0
        : (result.distanceKm - minDist) / (maxDist - minDist);

    let total = normPrice + normDist;
    if (settings.preferGarages && result.lot.carparkType === "garage") {
      total -= GARAGE_BONUS;
    }
    return total;
  };

  sorted.sort((a, b) => score(a) - score(b));
  return sorted;
}

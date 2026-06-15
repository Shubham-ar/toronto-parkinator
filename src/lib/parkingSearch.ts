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

export interface SearchParkingResult {
  results: SearchResult[];
  best: SearchResult | null;
}

export function searchParking(
  lots: GreenPLot[],
  currentLocation: Coordinates,
  settings: SearchSettings
): SearchParkingResult {
  // TODO: separate destination from current location
  const destination = currentLocation;

  const candidates: SearchResult[] = [];

  for (const lot of lots) {
    const lotCoords = { lat: lot.lat, lng: lot.lng };
    const distanceFromCurrent = haversineKm(currentLocation, lotCoords);
    const distanceFromDestination = haversineKm(destination, lotCoords);

    if (distanceFromCurrent > settings.maxDrivingRadiusKm) continue;
    if (distanceFromDestination > settings.maxWalkingRadiusKm) continue;
    if (!settings.showSurfaceLots && lot.carparkType === "surface") continue;

    candidates.push({
      lot,
      distanceFromCurrentLocationKm: distanceFromCurrent,
      distanceFromDestinationKm: distanceFromDestination,
      estimatedPrice: estimateParkingPrice(
        lot.rateHalfHour,
        settings.parkingDurationMinutes
      ),
      estimatedDriveMinutes: estimateDriveMinutes(distanceFromCurrent),
      estimatedWalkMinutes: estimateWalkMinutes(distanceFromDestination),
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
  };
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
      return a.distanceFromDestinationKm - b.distanceFromDestinationKm;
    });
    return sorted;
  }

  if (settings.sortPreference === "shortest_walk") {
    sorted.sort((a, b) => {
      if (a.distanceFromDestinationKm !== b.distanceFromDestinationKm) {
        return a.distanceFromDestinationKm - b.distanceFromDestinationKm;
      }
      return (a.estimatedPrice ?? Infinity) - (b.estimatedPrice ?? Infinity);
    });
    return sorted;
  }

  const finitePrices = sorted
    .map((r) => r.estimatedPrice)
    .filter((p): p is number => p != null);
  const distances = sorted.map((r) => r.distanceFromDestinationKm);
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
        : (result.distanceFromDestinationKm - minDist) / (maxDist - minDist);

    let total = normPrice + normDist;
    if (settings.preferGarages && result.lot.carparkType === "garage") {
      total -= GARAGE_BONUS;
    }
    return total;
  };

  sorted.sort((a, b) => score(a) - score(b));
  return sorted;
}

// TODO: Google Routes API drive time

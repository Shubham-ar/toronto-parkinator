import type { Coordinates } from "@/types/parking";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Human-readable distance, e.g. "350 m" or "1.2 km". */
export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// TODO: walking route calculation (Google Routes / Mapbox)

/** Rough urban walk time estimate from straight-line distance. */
export function estimateWalkMinutes(distanceKm: number): number {
  const walkSpeedKmh = 5;
  return Math.max(1, Math.round((distanceKm / walkSpeedKmh) * 60));
}

/** Rough urban drive time estimate from straight-line distance. */
export function estimateDriveMinutes(distanceKm: number): number {
  const driveSpeedKmh = 25;
  return Math.max(1, Math.round((distanceKm / driveSpeedKmh) * 60));
}

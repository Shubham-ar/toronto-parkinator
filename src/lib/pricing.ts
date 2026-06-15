/** Estimate total parking cost from half-hour rate and duration. */
export function estimateParkingPrice(
  rateHalfHour: number | null,
  durationMinutes: number
): number | null {
  if (
    rateHalfHour == null ||
    rateHalfHour <= 0 ||
    !Number.isFinite(rateHalfHour) ||
    durationMinutes <= 0
  ) {
    return null;
  }
  const periods = Math.ceil(durationMinutes / 30);
  return periods * rateHalfHour;
}

export function formatEstimatedPrice(price: number | null): string {
  if (price == null) return "Rate unavailable";
  return `$${price.toFixed(2)}`;
}

export function formatRateHalfHour(rateHalfHour: number | null): string {
  if (rateHalfHour == null) return "—";
  return `$${rateHalfHour.toFixed(2)}`;
}

// TODO: parse rate_details for time-of-day pricing

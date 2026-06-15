export interface Coordinates {
  lat: number;
  lng: number;
}

export type CarparkType = "garage" | "surface" | "unknown";

export interface GreenPLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rate: string | null;
  rateHalfHour: number | null;
  capacity: number | null;
  carparkType: CarparkType;
  isUnderConstruction?: boolean;
  sourceUrl?: string;
  rateDetails?: unknown;
  paymentMethods?: unknown;
  paymentOptions?: unknown;
}

export type SortPreference = "cheapest" | "shortest_walk" | "balanced";

export interface SearchSettings {
  maxDriveMinutes: number;
  maxWalkMinutes: number;
  parkingDurationMinutes: number;
  sortPreference: SortPreference;
  preferGarages: boolean;
  showSurfaceLots: boolean;
}

export interface SearchResult {
  lot: GreenPLot;
  distanceKm: number;
  estimatedPrice: number | null;
  estimatedDriveMinutes: number;
  estimatedWalkMinutes: number;
  isTrafficAware: boolean;
  isBest: boolean;
}

export interface SearchRequest {
  currentLocation: Coordinates;
  destination?: Coordinates;
  settings: SearchSettings;
}

export interface SearchResponse {
  results: SearchResult[];
  best: SearchResult | null;
  meta: {
    dataSource: "greenp" | "fallback";
    total: number;
    routingProvider: "tomtom_matrix_v2" | null;
    liveTrafficEnabled: boolean;
    distanceNote: string;
    cached?: boolean;
    note?: string;
  };
}

export interface GreenPApiResponse {
  lots: GreenPLot[];
  meta: {
    source: "greenp" | "fallback";
    total: number;
    cached: boolean;
    note?: string;
  };
}

export type AppState =
  | "idle"
  | "locating"
  | "results"
  | "no-results"
  | "location-failed";

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  maxDriveMinutes: 15,
  maxWalkMinutes: 10,
  parkingDurationMinutes: 120,
  sortPreference: "cheapest",
  preferGarages: false,
  showSurfaceLots: true,
};

export const DEMO_LOCATION: Coordinates = {
  lat: 43.6546575,
  lng: -79.3806966,
};

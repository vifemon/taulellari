export type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type MapboxResponse = {
  features: MapboxFeature[];
};

type MapboxFeature = {
  id?: string;
  geometry?: {
    coordinates?: unknown;
  };
  properties?: {
    coordinates?: {
      latitude?: unknown;
      longitude?: unknown;
    };
    full_address?: unknown;
    mapbox_id?: unknown;
    name?: unknown;
    place_formatted?: unknown;
  };
};

export async function searchMapboxAddresses(query: string, language: "ca" | "es" = "ca") {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MAPBOX_ACCESS_TOKEN is required for address autocomplete");
  }

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("country", "es");
  url.searchParams.set("language", language);
  url.searchParams.set("limit", "6");
  url.searchParams.set("proximity", "-0.3763,39.4699");
  url.searchParams.set("types", "address");

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Mapbox address search failed");
  }

  const data: unknown = await response.json();

  return parseMapboxSuggestions(data);
}

export function parseMapboxSuggestions(data: unknown): AddressSuggestion[] {
  if (!isMapboxResponse(data)) {
    return [];
  }

  return data.features.flatMap((feature) => {
    const suggestion = parseMapboxFeature(feature);
    return suggestion ? [suggestion] : [];
  });
}

function parseMapboxFeature(feature: MapboxFeature): AddressSuggestion | null {
  const longitude = toCoordinate(
    feature.properties?.coordinates?.longitude,
    Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates[0]
      : undefined,
  );
  const latitude = toCoordinate(
    feature.properties?.coordinates?.latitude,
    Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates[1]
      : undefined,
  );

  if (latitude === null || longitude === null) {
    return null;
  }

  const fullAddress = toText(feature.properties?.full_address);
  const name = toText(feature.properties?.name);
  const place = toText(feature.properties?.place_formatted);
  const label = fullAddress ?? [name, place].filter(Boolean).join(", ");

  if (!label) {
    return null;
  }

  return {
    id: toText(feature.properties?.mapbox_id) ?? feature.id ?? label,
    label,
    latitude,
    longitude,
  };
}

function isMapboxResponse(value: unknown): value is MapboxResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "features" in value &&
      Array.isArray((value as MapboxResponse).features),
  );
}

function toCoordinate(primary: unknown, fallback: unknown) {
  const value = typeof primary === "number" ? primary : fallback;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

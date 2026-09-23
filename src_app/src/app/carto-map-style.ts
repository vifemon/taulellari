type MapStyleLayer = {
  id: string;
  type: string;
  "source-layer"?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  [key: string]: unknown;
};

export type MapStyle = {
  version: number;
  name?: string;
  sources: Record<string, unknown>;
  layers: MapStyleLayer[];
  [key: string]: unknown;
};

export type MapTheme = "light" | "dark";
export type MapLabelLanguage = "ca" | "es";

const CARTO_STYLE_URLS: Record<MapTheme, string> = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

const MAP_PALETTES = {
  light: {
    accent: "#cf8944",
    boundary: "#123f83",
    building: "#ddc7a5",
    buildingOutline: "#c8aa7d",
    halo: "#fffaf0",
    label: "#14233f",
    labelMuted: "#52617a",
    land: "#f4ead9",
    landcover: "#e8d5ab",
    markerFill: "#f3e3c4",
    markerStroke: "#123f83",
    residential: "#efe0ca",
    roadCase: "#123f83",
    roadMajor: "#f3e3c4",
    roadMinor: "#fffaf0",
    water: "#adc4e6",
    waterLabel: "#123f83",
    waterway: "#789dd3",
  },
  dark: {
    accent: "#e6a95e",
    boundary: "#7ea6ef",
    building: "#17345f",
    buildingOutline: "#24487d",
    halo: "#071427",
    label: "#fff4df",
    labelMuted: "#c5d5ef",
    land: "#0d2142",
    landcover: "#18365f",
    markerFill: "#fff4df",
    markerStroke: "#7ea6ef",
    residential: "#10294e",
    roadCase: "#061023",
    roadMajor: "#7ea6ef",
    roadMinor: "#234574",
    water: "#173b63",
    waterLabel: "#9bbaf2",
    waterway: "#365b91",
  },
} as const;

const LOCALIZED_SOURCE_LAYERS = new Set([
  "aerodrome_label",
  "mountain_peak",
  "park",
  "place",
  "poi",
  "transportation_name",
  "water_name",
  "waterway",
]);

export function getMapPalette(theme: MapTheme) {
  return MAP_PALETTES[theme];
}

export function getCartoStyleDocumentUrl(theme: MapTheme) {
  return CARTO_STYLE_URLS[theme];
}

export function getCartoStyleUrl(theme: MapTheme, apiKey: string) {
  const key = apiKey.trim();

  if (!key) {
    throw new Error("CARTO_API_KEY is required for the publication map");
  }

  const url = new URL(getCartoStyleDocumentUrl(theme));
  url.searchParams.set("key", key);
  return url.toString();
}

export function addCartoApiKey(resourceUrl: string, apiKey: string) {
  const url = new URL(resourceUrl);
  const hostname = url.hostname.toLowerCase();
  const isCartoBasemapHost = hostname === "basemaps.cartocdn.com"
    || hostname === "tiles.basemaps.cartocdn.com"
    || /^tiles-[a-d]\.basemaps\.cartocdn\.com$/.test(hostname);

  if (url.protocol === "https:" && isCartoBasemapHost) {
    url.searchParams.set("key", apiKey.trim());
  }

  return url.toString();
}

export function createBrandedCartoStyle(
  style: MapStyle,
  theme: MapTheme,
  language: MapLabelLanguage,
): MapStyle {
  const palette = MAP_PALETTES[theme];

  return {
    ...style,
    id: `taulellari-${theme}-${language}`,
    name: `Taulellari ${theme}`,
    layers: style.layers.map((layer) => {
      const paint = { ...layer.paint };
      const layout = { ...layer.layout };
      const sourceLayer = layer["source-layer"];

      if (layer.type === "background") {
        paint["background-color"] = palette.land;
      } else if (layer.type === "fill") {
        applyFillPalette(layer.id, sourceLayer, paint, palette);
      } else if (layer.type === "line") {
        applyLinePalette(layer.id, sourceLayer, paint, palette);
      } else if (layer.type === "symbol") {
        applySymbolPalette(sourceLayer, paint, palette);
        localizeSymbolLayer(sourceLayer, layout, language);
      }

      return {
        ...layer,
        layout,
        paint,
      };
    }),
  };
}

export function parseMapStyle(value: unknown): MapStyle {
  if (!isRecord(value) || typeof value.version !== "number" || !isRecord(value.sources)) {
    throw new Error("CARTO returned an invalid map style");
  }

  if (!Array.isArray(value.layers) || !value.layers.every(isMapStyleLayer)) {
    throw new Error("CARTO returned an invalid map style");
  }

  return value as MapStyle;
}

function applyFillPalette(
  layerId: string,
  sourceLayer: string | undefined,
  paint: Record<string, unknown>,
  palette: (typeof MAP_PALETTES)[MapTheme],
) {
  if (sourceLayer === "water") {
    paint["fill-color"] = palette.water;
    return;
  }

  if (sourceLayer === "landcover" || sourceLayer === "park") {
    paint["fill-color"] = palette.landcover;
    return;
  }

  if (sourceLayer === "landuse") {
    paint["fill-color"] = layerId.includes("residential") ? palette.residential : palette.landcover;
    return;
  }

  if (sourceLayer === "building") {
    paint["fill-color"] = palette.building;
    paint["fill-outline-color"] = palette.buildingOutline;
  }
}

function applyLinePalette(
  layerId: string,
  sourceLayer: string | undefined,
  paint: Record<string, unknown>,
  palette: (typeof MAP_PALETTES)[MapTheme],
) {
  if (sourceLayer === "waterway") {
    paint["line-color"] = palette.waterway;
    return;
  }

  if (sourceLayer === "boundary") {
    paint["line-color"] = palette.boundary;
    paint["line-opacity"] = layerId.includes("outline") ? 0.32 : 0.62;
    return;
  }

  if (sourceLayer !== "transportation" && sourceLayer !== "aeroway") {
    return;
  }

  if (layerId.includes("rail")) {
    paint["line-color"] = palette.boundary;
    return;
  }

  if (layerId.includes("case")) {
    paint["line-color"] = palette.roadCase;
  } else if (layerId.includes("mot") || layerId.includes("trunk")) {
    paint["line-color"] = palette.accent;
  } else if (layerId.includes("pri")) {
    paint["line-color"] = palette.roadMajor;
  } else {
    paint["line-color"] = palette.roadMinor;
  }
}

function applySymbolPalette(
  sourceLayer: string | undefined,
  paint: Record<string, unknown>,
  palette: (typeof MAP_PALETTES)[MapTheme],
) {
  if (sourceLayer === "water_name" || sourceLayer === "waterway") {
    paint["text-color"] = palette.waterLabel;
  } else if (sourceLayer === "poi" || sourceLayer === "mountain_peak" || sourceLayer === "aerodrome_label") {
    paint["text-color"] = palette.labelMuted;
  } else {
    paint["text-color"] = palette.label;
  }

  paint["text-halo-color"] = palette.halo;
  paint["text-halo-width"] = 1;
}

function localizeSymbolLayer(
  sourceLayer: string | undefined,
  layout: Record<string, unknown>,
  language: MapLabelLanguage,
) {
  if (!sourceLayer || !LOCALIZED_SOURCE_LAYERS.has(sourceLayer) || layout["text-field"] === undefined) {
    return;
  }

  const localizedName = language === "ca" ? "name:ca" : "name:es";
  const fallback = sourceLayer === "transportation_name" ? ["get", "ref"] : ["get", "name_en"];
  layout["text-field"] = [
    "coalesce",
    ["get", localizedName],
    ["get", "name"],
    fallback,
  ];
}

function isMapStyleLayer(value: unknown): value is MapStyleLayer {
  return isRecord(value) && typeof value.id === "string" && typeof value.type === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

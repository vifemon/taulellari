"use client";

import Feature, { type FeatureLike } from "ol/Feature";
import { LocateFixed } from "lucide-react";
import OlMap from "ol/Map";
import View from "ol/View";
import Control from "ol/control/Control";
import { defaults as defaultControls } from "ol/control/defaults";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { applyBackground, applyStyle } from "ol-mapbox-style";
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import {
  addCartoApiKey,
  createBrandedCartoStyle,
  getCartoStyleDocumentUrl,
  getCartoStyleUrl,
  getMapPalette,
  parseMapStyle,
  type MapLabelLanguage,
  type MapTheme,
} from "./carto-map-style";
import styles from "./page.module.css";

const VALENCIAN_COMMUNITY_CENTER = fromLonLat([-0.55, 39.45]);
const VALENCIAN_COMMUNITY_ZOOM = 8;

type MapPublication = {
  id: number;
  fotos: { url: string }[];
  latitud?: number;
  longitud?: number;
};

const markerStyles = new Map<string, Style[]>();
const clusterStyles = new Map<string, Style>();
const thumbnailCanvases = new Map<string, HTMLCanvasElement | null>();
const MARKER_IMAGE_SIZE = 46;

function loadThumbnail(photoUrl: string, redraw: () => void) {
  if (thumbnailCanvases.has(photoUrl)) {
    return;
  }

  thumbnailCanvases.set(photoUrl, null);
  const image = new Image();

  image.addEventListener("load", () => {
    const canvas = document.createElement("canvas");
    canvas.width = MARKER_IMAGE_SIZE;
    canvas.height = MARKER_IMAGE_SIZE;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const scale = Math.max(MARKER_IMAGE_SIZE / image.width, MARKER_IMAGE_SIZE / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.beginPath();
    context.arc(MARKER_IMAGE_SIZE / 2, MARKER_IMAGE_SIZE / 2, MARKER_IMAGE_SIZE / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, (MARKER_IMAGE_SIZE - width) / 2, (MARKER_IMAGE_SIZE - height) / 2, width, height);
    thumbnailCanvases.set(photoUrl, canvas);
    redraw();
  });
  image.src = photoUrl;
}

function getMarkerStyles(photoUrl: string, photoCount: number, theme: MapTheme, redraw: () => void) {
  const cacheKey = `${photoUrl}-${photoCount}-${theme}`;
  const cachedStyles = markerStyles.get(cacheKey);

  if (cachedStyles) {
    return cachedStyles;
  }

  const thumbnail = thumbnailCanvases.get(photoUrl);
  const palette = getMapPalette(theme);

  if (thumbnail === undefined) {
    loadThumbnail(photoUrl, redraw);
  }

  const styles: Style[] = [
    new Style({
      image: new CircleStyle({
        fill: new Fill({ color: palette.markerFill }),
        radius: 29,
        stroke: new Stroke({ color: palette.markerStroke, width: 4 }),
      }),
    }),
  ];

  if (thumbnail) {
    styles.push(
      new Style({
        image: new Icon({
          anchor: [0.5, 0.5],
          height: MARKER_IMAGE_SIZE,
          img: thumbnail,
          width: MARKER_IMAGE_SIZE,
        }),
      }),
    );
  }

  if (photoCount > 1) {
    styles.push(
      new Style({
        image: new CircleStyle({
          displacement: [19, -19],
          fill: new Fill({ color: palette.accent }),
          radius: 12,
          stroke: new Stroke({ color: palette.markerStroke, width: 3 }),
        }),
        text: new Text({
          fill: new Fill({ color: "#ffffff" }),
          font: "900 12px var(--font-geist-sans), sans-serif",
          offsetX: 19,
          offsetY: 19,
          text: String(photoCount),
        }),
      }),
    );
  }

  if (thumbnail) {
    markerStyles.set(cacheKey, styles);
  }

  return styles;
}

function getClusterStyle(photoCount: number, theme: MapTheme) {
  const cacheKey = `${photoCount}-${theme}`;
  const cachedStyle = clusterStyles.get(cacheKey);

  if (cachedStyle) {
    return cachedStyle;
  }

  const palette = getMapPalette(theme);
  const style = new Style({
    image: new CircleStyle({
      fill: new Fill({ color: palette.accent }),
      radius: 24,
      stroke: new Stroke({ color: palette.markerStroke, width: 4 }),
    }),
    text: new Text({
      fill: new Fill({ color: "#ffffff" }),
      font: "900 15px var(--font-geist-sans), sans-serif",
      text: String(photoCount),
    }),
  });
  clusterStyles.set(cacheKey, style);

  return style;
}

function getClusterStyles(feature: FeatureLike, theme: MapTheme, redraw: () => void) {
  const publications = feature.get("features") as Feature<Point>[];

  if (publications.length === 1) {
    const photoUrl = publications[0].get("photoUrl") as string;
    const photoCount = publications[0].get("photoCount") as number;
    return getMarkerStyles(photoUrl, photoCount, theme, redraw);
  }

  const photoCount = publications.reduce(
    (total, publication) => total + (publication.get("photoCount") as number),
    0,
  );
  return getClusterStyle(photoCount, theme);
}

function toPublicationFeatures(publications: MapPublication[]) {
  return publications.flatMap((publication) => {
    const { latitud, longitud } = publication;
    const photoUrl = publication.fotos[0]?.url;

    if (
      typeof latitud !== "number"
      || typeof longitud !== "number"
      || !Number.isFinite(latitud)
      || !Number.isFinite(longitud)
      || !photoUrl
    ) {
      return [];
    }

    const feature = new Feature({
      geometry: new Point(fromLonLat([longitud, latitud])),
    });
    feature.setId(publication.id);
    feature.setProperties({
      photoCount: publication.fotos.length,
      photoUrl,
    });

    return [feature];
  });
}

async function loadBaseMapStyle({
  apiKey,
  language,
  theme,
}: {
  apiKey: string;
  language: MapLabelLanguage;
  theme: MapTheme;
}) {
  const styleUrl = getCartoStyleUrl(theme, apiKey);
  const response = await fetch(styleUrl);

  if (!response.ok) {
    throw new Error(`CARTO map style request failed with status ${response.status}`);
  }

  return createBrandedCartoStyle(parseMapStyle(await response.json()), theme, language);
}

async function createBaseMapLayer({
  apiKey,
  contributorsLabel,
  language,
  theme,
}: {
  apiKey: string;
  contributorsLabel: string;
  language: MapLabelLanguage;
  theme: MapTheme;
}) {
  const style = await loadBaseMapStyle({ apiKey, language, theme });
  const layer = new VectorTileLayer({
    className: `ol-base-map-${theme}-${language}`,
    declutter: true,
  });
  const styleOptions = {
    styleUrl: getCartoStyleDocumentUrl(theme),
    transformRequest: (resourceUrl: string, resourceType: string) => {
      const keyedUrl = addCartoApiKey(resourceUrl, apiKey);
      return resourceType === "SpriteImage" ? new Request(keyedUrl) : keyedUrl;
    },
  };

  await applyStyle(layer, style, styleOptions);
  await applyBackground(layer, style, styleOptions);
  layer.getSource()?.setAttributions([
    `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ${contributorsLabel}`,
    '&copy; <a href="https://carto.com/attributions">CARTO</a>',
  ]);

  return layer;
}

export function PublicationMap({
  cartoApiKey,
  onPublicationOpen,
  onReady,
  publications,
  theme,
}: {
  cartoApiKey: string;
  onPublicationOpen: (publicationId: number) => void;
  onReady: () => void;
  publications: MapPublication[];
  theme: MapTheme;
}) {
  const { i18n, t } = useTranslation();
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const baseLayerRef = useRef<VectorTileLayer | null>(null);
  const publicationLayerRef = useRef<VectorLayer | null>(null);
  const publicationSourceRef = useRef<VectorSource | null>(null);
  const recenterButtonRef = useRef<HTMLButtonElement | null>(null);
  const mapReadyRef = useRef(false);
  const baseLayerApiKeyRef = useRef(cartoApiKey);
  const baseLayerCacheRef = useRef(new Map<string, VectorTileLayer>());
  const baseLayerRequestsRef = useRef(new Map<string, Promise<VectorTileLayer>>());
  const onPublicationOpenRef = useRef(onPublicationOpen);
  const onReadyRef = useRef(onReady);
  const themeRef = useRef<MapTheme>(theme);
  const controlLabelsRef = useRef({
    attributions: t("map.controls.attributions"),
    contributors: t("map.attribution.contributors"),
    recenter: t("map.recenter"),
    resetRotation: t("map.controls.resetRotation"),
    zoomIn: t("map.controls.zoomIn"),
    zoomOut: t("map.controls.zoomOut"),
  });

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    const baseLayerCache = baseLayerCacheRef.current;
    const baseLayerRequests = baseLayerRequestsRef.current;
    const baseLayer = new VectorTileLayer({
      className: "ol-base-map-placeholder",
      declutter: true,
    });
    const publicationSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 56,
      source: publicationSource,
    });
    const publicationLayer = new VectorLayer({ source: clusterSource });
    baseLayerRef.current = baseLayer;
    publicationLayerRef.current = publicationLayer;
    publicationSourceRef.current = publicationSource;

    const map = new OlMap({
      controls: defaultControls({
        attributionOptions: {
          collapsible: false,
          tipLabel: controlLabelsRef.current.attributions,
        },
        rotateOptions: { tipLabel: controlLabelsRef.current.resetRotation },
        zoomOptions: {
          zoomInTipLabel: controlLabelsRef.current.zoomIn,
          zoomOutTipLabel: controlLabelsRef.current.zoomOut,
        },
      }),
      layers: [
        baseLayer,
        publicationLayer,
      ],
      target: mapElementRef.current,
      view: new View({
        center: VALENCIAN_COMMUNITY_CENTER,
        zoom: VALENCIAN_COMMUNITY_ZOOM,
      }),
    });
    mapRef.current = map;
    publicationLayer.setStyle(
      (feature) => getClusterStyles(feature, themeRef.current, () => publicationLayer.changed()),
    );

    const recenterButton = document.createElement("button");
    recenterButton.setAttribute("aria-label", controlLabelsRef.current.recenter);
    recenterButton.setAttribute("title", controlLabelsRef.current.recenter);
    recenterButton.type = "button";
    recenterButtonRef.current = recenterButton;
    const recenterButtonRoot = createRoot(recenterButton);
    recenterButtonRoot.render(<LocateFixed aria-hidden="true" size={18} strokeWidth={2.4} />);
    const recenterElement = Object.assign(document.createElement("div"), {
      className: "ol-recenter ol-unselectable ol-control",
    });
    recenterElement.appendChild(recenterButton);
    const recenterControl = new Control({ element: recenterElement });
    recenterButton.addEventListener("click", () => {
      map.getView().animate({
        center: VALENCIAN_COMMUNITY_CENTER,
        duration: 350,
        zoom: VALENCIAN_COMMUNITY_ZOOM,
      });
    });
    map.addControl(recenterControl);

    function handleMapClick(event: { pixel: number[] }) {
      const clusterFeature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
        { layerFilter: (layer) => layer === publicationLayer },
      ) as FeatureLike | undefined;
      const publications = clusterFeature?.get("features") as Feature<Point>[] | undefined;

      if (!clusterFeature || !publications?.length) {
        return;
      }

      if (publications.length === 1) {
        const publicationId = publications[0].getId();

        if (typeof publicationId === "number") {
          onPublicationOpenRef.current(publicationId);
        }
        return;
      }

      const coordinates = new Set(
        publications.map((publication) => publication.getGeometry()?.getCoordinates().join(",")),
      );

      if (coordinates.size > 1) {
        const view = map.getView();
        const zoom = view.getZoom() ?? 8;
        const geometry = clusterFeature.getGeometry() as Point;

        view.animate({
          center: geometry.getCoordinates(),
          duration: 350,
          zoom: Math.min(zoom + 2, 18),
        });
      }
    }

    map.on("singleclick", handleMapClick);

    return () => {
      map.removeControl(recenterControl);
      queueMicrotask(() => recenterButtonRoot.unmount());
      map.un("singleclick", handleMapClick);
      map.setTarget(undefined);
      mapRef.current = null;
      baseLayerRef.current = null;
      publicationLayerRef.current = null;
      publicationSourceRef.current = null;
      recenterButtonRef.current = null;
      mapReadyRef.current = false;
      baseLayerCache.clear();
      baseLayerRequests.clear();
    };
  }, []);

  useEffect(() => {
    const labels = {
      attributions: t("map.controls.attributions"),
      contributors: t("map.attribution.contributors"),
      recenter: t("map.recenter"),
      resetRotation: t("map.controls.resetRotation"),
      zoomIn: t("map.controls.zoomIn"),
      zoomOut: t("map.controls.zoomOut"),
    };
    controlLabelsRef.current = labels;

    setMapControlLabel(mapElementRef.current, ".ol-attribution button", labels.attributions);
    setMapControlLabel(mapElementRef.current, ".ol-rotate button", labels.resetRotation);
    setMapControlLabel(mapElementRef.current, ".ol-zoom-in", labels.zoomIn);
    setMapControlLabel(mapElementRef.current, ".ol-zoom-out", labels.zoomOut);

    recenterButtonRef.current?.setAttribute("aria-label", labels.recenter);
    recenterButtonRef.current?.setAttribute("title", labels.recenter);
  }, [i18n.resolvedLanguage, t]);

  useEffect(() => {
    onPublicationOpenRef.current = onPublicationOpen;
  }, [onPublicationOpen]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    themeRef.current = theme;
    publicationLayerRef.current?.changed();
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const activeMap = map;
    let cancelled = false;
    let readyHandler: (() => void) | null = null;
    let readyTimeout: number | null = null;
    const language: MapLabelLanguage = i18n.resolvedLanguage === "es" ? "es" : "ca";
    const contributorsLabel = controlLabelsRef.current.contributors;
    const apiKeyChanged = baseLayerApiKeyRef.current !== cartoApiKey;

    if (apiKeyChanged) {
      baseLayerApiKeyRef.current = cartoApiKey;
      baseLayerCacheRef.current.clear();
      baseLayerRequestsRef.current.clear();
    }

    function markMapReady() {
      if (cancelled || mapReadyRef.current) {
        return;
      }

      mapReadyRef.current = true;
      if (readyTimeout !== null) {
        window.clearTimeout(readyTimeout);
        readyTimeout = null;
      }
      onReadyRef.current();
    }

    if (!mapReadyRef.current) {
      readyTimeout = window.setTimeout(markMapReady, 5000);
    }
    activeMap.render();

    async function getBaseMapLayer(requestedTheme: MapTheme) {
      const requestedCacheKey = `${requestedTheme}:${language}`;
      let requestedLayer = baseLayerCacheRef.current.get(requestedCacheKey);

      if (!requestedLayer) {
        let request = baseLayerRequestsRef.current.get(requestedCacheKey);

        if (!request) {
          request = createBaseMapLayer({
            apiKey: cartoApiKey,
            contributorsLabel,
            language,
            theme: requestedTheme,
          });
          baseLayerRequestsRef.current.set(requestedCacheKey, request);
        }

        try {
          requestedLayer = await request;
          if (baseLayerApiKeyRef.current === cartoApiKey) {
            baseLayerCacheRef.current.set(requestedCacheKey, requestedLayer);
          }
        } finally {
          if (baseLayerRequestsRef.current.get(requestedCacheKey) === request) {
            baseLayerRequestsRef.current.delete(requestedCacheKey);
          }
        }
      }

      return requestedLayer;
    }

    async function updateBaseMap() {
      try {
        const nextBaseLayer = await getBaseMapLayer(theme);

        if (cancelled) {
          return;
        }

        const layers = activeMap.getLayers();
        const currentBaseLayer = baseLayerRef.current;
        const currentIndex = currentBaseLayer ? layers.getArray().indexOf(currentBaseLayer) : -1;

        if (currentBaseLayer !== nextBaseLayer || currentIndex === -1) {
          if (currentIndex === -1) {
            layers.insertAt(0, nextBaseLayer);
          } else {
            layers.setAt(currentIndex, nextBaseLayer);
          }
          baseLayerRef.current = nextBaseLayer;
        }

        if (!mapReadyRef.current) {
          readyHandler = markMapReady;
          activeMap.once("rendercomplete", readyHandler);
        }

        activeMap.renderSync();

        const alternateTheme: MapTheme = theme === "light" ? "dark" : "light";
        void getBaseMapLayer(alternateTheme).catch(() => undefined);
      } catch {
        if (cancelled) {
          return;
        }

        console.error("Unable to load the CARTO base map");
        markMapReady();
      }
    }

    void updateBaseMap();

    return () => {
      cancelled = true;
      if (readyHandler) {
        activeMap.un("rendercomplete", readyHandler);
      }
      if (readyTimeout !== null) {
        window.clearTimeout(readyTimeout);
      }
    };
  }, [cartoApiKey, i18n.resolvedLanguage, theme]);

  useEffect(() => {
    const source = publicationSourceRef.current;

    if (!source) {
      return;
    }

    source.clear();
    source.addFeatures(toPublicationFeatures(publications));
  }, [publications]);

  return (
    <section aria-label={t("map.label")} className={styles.mapViewport}>
      <div className={styles.mapCanvas} ref={mapElementRef} />
    </section>
  );
}

function setMapControlLabel(container: HTMLDivElement | null, selector: string, label: string) {
  const button = container?.querySelector<HTMLButtonElement>(selector);
  button?.setAttribute("aria-label", label);
  button?.setAttribute("title", label);
}

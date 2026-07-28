"use client";

import Feature, { type FeatureLike } from "ol/Feature";
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import { useEffect, useRef } from "react";

import styles from "./page.module.css";

const VALENCIAN_COMMUNITY_CENTER = fromLonLat([-0.55, 39.45]);

type MapTheme = "light" | "dark";
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

export function getBaseMapUrl(theme: MapTheme) {
  const variant = theme === "dark" ? "dark_all" : "light_all";

  return `https://{a-d}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}{r}.png`;
}

function createBaseMapSource(theme: MapTheme) {
  return new XYZ({
    attributions: [
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    ],
    url: getBaseMapUrl(theme),
  });
}

function getTertiaryColor(theme: MapTheme) {
  return theme === "dark" ? "#e6a95e" : "#cf8944";
}

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

  if (thumbnail === undefined) {
    loadThumbnail(photoUrl, redraw);
  }

  const styles: Style[] = [
    new Style({
      image: new CircleStyle({
        fill: new Fill({ color: "#f3e3c4" }),
        radius: 29,
        stroke: new Stroke({ color: "#123f83", width: 4 }),
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
          fill: new Fill({ color: getTertiaryColor(theme) }),
          radius: 12,
          stroke: new Stroke({ color: "#123f83", width: 3 }),
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

  const style = new Style({
    image: new CircleStyle({
      fill: new Fill({ color: getTertiaryColor(theme) }),
      radius: 24,
      stroke: new Stroke({ color: "#123f83", width: 4 }),
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

export function PublicationMap({
  publications,
  theme,
}: {
  publications: MapPublication[];
  theme: MapTheme;
}) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const publicationSourceRef = useRef<VectorSource | null>(null);
  const themeRef = useRef<MapTheme>(theme);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    const baseLayer = new TileLayer({ source: createBaseMapSource("light") });
    const publicationSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 56,
      source: publicationSource,
    });
    const publicationLayer = new VectorLayer({ source: clusterSource });
    baseLayerRef.current = baseLayer;
    publicationSourceRef.current = publicationSource;

    const map = new OlMap({
      layers: [
        baseLayer,
        publicationLayer,
      ],
      target: mapElementRef.current,
      view: new View({
        center: VALENCIAN_COMMUNITY_CENTER,
        zoom: 8,
      }),
    });
    mapRef.current = map;
    publicationLayer.setStyle((feature) => getClusterStyles(feature, themeRef.current, () => map.render()));

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      baseLayerRef.current = null;
      publicationSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    themeRef.current = theme;
    baseLayerRef.current?.setSource(createBaseMapSource(theme));
    mapRef.current?.render();
  }, [theme]);

  useEffect(() => {
    const source = publicationSourceRef.current;

    if (!source) {
      return;
    }

    source.clear();
    source.addFeatures(toPublicationFeatures(publications));
  }, [publications]);

  return (
    <section aria-label="Mapa de publicaciones" className={styles.mapViewport}>
      <div className={styles.mapCanvas} ref={mapElementRef} />
    </section>
  );
}

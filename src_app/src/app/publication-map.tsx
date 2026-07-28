"use client";

import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import XYZ from "ol/source/XYZ";
import { useEffect, useRef } from "react";

import styles from "./page.module.css";

const VALENCIAN_COMMUNITY_CENTER = fromLonLat([-0.55, 39.45]);

type MapTheme = "light" | "dark";

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

export function PublicationMap({ theme }: { theme: MapTheme }) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    const baseLayer = new TileLayer({ source: createBaseMapSource("light") });
    baseLayerRef.current = baseLayer;

    const map = new OlMap({
      layers: [baseLayer],
      target: mapElementRef.current,
      view: new View({
        center: VALENCIAN_COMMUNITY_CENTER,
        zoom: 8,
      }),
    });

    return () => {
      map.setTarget(undefined);
      baseLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    baseLayerRef.current?.setSource(createBaseMapSource(theme));
  }, [theme]);

  return (
    <section aria-label="Mapa de publicaciones" className={styles.mapViewport}>
      <div className={styles.mapCanvas} ref={mapElementRef} />
    </section>
  );
}

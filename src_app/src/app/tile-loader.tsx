"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

import type { GalleryView } from "@/app-state/preferences";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

import styles from "./page.module.css";

const TILE_CELLS = Array.from({ length: 9 }, (_, index) => index);

export function TileLoader({ active, view }: { active: boolean; view: GalleryView }) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mark = markRef.current;

    if (!active || !mark || prefersReducedMotion()) {
      return;
    }

    const cells = gsap.utils.toArray<HTMLElement>("[data-tile-loader-cell]", rootRef.current);
    const rotation = gsap.to(mark, {
      duration: 3.2,
      ease: "none",
      repeat: -1,
      rotation: "+=360",
    });
    const pulse = gsap.to(cells, {
      duration: 0.62,
      ease: "sine.inOut",
      opacity: 0.42,
      repeat: -1,
      scale: 0.68,
      stagger: { each: 0.07, from: "center" },
      transformOrigin: "50% 50%",
      yoyo: true,
    });

    return () => {
      rotation.kill();
      pulse.kill();
      gsap.set(mark, { clearProps: "transform" });
      gsap.set(cells, { clearProps: "opacity,transform,transformOrigin" });
    };
  }, { dependencies: [active], revertOnUpdate: true, scope: rootRef });

  return (
    <div
      aria-atomic="true"
      aria-hidden={!active}
      aria-live="polite"
      className={`${styles.tileLoader} ${active ? styles.tileLoaderActive : ""}`}
      ref={rootRef}
      role={active ? "status" : undefined}
    >
      <div aria-hidden="true" className={styles.tileLoaderMark} ref={markRef}>
        {TILE_CELLS.map((cell) => (
          <span data-tile-loader-cell key={cell} />
        ))}
      </div>
      <p>{t(view === "map" ? "loader.map" : "loader.gallery")}</p>
    </div>
  );
}

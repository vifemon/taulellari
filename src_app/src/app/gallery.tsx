"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LANGUAGE_TAGS, normalizeLocale } from "@/i18n/config";

import styles from "./page.module.css";

type GalleryPublication = {
  id: number;
  titulo: string;
  descripcion: string | null;
  direccionTexto: string;
  latitud: number;
  longitud: number;
  creadoEn: string;
  fotos: {
    index: number;
    url: string;
  }[];
};

type GalleryState = "idle" | "loading" | "anonymous" | "ready" | "error";

export function Gallery() {
  const { i18n, t } = useTranslation();
  const [state, setState] = useState<GalleryState>("idle");
  const [publications, setPublications] = useState<GalleryPublication[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    loadGallery(controller.signal);

    function refreshGallery() {
      loadGallery();
    }

    window.addEventListener("taulellari:auth", refreshGallery);
    window.addEventListener("taulellari:publication-created", refreshGallery);

    return () => {
      controller.abort();
      window.removeEventListener("taulellari:auth", refreshGallery);
      window.removeEventListener("taulellari:publication-created", refreshGallery);
    };
  }, []);

  async function loadGallery(signal?: AbortSignal) {
    setState("loading");

    try {
      const response = await fetch("/api/publicaciones", { signal });

      if (response.status === 401) {
        setPublications([]);
        setState("anonymous");
        return;
      }

      if (!response.ok) {
        setState("error");
        return;
      }

      const data: { publicaciones: GalleryPublication[] } = await response.json();
      setPublications(data.publicaciones);
      setState("ready");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setState("error");
      }
    }
  }

  return (
    <section className={styles.galleryPanel} aria-label={t("legacyGallery.label")}>
      <div className={styles.galleryHeader}>
        <span className={styles.kicker}>{t("legacyGallery.kicker")}</span>
        <div>
          <h2>{t("legacyGallery.heading")}</h2>
          <p>{t("legacyGallery.description")}</p>
        </div>
        <button className={styles.secondaryButton} onClick={() => loadGallery()} type="button">
          {t("legacyGallery.refresh")}
        </button>
      </div>

      {state === "loading" ? <p className={styles.status}>{t("legacyGallery.loading")}</p> : null}
      {state === "anonymous" ? (
        <p className={styles.status}>{t("legacyGallery.anonymous")}</p>
      ) : null}
      {state === "error" ? (
        <p className={styles.status}>{t("legacyGallery.loadError")}</p>
      ) : null}
      {state === "ready" && publications.length === 0 ? (
        <div className={styles.emptyGallery}>
          <strong>{t("legacyGallery.emptyTitle")}</strong>
          <span>{t("legacyGallery.emptyDescription")}</span>
        </div>
      ) : null}

      {publications.length > 0 ? (
        <div className={styles.galleryGrid}>
          {publications.map((publication, publicationIndex) => (
            <article className={styles.tile} key={publication.id}>
              <div className={styles.tileImageStack}>
                {publication.fotos.map((photo, index) => (
                  <div className={styles.tileImage} key={photo.index}>
                    <Image
                      alt={t("legacyGallery.photoAlt", { title: publication.titulo, number: index + 1 })}
                      fill
                      priority={publicationIndex === 0 && index === 0}
                      sizes="(max-width: 880px) 88vw, 30vw"
                      src={photo.url}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
              <div className={styles.tileBody}>
                <span>{formatDate(publication.creadoEn, LANGUAGE_TAGS[normalizeLocale(i18n.resolvedLanguage)])}</span>
                <h3>{publication.titulo}</h3>
                {publication.descripcion ? <p>{publication.descripcion}</p> : null}
                <p>{publication.direccionTexto}</p>
                <small>
                  {publication.latitud.toFixed(5)}, {publication.longitud.toFixed(5)}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

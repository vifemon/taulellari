export const SUPPORTED_LOCALES = ["val", "es"] as const;
export const DEFAULT_LOCALE = "val";
export const LEGACY_LOCALE_COOKIE_NAME = "taulellari_locale";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LANGUAGE_TAGS: Record<Locale, string> = {
  val: "ca-ES-valencia",
  es: "es-ES",
};

export const MAPBOX_LANGUAGES: Record<Locale, "ca" | "es"> = {
  val: "ca",
  es: "es",
};

export function normalizeLocale(value: string | null | undefined): Locale {
  const locale = value?.toLowerCase();

  if (locale === "es" || locale?.startsWith("es-")) {
    return "es";
  }

  if (locale === "val" || locale === "ca" || locale?.startsWith("ca-")) {
    return "val";
  }

  return DEFAULT_LOCALE;
}

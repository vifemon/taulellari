import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

export const APP_PREFERENCES_COOKIE_NAME = "taulellari_preferences";
export const APP_PREFERENCES_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";
export type GalleryView = "gallery" | "map";
export type GalleryScope = "all" | "mine";

export type AppPreferences = {
  locale: Locale;
  theme: Theme;
  galleryView: GalleryView;
  galleryScope: GalleryScope;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  locale: DEFAULT_LOCALE,
  theme: "dark",
  galleryView: "gallery",
  galleryScope: "all",
};

export function parseAppPreferences(
  value: string | null | undefined,
  fallbackLocale: Locale = DEFAULT_LOCALE,
): AppPreferences {
  let stored: unknown;

  try {
    stored = value ? JSON.parse(decodeURIComponent(value)) : null;
  } catch {
    stored = null;
  }

  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return { ...DEFAULT_APP_PREFERENCES, locale: fallbackLocale };
  }

  const preferences = stored as Record<string, unknown>;

  return {
    locale: preferences.locale === "val" || preferences.locale === "es"
      ? preferences.locale
      : fallbackLocale,
    theme: preferences.theme === "light" || preferences.theme === "dark"
      ? preferences.theme
      : DEFAULT_APP_PREFERENCES.theme,
    galleryView: preferences.galleryView === "gallery" || preferences.galleryView === "map"
      ? preferences.galleryView
      : DEFAULT_APP_PREFERENCES.galleryView,
    galleryScope: preferences.galleryScope === "all" || preferences.galleryScope === "mine"
      ? preferences.galleryScope
      : DEFAULT_APP_PREFERENCES.galleryScope,
  };
}

export function serializeAppPreferences(preferences: AppPreferences) {
  return encodeURIComponent(JSON.stringify(preferences));
}

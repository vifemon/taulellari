import "server-only";

import { createInstance } from "i18next";
import { cache } from "react";

import { getRequestPreferences } from "@/app-state/server";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./config";
import { i18nResources } from "./resources";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  return (await getRequestPreferences()).locale;
});

export function getServerTranslator(locale: Locale) {
  const instance = createInstance();

  void instance.init({
    fallbackLng: DEFAULT_LOCALE,
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: locale,
    resources: i18nResources,
    supportedLngs: [...SUPPORTED_LOCALES],
  });

  return instance.getFixedT(locale);
}

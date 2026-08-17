import "server-only";

import { createInstance } from "i18next";
import { cookies } from "next/headers";
import { cache } from "react";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, normalizeLocale, type Locale } from "./config";
import { i18nResources } from "./resources";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
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

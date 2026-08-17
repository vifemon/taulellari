import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./config";
import { i18nResources } from "./resources";

export function createI18n(locale: Locale) {
  const instance = createInstance();

  instance.use(initReactI18next);
  void instance.init({
    fallbackLng: DEFAULT_LOCALE,
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: locale,
    resources: i18nResources,
    supportedLngs: [...SUPPORTED_LOCALES],
    react: { useSuspense: false },
  });

  return instance;
}

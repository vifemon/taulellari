"use client";

import { useEffect, useRef, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18n } from "./create-i18n";
import { LANGUAGE_TAGS, SUPPORTED_LOCALES, type Locale } from "./config";
import { i18nResources, i18nResourceVersion } from "./resources";

export function AppI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [i18n] = useState(() => createI18n(initialLocale));
  const syncedLocaleRef = useRef<Locale | null>(null);
  const syncedResourceVersionRef = useRef("");

  useEffect(() => {
    const resourcesChanged = syncedResourceVersionRef.current !== i18nResourceVersion;

    if (resourcesChanged) {
      for (const locale of SUPPORTED_LOCALES) {
        i18n.addResourceBundle(locale, "translation", i18nResources[locale].translation, true, true);
      }

      syncedResourceVersionRef.current = i18nResourceVersion;
    }

    if (syncedLocaleRef.current !== initialLocale) {
      document.documentElement.lang = LANGUAGE_TAGS[initialLocale];
      syncedLocaleRef.current = initialLocale;
    }

    if (resourcesChanged || i18n.resolvedLanguage !== initialLocale) {
      void i18n.changeLanguage(initialLocale);
    }
  });

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

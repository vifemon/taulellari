"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18n } from "./create-i18n";
import { LANGUAGE_TAGS, type Locale } from "./config";

export function AppI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [i18n] = useState(() => createI18n(initialLocale));

  useEffect(() => {
    document.documentElement.lang = LANGUAGE_TAGS[initialLocale];

    if (i18n.resolvedLanguage !== initialLocale) {
      void i18n.changeLanguage(initialLocale);
    }
  }, [i18n, initialLocale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

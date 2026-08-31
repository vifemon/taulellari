"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";

import type { AuthUser } from "@/auth/types";
import { LANGUAGE_TAGS, LEGACY_LOCALE_COOKIE_NAME, type Locale } from "@/i18n/config";

import {
  APP_PREFERENCES_COOKIE_NAME,
  APP_PREFERENCES_MAX_AGE_SECONDS,
  type AppPreferences,
  type GalleryScope,
  type GalleryView,
  serializeAppPreferences,
  type Theme,
} from "./preferences";

type AppState = AppPreferences & {
  user: AuthUser | null;
  isLanguagePending: boolean;
  changeLocale: (locale: Locale) => void;
  setGalleryScope: (scope: GalleryScope) => void;
  setGalleryView: (view: GalleryView) => void;
  setTheme: (theme: Theme) => void;
  setUser: (user: AuthUser | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({
  children,
  initialPreferences,
  initialUser,
}: {
  children: React.ReactNode;
  initialPreferences: AppPreferences;
  initialUser: AuthUser | null;
}) {
  const normalizedInitialPreferences = initialUser
    ? initialPreferences
    : { ...initialPreferences, galleryScope: "all" as const };
  const [preferences, setPreferences] = useState(normalizedInitialPreferences);
  const preferencesRef = useRef(normalizedInitialPreferences);
  const [user, setCurrentUser] = useState(initialUser);
  const [isLanguagePending, startLanguageTransition] = useTransition();
  const { i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    persistPreferences(preferencesRef.current);
  }, []);

  function updatePreferences(update: Partial<AppPreferences>) {
    const nextPreferences = { ...preferencesRef.current, ...update };
    preferencesRef.current = nextPreferences;
    setPreferences(nextPreferences);
    persistPreferences(nextPreferences);
  }

  function changeLocale(locale: Locale) {
    if (locale === preferencesRef.current.locale) {
      return;
    }

    updatePreferences({ locale });
    document.documentElement.lang = LANGUAGE_TAGS[locale];

    void i18n.changeLanguage(locale).then(() => {
      startLanguageTransition(() => router.refresh());
    });
  }

  function setUser(nextUser: AuthUser | null) {
    setCurrentUser(nextUser);

    if (!nextUser) {
      updatePreferences({ galleryScope: "all" });
    }
  }

  return (
    <AppStateContext.Provider
      value={{
        ...preferences,
        user,
        isLanguagePending,
        changeLocale,
        setGalleryScope: (galleryScope) => updatePreferences({ galleryScope }),
        setGalleryView: (galleryView) => updatePreferences({ galleryView }),
        setTheme: (theme) => updatePreferences({ theme }),
        setUser,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const state = useContext(AppStateContext);

  if (!state) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return state;
}

function persistPreferences(preferences: AppPreferences) {
  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  const attributes = `Path=/; Max-Age=${APP_PREFERENCES_MAX_AGE_SECONDS}; SameSite=Lax${secureAttribute}`;

  document.cookie = `${APP_PREFERENCES_COOKIE_NAME}=${serializeAppPreferences(preferences)}; ${attributes}`;
  document.cookie = `${LEGACY_LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secureAttribute}`;
}

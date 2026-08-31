import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { LEGACY_LOCALE_COOKIE_NAME, normalizeLocale } from "@/i18n/config";

import { APP_PREFERENCES_COOKIE_NAME, parseAppPreferences } from "./preferences";

export const getRequestPreferences = cache(async () => {
  const cookieStore = await cookies();
  const legacyLocale = normalizeLocale(cookieStore.get(LEGACY_LOCALE_COOKIE_NAME)?.value);

  return parseAppPreferences(
    cookieStore.get(APP_PREFERENCES_COOKIE_NAME)?.value,
    legacyLocale,
  );
});

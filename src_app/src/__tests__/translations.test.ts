import { describe, expect, it } from "vitest";

import { normalizeLocale } from "../i18n/config";
import { createI18n } from "../i18n/create-i18n";
import { API_ERROR_CODES, getErrorTranslationKey } from "../i18n/error-codes";
import spanish from "../translations/es.json";
import valencian from "../translations/val.json";

describe("translation catalogues", () => {
  it("keeps Spanish and Valencian keys in sync", () => {
    expect(getLeafKeys(spanish)).toEqual(getLeafKeys(valencian));
    expect(getLeafValues(spanish).every((value) => value.trim().length > 0)).toBe(true);
    expect(getLeafValues(valencian).every((value) => value.trim().length > 0)).toBe(true);

    const spanishEntries = getLeafEntries(spanish);
    const valencianEntries = getLeafEntries(valencian);

    for (const [key, spanishValue] of spanishEntries) {
      expect(getInterpolationTokens(spanishValue)).toEqual(getInterpolationTokens(valencianEntries.get(key) ?? ""));
    }
  });

  it("uses the correct singular and plural forms", () => {
    const valencianI18n = createI18n("val");
    const spanishI18n = createI18n("es");

    expect(valencianI18n.t("publication.upload.filesSelected", { count: 1 })).toBe("1 fitxer seleccionat");
    expect(valencianI18n.t("publication.upload.filesSelected", { count: 2 })).toBe("2 fitxers seleccionats");
    expect(valencianI18n.t("profile.archive.photoCount", { count: 1 })).toBe("1 imatge");
    expect(valencianI18n.t("profile.archive.photoCount", { count: 2 })).toBe("2 imatges");
    expect(spanishI18n.t("publication.upload.filesSelected", { count: 1 })).toBe("1 archivo seleccionado");
    expect(spanishI18n.t("publication.upload.filesSelected", { count: 2 })).toBe("2 archivos seleccionados");
    expect(spanishI18n.t("profile.archive.photoCount", { count: 1 })).toBe("1 imagen");
    expect(spanishI18n.t("profile.archive.photoCount", { count: 2 })).toBe("2 imágenes");
  });

  it("falls back to Valencian for unsupported locale values", () => {
    expect(normalizeLocale("fr")).toBe("val");
    expect(normalizeLocale("ca-ES-valencia")).toBe("val");
    expect(normalizeLocale("es-ES")).toBe("es");
  });

  it("maps every API error code to an existing translation", () => {
    const valencianI18n = createI18n("val");
    const spanishI18n = createI18n("es");

    for (const errorCode of Object.values(API_ERROR_CODES)) {
      const key = getErrorTranslationKey(errorCode, "errors.publication.saveFailed");
      expect(valencianI18n.exists(key)).toBe(true);
      expect(spanishI18n.exists(key)).toBe(true);
    }

    expect(getErrorTranslationKey("UNKNOWN_ERROR", "errors.publication.saveFailed")).toBe("errors.publication.saveFailed");
  });
});

function getLeafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) => getLeafKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort();
}

function getLeafValues(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.values(value).flatMap(getLeafValues);
}

function getLeafEntries(value: unknown, prefix = ""): Map<string, string> {
  if (typeof value === "string") {
    return new Map([[prefix, value]]);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return new Map();
  }

  return new Map(
    Object.entries(value).flatMap(([key, child]) => [
      ...getLeafEntries(child, prefix ? `${prefix}.${key}` : key),
    ]),
  );
}

function getInterpolationTokens(value: string) {
  return Array.from(value.matchAll(/{{\s*([^},\s]+).*?}}/g), (match) => match[1]).sort();
}

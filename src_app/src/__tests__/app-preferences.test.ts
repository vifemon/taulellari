import { describe, expect, it } from "vitest";

import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  serializeAppPreferences,
} from "../app-state/preferences";

describe("app preferences", () => {
  it("round-trips every persisted preference", () => {
    const preferences = {
      locale: "es" as const,
      theme: "light" as const,
      galleryView: "map" as const,
      galleryScope: "mine" as const,
    };

    expect(parseAppPreferences(serializeAppPreferences(preferences))).toEqual(preferences);
  });

  it("normalizes missing or invalid cookie values", () => {
    expect(parseAppPreferences("not-json", "es")).toEqual({
      ...DEFAULT_APP_PREFERENCES,
      locale: "es",
    });
    expect(parseAppPreferences(encodeURIComponent(JSON.stringify({
      locale: "fr",
      theme: "sepia",
      galleryView: "list",
      galleryScope: "private",
    })))).toEqual(DEFAULT_APP_PREFERENCES);
  });
});

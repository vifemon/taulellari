import { describe, expect, it } from "vitest";

import { getBaseMapUrl } from "../app/publication-map";

describe("publication map base layer", () => {
  it("uses Carto Positron in light mode and Dark Matter in dark mode", () => {
    expect(getBaseMapUrl("light")).toContain("/light_all/");
    expect(getBaseMapUrl("dark")).toContain("/dark_all/");
  });
});

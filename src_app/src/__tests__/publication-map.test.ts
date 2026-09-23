import { describe, expect, it } from "vitest";

import {
  addCartoApiKey,
  createBrandedCartoStyle,
  getCartoStyleDocumentUrl,
  getCartoStyleUrl,
  type MapStyle,
} from "../app/carto-map-style";

describe("publication map base layer", () => {
  it("uses keyed CARTO vector styles", () => {
    expect(getCartoStyleDocumentUrl("light")).toBe(
      "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    );
    expect(getCartoStyleUrl("light", "test key")).toBe(
      "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json?key=test+key",
    );
    expect(getCartoStyleUrl("dark", "test-key")).toBe(
      "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json?key=test-key",
    );
  });

  it("adds the key only to CARTO subresources", () => {
    expect(addCartoApiKey("https://tiles-a.basemaps.cartocdn.com/vector/1/2/3.mvt", "test-key"))
      .toBe("https://tiles-a.basemaps.cartocdn.com/vector/1/2/3.mvt?key=test-key");
    expect(addCartoApiKey("https://example.com/style.json", "test-key"))
      .toBe("https://example.com/style.json");
    expect(addCartoApiKey("http://tiles.basemaps.cartocdn.com/style.json", "test-key"))
      .toBe("http://tiles.basemaps.cartocdn.com/style.json");
    expect(addCartoApiKey("https://uploads.cartocdn.com/style.json", "test-key"))
      .toBe("https://uploads.cartocdn.com/style.json");
  });

  it("applies the branded palette and localizes labels without mutating the source style", () => {
    const sourceStyle: MapStyle = {
      version: 8,
      sources: { carto: { type: "vector" } },
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#ffffff" },
        },
        {
          id: "water",
          type: "fill",
          "source-layer": "water",
          paint: { "fill-color": "#0000ff" },
        },
        {
          id: "road_mot_fill_noramp",
          type: "line",
          "source-layer": "transportation",
          paint: { "line-color": "#ffffff" },
        },
        {
          id: "place_city",
          type: "symbol",
          "source-layer": "place",
          layout: { "text-field": "{name_en}" },
          paint: { "text-color": "#000000" },
        },
      ],
    };

    const brandedStyle = createBrandedCartoStyle(sourceStyle, "dark", "ca");
    const lightStyle = createBrandedCartoStyle(sourceStyle, "light", "ca");

    expect(brandedStyle.id).toBe("taulellari-dark-ca");
    expect(lightStyle.id).toBe("taulellari-light-ca");
    expect(brandedStyle.layers[0].paint?.["background-color"]).toBe("#0d2142");
    expect(brandedStyle.layers[1].paint?.["fill-color"]).toBe("#173b63");
    expect(brandedStyle.layers[2].paint?.["line-color"]).toBe("#e6a95e");
    expect(brandedStyle.layers[3].layout?.["text-field"]).toEqual([
      "coalesce",
      ["get", "name:ca"],
      ["get", "name"],
      ["get", "name_en"],
    ]);
    expect(sourceStyle.id).toBeUndefined();
    expect(sourceStyle.layers[0].paint?.["background-color"]).toBe("#ffffff");
  });

});

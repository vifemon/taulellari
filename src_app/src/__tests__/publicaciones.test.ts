import { describe, expect, it } from "vitest";

import { parseMapboxSuggestions } from "../mapbox/geocoding";
import {
  MAX_PHOTOS_PER_PUBLICATION,
  validatePhotoFiles,
  validatePublicationFields,
} from "../publicaciones/validation";

describe("publication validation", () => {
  it("accepts valid title, address and coordinates", () => {
    expect(
      validatePublicationFields({
        titulo: " Portal azul ",
        direccionTexto: "Carrer de la Pau 1, Valencia",
        latitud: "39.4743",
        longitud: "-0.3768",
      }),
    ).toEqual({
      ok: true,
      data: {
        titulo: "Portal azul",
        direccionTexto: "Carrer de la Pau 1, Valencia",
        latitud: 39.4743,
        longitud: -0.3768,
      },
    });
  });

  it("rejects missing address or invalid coordinates", () => {
    expect(
      validatePublicationFields({
        titulo: "Portal",
        direccionTexto: "",
        latitud: "39.4743",
        longitud: "-0.3768",
      }).ok,
    ).toBe(false);

    expect(
      validatePublicationFields({
        titulo: "Portal",
        direccionTexto: "Carrer de la Pau 1, Valencia",
        latitud: "not-a-number",
        longitud: "-0.3768",
      }).ok,
    ).toBe(false);
  });

  it("accepts up to three compatible images", () => {
    const files = Array.from({ length: MAX_PHOTOS_PER_PUBLICATION }, (_, index) =>
      new File(["image"], `photo-${index}.jpg`, { type: "image/jpeg" }),
    );

    expect(validatePhotoFiles(files)).toBeNull();
    expect(
      validatePhotoFiles([
        ...files,
        new File(["image"], "extra.jpg", { type: "image/jpeg" }),
      ]),
    ).toBe("Solo puedes subir hasta 3 fotos");
  });
});

describe("Mapbox parsing", () => {
  it("maps Mapbox features to address suggestions", () => {
    expect(
      parseMapboxSuggestions({
        features: [
          {
            id: "address.1",
            geometry: { coordinates: [-0.3768, 39.4743] },
            properties: {
              full_address: "Carrer de la Pau 1",
              mapbox_id: "mapbox-address-1",
              place_formatted: "Valencia, Valencia, Espana",
            },
          },
        ],
      }),
    ).toEqual([
      {
        id: "mapbox-address-1",
        label: "Carrer de la Pau 1, Valencia, Valencia, Espana",
        latitude: 39.4743,
        longitude: -0.3768,
      },
    ]);
  });
});

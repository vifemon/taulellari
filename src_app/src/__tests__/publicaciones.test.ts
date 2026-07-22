import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseMapboxSuggestions } from "../mapbox/geocoding";
import {
  getPhotoContentType,
  getPublicationPhotoEntries,
} from "../publicaciones/photos";
import { removeSavedPhotos, savePublicationPhotos } from "../publicaciones/storage";
import {
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
        descripcion: null,
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

  it("rejects descriptions longer than the title limit", () => {
    expect(
      validatePublicationFields({
        titulo: "Portal",
        descripcion: "a".repeat(121),
        direccionTexto: "Carrer de la Pau 1, Valencia",
        latitud: "39.4743",
        longitud: "-0.3768",
      }).ok,
    ).toBe(false);
  });

  it("accepts any number of compatible images", () => {
    const files = Array.from({ length: 8 }, (_, index) =>
      new File(["image"], `photo-${index}.jpg`, { type: "image/jpeg" }),
    );

    expect(validatePhotoFiles(files)).toBeNull();
  });

  it("saves every selected image", async () => {
    const storageDir = await mkdtemp(path.join(os.tmpdir(), "taulellari-photos-"));
    const previousStorageDir = process.env.PHOTO_STORAGE_DIR;
    process.env.PHOTO_STORAGE_DIR = storageDir;
    const files = Array.from({ length: 5 }, (_, index) =>
      new File([`image-${index}`], `photo-${index}.jpg`, { type: "image/jpeg" }),
    );

    try {
      const savedPaths = await savePublicationPhotos(files);

      expect(savedPaths).toHaveLength(files.length);
      await expect(Promise.all(savedPaths.map((filePath) => readFile(filePath, "utf8")))).resolves.toEqual(
        files.map((_, index) => `image-${index}`),
      );
      await removeSavedPhotos(savedPaths);
    } finally {
      if (previousStorageDir === undefined) {
        delete process.env.PHOTO_STORAGE_DIR;
      } else {
        process.env.PHOTO_STORAGE_DIR = previousStorageDir;
      }
      await rm(storageDir, { recursive: true, force: true });
    }
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

describe("publication photos", () => {
  it("returns only existing photo entries", () => {
    expect(
      getPublicationPhotoEntries([
        { id: 11, publicacionId: 4, rutaLocal: "/data/1.jpg", orden: 1 },
        { id: 12, publicacionId: 4, rutaLocal: "/data/3.webp", orden: 3 },
      ]),
    ).toEqual([
      { id: 11, index: 1, path: "/data/1.jpg" },
      { id: 12, index: 3, path: "/data/3.webp" },
    ]);
  });

  it("detects image content types from file extensions", () => {
    expect(getPhotoContentType("/data/photo.JPG")).toBe("image/jpeg");
    expect(getPhotoContentType("/data/photo.webp")).toBe("image/webp");
    expect(getPhotoContentType("/data/photo.unknown")).toBe(
      "application/octet-stream",
    );
  });
});

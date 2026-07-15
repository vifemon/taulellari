export const MAX_PHOTOS_PER_PUBLICATION = 3;
export const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type PublicationFields = {
  titulo: string;
  descripcion: string | null;
  direccionTexto: string;
  latitud: number;
  longitud: number;
};

export type PublicationValidationResult =
  | { ok: true; data: PublicationFields }
  | { ok: false; error: string };

export function validatePublicationFields(input: {
  titulo: unknown;
  descripcion?: unknown;
  direccionTexto: unknown;
  latitud: unknown;
  longitud: unknown;
}): PublicationValidationResult {
  const titulo = normalizeRequiredText(input.titulo, 120);

  if (!titulo) {
    return { ok: false, error: "El titulo es obligatorio" };
  }

  const descripcion = normalizeOptionalText(input.descripcion, 120);

  if (descripcion === false) {
    return { ok: false, error: "La descripcion es demasiado larga" };
  }

  const direccionTexto = normalizeRequiredText(input.direccionTexto, 300);

  if (!direccionTexto) {
    return { ok: false, error: "La direccion es obligatoria" };
  }

  const latitud = toNumber(input.latitud);
  const longitud = toNumber(input.longitud);

  if (!isValidLatitude(latitud) || !isValidLongitude(longitud)) {
    return { ok: false, error: "Las coordenadas no son validas" };
  }

  return {
    ok: true,
    data: {
      titulo,
      descripcion,
      direccionTexto,
      latitud,
      longitud,
    },
  };
}

export function validatePhotoFiles(files: File[]) {
  if (files.length < 1) {
    return "Sube al menos una foto";
  }

  if (files.length > MAX_PHOTOS_PER_PUBLICATION) {
    return `Solo puedes subir hasta ${MAX_PHOTOS_PER_PUBLICATION} fotos`;
  }

  for (const file of files) {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return "Todas las fotos deben ser imagenes compatibles";
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return "Cada foto debe pesar como maximo 8 MB";
    }
  }

  return null;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return false;
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    return false;
  }

  return text;
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (!text || text.length > maxLength) {
    return null;
  }

  return text;
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Number(value);
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

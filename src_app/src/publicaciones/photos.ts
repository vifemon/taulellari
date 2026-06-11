export type PublicationPhotoEntry = {
  index: 1 | 2 | 3;
  path: string;
};

export type PublicationPhotoPaths = {
  rutaLocalFoto1: string;
  rutaLocalFoto2: string | null;
  rutaLocalFoto3: string | null;
};

export function getPublicationPhotoEntries(
  publication: PublicationPhotoPaths,
): PublicationPhotoEntry[] {
  return [
    { index: 1 as const, path: publication.rutaLocalFoto1 },
    publication.rutaLocalFoto2
      ? { index: 2 as const, path: publication.rutaLocalFoto2 }
      : null,
    publication.rutaLocalFoto3
      ? { index: 3 as const, path: publication.rutaLocalFoto3 }
      : null,
  ].filter((entry): entry is PublicationPhotoEntry => entry !== null);
}

export function getPhotoContentType(filePath: string) {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "avif":
      return "image/avif";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

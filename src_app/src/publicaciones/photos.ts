export type PublicationPhotoEntry = {
  id: number;
  index: number;
  path: string;
};

type PublicationPhotoRecord = {
  id: number;
  orden: number;
  rutaLocal: string;
};

export function getPublicationPhotoEntries(
  photos: PublicationPhotoRecord[],
): PublicationPhotoEntry[] {
  return photos.map((photo) => ({
    id: photo.id,
    index: photo.orden,
    path: photo.rutaLocal,
  }));
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

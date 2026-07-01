import { readFile } from "node:fs/promises";

import { findPublicationPhotoPaths } from "@/db/repositories";
import {
  getPhotoContentType,
  getPublicationPhotoEntries,
} from "@/publicaciones/photos";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index } = await context.params;
  const publicationId = Number(id);
  const photoIndex = Number(index);

  if (!Number.isSafeInteger(publicationId) || ![1, 2, 3].includes(photoIndex)) {
    return Response.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  const publication = await findPublicationPhotoPaths({
    id: publicationId,
  });

  if (!publication) {
    return Response.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  const photo = getPublicationPhotoEntries(publication).find(
    (entry) => entry.index === photoIndex,
  );

  if (!photo) {
    return Response.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  try {
    const file = await readFile(photo.path);

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": getPhotoContentType(photo.path),
      },
    });
  } catch {
    return Response.json({ error: "Foto no encontrada" }, { status: 404 });
  }
}

import { readFile } from "node:fs/promises";

import { deletePublicationPhoto, findPublicationPhoto } from "@/db/repositories";
import { getCurrentUser } from "@/auth/current-user";
import { getPhotoContentType } from "@/publicaciones/photos";
import { removeSavedPhotos } from "@/publicaciones/storage";
import { API_ERROR_CODES } from "@/i18n/error-codes";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index } = await context.params;
  const publicationId = Number(id);
  const photoIndex = Number(index);

  if (!Number.isSafeInteger(publicationId) || !Number.isSafeInteger(photoIndex) || photoIndex < 1) {
    return Response.json({ error: API_ERROR_CODES.photoNotFound }, { status: 404 });
  }

  const photo = await findPublicationPhoto({ id: publicationId, orden: photoIndex });

  if (!photo) {
    return Response.json({ error: API_ERROR_CODES.photoNotFound }, { status: 404 });
  }

  try {
    const file = await readFile(photo.rutaLocal);

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": getPhotoContentType(photo.rutaLocal),
      },
    });
  } catch {
    return Response.json({ error: API_ERROR_CODES.photoNotFound }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; index: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: API_ERROR_CODES.authRequired }, { status: 401 });
  }

  const { id, index } = await context.params;
  const publicationId = Number(id);
  const photoIndex = Number(index);

  if (!Number.isSafeInteger(publicationId) || !Number.isSafeInteger(photoIndex) || photoIndex < 1) {
    return Response.json({ error: API_ERROR_CODES.photoNotFound }, { status: 404 });
  }

  const deleted = await deletePublicationPhoto({
    id: publicationId,
    orden: photoIndex,
    usuarioId: user.id,
  });

  if (!deleted) {
    return Response.json({ error: API_ERROR_CODES.photoNotFound }, { status: 404 });
  }

  await removeSavedPhotos([deleted.path]);

  return Response.json({ ok: true, publicationDeleted: deleted.publicationDeleted });
}

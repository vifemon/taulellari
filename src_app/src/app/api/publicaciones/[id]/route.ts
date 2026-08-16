import { getCurrentUser } from "@/auth/current-user";
import {
  deletePublication,
  findPublicationPhotoPaths,
  updatePublication,
} from "@/db/repositories";
import { getPublicationPhotoEntries } from "@/publicaciones/photos";
import { removeSavedPhotos } from "@/publicaciones/storage";
import { validatePublicationFields } from "@/publicaciones/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "No has iniciat sessió" }, { status: 401 });
  }

  const publicationId = await parsePublicationId(context);

  if (!publicationId) {
    return Response.json({ error: "No s'ha trobat la publicació" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const values = typeof body === "object" && body ? body : {};
  const fields = validatePublicationFields({
    titulo: "titulo" in values ? values.titulo : undefined,
    descripcion: "descripcion" in values ? values.descripcion : undefined,
    direccionTexto: "direccionTexto" in values ? values.direccionTexto : undefined,
    latitud: "latitud" in values ? values.latitud : undefined,
    longitud: "longitud" in values ? values.longitud : undefined,
  });

  if (!fields.ok) {
    return Response.json({ error: fields.error }, { status: 400 });
  }

  const existing = await findPublicationPhotoPaths({
    id: publicationId,
    usuarioId: user.id,
  });

  if (!existing) {
    return Response.json({ error: "No s'ha trobat la publicació" }, { status: 404 });
  }

  await updatePublication({
    id: publicationId,
    usuarioId: user.id,
    ...fields.data,
  });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "No has iniciat sessió" }, { status: 401 });
  }

  const publicationId = await parsePublicationId(context);

  if (!publicationId) {
    return Response.json({ error: "No s'ha trobat la publicació" }, { status: 404 });
  }

  const photos = await findPublicationPhotoPaths({
    id: publicationId,
    usuarioId: user.id,
  });

  if (!photos) {
    return Response.json({ error: "No s'ha trobat la publicació" }, { status: 404 });
  }

  await deletePublication({ id: publicationId, usuarioId: user.id });
  await removeSavedPhotos(getPublicationPhotoEntries(photos).map((photo) => photo.path));

  return Response.json({ ok: true });
}

async function parsePublicationId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const publicationId = Number(id);

  if (!Number.isSafeInteger(publicationId) || publicationId < 1) {
    return null;
  }

  return publicationId;
}

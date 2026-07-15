import { getCurrentUser } from "@/auth/current-user";
import {
  createPublication,
  listPublications,
} from "@/db/repositories";
import { getPublicationPhotoEntries } from "@/publicaciones/photos";
import { removeSavedPhotos, savePublicationPhotos } from "@/publicaciones/storage";
import {
  validatePhotoFiles,
  validatePublicationFields,
} from "@/publicaciones/validation";

export async function GET() {
  const user = await getCurrentUser();
  const rows = await listPublications();

  return Response.json({
    publicaciones: rows.map((publication) => ({
      id: publication.id,
      ...(user
        ? {
            titulo: publication.titulo,
            descripcion: publication.descripcion,
            direccionTexto: publication.direccionTexto,
            latitud: publication.latitud,
            longitud: publication.longitud,
            creadoEn: publication.creadoEn,
            isOwner: publication.usuarioId === user.id,
          }
        : {}),
      fotos: getPublicationPhotoEntries(publication).map((photo) => ({
        index: photo.index,
        url: `/api/publicaciones/${publication.id}/fotos/${photo.index}`,
      })),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const fields = validatePublicationFields({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    direccionTexto: formData.get("direccionTexto"),
    latitud: formData.get("latitud"),
    longitud: formData.get("longitud"),
  });

  if (!fields.ok) {
    return Response.json({ error: fields.error }, { status: 400 });
  }

  const photos = formData
    .getAll("fotos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const photoError = validatePhotoFiles(photos);

  if (photoError) {
    return Response.json({ error: photoError }, { status: 400 });
  }

  const savedPaths = await savePublicationPhotos(photos);

  try {
    const publication = await createPublication({
      titulo: fields.data.titulo,
      descripcion: fields.data.descripcion,
      rutaLocalFoto1: savedPaths[0],
      rutaLocalFoto2: savedPaths[1],
      rutaLocalFoto3: savedPaths[2],
      direccionTexto: fields.data.direccionTexto,
      latitud: fields.data.latitud,
      longitud: fields.data.longitud,
      usuarioId: user.id,
    });

    return Response.json({ publication }, { status: 201 });
  } catch (error) {
    await removeSavedPhotos(savedPaths);
    throw error;
  }
}

import { getCurrentUser } from "@/auth/current-user";
import { getDb } from "@/db/client";
import { publicaciones } from "@/db/schema";
import { removeSavedPhotos, savePublicationPhotos } from "@/publicaciones/storage";
import {
  validatePhotoFiles,
  validatePublicationFields,
} from "@/publicaciones/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const fields = validatePublicationFields({
    titulo: formData.get("titulo"),
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
    const [publication] = await getDb()
      .insert(publicaciones)
      .values({
        titulo: fields.data.titulo,
        rutaLocalFoto1: savedPaths[0],
        rutaLocalFoto2: savedPaths[1],
        rutaLocalFoto3: savedPaths[2],
        direccionTexto: fields.data.direccionTexto,
        latitud: fields.data.latitud,
        longitud: fields.data.longitud,
        usuarioId: user.id,
      })
      .returning({ id: publicaciones.id });

    return Response.json({ publication }, { status: 201 });
  } catch (error) {
    await removeSavedPhotos(savedPaths);
    throw error;
  }
}

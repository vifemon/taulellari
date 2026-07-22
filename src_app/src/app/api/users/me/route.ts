import { cookies } from "next/headers";

import { getCurrentUser } from "@/auth/current-user";
import { hashPassword } from "@/auth/password";
import { SESSION_COOKIE_NAME } from "@/auth/session";
import { parseProfileInput, readJsonObject } from "@/auth/user-input";
import {
  deleteUser,
  findUserByEmail,
  listPublicationPhotoPathsForUser,
  updateUser,
} from "@/db/repositories";
import { getPublicationPhotoEntries } from "@/publicaciones/photos";
import { removeSavedPhotos } from "@/publicaciones/storage";

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const input = parseProfileInput(await readJsonObject(request));

  if (!input) {
    return Response.json({ error: "Datos de perfil invalidos" }, { status: 400 });
  }

  const existingUser = await findUserByEmail(input.email);

  if (existingUser && existingUser.id !== currentUser.id) {
    return Response.json({ error: "El email ya esta registrado" }, { status: 409 });
  }

  const user = await updateUser({
    id: currentUser.id,
    email: input.email,
    nombre: input.nombre,
    apellidos: input.apellidos,
    passwordHash: input.password ? await hashPassword(input.password) : undefined,
  });

  return Response.json({ user });
}

export async function DELETE() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const publications = await listPublicationPhotoPathsForUser(currentUser.id);
  const photoPaths = getPublicationPhotoEntries(publications).map((photo) => photo.path);

  await deleteUser(currentUser.id);
  await removeSavedPhotos(photoPaths);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return Response.json({ ok: true });
}

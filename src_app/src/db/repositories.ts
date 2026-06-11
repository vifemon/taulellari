import { and, desc, eq } from "drizzle-orm";

import { getPgDb, getSqliteDb, isDevelopmentDatabase } from "./client";
import * as pgSchema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

export type UserRecord = {
  id: number;
  email: string;
};

export type PublicationCreateInput = {
  titulo: string;
  rutaLocalFoto1: string;
  rutaLocalFoto2?: string;
  rutaLocalFoto3?: string;
  direccionTexto: string;
  latitud: number;
  longitud: number;
  usuarioId: number;
};

export type PublicationListItem = {
  id: number;
  titulo: string;
  direccionTexto: string;
  latitud: number;
  longitud: number;
  rutaLocalFoto1: string;
  rutaLocalFoto2: string | null;
  rutaLocalFoto3: string | null;
  creadoEn: Date | string;
};

export type PublicationPhotoPaths = Pick<
  PublicationListItem,
  "rutaLocalFoto1" | "rutaLocalFoto2" | "rutaLocalFoto3"
>;

export async function findUserById(id: number): Promise<UserRecord | null> {
  if (isDevelopmentDatabase()) {
    const user = getSqliteDb()
      .select({ id: sqliteSchema.usuarios.id, email: sqliteSchema.usuarios.email })
      .from(sqliteSchema.usuarios)
      .where(eq(sqliteSchema.usuarios.id, id))
      .get();

    return user ?? null;
  }

  const [user] = await getPgDb()
    .select({ id: pgSchema.usuarios.id, email: pgSchema.usuarios.email })
    .from(pgSchema.usuarios)
    .where(eq(pgSchema.usuarios.id, id))
    .limit(1);

  return user ?? null;
}

export async function findOrCreateUserByEmail(email: string): Promise<{
  user: UserRecord | null;
  created: boolean;
}> {
  if (isDevelopmentDatabase()) {
    const result = getSqliteDb()
      .insert(sqliteSchema.usuarios)
      .values({ email })
      .onConflictDoNothing({ target: sqliteSchema.usuarios.email })
      .run();
    const user = getSqliteDb()
      .select({ id: sqliteSchema.usuarios.id, email: sqliteSchema.usuarios.email })
      .from(sqliteSchema.usuarios)
      .where(eq(sqliteSchema.usuarios.email, email))
      .get();

    return { user: user ?? null, created: result.changes > 0 };
  }

  const [createdUser] = await getPgDb()
    .insert(pgSchema.usuarios)
    .values({ email })
    .onConflictDoNothing({ target: pgSchema.usuarios.email })
    .returning({ id: pgSchema.usuarios.id, email: pgSchema.usuarios.email });

  if (createdUser) {
    return { user: createdUser, created: true };
  }

  const [user] = await getPgDb()
    .select({ id: pgSchema.usuarios.id, email: pgSchema.usuarios.email })
    .from(pgSchema.usuarios)
    .where(eq(pgSchema.usuarios.email, email))
    .limit(1);

  return { user: user ?? null, created: false };
}

export async function listPublicationsForUser(
  usuarioId: number,
): Promise<PublicationListItem[]> {
  if (isDevelopmentDatabase()) {
    return getSqliteDb()
      .select({
        id: sqliteSchema.publicaciones.id,
        titulo: sqliteSchema.publicaciones.titulo,
        direccionTexto: sqliteSchema.publicaciones.direccionTexto,
        latitud: sqliteSchema.publicaciones.latitud,
        longitud: sqliteSchema.publicaciones.longitud,
        rutaLocalFoto1: sqliteSchema.publicaciones.rutaLocalFoto1,
        rutaLocalFoto2: sqliteSchema.publicaciones.rutaLocalFoto2,
        rutaLocalFoto3: sqliteSchema.publicaciones.rutaLocalFoto3,
        creadoEn: sqliteSchema.publicaciones.creadoEn,
      })
      .from(sqliteSchema.publicaciones)
      .where(eq(sqliteSchema.publicaciones.usuarioId, usuarioId))
      .orderBy(desc(sqliteSchema.publicaciones.creadoEn))
      .all();
  }

  return getPgDb()
    .select({
      id: pgSchema.publicaciones.id,
      titulo: pgSchema.publicaciones.titulo,
      direccionTexto: pgSchema.publicaciones.direccionTexto,
      latitud: pgSchema.publicaciones.latitud,
      longitud: pgSchema.publicaciones.longitud,
      rutaLocalFoto1: pgSchema.publicaciones.rutaLocalFoto1,
      rutaLocalFoto2: pgSchema.publicaciones.rutaLocalFoto2,
      rutaLocalFoto3: pgSchema.publicaciones.rutaLocalFoto3,
      creadoEn: pgSchema.publicaciones.creadoEn,
    })
    .from(pgSchema.publicaciones)
    .where(eq(pgSchema.publicaciones.usuarioId, usuarioId))
    .orderBy(desc(pgSchema.publicaciones.creadoEn));
}

export async function createPublication(input: PublicationCreateInput) {
  if (isDevelopmentDatabase()) {
    const result = getSqliteDb()
      .insert(sqliteSchema.publicaciones)
      .values(input)
      .run();

    return { id: Number(result.lastInsertRowid) };
  }

  const [publication] = await getPgDb()
    .insert(pgSchema.publicaciones)
    .values(input)
    .returning({ id: pgSchema.publicaciones.id });

  return publication;
}

export async function findPublicationPhotoPaths(input: {
  id: number;
  usuarioId: number;
}): Promise<PublicationPhotoPaths | null> {
  if (isDevelopmentDatabase()) {
    const publication = getSqliteDb()
      .select({
        rutaLocalFoto1: sqliteSchema.publicaciones.rutaLocalFoto1,
        rutaLocalFoto2: sqliteSchema.publicaciones.rutaLocalFoto2,
        rutaLocalFoto3: sqliteSchema.publicaciones.rutaLocalFoto3,
      })
      .from(sqliteSchema.publicaciones)
      .where(
        and(
          eq(sqliteSchema.publicaciones.id, input.id),
          eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
        ),
      )
      .get();

    return publication ?? null;
  }

  const [publication] = await getPgDb()
    .select({
      rutaLocalFoto1: pgSchema.publicaciones.rutaLocalFoto1,
      rutaLocalFoto2: pgSchema.publicaciones.rutaLocalFoto2,
      rutaLocalFoto3: pgSchema.publicaciones.rutaLocalFoto3,
    })
    .from(pgSchema.publicaciones)
    .where(
      and(
        eq(pgSchema.publicaciones.id, input.id),
        eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
      ),
    )
    .limit(1);

  return publication ?? null;
}

import { and, desc, eq } from "drizzle-orm";

import { getPgDb, getSqliteDb, isDevelopmentDatabase } from "./client";
import * as pgSchema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

export type UserRecord = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
};

export type UserWithPasswordRecord = UserRecord & {
  passwordHash: string;
};

export type UserCreateInput = {
  email: string;
  nombre: string;
  apellidos: string;
  passwordHash: string;
};

export type UserUpdateInput = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  passwordHash?: string;
};

export type PublicationCreateInput = {
  titulo: string;
  descripcion?: string | null;
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
  usuarioId: number;
  titulo: string;
  descripcion: string | null;
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
      .select({
        id: sqliteSchema.usuarios.id,
        email: sqliteSchema.usuarios.email,
        nombre: sqliteSchema.usuarios.nombre,
        apellidos: sqliteSchema.usuarios.apellidos,
      })
      .from(sqliteSchema.usuarios)
      .where(eq(sqliteSchema.usuarios.id, id))
      .get();

    return user ?? null;
  }

  const [user] = await getPgDb()
    .select({
      id: pgSchema.usuarios.id,
      email: pgSchema.usuarios.email,
      nombre: pgSchema.usuarios.nombre,
      apellidos: pgSchema.usuarios.apellidos,
    })
    .from(pgSchema.usuarios)
    .where(eq(pgSchema.usuarios.id, id))
    .limit(1);

  return user ?? null;
}

export async function findUserByEmail(
  email: string,
): Promise<UserWithPasswordRecord | null> {
  if (isDevelopmentDatabase()) {
    const user = getSqliteDb()
      .select({
        id: sqliteSchema.usuarios.id,
        email: sqliteSchema.usuarios.email,
        nombre: sqliteSchema.usuarios.nombre,
        apellidos: sqliteSchema.usuarios.apellidos,
        passwordHash: sqliteSchema.usuarios.passwordHash,
      })
      .from(sqliteSchema.usuarios)
      .where(eq(sqliteSchema.usuarios.email, email))
      .get();

    return user ?? null;
  }

  const [user] = await getPgDb()
    .select({
      id: pgSchema.usuarios.id,
      email: pgSchema.usuarios.email,
      nombre: pgSchema.usuarios.nombre,
      apellidos: pgSchema.usuarios.apellidos,
      passwordHash: pgSchema.usuarios.passwordHash,
    })
    .from(pgSchema.usuarios)
    .where(eq(pgSchema.usuarios.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(input: UserCreateInput): Promise<UserRecord> {
  if (isDevelopmentDatabase()) {
    const result = getSqliteDb().insert(sqliteSchema.usuarios).values(input).run();

    return {
      id: Number(result.lastInsertRowid),
      email: input.email,
      nombre: input.nombre,
      apellidos: input.apellidos,
    };
  }

  const [user] = await getPgDb()
    .insert(pgSchema.usuarios)
    .values(input)
    .returning({
      id: pgSchema.usuarios.id,
      email: pgSchema.usuarios.email,
      nombre: pgSchema.usuarios.nombre,
      apellidos: pgSchema.usuarios.apellidos,
    });

  return user;
}

export async function updateUser(input: UserUpdateInput): Promise<UserRecord> {
  const values = {
    email: input.email,
    nombre: input.nombre,
    apellidos: input.apellidos,
    ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
  };

  if (isDevelopmentDatabase()) {
    getSqliteDb()
      .update(sqliteSchema.usuarios)
      .set(values)
      .where(eq(sqliteSchema.usuarios.id, input.id))
      .run();

    const user = await findUserById(input.id);

    if (!user) {
      throw new Error("User not found after update");
    }

    return user;
  }

  const [user] = await getPgDb()
    .update(pgSchema.usuarios)
    .set(values)
    .where(eq(pgSchema.usuarios.id, input.id))
    .returning({
      id: pgSchema.usuarios.id,
      email: pgSchema.usuarios.email,
      nombre: pgSchema.usuarios.nombre,
      apellidos: pgSchema.usuarios.apellidos,
    });

  return user;
}

export async function deleteUser(id: number) {
  if (isDevelopmentDatabase()) {
    getSqliteDb().delete(sqliteSchema.usuarios).where(eq(sqliteSchema.usuarios.id, id)).run();
    return;
  }

  await getPgDb().delete(pgSchema.usuarios).where(eq(pgSchema.usuarios.id, id));
}

export async function listPublications(): Promise<PublicationListItem[]> {
  if (isDevelopmentDatabase()) {
    return getSqliteDb()
      .select({
        id: sqliteSchema.publicaciones.id,
        usuarioId: sqliteSchema.publicaciones.usuarioId,
        titulo: sqliteSchema.publicaciones.titulo,
        descripcion: sqliteSchema.publicaciones.descripcion,
        direccionTexto: sqliteSchema.publicaciones.direccionTexto,
        latitud: sqliteSchema.publicaciones.latitud,
        longitud: sqliteSchema.publicaciones.longitud,
        rutaLocalFoto1: sqliteSchema.publicaciones.rutaLocalFoto1,
        rutaLocalFoto2: sqliteSchema.publicaciones.rutaLocalFoto2,
        rutaLocalFoto3: sqliteSchema.publicaciones.rutaLocalFoto3,
        creadoEn: sqliteSchema.publicaciones.creadoEn,
      })
      .from(sqliteSchema.publicaciones)
      .orderBy(desc(sqliteSchema.publicaciones.creadoEn))
      .all();
  }

  return getPgDb()
    .select({
      id: pgSchema.publicaciones.id,
      usuarioId: pgSchema.publicaciones.usuarioId,
      titulo: pgSchema.publicaciones.titulo,
      descripcion: pgSchema.publicaciones.descripcion,
      direccionTexto: pgSchema.publicaciones.direccionTexto,
      latitud: pgSchema.publicaciones.latitud,
      longitud: pgSchema.publicaciones.longitud,
      rutaLocalFoto1: pgSchema.publicaciones.rutaLocalFoto1,
      rutaLocalFoto2: pgSchema.publicaciones.rutaLocalFoto2,
      rutaLocalFoto3: pgSchema.publicaciones.rutaLocalFoto3,
      creadoEn: pgSchema.publicaciones.creadoEn,
    })
    .from(pgSchema.publicaciones)
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
  usuarioId?: number;
}): Promise<PublicationPhotoPaths | null> {
  if (isDevelopmentDatabase()) {
    const filters = input.usuarioId
      ? and(
          eq(sqliteSchema.publicaciones.id, input.id),
          eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
        )
      : eq(sqliteSchema.publicaciones.id, input.id);
    const publication = getSqliteDb()
      .select({
        rutaLocalFoto1: sqliteSchema.publicaciones.rutaLocalFoto1,
        rutaLocalFoto2: sqliteSchema.publicaciones.rutaLocalFoto2,
        rutaLocalFoto3: sqliteSchema.publicaciones.rutaLocalFoto3,
      })
      .from(sqliteSchema.publicaciones)
      .where(filters)
      .get();

    return publication ?? null;
  }

  const filters = input.usuarioId
    ? and(
        eq(pgSchema.publicaciones.id, input.id),
        eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
      )
    : eq(pgSchema.publicaciones.id, input.id);
  const [publication] = await getPgDb()
    .select({
      rutaLocalFoto1: pgSchema.publicaciones.rutaLocalFoto1,
      rutaLocalFoto2: pgSchema.publicaciones.rutaLocalFoto2,
      rutaLocalFoto3: pgSchema.publicaciones.rutaLocalFoto3,
    })
    .from(pgSchema.publicaciones)
    .where(filters)
    .limit(1);

  return publication ?? null;
}

export async function listPublicationPhotoPathsForUser(
  usuarioId: number,
): Promise<PublicationPhotoPaths[]> {
  if (isDevelopmentDatabase()) {
    return getSqliteDb()
      .select({
        rutaLocalFoto1: sqliteSchema.publicaciones.rutaLocalFoto1,
        rutaLocalFoto2: sqliteSchema.publicaciones.rutaLocalFoto2,
        rutaLocalFoto3: sqliteSchema.publicaciones.rutaLocalFoto3,
      })
      .from(sqliteSchema.publicaciones)
      .where(eq(sqliteSchema.publicaciones.usuarioId, usuarioId))
      .all();
  }

  return getPgDb()
    .select({
      rutaLocalFoto1: pgSchema.publicaciones.rutaLocalFoto1,
      rutaLocalFoto2: pgSchema.publicaciones.rutaLocalFoto2,
      rutaLocalFoto3: pgSchema.publicaciones.rutaLocalFoto3,
    })
    .from(pgSchema.publicaciones)
    .where(eq(pgSchema.publicaciones.usuarioId, usuarioId));
}

export async function updatePublication(input: {
  id: number;
  usuarioId: number;
  titulo: string;
  descripcion: string | null;
  direccionTexto: string;
  latitud: number;
  longitud: number;
}) {
  if (isDevelopmentDatabase()) {
    getSqliteDb()
      .update(sqliteSchema.publicaciones)
      .set({
        titulo: input.titulo,
        descripcion: input.descripcion,
        direccionTexto: input.direccionTexto,
        latitud: input.latitud,
        longitud: input.longitud,
      })
      .where(
        and(
          eq(sqliteSchema.publicaciones.id, input.id),
          eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
        ),
      )
      .run();
    return;
  }

  await getPgDb()
    .update(pgSchema.publicaciones)
    .set({
      titulo: input.titulo,
      descripcion: input.descripcion,
      direccionTexto: input.direccionTexto,
      latitud: input.latitud,
      longitud: input.longitud,
    })
    .where(
      and(
        eq(pgSchema.publicaciones.id, input.id),
        eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
      ),
    );
}

export async function deletePublication(input: { id: number; usuarioId: number }) {
  if (isDevelopmentDatabase()) {
    getSqliteDb()
      .delete(sqliteSchema.publicaciones)
      .where(
        and(
          eq(sqliteSchema.publicaciones.id, input.id),
          eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
        ),
      )
      .run();
    return;
  }

  await getPgDb()
    .delete(pgSchema.publicaciones)
    .where(
      and(
        eq(pgSchema.publicaciones.id, input.id),
        eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
      ),
    );
}

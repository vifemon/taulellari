import { and, asc, count, desc, eq } from "drizzle-orm";

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
  fotos: string[];
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
  creadoEn: Date | string;
  fotos: PublicationPhotoRecord[];
};

export type PublicationPhotoRecord = {
  id: number;
  publicacionId: number;
  rutaLocal: string;
  orden: number;
};

type PublicationDatabaseRow = Omit<PublicationListItem, "fotos">;

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
    const publications = getSqliteDb()
      .select({
        id: sqliteSchema.publicaciones.id,
        usuarioId: sqliteSchema.publicaciones.usuarioId,
        titulo: sqliteSchema.publicaciones.titulo,
        descripcion: sqliteSchema.publicaciones.descripcion,
        direccionTexto: sqliteSchema.publicaciones.direccionTexto,
        latitud: sqliteSchema.publicaciones.latitud,
        longitud: sqliteSchema.publicaciones.longitud,
        creadoEn: sqliteSchema.publicaciones.creadoEn,
      })
      .from(sqliteSchema.publicaciones)
      .orderBy(desc(sqliteSchema.publicaciones.creadoEn))
      .all();

    const photos = getSqliteDb()
      .select({
        id: sqliteSchema.fotosPublicacion.id,
        publicacionId: sqliteSchema.fotosPublicacion.publicacionId,
        rutaLocal: sqliteSchema.fotosPublicacion.rutaLocal,
        orden: sqliteSchema.fotosPublicacion.orden,
      })
      .from(sqliteSchema.fotosPublicacion)
      .orderBy(asc(sqliteSchema.fotosPublicacion.publicacionId), asc(sqliteSchema.fotosPublicacion.orden))
      .all();

    return attachPublicationPhotos(publications, photos);
  }

  const [publications, photos] = await Promise.all([
    getPgDb()
      .select({
        id: pgSchema.publicaciones.id,
        usuarioId: pgSchema.publicaciones.usuarioId,
        titulo: pgSchema.publicaciones.titulo,
        descripcion: pgSchema.publicaciones.descripcion,
        direccionTexto: pgSchema.publicaciones.direccionTexto,
        latitud: pgSchema.publicaciones.latitud,
        longitud: pgSchema.publicaciones.longitud,
        creadoEn: pgSchema.publicaciones.creadoEn,
      })
      .from(pgSchema.publicaciones)
      .orderBy(desc(pgSchema.publicaciones.creadoEn)),
    getPgDb()
      .select({
        id: pgSchema.fotosPublicacion.id,
        publicacionId: pgSchema.fotosPublicacion.publicacionId,
        rutaLocal: pgSchema.fotosPublicacion.rutaLocal,
        orden: pgSchema.fotosPublicacion.orden,
      })
      .from(pgSchema.fotosPublicacion)
      .orderBy(asc(pgSchema.fotosPublicacion.publicacionId), asc(pgSchema.fotosPublicacion.orden)),
  ]);

  return attachPublicationPhotos(publications, photos);
}

export async function createPublication(input: PublicationCreateInput) {
  if (isDevelopmentDatabase()) {
    return getSqliteDb().transaction((db) => {
      const result = db
        .insert(sqliteSchema.publicaciones)
        .values({
          titulo: input.titulo,
          descripcion: input.descripcion,
          direccionTexto: input.direccionTexto,
          latitud: input.latitud,
          longitud: input.longitud,
          usuarioId: input.usuarioId,
        })
        .run();
      const publicationId = Number(result.lastInsertRowid);

      db.insert(sqliteSchema.fotosPublicacion)
        .values(input.fotos.map((rutaLocal, index) => ({
          publicacionId: publicationId,
          rutaLocal,
          orden: index + 1,
        })))
        .run();

      return { id: publicationId };
    });
  }

  return getPgDb().transaction(async (tx) => {
    const [publication] = await tx
      .insert(pgSchema.publicaciones)
      .values({
        titulo: input.titulo,
        descripcion: input.descripcion,
        direccionTexto: input.direccionTexto,
        latitud: input.latitud,
        longitud: input.longitud,
        usuarioId: input.usuarioId,
      })
      .returning({ id: pgSchema.publicaciones.id });

    await tx.insert(pgSchema.fotosPublicacion).values(
      input.fotos.map((rutaLocal, index) => ({
        publicacionId: publication.id,
        rutaLocal,
        orden: index + 1,
      })),
    );

    return publication;
  });
}

export async function findPublicationPhotoPaths(input: {
  id: number;
  usuarioId?: number;
}): Promise<PublicationPhotoRecord[] | null> {
  if (isDevelopmentDatabase()) {
    const filters = input.usuarioId
      ? and(
          eq(sqliteSchema.publicaciones.id, input.id),
          eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
        )
      : eq(sqliteSchema.publicaciones.id, input.id);
    const publication = getSqliteDb()
      .select({ id: sqliteSchema.publicaciones.id })
      .from(sqliteSchema.publicaciones)
      .where(filters)
      .get();

    if (!publication) {
      return null;
    }

    return getSqliteDb()
      .select({
        id: sqliteSchema.fotosPublicacion.id,
        publicacionId: sqliteSchema.fotosPublicacion.publicacionId,
        rutaLocal: sqliteSchema.fotosPublicacion.rutaLocal,
        orden: sqliteSchema.fotosPublicacion.orden,
      })
      .from(sqliteSchema.fotosPublicacion)
      .where(eq(sqliteSchema.fotosPublicacion.publicacionId, input.id))
      .orderBy(asc(sqliteSchema.fotosPublicacion.orden))
      .all();
  }

  const filters = input.usuarioId
    ? and(
        eq(pgSchema.publicaciones.id, input.id),
        eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
      )
    : eq(pgSchema.publicaciones.id, input.id);
  const [publication] = await getPgDb()
    .select({ id: pgSchema.publicaciones.id })
    .from(pgSchema.publicaciones)
    .where(filters)
    .limit(1);

  if (!publication) {
    return null;
  }

  return getPgDb()
    .select({
      id: pgSchema.fotosPublicacion.id,
      publicacionId: pgSchema.fotosPublicacion.publicacionId,
      rutaLocal: pgSchema.fotosPublicacion.rutaLocal,
      orden: pgSchema.fotosPublicacion.orden,
    })
    .from(pgSchema.fotosPublicacion)
    .where(eq(pgSchema.fotosPublicacion.publicacionId, input.id))
    .orderBy(asc(pgSchema.fotosPublicacion.orden));
}

export async function listPublicationPhotoPathsForUser(
  usuarioId: number,
): Promise<PublicationPhotoRecord[]> {
  if (isDevelopmentDatabase()) {
    return getSqliteDb()
      .select({
        id: sqliteSchema.fotosPublicacion.id,
        publicacionId: sqliteSchema.fotosPublicacion.publicacionId,
        rutaLocal: sqliteSchema.fotosPublicacion.rutaLocal,
        orden: sqliteSchema.fotosPublicacion.orden,
      })
      .from(sqliteSchema.fotosPublicacion)
      .innerJoin(
        sqliteSchema.publicaciones,
        eq(sqliteSchema.fotosPublicacion.publicacionId, sqliteSchema.publicaciones.id),
      )
      .where(eq(sqliteSchema.publicaciones.usuarioId, usuarioId))
      .orderBy(asc(sqliteSchema.fotosPublicacion.publicacionId), asc(sqliteSchema.fotosPublicacion.orden))
      .all();
  }

  return getPgDb()
    .select({
      id: pgSchema.fotosPublicacion.id,
      publicacionId: pgSchema.fotosPublicacion.publicacionId,
      rutaLocal: pgSchema.fotosPublicacion.rutaLocal,
      orden: pgSchema.fotosPublicacion.orden,
    })
    .from(pgSchema.fotosPublicacion)
    .innerJoin(
      pgSchema.publicaciones,
      eq(pgSchema.fotosPublicacion.publicacionId, pgSchema.publicaciones.id),
    )
    .where(eq(pgSchema.publicaciones.usuarioId, usuarioId))
    .orderBy(asc(pgSchema.fotosPublicacion.publicacionId), asc(pgSchema.fotosPublicacion.orden));
}

export async function findPublicationPhoto(input: {
  id: number;
  orden: number;
}): Promise<PublicationPhotoRecord | null> {
  if (isDevelopmentDatabase()) {
    const photo = getSqliteDb()
      .select({
        id: sqliteSchema.fotosPublicacion.id,
        publicacionId: sqliteSchema.fotosPublicacion.publicacionId,
        rutaLocal: sqliteSchema.fotosPublicacion.rutaLocal,
        orden: sqliteSchema.fotosPublicacion.orden,
      })
      .from(sqliteSchema.fotosPublicacion)
      .where(
        and(
          eq(sqliteSchema.fotosPublicacion.publicacionId, input.id),
          eq(sqliteSchema.fotosPublicacion.orden, input.orden),
        ),
      )
      .get();

    return photo ?? null;
  }

  const [photo] = await getPgDb()
    .select({
      id: pgSchema.fotosPublicacion.id,
      publicacionId: pgSchema.fotosPublicacion.publicacionId,
      rutaLocal: pgSchema.fotosPublicacion.rutaLocal,
      orden: pgSchema.fotosPublicacion.orden,
    })
    .from(pgSchema.fotosPublicacion)
    .where(
      and(
        eq(pgSchema.fotosPublicacion.publicacionId, input.id),
        eq(pgSchema.fotosPublicacion.orden, input.orden),
      ),
    )
    .limit(1);

  return photo ?? null;
}

export async function deletePublicationPhoto(input: {
  id: number;
  orden: number;
  usuarioId: number;
}): Promise<{ path: string; publicationDeleted: boolean } | null> {
  if (isDevelopmentDatabase()) {
    return getSqliteDb().transaction((db) => {
      const photo = db
        .select({
          id: sqliteSchema.fotosPublicacion.id,
          rutaLocal: sqliteSchema.fotosPublicacion.rutaLocal,
        })
        .from(sqliteSchema.fotosPublicacion)
        .innerJoin(
          sqliteSchema.publicaciones,
          eq(sqliteSchema.fotosPublicacion.publicacionId, sqliteSchema.publicaciones.id),
        )
        .where(
          and(
            eq(sqliteSchema.fotosPublicacion.publicacionId, input.id),
            eq(sqliteSchema.fotosPublicacion.orden, input.orden),
            eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
          ),
        )
        .get();

      if (!photo) {
        return null;
      }

      const photoCount = db
        .select({ value: count() })
        .from(sqliteSchema.fotosPublicacion)
        .where(eq(sqliteSchema.fotosPublicacion.publicacionId, input.id))
        .get();
      const publicationDeleted = Number(photoCount?.value ?? 0) <= 1;

      if (publicationDeleted) {
        db.delete(sqliteSchema.publicaciones)
          .where(
            and(
              eq(sqliteSchema.publicaciones.id, input.id),
              eq(sqliteSchema.publicaciones.usuarioId, input.usuarioId),
            ),
          )
          .run();
      } else {
        db.delete(sqliteSchema.fotosPublicacion)
          .where(eq(sqliteSchema.fotosPublicacion.id, photo.id))
          .run();
      }

      return { path: photo.rutaLocal, publicationDeleted };
    });
  }

  return getPgDb().transaction(async (tx) => {
    const [photo] = await tx
      .select({
        id: pgSchema.fotosPublicacion.id,
        rutaLocal: pgSchema.fotosPublicacion.rutaLocal,
      })
      .from(pgSchema.fotosPublicacion)
      .innerJoin(
        pgSchema.publicaciones,
        eq(pgSchema.fotosPublicacion.publicacionId, pgSchema.publicaciones.id),
      )
      .where(
        and(
          eq(pgSchema.fotosPublicacion.publicacionId, input.id),
          eq(pgSchema.fotosPublicacion.orden, input.orden),
          eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
        ),
      )
      .limit(1);

    if (!photo) {
      return null;
    }

    const [photoCount] = await tx
      .select({ value: count() })
      .from(pgSchema.fotosPublicacion)
      .where(eq(pgSchema.fotosPublicacion.publicacionId, input.id));
    const publicationDeleted = Number(photoCount?.value ?? 0) <= 1;

    if (publicationDeleted) {
      await tx
        .delete(pgSchema.publicaciones)
        .where(
          and(
            eq(pgSchema.publicaciones.id, input.id),
            eq(pgSchema.publicaciones.usuarioId, input.usuarioId),
          ),
        );
    } else {
      await tx.delete(pgSchema.fotosPublicacion).where(eq(pgSchema.fotosPublicacion.id, photo.id));
    }

    return { path: photo.rutaLocal, publicationDeleted };
  });
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

function attachPublicationPhotos(
  publications: PublicationDatabaseRow[],
  photos: PublicationPhotoRecord[],
): PublicationListItem[] {
  const photosByPublication = new Map<number, PublicationPhotoRecord[]>();

  for (const photo of photos) {
    const publicationPhotos = photosByPublication.get(photo.publicacionId) ?? [];
    publicationPhotos.push(photo);
    photosByPublication.set(photo.publicacionId, publicationPhotos);
  }

  return publications.map((publication) => ({
    ...publication,
    fotos: photosByPublication.get(publication.id) ?? [],
  }));
}

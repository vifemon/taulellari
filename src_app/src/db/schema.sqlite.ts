import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  apellidos: text("apellidos").notNull(),
  passwordHash: text("password_hash").notNull(),
  creadoEn: text("creado_en").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publicaciones = sqliteTable("publicaciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  direccionTexto: text("direccion_texto").notNull(),
  latitud: real("latitud").notNull(),
  longitud: real("longitud").notNull(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadoEn: text("creado_en").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const fotosPublicacion = sqliteTable("fotos_publicacion", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicacionId: integer("publicacion_id")
    .notNull()
    .references(() => publicaciones.id, { onDelete: "cascade" }),
  rutaLocal: text("ruta_local").notNull(),
  orden: integer("orden").notNull(),
  creadoEn: text("creado_en").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  publicaciones: many(publicaciones),
}));

export const publicacionesRelations = relations(publicaciones, ({ one, many }) => ({
  usuario: one(usuarios, {
    fields: [publicaciones.usuarioId],
    references: [usuarios.id],
  }),
  fotos: many(fotosPublicacion),
}));

export const fotosPublicacionRelations = relations(fotosPublicacion, ({ one }) => ({
  publicacion: one(publicaciones, {
    fields: [fotosPublicacion.publicacionId],
    references: [publicaciones.id],
  }),
}));

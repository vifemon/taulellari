import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  creadoEn: text("creado_en").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const publicaciones = sqliteTable("publicaciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  rutaLocalFoto1: text("ruta_local_foto_1").notNull(),
  rutaLocalFoto2: text("ruta_local_foto_2"),
  rutaLocalFoto3: text("ruta_local_foto_3"),
  direccionTexto: text("direccion_texto").notNull(),
  latitud: real("latitud").notNull(),
  longitud: real("longitud").notNull(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadoEn: text("creado_en").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  publicaciones: many(publicaciones),
}));

export const publicacionesRelations = relations(publicaciones, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [publicaciones.usuarioId],
    references: [usuarios.id],
  }),
}));

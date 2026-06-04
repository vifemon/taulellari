import { relations } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export const publicaciones = pgTable("publicaciones", {
  id: serial("id").primaryKey(),
  rutaLocalFoto1: text("ruta_local_foto_1").notNull(),
  rutaLocalFoto2: text("ruta_local_foto_2"),
  latitud: doublePrecision("latitud").notNull(),
  longitud: doublePrecision("longitud").notNull(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
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

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Publicacion = typeof publicaciones.$inferSelect;
export type NuevaPublicacion = typeof publicaciones.$inferInsert;

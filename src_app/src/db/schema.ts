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
  nombre: text("nombre").notNull(),
  apellidos: text("apellidos").notNull(),
  passwordHash: text("password_hash").notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export const publicaciones = pgTable("publicaciones", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  direccionTexto: text("direccion_texto").notNull(),
  latitud: doublePrecision("latitud").notNull(),
  longitud: doublePrecision("longitud").notNull(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export const fotosPublicacion = pgTable("fotos_publicacion", {
  id: serial("id").primaryKey(),
  publicacionId: integer("publicacion_id")
    .notNull()
    .references(() => publicaciones.id, { onDelete: "cascade" }),
  rutaLocal: text("ruta_local").notNull(),
  orden: integer("orden").notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
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

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type Publicacion = typeof publicaciones.$inferSelect;
export type NuevaPublicacion = typeof publicaciones.$inferInsert;
export type FotoPublicacion = typeof fotosPublicacion.$inferSelect;
export type NuevaFotoPublicacion = typeof fotosPublicacion.$inferInsert;

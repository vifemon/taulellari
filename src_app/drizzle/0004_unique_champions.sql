CREATE TABLE "fotos_publicacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"publicacion_id" integer NOT NULL,
	"ruta_local" text NOT NULL,
	"orden" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fotos_publicacion" ADD CONSTRAINT "fotos_publicacion_publicacion_id_publicaciones_id_fk" FOREIGN KEY ("publicacion_id") REFERENCES "public"."publicaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "fotos_publicacion" ("publicacion_id", "ruta_local", "orden")
SELECT "id", "ruta_local_foto_1", 1
FROM "publicaciones"
WHERE "ruta_local_foto_1" IS NOT NULL
UNION ALL
SELECT "id", "ruta_local_foto_2", 2
FROM "publicaciones"
WHERE "ruta_local_foto_2" IS NOT NULL
UNION ALL
SELECT "id", "ruta_local_foto_3", 3
FROM "publicaciones"
WHERE "ruta_local_foto_3" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "publicaciones" DROP COLUMN "ruta_local_foto_1";--> statement-breakpoint
ALTER TABLE "publicaciones" DROP COLUMN "ruta_local_foto_2";--> statement-breakpoint
ALTER TABLE "publicaciones" DROP COLUMN "ruta_local_foto_3";

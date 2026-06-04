CREATE TABLE "publicaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"ruta_local_foto_1" text NOT NULL,
	"ruta_local_foto_2" text,
	"latitud" double precision NOT NULL,
	"longitud" double precision NOT NULL,
	"usuario_id" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
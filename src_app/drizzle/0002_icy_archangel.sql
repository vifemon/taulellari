ALTER TABLE "usuarios" ADD COLUMN "nombre" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "apellidos" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "password_hash" text DEFAULT '' NOT NULL;

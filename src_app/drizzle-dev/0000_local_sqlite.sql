PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publicaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  titulo TEXT NOT NULL,
  ruta_local_foto_1 TEXT NOT NULL,
  ruta_local_foto_2 TEXT,
  ruta_local_foto_3 TEXT,
  direccion_texto TEXT NOT NULL,
  latitud REAL NOT NULL,
  longitud REAL NOT NULL,
  usuario_id INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS publicaciones_usuario_id_creado_en_idx
  ON publicaciones(usuario_id, creado_en);

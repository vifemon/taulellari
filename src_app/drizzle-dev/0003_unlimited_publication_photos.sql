CREATE TABLE fotos_publicacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  publicacion_id INTEGER NOT NULL,
  ruta_local TEXT NOT NULL,
  orden INTEGER NOT NULL,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE
);

INSERT INTO fotos_publicacion (publicacion_id, ruta_local, orden)
SELECT id, ruta_local_foto_1, 1
FROM publicaciones
WHERE ruta_local_foto_1 IS NOT NULL
UNION ALL
SELECT id, ruta_local_foto_2, 2
FROM publicaciones
WHERE ruta_local_foto_2 IS NOT NULL
UNION ALL
SELECT id, ruta_local_foto_3, 3
FROM publicaciones
WHERE ruta_local_foto_3 IS NOT NULL;

ALTER TABLE publicaciones DROP COLUMN ruta_local_foto_1;
ALTER TABLE publicaciones DROP COLUMN ruta_local_foto_2;
ALTER TABLE publicaciones DROP COLUMN ruta_local_foto_3;

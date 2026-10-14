# Despliegue de Taulellari en Raspberry Pi

## Estado

Preparacion del primer despliegue con base PostgreSQL y fotos nuevas, sin importar
SQLite ni las imagenes de pruebas. El Dockerfile y el arranque con migraciones
estan implementados. Pendiente: construir y probar la imagen en ARM64, ejecutar
las migraciones contra PostgreSQL real, preparar Compose para Portainer y HTTPS.

## Servidor comprobado

- Raspberry Pi con 16 GB de RAM, Debian 13 y arquitectura `aarch64` (`linux/arm64`).
- IP LAN: `192.168.1.10`; acceso remoto mediante WireGuard existente.
- Docker Compose v2.40.3.
- El NVMe `/dev/nvme0n1p2` esta montado en `/`; `/srv/taulellari` reside en el NVMe.
- Carpetas preparadas: `photos`, `postgres` y `backups` bajo `/srv/taulellari`.
- Se comprobaron libres `3001/TCP` y `443/TCP`. El puerto publicado definitivo
  depende del proxy HTTPS; volver a comprobarlo antes de desplegar.
- No se requieren nuevos puertos abiertos en el router. PostgreSQL no publicara
  su puerto al host. El stack tendra su propia red Docker.

## Construccion de la imagen

El contexto de construccion es **`src_app/`**, no la raiz del repositorio.
Desde la raiz, en una maquina con Docker y soporte para la arquitectura destino:

```bash
docker build --platform linux/arm64 -t taulellari:local ./src_app
```

En la Raspberry la construccion sera ARM64 nativa. El Dockerfile usa Node 22 sobre
Debian Bookworm slim e instala las dependencias con `npm ci`; incluye compiladores
solo en las etapas de construccion para los modulos nativos que los necesiten.
El build requiere acceso a npm y a Google Fonts usados por `next/font`.

La secuencia es:

1. Instalar dependencias y compilar Next.js con `npm run build`.
2. Crear la imagen final con la salida standalone, `public`, recursos estaticos,
   migraciones y sus dependencias de ejecucion (`pg` y `drizzle-orm`).
3. Al arrancar el contenedor, comprobar configuracion y carpeta de fotos.
4. Conectar a PostgreSQL y aplicar migraciones pendientes.
5. Solo tras completar las migraciones, ejecutar `node server.js`.

**El build no ejecuta migraciones ni necesita credenciales de produccion.**
`.dockerignore` excluye `.env*`, bases SQLite, fotos de pruebas, `node_modules` y
salidas de build locales. Las dependencias nativas se instalan para la arquitectura
de la imagen; no se copian las de Windows.

La etiqueta `local` sirve para la primera prueba. Antes de desplegar una entrega
se fijara una etiqueta de version/commit. Una imagen construida en otro ordenador
debera transferirse o publicarse en un registro accesible desde la Raspberry.
El editor de Compose de Portainer necesitara esa imagen disponible.

## Variables de ejecucion

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL con usuario, contrasena, nombre del servicio Docker y base de datos. No usar `localhost` para otro contenedor. |
| `AUTH_SECRET` | Secreto aleatorio persistente para firmar las sesiones. |
| `MAPBOX_ACCESS_TOKEN` | Geocodificacion desde el servidor. |
| `CARTO_API_KEY` | Mapas vectoriales; esta clave se entrega al navegador. |
| `PHOTO_STORAGE_DIR` | Ruta absoluta **dentro del contenedor**, propuesta: `/data/taulellari/photos`. |

Estas cinco variables son obligatorias en el entrypoint. Se suministraran en
Portainer, nunca en el Dockerfile ni en archivos versionados con valores reales.
`NODE_ENV=production`, `HOSTNAME=0.0.0.0` y `PORT=3000` vienen definidos en la imagen.
`EXPOSE 3000` describe el puerto interno: no publica el puerto 3000 del host, que
ya usa Open WebUI. `SQLITE_DATABASE_URL` no se usa en produccion.

## Persistencia y permisos

El futuro Compose montara `/srv/taulellari/photos` del host sobre
`/data/taulellari/photos` del contenedor y configurara `PHOTO_STORAGE_DIR` con esa
ruta interna. La base de datos guarda rutas absolutas de fotos: conservar esta
ruta interna entre actualizaciones y restauraciones.

La imagen ejecuta la app como usuario `node`, UID/GID **1000:1000**. Antes del
primer arranque, la carpeta `photos` debe permitir lectura, escritura y acceso a
ese usuario. Para la carpeta nueva creada durante la preparacion:

```bash
sudo chown 1000:1000 /srv/taulellari/photos
sudo chmod 0750 /srv/taulellari/photos
```

No aplicar esos propietarios a `postgres`: sus permisos se definiran al elegir
la imagen PostgreSQL. El entrypoint no cambia permisos ni crea carpetas del host.
Comprueba que `PHOTO_STORAGE_DIR` existe y es accesible; el bind mount debe quedar
declarado y comprobado en Compose. No copiar datos de `dev.db` ni de `uploads/`.

## Migraciones PostgreSQL

- Esquema: `src_app/src/db/schema.ts`.
- Historial versionado: `src_app/drizzle/0000_*.sql` a `0004_*.sql` y `meta/`.
- `npm run db:generate` no detecta cambios pendientes respecto al snapshot actual.
- No se regeneran ni borran migraciones historicas al arrancar.
- `scripts/migrate-postgres.mjs` usa el migrador de Drizzle directamente; no
  necesita `drizzle-kit` en la imagen de produccion.
- Drizzle registra las migraciones aplicadas en `drizzle.__drizzle_migrations`.
  Reiniciar no recrea tablas ni borra datos: solo aplica las pendientes.
- El script reintenta errores transitorios de conexion hasta 12 veces, con
  timeout de conexion de 5 segundos y pausas de 2 segundos. Credenciales invalidas
  y errores SQL hacen fallar el arranque.
- Un bloqueo advisory de PostgreSQL serializa las migraciones si se solapan dos
  contenedores durante una actualizacion; el timeout de espera del bloqueo es 60 s.
- Las conexiones se cierran incluso si falla una migracion. Los logs muestran el
  codigo de error sin imprimir credenciales ni consultas SQL.
- `entrypoint.sh` termina con error si falla la migracion y usa `exec` para iniciar
  Next.js, de modo que el servidor recibe las senales de parada de Docker.

Para cambios futuros, generar y revisar SQL **antes del build**. Nunca usar
`db:push` como procedimiento de despliegue. En una actualizacion con datos reales,
respaldar PostgreSQL y las fotos antes de aplicar cambios; el arranque automatico
no sustituye un procedimiento de backup ni implementa un rollback automatico.

## Verificacion antes del primer despliegue

Validacion local: lint, tests y build de Next.js; pruebas del migrador con dobles
de PostgreSQL para conexion tardia, credenciales invalidas, error SQL y agotamiento
de reintentos. Estas pruebas no ejecutan el SQL sobre un servidor PostgreSQL real.

Pendiente de comprobar en Docker:

1. Construir la imagen ARM64 sin archivos `.env` ni datos de pruebas.
2. Arrancar PostgreSQL vacio y saludable, despues la app con sus variables y mount.
3. Verificar las tres tablas y las cinco migraciones registradas.
4. Reiniciar y comprobar que no se vuelven a aplicar ni se duplican datos.
5. Verificar que un fallo de migracion impide iniciar la web.
6. Con HTTPS configurado, registrar un usuario y subir/leer una imagen; recrear
   los contenedores y comprobar que usuario e imagen siguen disponibles.

## Siguiente paso: Compose y HTTPS

Preparar un stack aislado en Portainer con PostgreSQL y la imagen de la app,
healthcheck de PostgreSQL, bind mounts y politica de reinicio. Resolver el proxy
HTTPS y el certificado antes de usar el login: las cookies de produccion son
`Secure`, incluso cuando se accede mediante WireGuard.

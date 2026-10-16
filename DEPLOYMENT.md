# Taulellari: despliegue local/VPN con Portainer

## Arquitectura

Acceso directo a **http://192.168.1.10:3001** desde la LAN o WireGuard.
`docker-compose.yml`, en la raiz, contiene exactamente dos servicios:

| Servicio | Imagen | Puerto publicado | Persistencia en el NVMe |
| --- | --- | --- | --- |
| `db` | `postgres:16-bookworm` | Ninguno | `/srv/taulellari/postgres_data` |
| `app` | Imagen local indicada en `TAULELLARI_IMAGE` | `3001:3000` | `/srv/taulellari/photos` |

El stack no utiliza proxy, certificados ni DuckDNS. La VPN existente sigue
funcionando con su configuracion actual. No se necesita un registro DNS para
Taulellari ni abrir puertos nuevos en el router.

La Raspberry usa Debian 13, ARM64 (`aarch64`), 16 GB de RAM y Compose v2.40.3.
El NVMe `/dev/nvme0n1p2` esta montado en `/`, por lo que `/srv/taulellari` reside
en el NVMe. Se comprobo libre 3001/TCP; volver a comprobarlo antes de desplegar.

Las redes Docker pertenecen al stack: `database` es interna, compartida por
`db` y `app`; `web` permite a la app recibir conexiones y consultar Mapbox/CARTO.
No se usan redes externas ni se modifican contenedores existentes.

## 1. Crear las dos carpetas de datos

Para esta primera instalacion, con PostgreSQL vacio y fotos nuevas:

```bash
sudo ls -ld /srv
sudo install -d -m 0755 /srv/taulellari
sudo install -d -o 1000 -g 1000 -m 0750 /srv/taulellari/photos
sudo install -d -o root -g root -m 0700 /srv/taulellari/postgres_data
sudo ls -ld /srv/taulellari/photos /srv/taulellari/postgres_data
findmnt -T /srv/taulellari/photos
```

La app corre como `node` (UID/GID 1000:1000). La imagen oficial PostgreSQL
inicializa su directorio y ajusta el propietario de sus datos al arrancar;
no forzar UID 1000 para PostgreSQL. Los comandos anteriores de propietarios
son para la primera instalacion, no para ejecutarlos sobre una BD en uso.

El bind de fotos va a `/data/taulellari/photos`; la BD guarda las rutas absolutas
internas, asi que conservar ese destino entre actualizaciones. PostgreSQL usa
`/var/lib/postgresql/data/pgdata`, dentro del bind de `postgres_data`.
Los mounts tienen `create_host_path: false` y deben existir antes de arrancar.

Las carpetas propuestas anteriormente (`postgres`, `traefik`, `certificates`,
`backups`) no se usan en este Compose. No se eliminan automaticamente. No importar
`dev.db`, `uploads/` ni datos de otro PostgreSQL: este primer despliegue comienza
con los dos directorios de datos nuevos/vacios.

## 2. Descargar el codigo y construir en la Raspberry

Comprobar Git y que la ruta elegida para el repositorio no exista ya:

```bash
git --version
ls -ld "$HOME/taulellari"
```

Si la segunda orden indica que no existe, descargar:

```bash
git clone --branch develop https://github.com/vifemon/taulellari.git "$HOME/taulellari"
cd "$HOME/taulellari"
docker build --platform linux/arm64 -t taulellari:local ./src_app
```

Si ya hay un checkout, revisar su rama y cambios locales antes de actualizarlo.
No sobrescribirlo. La imagen debe construirse en el mismo Docker host gestionado
por Portainer. La etiqueta `taulellari:local` sirve para esta primera instalacion;
registrar el commit construido con `git rev-parse HEAD`.

El contexto del build es **`src_app/`**. El Dockerfile usa Node 22 Bookworm slim,
`npm ci` y salida standalone de Next.js. Se instalan herramientas de compilacion
solo en las etapas de build para los modulos nativos. El build necesita acceso
a npm y Google Fonts; no necesita credenciales ni conecta a la BD de produccion.

`.dockerignore` excluye `.env*`, SQLite, imagenes de pruebas, `node_modules` y
builds locales. Las dependencias nativas se construyen para ARM64, no se copian
las de Windows. La imagen final incluye las migraciones y sus dependencias.

## 3. Variables en Portainer

Crear un stack **Docker standalone**, no Swarm, llamado `taulellari`. Pegar el
contenido de `docker-compose.yml` en el editor y rellenar las variables de
`deploy/portainer.env.example`:

| Variable | Valor |
| --- | --- |
| `TAULELLARI_IMAGE` | `taulellari:local`, la imagen construida en la Raspberry. |
| `POSTGRES_PASSWORD` | Generar con `openssl rand -hex 32`. |
| `AUTH_SECRET` | Ejecutar de nuevo `openssl rand -hex 32` para un valor distinto. |
| `MAPBOX_ACCESS_TOKEN` | Token para autocompletar direcciones. |
| `CARTO_API_KEY` | Clave para los mapas vectoriales, entregada al navegador. |

Guardar los valores directamente en Portainer y en un gestor de contrasenas;
no pegarlos en el chat ni versionar un archivo con credenciales reales.
El Compose construye `DATABASE_URL` con el servicio `db`, usuario/base `taulellari`
y la misma `POSTGRES_PASSWORD`. Usar hexadecimal evita caracteres reservados en
la URL. No es necesario introducir `DATABASE_URL` por separado.

La configuracion de la app incluye:

```text
NODE_ENV=production                 (definido en la imagen)
PHOTO_STORAGE_DIR=/data/taulellari/photos
SESSION_COOKIE_SECURE=false
```

`SESSION_COOKIE_SECURE=false` permite la cookie de sesion sobre HTTP, incluso
en un build de produccion. Se conservan `HttpOnly`, `SameSite=Lax`, firma HMAC,
duracion y validacion de la sesion. Login y registro usan la misma funcion de
opciones. Las cookies de preferencias ya siguen el protocolo del navegador.

Fuera de este Compose, si se omite `SESSION_COOKIE_SECURE`, el valor predeterminado
es `true` en produccion y `false` en desarrollo. Tambien admite `true` explicito;
cualquier otro valor se rechaza. No cambiar `NODE_ENV` a development para habilitar
HTTP: eso seleccionaria SQLite en vez de PostgreSQL.

No activar en Portainer opciones que fuercen descargar la imagen local de la app;
el Compose utiliza `pull_policy: never` para ella. PostgreSQL si se descarga del
registro. `SQLITE_DATABASE_URL`, `DUCKDNS_TOKEN` y `ACME_EMAIL` no son necesarios.

## 4. Arranque y migraciones

1. PostgreSQL 16 inicializa la base vacia en el NVMe.
2. Su healthcheck debe estar correcto antes de iniciar la app.
3. `scripts/entrypoint.sh` valida las variables y acceso a la carpeta de fotos.
4. `scripts/migrate-postgres.mjs` aplica las migraciones pendientes de `drizzle/`.
5. Solo si terminan correctamente arranca Next.js en el puerto interno 3000.

Las cinco migraciones existentes concuerdan con el snapshot actual segun
`npm run db:generate`. No se generan nuevas migraciones durante el arranque.
Drizzle registra las aplicadas en `drizzle.__drizzle_migrations`: reiniciar no
borra datos ni recrea tablas. El runner usa `pg` y `drizzle-orm`, sin necesitar
`drizzle-kit` en la imagen final.

El script reintenta conexiones transitorias hasta 12 veces, con timeout de 5 s
y pausas de 2 s. Un advisory lock serializa migraciones concurrentes (espera
maxima del bloqueo: 60 s). Credenciales invalidas o errores SQL abortan el arranque.
Las conexiones se cierran incluso al fallar y no se imprimen secretos ni SQL.
`exec` entrega las senales de parada al servidor Next.js.

## 5. Validacion en Portainer y navegador

1. Desplegar y comprobar que `db` y `app` aparecen saludables.
2. Revisar los logs de la app: deben indicar que las migraciones terminaron.
3. Entrar en **http://192.168.1.10:3001**, registrar el primer usuario y recargar:
   la sesion debe mantenerse. Comprobar tambien salir y volver a entrar.
4. Subir una foto y verla; comprobar que existe en `/srv/taulellari/photos`.
5. Repetir desde el movil con datos moviles y WireGuard activo.
6. Recrear los contenedores conservando los mounts y verificar usuario y fotos.

El healthcheck de la app consulta `/api/publicaciones`, comprobando tambien la BD.
`unless-stopped` reinicia procesos que terminan; estar `unhealthy` por si solo no
produce un reinicio automatico. Los logs tienen rotacion configurada.

Antes de nuevas entregas, respaldar BD y fotos de forma coordinada. No usar
`db:push` como despliegue ni borrar los mounts. Cambiar `POSTGRES_PASSWORD` en
Portainer despues de inicializar la BD no cambia la contrasena almacenada en
PostgreSQL: el cambio debe hacerse coordinadamente. Cambiar `AUTH_SECRET` invalida
las sesiones existentes.

## Estado de validacion

Lint, pruebas de cookies/migrador y build se validan localmente. El entorno Windows
no tiene Docker: falta construir la imagen en la Raspberry y ejecutar realmente
las migraciones y las pruebas de persistencia/login sobre PostgreSQL 16.
La sintaxis YAML puede comprobarse localmente; la validacion de Compose sera con
`docker compose config --quiet`, suministrando sus variables sin imprimir secretos.

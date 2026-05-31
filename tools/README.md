# Harness Tools

Registro de herramientas base disponibles para automatizacion del proyecto.

## Entorno

- Directorio raiz del Harness: carpeta del proyecto.
- Directorio de app por defecto: `src_app/`.
- Para apuntar a otra app, usar `APP_DIR=/ruta/a/app` antes del comando.
- Los scripts `.sh` se ejecutan con `sh` desde la raiz del proyecto.
- En Windows, usar Git Bash o invocar `C:\Program Files\Git\bin\sh.exe` si `sh` no esta en el PATH.

## Herramientas

### `git_tool.sh`

Gestion Git para el ciclo de trabajo del Harness.

Comandos principales:

- `sh tools/git_tool.sh init`: inicializa el repositorio si todavia no existe.
- `sh tools/git_tool.sh branch <nombre>`: crea o cambia de rama.
- `sh tools/git_tool.sh commit-passed "mensaje"`: ejecuta checks, prepara cambios y crea commit solo si pasan.
- `sh tools/git_tool.sh set-remote <github-url>`: configura `origin` para GitHub.
- `sh tools/git_tool.sh push`: publica la rama actual en GitHub.

### `db_tool.sh`

Gestion base para migraciones y estado local de base de datos. Detecta Prisma o Drizzle cuando existan sus archivos de configuracion.

Comandos principales:

- `sh tools/db_tool.sh status`: muestra herramienta detectada y estado de migraciones.
- `sh tools/db_tool.sh migrate`: ejecuta migraciones.
- `sh tools/db_tool.sh generate`: genera cliente o migraciones segun el stack.
- `sh tools/db_tool.sh push`: sincroniza esquema cuando el stack lo soporte.
- `sh tools/db_tool.sh tables`: inspecciona tablas locales usando `DATABASE_URL`.
- `sh tools/db_tool.sh studio`: abre Prisma Studio o Drizzle Studio.

### `test_runner.sh`

Ejecucion de calidad para tests y lint.

Comandos principales:

- `sh tools/test_runner.sh once`: ejecuta `npm run test` y `npm run lint` una vez.
- `sh tools/test_runner.sh test`: ejecuta solo tests.
- `sh tools/test_runner.sh lint`: ejecuta solo lint.
- `sh tools/test_runner.sh loop 10`: ejecuta tests y lint en bucle cada 10 segundos hasta que falle.
- `sh tools/test_runner.sh watch`: ejecuta Vitest en modo watch.

## Estado Actual

La app aun no tiene `package.json` dentro de `src_app/`. Las herramientas estan listas, pero los comandos de Node y base de datos devolveran un mensaje de preparacion pendiente hasta que se inicialice el proyecto Next.js y el stack Prisma o Drizzle.

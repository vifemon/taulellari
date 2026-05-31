# Herramientas Disponibles

Fecha de registro: 2026-05-31

## Directorio Base

- `tools/`: scripts operativos del Agent Harness.
- App por defecto: `src_app/`.
- Variable de entorno para cambiar app: `APP_DIR`.

## Inventario

- `tools/git_tool.sh`: inicializa Git, gestiona ramas, configura remoto GitHub, ejecuta commits tras checks correctos y publica ramas.
- `tools/db_tool.sh`: prepara ejecucion de migraciones y revision local de tablas para Prisma o Drizzle.
- `tools/test_runner.sh`: ejecuta `npm run test` y `npm run lint` bajo demanda, en watch o en bucle.

## Uso Rapido

- `sh tools/git_tool.sh init`
- `sh tools/git_tool.sh branch <nombre>`
- `sh tools/git_tool.sh commit-passed "mensaje descriptivo"`
- `sh tools/git_tool.sh push`
- `sh tools/db_tool.sh status`
- `sh tools/db_tool.sh migrate`
- `sh tools/db_tool.sh tables`
- `sh tools/test_runner.sh once`
- `sh tools/test_runner.sh loop 10`

## Notas Operativas

- Los scripts estan preparados para trabajar desde la raiz del proyecto.
- En este entorno Windows, `sh` no esta en el PATH; los scripts se validaron con `C:\Program Files\Git\bin\sh.exe`.
- `test_runner.sh` requiere un `package.json` en `src_app/` con scripts `test` y `lint`.
- `db_tool.sh` detecta Prisma con `prisma/schema.prisma` y Drizzle con `drizzle.config.*`.
- `git_tool.sh commit-passed` usa `tools/test_runner.sh once` antes de crear commits.

#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
APP_DIR=${APP_DIR:-"$PROJECT_ROOT/src_app"}

usage() {
  cat <<'EOF'
Usage: sh tools/db_tool.sh <command> [args]

Commands:
  status              Show detected database tooling and migration status.
  migrate [args]      Run Prisma or Drizzle migrations.
  generate [args]     Generate Prisma client or Drizzle migrations.
  push [args]         Push schema changes when supported by the tool.
  tables              Inspect local development tables when DATABASE_URL is available.
  studio [args]       Open Prisma Studio or Drizzle Studio.
  help                Show this help.

Environment:
  APP_DIR             App directory. Defaults to ./src_app.
  DATABASE_URL        Used by tables inspection. If missing, .env is checked.

Examples:
  sh tools/db_tool.sh status
  sh tools/db_tool.sh migrate
  APP_DIR=./src_app sh tools/db_tool.sh tables
EOF
}

require_app_dir() {
  if [ ! -d "$APP_DIR" ]; then
    echo "App directory not found: $APP_DIR" >&2
    exit 1
  fi
}

require_package() {
  require_app_dir
  if [ ! -f "$APP_DIR/package.json" ]; then
    echo "No package.json found in $APP_DIR." >&2
    echo "Initialize the Next.js app there before running database commands." >&2
    exit 1
  fi
}

require_npx() {
  if ! command -v npx >/dev/null 2>&1; then
    echo "npx is required but was not found in PATH." >&2
    exit 1
  fi
}

has_prisma() {
  [ -f "$APP_DIR/prisma/schema.prisma" ] || [ -f "$APP_DIR/schema.prisma" ]
}

has_drizzle() {
  [ -f "$APP_DIR/drizzle.config.ts" ] || \
  [ -f "$APP_DIR/drizzle.config.js" ] || \
  [ -f "$APP_DIR/drizzle.config.mjs" ] || \
  [ -f "$APP_DIR/drizzle.config.cjs" ]
}

detect_tool() {
  if has_prisma; then
    echo "prisma"
  elif has_drizzle; then
    echo "drizzle"
  else
    echo "none"
  fi
}

run_npx() {
  require_package
  require_npx
  (cd "$APP_DIR" && npx "$@")
}

cmd_status() {
  require_app_dir
  tool=$(detect_tool)

  echo "App directory: $APP_DIR"
  echo "Detected database tool: $tool"

  case "$tool" in
    prisma)
      run_npx prisma migrate status "$@"
      ;;
    drizzle)
      run_npx drizzle-kit check "$@"
      ;;
    none)
      echo "No Prisma or Drizzle config found yet."
      ;;
  esac
}

cmd_migrate() {
  tool=$(detect_tool)

  case "$tool" in
    prisma)
      run_npx prisma migrate dev "$@"
      ;;
    drizzle)
      run_npx drizzle-kit migrate "$@"
      ;;
    none)
      echo "No Prisma or Drizzle config found in $APP_DIR." >&2
      exit 1
      ;;
  esac
}

cmd_generate() {
  tool=$(detect_tool)

  case "$tool" in
    prisma)
      run_npx prisma generate "$@"
      ;;
    drizzle)
      run_npx drizzle-kit generate "$@"
      ;;
    none)
      echo "No Prisma or Drizzle config found in $APP_DIR." >&2
      exit 1
      ;;
  esac
}

cmd_push() {
  tool=$(detect_tool)

  case "$tool" in
    prisma)
      run_npx prisma db push "$@"
      ;;
    drizzle)
      run_npx drizzle-kit push "$@"
      ;;
    none)
      echo "No Prisma or Drizzle config found in $APP_DIR." >&2
      exit 1
      ;;
  esac
}

load_database_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    return 0
  fi

  env_file="$APP_DIR/.env"
  if [ ! -f "$env_file" ]; then
    return 1
  fi

  db_line=$(grep '^DATABASE_URL=' "$env_file" | tail -n 1 || true)
  if [ -z "$db_line" ]; then
    return 1
  fi

  DATABASE_URL=${db_line#DATABASE_URL=}
  case "$DATABASE_URL" in
    \"*\") DATABASE_URL=$(printf '%s' "$DATABASE_URL" | sed 's/^"//;s/"$//') ;;
    \'*\') DATABASE_URL=$(printf '%s' "$DATABASE_URL" | sed "s/^'//;s/'$//") ;;
  esac
  export DATABASE_URL
}

cmd_tables() {
  require_app_dir

  if ! load_database_url; then
    echo "DATABASE_URL is not set and was not found in $APP_DIR/.env." >&2
    exit 1
  fi

  case "$DATABASE_URL" in
    file:*)
      if ! command -v sqlite3 >/dev/null 2>&1; then
        echo "sqlite3 is required to inspect SQLite tables." >&2
        exit 1
      fi
      db_path=${DATABASE_URL#file:}
      if [ "$db_path" = ":memory:" ]; then
        echo "Cannot inspect in-memory SQLite database tables from this script." >&2
        exit 1
      fi
      case "$db_path" in
        /*) ;;
        [A-Za-z]:*) ;;
        *) db_path="$APP_DIR/$db_path" ;;
      esac
      sqlite3 "$db_path" ".tables"
      ;;
    postgres://*|postgresql://*)
      if ! command -v psql >/dev/null 2>&1; then
        echo "psql is required to inspect PostgreSQL tables." >&2
        exit 1
      fi
      psql "$DATABASE_URL" -c '\dt'
      ;;
    mysql://*|mariadb://*)
      echo "MySQL table inspection requires the mysql CLI with explicit connection flags." >&2
      echo "Use your local mysql client or add project-specific flags to tools/db_tool.sh." >&2
      exit 1
      ;;
    *)
      echo "Unsupported DATABASE_URL format for table inspection." >&2
      exit 1
      ;;
  esac
}

cmd_studio() {
  tool=$(detect_tool)

  case "$tool" in
    prisma)
      run_npx prisma studio "$@"
      ;;
    drizzle)
      run_npx drizzle-kit studio "$@"
      ;;
    none)
      echo "No Prisma or Drizzle config found in $APP_DIR." >&2
      exit 1
      ;;
  esac
}

command_name=${1:-help}
shift || true

case "$command_name" in
  status) cmd_status "$@" ;;
  migrate) cmd_migrate "$@" ;;
  generate) cmd_generate "$@" ;;
  push) cmd_push "$@" ;;
  tables) cmd_tables ;;
  studio) cmd_studio "$@" ;;
  help|-h|--help) usage ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage
    exit 1
    ;;
esac

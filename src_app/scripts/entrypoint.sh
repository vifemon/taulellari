#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${AUTH_SECRET:?AUTH_SECRET is required}"
: "${CARTO_API_KEY:?CARTO_API_KEY is required}"
: "${MAPBOX_ACCESS_TOKEN:?MAPBOX_ACCESS_TOKEN is required}"
: "${PHOTO_STORAGE_DIR:?PHOTO_STORAGE_DIR is required}"

case "$PHOTO_STORAGE_DIR" in
  /*) ;;
  *) printf '%s\n' 'PHOTO_STORAGE_DIR must be an absolute path' >&2; exit 1 ;;
esac

if [ ! -d "$PHOTO_STORAGE_DIR" ] || [ ! -r "$PHOTO_STORAGE_DIR" ] || [ ! -w "$PHOTO_STORAGE_DIR" ] || [ ! -x "$PHOTO_STORAGE_DIR" ]; then
  printf '%s\n' 'PHOTO_STORAGE_DIR must be a mounted, readable and writable directory' >&2
  exit 1
fi

node /app/scripts/migrate-postgres.mjs
exec "$@"

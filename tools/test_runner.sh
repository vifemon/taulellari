#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
APP_DIR=${APP_DIR:-"$PROJECT_ROOT/src_app"}
INTERVAL=${INTERVAL:-5}

usage() {
  cat <<'EOF'
Usage: sh tools/test_runner.sh <command> [args]

Commands:
  once              Run npm run test and npm run lint once.
  test [args]       Run npm run test, forwarding args after --.
  lint [args]       Run npm run lint, forwarding args after --.
  loop [seconds]    Run once repeatedly until a check fails.
  watch [args]      Run Vitest in watch mode through npm run test.
  help              Show this help.

Environment:
  APP_DIR           App directory. Defaults to ./src_app.
  INTERVAL          Default loop interval in seconds. Defaults to 5.

Examples:
  sh tools/test_runner.sh once
  sh tools/test_runner.sh test -- --run
  sh tools/test_runner.sh loop 10
EOF
}

require_app_package() {
  if [ ! -d "$APP_DIR" ]; then
    echo "App directory not found: $APP_DIR" >&2
    exit 1
  fi

  if [ ! -f "$APP_DIR/package.json" ]; then
    echo "No package.json found in $APP_DIR." >&2
    echo "Initialize the Next.js app there before running tests." >&2
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required but was not found in PATH." >&2
    exit 1
  fi
}

run_test() {
  require_app_package

  if [ "${1:-}" = "--" ]; then
    shift
  fi

  if [ $# -gt 0 ]; then
    (cd "$APP_DIR" && npm run test -- "$@")
  else
    (cd "$APP_DIR" && npm run test)
  fi
}

run_lint() {
  require_app_package

  if [ "${1:-}" = "--" ]; then
    shift
  fi

  if [ $# -gt 0 ]; then
    (cd "$APP_DIR" && npm run lint -- "$@")
  else
    (cd "$APP_DIR" && npm run lint)
  fi
}

run_once() {
  run_test
  run_lint
}

run_loop() {
  seconds=${1:-$INTERVAL}

  while :; do
    run_once
    echo "Checks passed. Running again in ${seconds}s. Press Ctrl+C to stop."
    sleep "$seconds"
  done
}

run_watch() {
  require_app_package

  if [ "${1:-}" = "--" ]; then
    shift
  fi

  (cd "$APP_DIR" && npm run test -- --watch "$@")
}

command_name=${1:-once}
shift || true

case "$command_name" in
  once) run_once ;;
  test) run_test "$@" ;;
  lint) run_lint "$@" ;;
  loop) run_loop "$@" ;;
  watch) run_watch "$@" ;;
  help|-h|--help) usage ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage
    exit 1
    ;;
esac

#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
TEST_RUNNER="$SCRIPT_DIR/test_runner.sh"

usage() {
  cat <<'EOF'
Usage: sh tools/git_tool.sh <command> [args]

Commands:
  init [default-branch]       Initialize the repository if needed.
  branch <name>               Create or switch to a branch.
  commit-passed [message]     Run checks, stage changes, and commit if checks pass.
  push [remote] [branch]      Push the current branch to a GitHub remote.
  set-remote <url> [name]     Add or update a remote. Defaults to origin.
  status                      Show git status.
  help                        Show this help.

Examples:
  sh tools/git_tool.sh init
  sh tools/git_tool.sh branch feature/login
  sh tools/git_tool.sh commit-passed "feat: add login form"
  sh tools/git_tool.sh set-remote git@github.com:owner/repo.git
  sh tools/git_tool.sh push
EOF
}

require_git() {
  if ! command -v git >/dev/null 2>&1; then
    echo "git is required but was not found in PATH." >&2
    exit 1
  fi
}

is_repo() {
  git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

ensure_repo() {
  default_branch=${1:-main}

  if is_repo; then
    return 0
  fi

  echo "Git repository not found. Initializing in $PROJECT_ROOT"
  if git -C "$PROJECT_ROOT" init -b "$default_branch" >/dev/null 2>&1; then
    echo "Initialized git repository on branch $default_branch."
  else
    git -C "$PROJECT_ROOT" init >/dev/null
    git -C "$PROJECT_ROOT" branch -M "$default_branch"
    echo "Initialized git repository on branch $default_branch."
  fi
}

current_branch() {
  git -C "$PROJECT_ROOT" symbolic-ref --quiet --short HEAD 2>/dev/null || echo "main"
}

cmd_init() {
  default_branch=${1:-main}

  if is_repo; then
    echo "Git repository already initialized in $PROJECT_ROOT."
    return 0
  fi

  ensure_repo "$default_branch"
}

cmd_branch() {
  if [ $# -lt 1 ]; then
    echo "Branch name is required." >&2
    usage
    exit 1
  fi

  branch_name=$1
  ensure_repo

  if git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/heads/$branch_name"; then
    git -C "$PROJECT_ROOT" checkout "$branch_name"
  else
    git -C "$PROJECT_ROOT" checkout -b "$branch_name"
  fi
}

cmd_commit_passed() {
  ensure_repo

  if [ ! -f "$TEST_RUNNER" ]; then
    echo "Test runner not found at $TEST_RUNNER." >&2
    exit 1
  fi

  sh "$TEST_RUNNER" once

  git -C "$PROJECT_ROOT" add -A

  if git -C "$PROJECT_ROOT" diff --cached --quiet; then
    echo "No changes to commit after checks passed."
    return 0
  fi

  message=${*:-}
  if [ -z "$message" ]; then
    branch=$(current_branch)
    message="chore: update $branch after passing checks"
  fi

  git -C "$PROJECT_ROOT" commit -m "$message"
}

cmd_push() {
  remote=${1:-origin}
  branch=${2:-$(current_branch)}

  ensure_repo

  if ! git -C "$PROJECT_ROOT" remote get-url "$remote" >/dev/null 2>&1; then
    echo "Remote '$remote' is not configured." >&2
    echo "Use: sh tools/git_tool.sh set-remote <github-url> [$remote]" >&2
    exit 1
  fi

  git -C "$PROJECT_ROOT" push -u "$remote" "$branch"
}

cmd_set_remote() {
  if [ $# -lt 1 ]; then
    echo "Remote URL is required." >&2
    usage
    exit 1
  fi

  url=$1
  remote=${2:-origin}

  ensure_repo
  if git -C "$PROJECT_ROOT" remote get-url "$remote" >/dev/null 2>&1; then
    git -C "$PROJECT_ROOT" remote set-url "$remote" "$url"
  else
    git -C "$PROJECT_ROOT" remote add "$remote" "$url"
  fi

  echo "Remote '$remote' configured as $url."
}

cmd_status() {
  ensure_repo
  git -C "$PROJECT_ROOT" status --short --branch
}

require_git

command_name=${1:-help}
shift || true

case "$command_name" in
  init) cmd_init "$@" ;;
  branch) cmd_branch "$@" ;;
  commit-passed) cmd_commit_passed "$@" ;;
  push) cmd_push "$@" ;;
  set-remote) cmd_set_remote "$@" ;;
  status) cmd_status ;;
  help|-h|--help) usage ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage
    exit 1
    ;;
esac

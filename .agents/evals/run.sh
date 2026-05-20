#!/usr/bin/env bash
set -euo pipefail
SKILL="${1:-}"
if [[ -z "$SKILL" ]]; then
  echo "Usage: $(basename "$0") <skill-name>" >&2
  exit 1
fi
ROOT="$(git rev-parse --show-toplevel)"
SUITE="$ROOT/.agents/skills/$SKILL/evals.json"
[[ -f "$SUITE" ]] || { echo "No evals.json at $SUITE" >&2; exit 1; }
cd "$ROOT/.agents/evals"
EVAL_SUITE="$SUITE" pnpm exec promptfoo eval -c ./promptfooconfig.yaml "${@:2}"

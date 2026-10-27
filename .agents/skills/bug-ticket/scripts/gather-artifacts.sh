#!/usr/bin/env bash
# Usage: gather-artifacts.sh <run_id> <desktop|android|ios> <out_dir>
# Downloads the Allure result artifacts of one platform from a run.
set -euo pipefail

RUN_ID="${1:?run id required}"
PLATFORM="${2:?platform required}"
OUT_DIR="${3:?out dir required}"
REPO="${REPO:-LedgerHQ/ledger-live}"

case "$PLATFORM" in
  desktop) PATTERN='^allure-results$' ;;
  android|ios) PATTERN="^${PLATFORM}-test-artifacts-[0-9]+$" ;;
  *) echo "unknown platform: $PLATFORM" >&2; exit 2 ;;
esac

mkdir -p "$OUT_DIR"

gh api "repos/$REPO/actions/runs/$RUN_ID/artifacts" --paginate --jq '.artifacts[].name' \
  | grep -E "$PATTERN" \
  | while read -r name; do
      gh run download "$RUN_ID" --repo "$REPO" -n "$name" -D "$OUT_DIR/$name"
    done

echo "artifacts in $OUT_DIR: $(ls "$OUT_DIR" | wc -l | tr -d ' ')"

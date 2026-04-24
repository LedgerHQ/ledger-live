#!/usr/bin/env bash
# Builds a filtered artifact directory for AI analysis.
# - All test-cases from the Allure report are included.
# - Attachments are included only for failed/broken tests, excluding images and videos.
set -euo pipefail
shopt -s nullglob

ARTIFACTS="${ARTIFACTS:-e2e/mobile/artifacts}"
OUT="${OUT:-e2e/mobile/artifacts/artifacts-ai}"

# Safety guard: refuse to delete if OUT is empty, is the repo root, or is the artifacts source.
if [[ -z "$OUT" || "$OUT" == "/" || "$OUT" == "." || "$(realpath "$OUT" 2>/dev/null || echo "$OUT")" == "$(realpath "$ARTIFACTS")" ]]; then
  echo "Error: OUT='$OUT' is unsafe to delete. Aborting." >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT/attachments"

for f in categories.json executor.json environment.properties speculos-instances.json; do
  [[ -f "$ARTIFACTS/$f" ]] && cp "$ARTIFACTS/$f" "$OUT/"
done
[[ -d "$ARTIFACTS/appVersion" ]] && cp -r "$ARTIFACTS/appVersion" "$OUT/"

test_cases=("$ARTIFACTS/allure-report/data/test-cases"/*.json)
if [[ ${#test_cases[@]} -eq 0 ]]; then
  echo "No test-case files found in $ARTIFACTS/allure-report/data/test-cases, skipping AI artifact build." >&2
  exit 0
fi

# No deduplication needed — Allure already handles retries.
for tc in "${test_cases[@]}"; do
  status=$(jq -r '.status' "$tc")

  cp "$tc" "$OUT/"

  if [[ "$status" == "failed" || "$status" == "broken" ]]; then
    while IFS= read -r src; do
      [[ -f "$ARTIFACTS/allure-report/data/attachments/$src" ]] && \
        cp "$ARTIFACTS/allure-report/data/attachments/$src" "$OUT/attachments/"
    done < <(jq -r '.. | .attachments? // empty | .[] | select(.type | startswith("video/") or startswith("image/") | not) | .source' "$tc" | sort -u)
  fi
done

if [[ -f "$ARTIFACTS/allure-report/widgets/summary.json" ]]; then
  cp "$ARTIFACTS/allure-report/widgets/summary.json" "$OUT/summary.json"
else
  echo "Warning: allure-report/widgets/summary.json not found, skipping summary." >&2
fi

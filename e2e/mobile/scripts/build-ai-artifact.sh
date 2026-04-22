#!/usr/bin/env bash
# Builds a filtered artifact directory for AI analysis.
# - Only failed/broken *-result.json files are included (passed tests are counted
#   and stored in a summary file so the parser can still report totals).
# - Attachments are included only for failed/broken tests, excluding images and videos.
set -euo pipefail
shopt -s nullglob

ARTIFACTS="${ARTIFACTS:-e2e/mobile/artifacts}"
OUT="${OUT:-e2e/mobile/artifacts-ai}"

mkdir -p "$OUT/attachments"

for f in categories.json executor.json environment.properties speculos-instances.json appVersion; do
  [[ -f "$ARTIFACTS/$f" ]] && cp "$ARTIFACTS/$f" "$OUT/"
done

results=("$ARTIFACTS"/*-result.json)
if [[ ${#results[@]} -eq 0 ]]; then
  echo "No result files found in $ARTIFACTS, skipping AI artifact build." >&2
  exit 0
fi

total=0
passed=0

for result in "${results[@]}"; do
  status=$(jq -r '.status' "$result")
  total=$((total + 1))

  if [[ "$status" == "failed" || "$status" == "broken" ]]; then
    cp "$result" "$OUT/"

    while IFS= read -r src; do
      [[ -f "$ARTIFACTS/$src" ]] && \
        cp "$ARTIFACTS/$src" "$OUT/attachments/"
    done < <(jq -r '.. | .attachments? // empty | .[] | select(.type | startswith("video/") or startswith("image/") | not) | .source' "$result" | sort -u)
  elif [[ "$status" == "passed" ]]; then
    passed=$((passed + 1))
  fi
done

printf '{"total_results":%d,"passed_results":%d}\n' "$total" "$passed" > "$OUT/summary.json"

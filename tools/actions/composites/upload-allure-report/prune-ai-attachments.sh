#!/bin/bash
set -euo pipefail

# Build a pruned copy of an Allure results directory for upload, dropping
# AI-analysis-only payloads to shrink the report sent to the Allure server:
#   - All "text/xml" attachments (currently used for Native View Hierarchy),
#     captured solely for AI
#   - AI artifact directories (artifacts-ai / *-ai-analysis) if present.
#
# The SOURCE directory is left untouched on purpose: later steps in the job
# (`allure generate` in get-allure-summary, then build-ai-artifact.sh) still
# need the full data. Writes the pruned copy path to $GITHUB_OUTPUT as `path`.
#
# Usage: prune-ai-attachments.sh <source-dir> <dest-dir>

SRC="${1:-}"
DST="${2:-}"

emit_path() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "path=$1" >> "$GITHUB_OUTPUT"
  fi
}

if [ -z "$SRC" ] || [ -z "$DST" ]; then
  echo "::error::Usage: prune-ai-attachments.sh <source-dir> <dest-dir>"
  exit 1
fi

# Fall back to the original directory so the publish step still has something
# to upload if there is nothing to prune.
if [ ! -d "$SRC" ]; then
  echo "::warning::Directory '$SRC' not found. Skipping AI-attachment pruning."
  emit_path "$SRC"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "::warning::'jq' not found. Uploading report without AI-attachment pruning."
  emit_path "$SRC"
  exit 0
fi

# Fresh copy we can mutate without touching the source.
rm -rf "$DST"
mkdir -p "$DST"
cp -a "$SRC/." "$DST/"

# Drop AI artifact directories that needn't reach the Allure server.
find "$DST" -type d \( -name 'artifacts-ai' -o -name '*-ai-analysis' \) -prune -exec rm -rf {} +

# Remove the AI-only text/xml attachments: delete the referenced attachment files,
# then strip their entries from the result JSON.
removed=0
dst_abs=$(realpath -m -- "$DST")
shopt -s nullglob
for json in "$DST"/*-result.json "$DST"/*-container.json; do
  [ -f "$json" ] || continue

  while IFS= read -r src; do
    [ -n "$src" ] || continue
    case "$src" in
      /*)
        echo "::warning::Skipping attachment with absolute source path: $src"
        continue
        ;;
    esac
    target=$(realpath -m -- "$DST/$src")
    case "$target" in
      "$dst_abs"/*) ;;
      *)
        echo "::warning::Skipping attachment outside results dir: $src"
        continue
        ;;
    esac
    if [ -f "$target" ]; then
      rm -f -- "$target"
      removed=$((removed + 1))
    fi
  done < <(jq -r '[.. | objects | .attachments? // empty | .[]? | select(.type == "text/xml") | .source] | .[]' "$json")

  tmp=$(mktemp "$DST/.prune.XXXXXX")
  jq 'walk(if type == "object" and has("attachments") then .attachments |= map(select(.type != "text/xml")) else . end)' "$json" > "$tmp"
  mv -f "$tmp" "$json"
done

echo "Pruned $removed AI-analysis attachment file(s) from the upload copy."
emit_path "$DST"

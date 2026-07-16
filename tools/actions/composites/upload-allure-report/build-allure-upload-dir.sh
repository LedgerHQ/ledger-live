#!/usr/bin/env bash
# Build the directory that gets sent to the Allure server.
#
# Allow-list copy from an Allure results dir into a fresh upload directory,
# keeping only what the Allure server's results-format ingest expects:
#   - *-result.json, *-container.json (test results + containers)
#   - categories.json, environment.properties, executor.json (metadata)
#   - any file referenced as `attachments[].source` from a result/container JSON
#
# Then strips text/xml attachments (Native View Hierarchy, captured for AI
# analysis only) — both the files in the copy and their entries in the JSONs.
#
# The source directory is left untouched: any downstream step (`Get summary`,
# `build-ai-artifact.sh`, …) keeps seeing the full data.
#
# Writes the dest dir to $GITHUB_OUTPUT as `path` for downstream composite steps.
#
# Usage: build-allure-upload-dir.sh <source-dir> <dest-dir>

set -euo pipefail
shopt -s nullglob

SRC="${1:-}"
DST="${2:-}"

emit_path() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "path=$1" >> "$GITHUB_OUTPUT"
  fi
}

if [ -z "$SRC" ] || [ -z "$DST" ]; then
  echo "::error::Usage: build-allure-upload-dir.sh <source-dir> <dest-dir>" >&2
  exit 1
fi

if [ ! -d "$SRC" ]; then
  echo "::warning::Source directory '$SRC' does not exist. Falling back to it."
  emit_path "$SRC"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "::error::'jq' is required to resolve attachment references." >&2
  exit 1
fi

rm -rf "$DST"
mkdir -p "$DST"

# 1) Test results / containers (Allure 2 root-level JSONs).
results=0
for f in "$SRC"/*-result.json "$SRC"/*-container.json; do
  cp -p "$f" "$DST/"
  results=$((results + 1))
done

# 2) Standard metadata files at the results root.
for name in categories.json environment.properties executor.json; do
  if [ -f "$SRC/$name" ]; then
    cp -p "$SRC/$name" "$DST/"
  fi
done

# 3) Attachments referenced from any result/container JSON. We honor whatever
#    relative path is recorded (typically `attachments/<uuid>`, but other
#    layouts are valid in the Allure format). Absolute and escaping paths are
#    skipped defensively.
src_abs=$(realpath -m -- "$SRC")
attachments=0
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  case "$ref" in /*) continue ;; esac
  target=$(realpath -m -- "$SRC/$ref")
  case "$target" in
    "$src_abs"/*) ;;
    *) continue ;;
  esac
  if [ -f "$SRC/$ref" ] && [ ! -e "$DST/$ref" ]; then
    mkdir -p "$DST/$(dirname "$ref")"
    cp -p "$SRC/$ref" "$DST/$ref"
    attachments=$((attachments + 1))
  fi
done < <(
  for json in "$DST"/*-result.json "$DST"/*-container.json; do
    [ -f "$json" ] || continue
    jq -r '[.. | objects | .attachments? // empty | .[]? | .source] | .[]' "$json"
  done | sort -u
)

# 4) Drop text/xml attachments (Native View Hierarchy etc., AI-only payloads).
#    Delete the files in the copy, then strip the entries from the JSONs.
removed=0
dst_abs=$(realpath -m -- "$DST")
for json in "$DST"/*-result.json "$DST"/*-container.json; do
  [ -f "$json" ] || continue

  while IFS= read -r ref; do
    [ -n "$ref" ] || continue
    case "$ref" in /*) continue ;; esac
    target=$(realpath -m -- "$DST/$ref")
    case "$target" in
      "$dst_abs"/*) ;;
      *) continue ;;
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

echo "Built Allure upload dir at '$DST':"
echo "  result/container files: $results"
echo "  attachments copied:     $attachments"
echo "  text/xml stripped:      $removed"

emit_path "$DST"

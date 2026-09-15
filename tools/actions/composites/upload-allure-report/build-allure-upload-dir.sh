#!/usr/bin/env bash
# Build the directory that gets sent to the Allure server.
#
# Allow-list copy from an Allure results dir into a fresh upload directory,
# keeping only what the Allure server's results-format ingest expects:
#   - *-result.json, *-container.json (test results + containers)
#   - categories.json, environment.properties, executor.json (metadata)
#   - any file referenced as `attachments[].source` from a result/container JSON
#
# text/xml attachments (Native View Hierarchy, captured for AI analysis only) are
# left out of the copy entirely, and their entries are stripped from the JSONs.
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

started=$SECONDS

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

# Reject an attachment reference that is absolute or climbs out of the results
# dir. Pure string work: a `..` path segment is the only way out, and the guard
# stays stricter than canonicalising, because it never touches the filesystem.
# Wrapping in slashes catches `..` at either end; `foo..bar` is left alone.
ref_is_safe() {
  case "$1" in
    "" | /*) return 1 ;;
    */../* | ../* | */..) return 1 ;;
  esac
  return 0
}

refs=$(mktemp "${TMPDIR:-/tmp}/allure-refs.XXXXXX")
drop=$(mktemp "${TMPDIR:-/tmp}/allure-drop.XXXXXX")
keep=$(mktemp "${TMPDIR:-/tmp}/allure-keep.XXXXXX")
copylist=$(mktemp "${TMPDIR:-/tmp}/allure-copy.XXXXXX")
trap 'rm -f "$refs" "$drop" "$keep" "$copylist"' EXIT

# 3) Collect every attachment reference and its type in ONE jq pass over all the
#    JSONs, rather than spawning jq (and a path canonicaliser) per file.
if [ "$results" -gt 0 ]; then
  jq -r '
    .. | objects | .attachments? // empty | .[]?
    | select(.source != null)
    | "\(.type // "")\t\(.source)"
  ' "$DST"/*-result.json "$DST"/*-container.json | sort -u > "$refs"
fi

# A reference is dropped if it is typed text/xml anywhere, matching the previous
# behaviour of copying everything and then deleting the text/xml files.
awk -F'\t' '$1 == "text/xml" { print $2 }' "$refs" | sort -u > "$drop"
awk -F'\t' '{ print $2 }' "$refs" | sort -u | comm -23 - "$drop" > "$keep"

# 4) Copy the surviving attachments in a single streamed pass. We honor whatever
#    relative path is recorded (typically `attachments/<uuid>`, but other layouts
#    are valid in the Allure format), and tar recreates the directories for us —
#    a per-file `dirname`/`mkdir`/`cp` trio costs thousands of processes here.
while IFS= read -r ref; do
  ref_is_safe "$ref" || continue
  [ -f "$SRC/$ref" ] || continue
  printf '%s\n' "$ref"
done < "$keep" > "$copylist"

attachments=$(wc -l < "$copylist" | tr -d ' ')
if [ "$attachments" -gt 0 ]; then
  tar -C "$SRC" -cf - -T "$copylist" | tar -C "$DST" -xf -
fi

# 5) Strip text/xml entries from the JSONs. Only the files that actually carry
#    one are rewritten, so this touches a small fraction of the results.
removed=$(wc -l < "$drop" | tr -d ' ')
if [ "$removed" -gt 0 ]; then
  for json in "$DST"/*-result.json "$DST"/*-container.json; do
    grep -q 'text/xml' "$json" || continue
    tmp=$(mktemp "$DST/.prune.XXXXXX")
    jq 'walk(if type == "object" and has("attachments") then .attachments |= map(select(.type != "text/xml")) else . end)' \
      "$json" > "$tmp"
    mv -f "$tmp" "$json"
  done
fi

echo "Built Allure upload dir at '$DST':"
echo "  result/container files: $results"
echo "  attachments copied:     $attachments"
echo "  text/xml stripped:      $removed"
echo "  elapsed:                $((SECONDS - started))s"

emit_path "$DST"

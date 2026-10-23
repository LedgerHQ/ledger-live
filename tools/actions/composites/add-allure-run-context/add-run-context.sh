#!/usr/bin/env bash
# Prepend `RUN.<key> = <value>` entries to an Allure results environment.properties.
#
# Reads newline-separated `key=value` pairs on stdin. Empty values are written as
# `(none)`; lines without `=` are skipped. The block goes first because Allure lists
# environment entries in file order, and the FF.* / ENV.* lists written by the test
# teardowns run to hundreds of lines.
#
# Usage: add-run-context.sh <results-dir> < pairs
# Compatible with bash 3.2 (macOS runners).

set -euo pipefail

DIR="${1:-}"
if [ -z "$DIR" ]; then
  echo "::error::Usage: add-run-context.sh <results-dir> < pairs" >&2
  exit 1
fi

mkdir -p "$DIR"
FILE="$DIR/environment.properties"

block=""
count=0
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  [ -n "$line" ] || continue
  case "$line" in
    *=*) ;;
    *)
      echo "::warning::Skipping run context line without '='" >&2
      continue
      ;;
  esac
  key="${line%%=*}"
  value="${line#*=}"
  value="${value//\\/\\\\}"
  [ -n "$value" ] || value="(none)"
  block="${block}RUN.${key} = ${value}"$'\n'
  count=$((count + 1))
done

tmp=$(mktemp "$DIR/.environment.XXXXXX")
{
  printf '%s' "$block"
  if [ -f "$FILE" ]; then
    cat "$FILE"
  fi
} > "$tmp"
mv -f "$tmp" "$FILE"

echo "Added $count run context entries to $FILE"

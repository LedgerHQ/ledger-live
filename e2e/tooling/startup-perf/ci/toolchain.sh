#!/usr/bin/env bash
# The toolchain a build was made with, kept beside its sha.txt: a cached build A can come from
# older runners than build B, and a runner update would then look like a startup change.
# Usage: toolchain.sh record <file>         in a build job
#        toolchain.sh compare <dir A> <dir B>   in a measure job: warns, never fails
set -euo pipefail

record() {
  local file=$1
  {
    echo "os: $(uname -sm) $(sw_vers -productVersion 2> /dev/null || true)"
    if [[ -n "${ImageOS:-}${ImageVersion:-}" ]]; then echo "image: ${ImageOS:-} ${ImageVersion:-}"; fi
    if command -v xcodebuild > /dev/null; then echo "xcode: $(xcodebuild -version | paste -sd ' ' -)"; fi
    local java
    if java=$(java -version 2>&1); then echo "java: $(head -1 <<< "$java")"; fi
    echo "node: $(node --version)"
  } > "$file"
}

compare() {
  local dir_a=$1 dir_b=$2
  local a="$dir_a/toolchain.txt" b="$dir_b/toolchain.txt"
  # One build measured against itself: nothing to compare.
  [[ -f "$dir_b/sha.txt" ]] || return 0
  if [[ ! -f "$a" || ! -f "$b" ]]; then
    echo "::warning title=Build toolchains unknown::A or B has no toolchain.txt, so a toolchain difference between them would go unnoticed."
    return 0
  fi
  cmp -s "$a" "$b" && return 0
  local changes
  changes=$(diff "$a" "$b" | sed -n 's/^< /A /p; s/^> /B /p' | paste -sd ';' -) || true
  echo "::warning title=A and B were built with different toolchains::${changes}. A startup difference may come from the toolchain."
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    {
      echo "### ⚠️ A and B were built with different toolchains"
      echo
      echo '```diff'
      diff -u --label A --label B "$a" "$b" || true
      echo '```'
    } >> "$GITHUB_STEP_SUMMARY"
  fi
}

case "${1:-}" in
  record) record "$2" ;;
  compare) compare "$2" "$3" ;;
  *)
    echo "Usage: toolchain.sh record <file> | compare <dir A> <dir B>" >&2
    exit 1
    ;;
esac

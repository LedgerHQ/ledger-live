#!/usr/bin/env bash
# Select the @smoke spec files for a PR smoke run, publish them to $GITHUB_ENV for the
# Detox step, and report whether there are any so the caller can skip cleanly.
#
# Shared by the iOS and Android smoke jobs, which previously carried identical copies.
#
# The canonical selector lives in e2e/mobile/. This runs from the caller's checkout, so
# a ref cut before that move still resolves its own in-tree copy — note the two copies
# do not select identically (the old one matched raw file text, the current one matches
# declared @tags or paths), so the fallback is a compatibility shim, not an equivalent.
#
# Env: GITHUB_ENV, GITHUB_OUTPUT

set -euo pipefail

: "${GITHUB_ENV:?GITHUB_ENV must be set}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"

SHARD_TESTS=e2e/mobile/scripts/shard-tests.mjs
[ -f "$SHARD_TESTS" ] || SHARD_TESTS=apps/ledger-live-mobile/scripts/shard-tests.mjs

SMOKE_FILES=$(node "$SHARD_TESTS" "@smoke" "e2e/mobile")

if [ -z "$SMOKE_FILES" ]; then
  echo "No smoke test files found — skipping smoke tests"
  echo "has_tests=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

echo "has_tests=true" >> "$GITHUB_OUTPUT"
{
  echo "SHARD_TEST_FILES<<EOF"
  echo "$SMOKE_FILES"
  echo "EOF"
} >> "$GITHUB_ENV"
echo "Smoke test files: $SMOKE_FILES"

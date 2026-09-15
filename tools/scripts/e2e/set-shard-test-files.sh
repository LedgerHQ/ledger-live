#!/usr/bin/env bash
# Publish this shard's pre-computed spec-file list to $GITHUB_ENV for the Detox run step.
#
# Shared by the iOS and Android shard jobs: the list is produced once by
# generate-shards-matrix and carried in the job matrix, so both platforms only have to
# forward it. SHARD_FILES arrives through the environment rather than being interpolated
# into the script, so a spec path can never be evaluated as shell.
#
# Env: SHARD_FILES, SHARD_INDEX, SHARD_TOTAL, GITHUB_ENV

set -euo pipefail

: "${GITHUB_ENV:?GITHUB_ENV must be set}"

FILES="${SHARD_FILES:-}"
COUNT=$(printf '%s' "$FILES" | wc -w | tr -d ' ')

{
  echo "SHARD_TEST_FILES<<EOF"
  echo "$FILES"
  echo "EOF"
} >> "$GITHUB_ENV"

printf 'Using pre-computed shard %s/%s with %s test files\n' \
  "${SHARD_INDEX:-?}" "${SHARD_TOTAL:-?}" "$COUNT"

if [ "$COUNT" -eq 0 ]; then
  echo "::warning::shard ${SHARD_INDEX:-?}/${SHARD_TOTAL:-?} received no test files"
fi

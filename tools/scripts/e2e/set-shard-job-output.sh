#!/usr/bin/env bash
# Publish this shard's Detox outcome as a per-shard job output.
#
# Shared by the iOS and Android shard jobs. The output name carries the shard index
# because a matrix job's outputs overwrite each other — the last leg to finish would
# otherwise be the only one visible. aggregate-shard-results reads status_1..status_N
# to tell a failed shard apart from one that never reported at all.
#
# Env: SHARD_INDEX, DETOX_OUTCOME, GITHUB_OUTPUT

set -euo pipefail

: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"
: "${SHARD_INDEX:?SHARD_INDEX must be set}"

echo "status_${SHARD_INDEX}=${DETOX_OUTCOME:-unknown}" >> "$GITHUB_OUTPUT"

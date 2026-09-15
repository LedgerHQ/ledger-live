#!/usr/bin/env bash
# Fail the run early if the feature_flags_json input is not valid JSON, rather than
# letting every shard discover it independently.
#
# Env: E2E_FEATURE_FLAGS_JSON (empty is valid and means "no override")

set -euo pipefail

raw="${E2E_FEATURE_FLAGS_JSON:-}"
if [ -z "$raw" ]; then
  exit 0
fi

# shellcheck disable=SC2016 # the JS body must reach node unexpanded; $raw is passed as argv
node -e '
  try {
    JSON.parse(process.argv[1]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Invalid E2E_FEATURE_FLAGS_JSON: ${message}`);
    process.exit(1);
  }
' "$raw"

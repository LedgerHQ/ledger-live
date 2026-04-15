#!/bin/bash
set -euo pipefail

# Build the Allure project ID from repository, branch, and platform.
# The platform is normalized to: ios, android, or desktop.
# An optional extra suffix is appended to disambiguate runs (e.g. "manual", "PR-checks").
#
# Required environment variables:
#   REPOSITORY   - Full GitHub repository (e.g. LedgerHQ/ledger-live)
#   BRANCH       - Branch name
#   PLATFORM     - Raw platform value (e.g. ios-e2e, android-e2e, linux-speculos)
#
# Optional environment variables:
#   EXTRA_SUFFIX - Extra tag appended after the platform (e.g. manual, PR-checks)
#   OUTPUT_FILE  - File to write "path=<value>" (defaults to $GITHUB_OUTPUT)

for var in REPOSITORY BRANCH PLATFORM; do
  if [ -z "${!var:-}" ]; then
    echo "::error::Required environment variable $var is not set"
    exit 1
  fi
done

REPO_NAME=$(echo "$REPOSITORY" | cut -d'/' -f2)

# Normalize platform to ios, android, or desktop
case "$PLATFORM" in
  *ios*)     SUFFIX="ios" ;;
  *android*) SUFFIX="android" ;;
  *)         SUFFIX="desktop" ;;
esac

if [ "$REPOSITORY" != "LedgerHQ/ledger-live" ]; then
  PATH_VALUE="${REPO_NAME}-${BRANCH}-${SUFFIX}"
else
  PATH_VALUE="${BRANCH}-${SUFFIX}"
fi

if [ -n "${EXTRA_SUFFIX:-}" ]; then
  PATH_VALUE="${PATH_VALUE}-${EXTRA_SUFFIX}"
fi

# Allure Docker Service requires lowercase project IDs ([a-z0-9_-]);
# uppercase characters cause the server to silently reject project creation
# and return 404 on subsequent send-results calls.
PATH_VALUE=$(printf '%s' "$PATH_VALUE" | tr '[:upper:]' '[:lower:]')

echo "Report path: $PATH_VALUE"

OUT="${OUTPUT_FILE:-${GITHUB_OUTPUT:-}}"
if [ -n "$OUT" ]; then
  echo "path=${PATH_VALUE}" >> "$OUT"
fi

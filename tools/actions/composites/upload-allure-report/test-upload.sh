#!/bin/bash
set -euo pipefail

# Manual test for upload-to-allure.sh
# Usage: ./test-upload.sh <results-dir>
#
# Requires ALLURE_PASSWORD env var to be set.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export ALLURE_SERVER_URL="https://allure-ledger-live.aws.sbx.ldg-tech.com"
export ALLURE_LOGIN="ldg-github-ci"
export PROJECT_ID="manual-test"
export BUILD_URL="https://github.com/LedgerHQ/ledger-live/actions/runs/0"
export BUILD_NAME="manual-test-run"
export RESULTS_DIR="${1:?Usage: $0 <results-dir>}"

if [ -z "${ALLURE_PASSWORD:-}" ]; then
  echo "Error: ALLURE_PASSWORD env var is not set"
  exit 1
fi

"$SCRIPT_DIR/upload-to-allure.sh"

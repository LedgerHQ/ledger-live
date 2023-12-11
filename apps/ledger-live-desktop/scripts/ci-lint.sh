#!/usr/bin/env bash
set -e

pushd "$(dirname $0)/../../.." > /dev/null
PORT=""

usage() {
  echo "Usage: $(basename $0) [-p <port>]" 1>&2
  exit 1
}

while getopts "hp" arg; do
  case $arg in
    h)
      usage
      ;;
    p)
      PORT=${OPTARG}
      ;;
    *)
      usage
      ;;
  esac
done


pnpm lint \
  --filter="ledger-live-desktop" \
  --api="http://127.0.0.1:${PORT}" \
  --token="yolo" \
  --team="foo" \
  -- --format="json" \
  -o="lint.json"

node -p "require('./node_modules/eslint/lib/cli-engine/formatters/stylish.js')(require('./apps/ledger-live-desktop/lint.json'))"

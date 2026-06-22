#!/usr/bin/env bash
#
# Unified Maestro test runner for the ledger-live-mobile e2e POC.
# Mirrors the Detox `test:detox` entrypoint: run everything, or filter by name.
#
# Usage (via pnpm, from repo root):
#   pnpm e2e:mobile test:maestro                 # run ALL Maestro tests (sequentially)
#   pnpm e2e:mobile test:maestro swap            # run only tests whose name contains "swap"
#   pnpm e2e:mobile test:maestro send-doge
#   pnpm e2e:mobile test:maestro add-account
#   pnpm e2e:mobile test:maestro --list          # list available tests and exit
#
# Or directly:  bash maestro/run.sh [name|--list]
#
# Env (forwarded to each test's run-*.sh; see those scripts for the full set):
#   SEED                test mnemonic (required for device-backed runs; NEVER commit)
#   REMOTE_SPECULOS     "true" (default for swap/send-doge) -> needs SPECULINHO_URL;
#                       "false" -> local Docker Speculos -> needs COINAPPS + Docker
#   SPECULINHO_URL      remote Speculos base URL (Ledger internal; usually needs VPN)
#   COINAPPS            path to a coin-apps clone (local Docker Speculos)
#   SPECULOS_DEVICE     nanoX (default) | nanoSP | ...
#
# NOTE: ASCII only on purpose -- fancy glyphs have broken variable parsing in some shells.
set -euo pipefail

# Run from the e2e/mobile package dir (where the run-*.sh scripts + artifacts live).
cd "$(dirname "$0")/.."

# Shared helpers (run_maestro_flow / generate_allure_report) + a clean slate for this run's report.
source "maestro/_platform.sh"
rm -rf "$MAESTRO_DEBUG_ROOT" "$MAESTRO_ALLURE_RESULTS" "$MAESTRO_ALLURE_REPORT"

# Test registry: "name|script|description". The name is what you filter on.
TESTS="add-account|maestro/run-eth.sh|native ETH add-account (classic UI)
send-doge|maestro/run-send-doge.sh|native send DOGE (on-device sign)
swap|maestro/run-swap.sh|swap across all currency pairs (one harness cycle each)"

list_tests() {
  echo "Available Maestro tests:"
  printf '%s\n' "$TESTS" | while IFS='|' read -r name script desc; do
    [ -n "$name" ] || continue
    printf "  %-14s %s\n" "$name" "$desc"
  done
}

usage() {
  echo "Usage: pnpm e2e:mobile test:maestro [name]"
  echo "  (no name) | all   run all Maestro tests sequentially"
  echo "  <name>            run tests whose name contains <name> (e.g. swap, send-doge, add-account)"
  echo "  --list | --help   show this help"
  echo
  list_tests
}

FILTER="${1:-}"
case "$FILTER" in
  -h | --help | help | --list | list)
    usage
    exit 0
    ;;
esac

# Select matching tests (substring match on the name; empty/"all" -> everything).
SELECTED=""
while IFS='|' read -r name script desc; do
  [ -n "$name" ] || continue
  if [ -z "$FILTER" ] || [ "$FILTER" = "all" ]; then
    SELECTED="${SELECTED}${name}|${script}"$'\n'
  else
    case "$name" in
      *"$FILTER"*) SELECTED="${SELECTED}${name}|${script}"$'\n' ;;
    esac
  fi
done <<EOF
$TESTS
EOF

if [ -z "$SELECTED" ]; then
  echo "ERROR: no Maestro test matches '$FILTER'."
  echo
  list_tests
  exit 1
fi

# Run the selected tests sequentially. Each run-*.sh does its own preflight, backend
# (bridge [+ Speculos]) bring-up, Maestro run, and teardown, so they are independent.
overall=0
results=""
while IFS='|' read -r name script; do
  [ -n "$name" ] || continue
  echo
  echo "=================================================================="
  echo ">> Maestro test: $name   ($script)"
  echo "=================================================================="
  if bash "$script"; then
    results="${results}  PASS  ${name}"$'\n'
  else
    rc=$?
    results="${results}  FAIL  ${name} (exit ${rc})"$'\n'
    overall=1
  fi
done <<EOF
$SELECTED
EOF

# Build the Allure report from every flow's debug output (captures failures too).
generate_allure_report

echo
echo "===================== Maestro results ====================="
printf '%s' "$results"
echo "==========================================================="
exit "$overall"

#!/usr/bin/env bash
# Automated regression harness for the wallet-cli cases that need no device.
# Case ids match ../../docs/regression/no-device.md.
#
#   ./run.sh                       # suites B, C, D (skill group, first-run nudge, read/dry-run)
#   ./run.sh --suite b             # one suite (a|b|c|d, repeatable)
#   ./run.sh --with-gates          # add suite A (repo gates); --with-build adds build/pack/smoke
#   ./run.sh --bin ./path/to/cli   # a specific binary (default: dist/<platform>/cli)
#   ./run.sh --source              # run from source via `pnpm wallet-cli start`
#
# Suites B and C are hermetic (throwaway cwd, HOME and XDG_STATE_HOME).
# Suite D reads the developer's real session and live backends; it never signs
# or broadcasts. Device-touching cases live in the docs, not here.
#
# Requires: bash, jq, node, timeout (coreutils), and a built binary or pnpm.

set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=${REPO_ROOT:-$(git -C "$HERE" rev-parse --show-toplevel)}
WALLET_CLI_DIR="$REPO_ROOT/apps/wallet-cli"
EXPECTED_VERSION=$(jq -r .version "$WALLET_CLI_DIR/package.json")

for tool in jq node timeout; do
  command -v "$tool" >/dev/null || { echo "missing required tool: $tool" >&2; exit 2; }
done

SUITES=()
WITH_GATES=0
WITH_BUILD=0
BIN_OVERRIDE=""
USE_SOURCE=0
CASE_TIMEOUT=${CASE_TIMEOUT:-240}
GATE_TIMEOUT=${GATE_TIMEOUT:-2400}

while [ $# -gt 0 ]; do
  case "$1" in
    --suite) SUITES+=("$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')"); shift 2 ;;
    --with-gates) WITH_GATES=1; SUITES+=(a); shift ;;
    --with-build) WITH_BUILD=1; shift ;;
    --bin) BIN_OVERRIDE="$2"; shift 2 ;;
    --source) USE_SOURCE=1; shift ;;
    --timeout) CASE_TIMEOUT="$2"; shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done
[ ${#SUITES[@]} -eq 0 ] && SUITES=(b c d)

# --- CLI under test ---------------------------------------------------------
if [ "$USE_SOURCE" = 1 ]; then
  BIN_ARR=(pnpm --dir "$REPO_ROOT" --silent wallet-cli start)
  BIN_LABEL="pnpm wallet-cli start"
else
  if [ -n "$BIN_OVERRIDE" ]; then
    BIN="$BIN_OVERRIDE"
  else
    case "$(uname -s)-$(uname -m)" in
      Darwin-arm64) BIN="$WALLET_CLI_DIR/dist/darwin-arm64/cli" ;;
      Linux-x86_64) BIN="$WALLET_CLI_DIR/dist/linux-x64/cli" ;;
      Linux-aarch64) BIN="$WALLET_CLI_DIR/dist/linux-arm64/cli" ;;
      *) echo "no default binary for $(uname -s)-$(uname -m); pass --bin or --source" >&2; exit 2 ;;
    esac
  fi
  if [ ! -x "$BIN" ]; then
    echo "binary not found: $BIN" >&2
    echo "build it with: (cd $WALLET_CLI_DIR && pnpm build)   — or run with --source" >&2
    exit 2
  fi
  BIN_ARR=("$BIN")
  BIN_LABEL="$BIN"
fi

# --- scratch space ----------------------------------------------------------
RUN_ID=$(date +%Y%m%d-%H%M%S)
TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/wallet-cli-regression.$RUN_ID.XXXXXX")
LOG_FILE="$TMP_ROOT/run.log"
ISO_STATE=$(mktemp -d "$TMP_ROOT/iso-state.XXXXXX")
ISO_HOME=$(mktemp -d "$TMP_ROOT/iso-home.XXXXXX")
CLI_ENV=()
OUT=""; ERR=""; RC=0
: >"$LOG_FILE"

# shellcheck source=lib.sh
source "$HERE/lib.sh"
source "$HERE/cases-gates.sh"
source "$HERE/cases-skill.sh"
source "$HERE/cases-nudge.sh"
source "$HERE/cases-readonly.sh"

echo "wallet-cli regression run $RUN_ID"
echo "  version under test : $EXPECTED_VERSION"
echo "  cli                : $BIN_LABEL"
echo "  suites             : ${SUITES[*]}"
echo "  log                : $LOG_FILE"
echo

START=$(date +%s)
for s in "${SUITES[@]}"; do
  case "$s" in
    a) echo "── Suite A — repo & artifact gates ──"; suite_a ;;
    b) echo "── Suite B — skill command group ──"; suite_b ;;
    c) echo "── Suite C — first-run nudge ──"; suite_c ;;
    d) echo "── Suite D — device-free regression ──"; suite_d ;;
    *) echo "unknown suite: $s" >&2; exit 2 ;;
  esac
  echo
done
END=$(date +%s)

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "──────────────────────────────────────────────"
printf 'passed %s/%s   failed %s   skipped %s   (%ss)\n' "$PASS_COUNT" "$TOTAL" "$FAIL_COUNT" "$SKIP_COUNT" "$((END - START))"
if [ "$FAIL_COUNT" -gt 0 ]; then
  printf 'failed cases: %s\n' "${FAILED_IDS[*]}"
  echo "full log: $LOG_FILE"
  exit 1
fi
echo "log: $LOG_FILE"

#!/usr/bin/env bash
#
# QAA-1365 — reproduce the iOS Detox shard hang locally.
#
# Runs three EXISTING specs on two jest workers, then freezes one worker with
# SIGSTOP. The frozen worker's event loop stops advancing, which is the class of
# failure behind the CI hang: jest's testTimeout, the beforeAll timeout and
# Detox's setupTimeout all live on that same loop, so none of them fire, the
# parent waits on the dead worker forever, and --forceExit is never reached.
# Only an external kill ends the run — in CI that is the step's timeout-minutes.
#
# NOTE: the SIGSTOP stands in for whatever wedges the loop in CI; that trigger is
# still unknown. An unresponsive *app* alone does NOT reproduce this (measured:
# jest's testTimeout fires normally and the spec fails with a real result).
#
# Usage:
#   ./scripts/repro-qaa1365.sh              # reproduce the hang (default)
#   ./scripts/repro-qaa1365.sh --check      # preflight only, run nothing
#   MODE=kill ./scripts/repro-qaa1365.sh    # freeze, hold, then SIGKILL only the
#                                           # worker: does jest recover and
#                                           # attribute a "broken" result itself?
#
# Env overrides: SPECS, WORKERS, STEP_TIMEOUT, FREEZE_HOLD, LOG
#
# Requires the sandbox to be OFF (Detox writes its IPC socket under /tmp).

set -uo pipefail

REPO="${REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
E2E_DIR="$REPO/e2e/mobile"
APP="$REPO/apps/ledger-live-mobile/ios/build/Build/Products/Release-iphonesimulator/ledgerlivemobile.app"

# Three specs that need no Docker, no Speculos and no SEED. The two settings
# specs only use the committed userdata/skip-onboarding.json fixture.
SPECS="${SPECS:-userOpensApplication userCanExportLogs userCanAccessLedgerSupport}"
WORKERS="${WORKERS:-2}"
STEP_TIMEOUT="${STEP_TIMEOUT:-420}"   # stands in for the workflow's timeout-minutes
FREEZE_HOLD="${FREEZE_HOLD:-120}"     # MODE=kill only: seconds to stay frozen first
MODE="${MODE:-stop}"
LOG="${LOG:-/tmp/qaa1365-$(date +%H%M%S).log}"

VICTIM=""
RUNPID=""

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33m !! %s\033[0m\n' "$*"; }

release_victim() {
  [ -n "$VICTIM" ] || return 0
  if ps -p "$VICTIM" >/dev/null 2>&1; then
    kill -CONT "$VICTIM" 2>/dev/null
    kill -KILL "$VICTIM" 2>/dev/null
    echo "   released frozen worker $VICTIM"
  fi
  VICTIM=""
}

cleanup() {
  release_victim
  [ -n "$RUNPID" ] && kill "$RUNPID" 2>/dev/null
  return 0
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------- preflight ---
say "Preflight"
fail=0
[ -d "$E2E_DIR" ]     && echo "   e2e dir        $E2E_DIR" || { warn "missing $E2E_DIR"; fail=1; }
[ -d "$APP" ]         && echo "   app build      present" || { warn "no Release build — run: pnpm mobile e2e:build -c ios.sim.release"; fail=1; }
command -v timeout >/dev/null && echo "   timeout        $(command -v timeout)" \
  || { warn "coreutils 'timeout' missing — brew install coreutils"; fail=1; }

# Worker N>1 resolves the device alias "simulator<N>" (e2e/mobile/jest.environment.ts),
# so a simulator with that exact name must exist for every worker beyond the first.
need_sims=("iOS Simulator")
for ((i = 2; i <= WORKERS; i++)); do need_sims+=("iOS Simulator $i"); done
for s in "${need_sims[@]}"; do
  if xcrun simctl list devices 2>/dev/null | grep -q "^ *$s ("; then
    echo "   simulator      '$s' ok"
  else
    warn "no simulator named '$s' (needed for $WORKERS workers)"; fail=1
  fi
done

stale=$(xcrun simctl list devices booted 2>/dev/null | grep -c -- "-Detox" || true)
[ "$stale" -gt 0 ] && warn "$stale booted 'iOS Simulator-Detox' clone(s) left from earlier runs; too many make simctl install fail — shut them down with: xcrun simctl shutdown <udid>"

[ "$fail" -ne 0 ] && { warn "preflight failed"; exit 1; }
echo "   specs          $SPECS"
echo "   mode           $MODE (step timeout ${STEP_TIMEOUT}s, $WORKERS workers)"
echo "   log            $LOG"
[ "${1:-}" = "--check" ] && { say "Preflight only — exiting"; exit 0; }

# ---------------------------------------------------------------- 1. run it ---
# --maxWorkers=N, NOT --workers (that flag is forwarded raw to jest and rejected).
# Without it, local maxWorkers is 1, jest runs in-band and there is no separate
# worker to freeze. --cleanup stops Detox leaving booted clone simulators behind.
say "1. Starting Detox: 3 specs on $WORKERS workers"
: > "$LOG"
(
  cd "$E2E_DIR" || exit 1
  E2E_RETRIES=0 exec timeout "$STEP_TIMEOUT" pnpm detox test \
    -c ios.sim.release --maxWorkers="$WORKERS" --forceExit --cleanup \
    --record-logs failing $SPECS
) >>"$LOG" 2>&1 &
RUNPID=$!
echo "   pid $RUNPID — follow with: tail -f $LOG"

# ------------------------------------------------- 2. wait for a live spec ---
say "2. Waiting for a worker to launch the app (~40-95s)"
for _ in $(seq 1 180); do
  grep -q 'com.ledger.live launched' "$LOG" 2>/dev/null && break
  ps -p "$RUNPID" >/dev/null 2>&1 || { warn "run exited early — see $LOG"; exit 1; }
  sleep 2
done
grep -q 'com.ledger.live launched' "$LOG" || { warn "no app launch after 6min — see $LOG"; exit 1; }
sleep 10   # let the spec body get going

# -------------------------------------------------- 3. freeze one worker -----
# Detox prefixes each log line with the pid that emitted it, and the app-launch
# lines come from the jest workers themselves.
say "3. Freezing one jest worker"
for p in $(grep 'com.ledger.live launched' "$LOG" | sed -E 's/.*detox\[([0-9]+)\].*/\1/' | sort -u); do
  ps -o command= -p "$p" 2>/dev/null | grep -q processChild && VICTIM="$p"
done
[ -n "$VICTIM" ] || { warn "no live jest worker pid found — see $LOG"; exit 1; }

frozen_spec=$(grep -E "detox\[$VICTIM\].*is assigned" "$LOG" | sed -E 's/.*i ([^ ]+\.spec\.ts) is assigned.*/\1/' | tail -1)
kill -STOP "$VICTIM"
echo "   SIGSTOP -> worker $VICTIM  (state: $(ps -o stat= -p "$VICTIM" 2>/dev/null | tr -d ' '), T = stopped)"
echo "   that worker holds: ${frozen_spec:-<unknown>}"

# ------------------------------------------------------------ 4. observe -----
if [ "$MODE" = "kill" ]; then
  say "4. Holding frozen for ${FREEZE_HOLD}s, then SIGKILL the worker only"
  sleep "$FREEZE_HOLD"
  echo "   SIGKILL -> worker $VICTIM at $(date +%H:%M:%S)"
  kill -KILL "$VICTIM" 2>/dev/null
  VICTIM=""
  echo "   watching whether jest recovers and finishes on its own..."
else
  say "4. Observing — the other worker finishes, then the run goes silent"
  echo "   nothing should end it before the ${STEP_TIMEOUT}s external kill"
fi

wait "$RUNPID"; rc=$?
RUNPID=""
release_victim

# ------------------------------------------------------------- 5. verdict ----
say "5. Verdict"
last_line_ts=$(grep -oE '^[0-9]{2}:[0-9]{2}:[0-9]{2}' "$LOG" | tail -1)
echo "   exit code            $rc   (124 = killed externally, i.e. the hang)"
echo "   last output at       ${last_line_ts:-<none>}"
echo
grep -E '^(PASS|FAIL) ' "$LOG" | sed 's/^/   /'
grep -E '^Test Suites:' "$LOG" | sed 's/^/   /'
echo
for s in $SPECS; do
  grep -qE "^(PASS|FAIL) .*$s" "$LOG" || echo "   NEVER REPORTED       $s   <-- the stalled spec"
done

if [ -n "${frozen_spec:-}" ]; then
  base="${frozen_spec%.spec.ts}"
  hit=$(grep -l "$base" "$E2E_DIR"/artifacts/*-result.json 2>/dev/null | head -1)
  if [ -n "$hit" ]; then
    echo "   allure result for the stalled spec: $(python3 -c "import json;print(json.load(open('$hit')).get('status'))" 2>/dev/null)"
  else
    echo "   allure result for the stalled spec: NONE (silently missing from the report)"
  fi
fi

echo
if [ "$rc" -eq 124 ]; then
  echo "   => REPRODUCED: the shard hung until the external kill, exactly as CI does."
else
  echo "   => run ended on its own (exit $rc) — read $LOG to see what finished it."
fi
echo "   full log: $LOG"

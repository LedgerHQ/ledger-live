#!/usr/bin/env bash
#
# QAA-1365 probe helper. Freezes one jest worker of the shard running in THIS
# step, to reproduce the iOS Detox shard hang in real CI.
#
#   usage: ci-stall-freezer.sh <stop|kill> <shard-log> <root-pid> [hold-seconds]
#
# stop  — SIGSTOP a worker and leave it frozen: the shard then hangs until the
#         step's timeout-minutes kills it, which is the QAA-1365 signature.
# kill  — SIGSTOP, hold, then SIGKILL that worker: locally this makes jest
#         attribute a failed result for the spec and finish in the same second,
#         which is the candidate fix. <hold-seconds> defaults to 120.
#
# Targeting: the freeze must hit a worker that is actually RUNNING a spec. An
# idle sibling worker looks identical to `pgrep`, and freezing the idle one does
# nothing (measured). Detox's WorkerAssignReporter logs "<spec> is assigned to
# <UDID>" prefixed with the emitting worker's pid, but at info level, and CI runs
# detox with --loglevel warn — that line does not appear in real CI logs (0
# occurrences in the 2026-09-14 shard log). So CPU time is the primary signal: a
# worker executing a spec accumulates seconds, a spawned-but-idle one does not.
#
# Candidates are restricted to descendants of <root-pid>, because these are
# shared self-hosted runners and another job's jest workers must never be touched.

set -uo pipefail

MODE="${1:?mode: stop|kill}"
LOG="${2:?path to the shard log}"
ROOT="${3:?root pid whose descendants may be frozen}"
HOLD="${4:-120}"

START_TIMEOUT="${START_TIMEOUT_SECONDS:-360}" # app launch takes 40-95s, slower under load
SETTLE="${SETTLE_SECONDS:-45}"                # let the spec body get going before freezing
MIN_CPU="${MIN_CPU_SECONDS:-2}"               # CPU seconds that mark a worker as working

note() { echo "::notice::QAA-1365 probe: $*"; }
warn() { echo "::warning::QAA-1365 probe: $*"; }

descendants() {
  local parent="$1" child
  for child in $(pgrep -P "$parent" 2>/dev/null); do
    echo "$child"
    descendants "$child"
  done
}

# Pick our busiest jest worker, in CPU seconds, or print nothing.
busiest_worker() {
  local mine workers
  mine=" $(descendants "$ROOT" | tr '\n' ' ') "
  workers=$(pgrep -d, -f "jest-worker/build/processChild" 2>/dev/null) || return 0
  [ -n "$workers" ] || return 0
  ps -o pid=,time= -p "$workers" 2>/dev/null | awk -v mine="$mine" -v min="$MIN_CPU" '
    {
      if (index(mine, " " $1 " ") == 0) next            # not ours - never touch it
      n = split($2, t, /[:.]/)                          # M:SS.ss or H:MM:SS.ss
      s = (n >= 3 ? t[n-2] * 60 + t[n-1] : $2 + 0)
      if (s >= min && s > best) { best = s; p = $1 }
    }
    END { if (p) printf "%s", p }'
}

# Wait until one of our workers is genuinely executing a spec. Deliberately not
# keyed on a log line: the launch markers ("com.ledger.live launched", "<spec> is
# assigned to <UDID>", "[E2E Bridge Server]") are all info level and none of them
# appear in real CI logs under --loglevel warn (all 0 in the 2026-09-14 shard log,
# where only "Detox Memory Usage" survives). CPU burn is the signal that works
# everywhere.
for _ in $(seq 1 $((START_TIMEOUT / 2))); do
  [ -n "$(busiest_worker)" ] && break
  sleep 2
done
sleep "$SETTLE"

mine=" $(descendants "$ROOT" | tr '\n' ' ') "

# Preferred: the worker pid Detox itself named (present only at info level).
victim=$(grep "is assigned to" "$LOG" 2>/dev/null | sed -E 's/.*detox\[([0-9]+)\].*/\1/' | tail -1)
if [ -n "$victim" ] && [ "${mine#* $victim }" = "$mine" ]; then
  warn "logged worker $victim is not ours; ignoring it"
  victim=""
fi

# Fallback: our busiest jest worker by CPU time.
if [ -z "$victim" ]; then
  victim=$(busiest_worker)
  note "no info-level marker (loglevel warn); picked our busiest worker ${victim:-<none>}"
fi

if [ -z "$victim" ] || ! ps -o command= -p "$victim" 2>/dev/null | grep -q processChild; then
  warn "no live jest worker of this shard found; nothing frozen"
  exit 0
fi

note "SIGSTOP jest worker $victim ($(ps -o time= -p "$victim" | tr -d ' ') CPU) at $(date -u +%H:%M:%S)"
kill -STOP "$victim" || { warn "SIGSTOP failed on $victim"; exit 0; }

if [ "$MODE" = "kill" ]; then
  sleep "$HOLD"
  note "SIGKILL jest worker $victim at $(date -u +%H:%M:%S) after ${HOLD}s frozen"
  kill -KILL "$victim" 2>/dev/null
fi

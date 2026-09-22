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
# Targeting. The freeze must hit a worker that is STILL RUNNING a spec; freezing
# an idle one does nothing (measured twice — locally, and in run 35756645919,
# where the pick landed 0.5s after two of the three specs had already passed).
# Three lessons are baked in below:
#
#   1. Cumulative CPU is the wrong signal: the worker with the most CPU is the
#      one that has done the most work, i.e. most likely already finished. Use
#      the CPU *delta* over a short window, which only a working worker has.
#   2. Log markers are unusable in CI: "com.ledger.live launched", "<spec> is
#      assigned to <UDID>" and "[E2E Bridge Server]" are info level and CI runs
#      detox with --loglevel warn — all three occur 0 times in the real
#      2026-09-14 shard log. Only "Detox Memory Usage" survives.
#   3. Freeze early. Specs take ~49-65s in CI, so the window closes fast; the
#      default settle is deliberately short.
#
# Candidates are restricted to descendants of <root-pid>: these are shared
# self-hosted runners and another job's jest workers must never be touched.

set -uo pipefail

MODE="${1:?mode: stop|kill}"
LOG="${2:?path to the shard log}"
ROOT="${3:?root pid whose descendants may be frozen}"
HOLD="${4:-120}"

START_TIMEOUT="${START_TIMEOUT_SECONDS:-360}" # app launch takes 40-95s, slower under load
SETTLE="${SETTLE_SECONDS:-15}"                # short: specs finish in ~49-65s in CI
SAMPLE="${SAMPLE_SECONDS:-3}"                 # CPU sampling window
MIN_DELTA="${MIN_DELTA_SECONDS:-0.2}"         # CPU seconds burned in that window

note() { echo "::notice::QAA-1365 probe: $*"; }
warn() { echo "::warning::QAA-1365 probe: $*"; }

descendants() {
  local parent="$1" child
  for child in $(pgrep -P "$parent" 2>/dev/null); do
    echo "$child"
    descendants "$child"
  done
}

our_workers() {
  local mine workers
  mine=" $(descendants "$ROOT" | tr '\n' ' ') "
  workers=$(pgrep -f "jest-worker/build/processChild" 2>/dev/null) || return 0
  for w in $workers; do
    case "$mine" in *" $w "*) echo "$w" ;; esac
  done
}

# The worker burning the most CPU right now, else the least-progressed one.
# Both are printed as "<pid> <delta> <cumulative>" for the run log.
pick_worker() {
  local workers first second
  workers=$(our_workers | tr '\n' ',')
  workers="${workers%,}"
  [ -n "$workers" ] || return 0
  first=$(ps -o pid=,time= -p "$workers" 2>/dev/null)
  sleep "$SAMPLE"
  second=$(ps -o pid=,time= -p "$workers" 2>/dev/null)
  awk -v min="$MIN_DELTA" '
    function secs(x) { n = split(x, t, /[:.]/); return (n >= 3 ? t[n-2] * 60 + t[n-1] + t[n] / 100 : x + 0) }
    NR == FNR { before[$1] = secs($2); next }
    {
      now = secs($2); d = now - before[$1]
      if (d >= min && d > bestd) { bestd = d; busy = $1; busyc = now }
      if (least == "" || now < leastc) { least = $1; leastc = now }
    }
    END {
      if (busy) printf "%s %.2f %.2f", busy, bestd, busyc
      else if (least) printf "%s 0 %.2f", least, leastc
    }' <(echo "$first") <(echo "$second")
}

# Wait until one of our workers is executing a spec (CPU is the only signal that
# works at CI log levels), then freeze quickly, before any spec can finish.
for _ in $(seq 1 $((START_TIMEOUT / SAMPLE))); do
  [ -n "$(pick_worker)" ] && break
done
sleep "$SETTLE"

read -r victim delta cpu <<<"$(pick_worker)"

if [ -z "${victim:-}" ] || ! ps -o command= -p "$victim" 2>/dev/null | grep -q processChild; then
  warn "no live jest worker of this shard found; nothing frozen"
  exit 0
fi

# grep -c prints 0 and exits 1 on no match, so take the first line only.
done_specs=$(grep -cE "^(PASS|FAIL) " "$LOG" 2>/dev/null | head -1)
done_specs="${done_specs:-0}"
[ "$done_specs" -gt 0 ] 2>/dev/null && warn "late: $done_specs spec(s) already finished before the freeze"

if [ "$delta" = "0" ]; then
  warn "no worker was actively burning CPU; freezing the least-progressed one ($victim, ${cpu}s CPU) — it may be idle, in which case the shard will NOT hang"
else
  note "worker $victim is active (+${delta}s CPU in ${SAMPLE}s, ${cpu}s total)"
fi

note "SIGSTOP jest worker $victim at $(date -u +%H:%M:%S), after $done_specs of the shard's specs finished"
kill -STOP "$victim" || { warn "SIGSTOP failed on $victim"; exit 0; }

if [ "$MODE" = "kill" ]; then
  sleep "$HOLD"
  note "SIGKILL jest worker $victim at $(date -u +%H:%M:%S) after ${HOLD}s frozen"
  kill -KILL "$victim" 2>/dev/null
fi

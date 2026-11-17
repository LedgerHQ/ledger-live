#!/usr/bin/env bash
# Runs after check-simulators.sh, right before Detox. One to four minutes after boot, trustd applies
# Apple's PKITrustSupplementals update to its pinning database, and every TLS trust evaluation on the
# simulator waits until it is done (up to two minutes). An evaluation that waits ~15 s fails with
# NSURLErrorDomain -1200, so an app launched then starts on compiled-default feature flags (QAA-1840).
#
# Waits until each simulator has finished that update, or has run long enough without starting one.
# Never fails the job: at worst Detox starts as it did before this wait existed.
#
# Reads IOS_SIMULATOR_COUNT, exported to the job by boot-ios-simulators-background.
set -uo pipefail

N="${IOS_SIMULATOR_COUNT:-0}"
# On CI the update started 56-220 s after trustd last started, on 35 of 42 simulators.
START_DEADLINE=240
# The longest update seen on CI blocked trust evaluations for 124 s.
MAX_WAIT=360
POLL_INTERVAL=5
LOG_SHOW_TIMEOUT=60

START_MARKER="Pinning database should update"
# trustd logs SecPinningDb when the update fails, which it often does; otherwise the first evaluation
# answered after the start marker shows that it is over.
END_MARKERS="SecPinningDb|trustd returned"
TRUSTD_START_MARKER="Opening db with version"

if ((N < 1)); then
  echo "ℹ️ No simulators to wait for"
  exit 0
fi

if ! SIMCTL="$(xcrun -f simctl)"; then
  echo "::warning::simctl not found: Detox starts without waiting for the trust store update"
  exit 0
fi

# macOS has no `timeout`: the alarm survives exec and its default action kills the command.
with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV or die "exec failed: $!\n"' "$seconds" "$@"
}

sim_name() {
  if [[ "$1" -eq 1 ]]; then echo "iOS Simulator"; else echo "iOS Simulator $1"; fi
}

to_epoch() {
  date -j -f "%Y-%m-%d %H:%M:%S" "${1:0:19}" +%s 2>/dev/null
}

trust_logs() {
  with_timeout "$LOG_SHOW_TIMEOUT" "$SIMCTL" spawn "$1" log show --last 20m --style compact \
    --predicate "(process == \"trustd\" AND (eventMessage CONTAINS \"$TRUSTD_START_MARKER\" OR eventMessage CONTAINS \"$START_MARKER\" OR eventMessage CONTAINS \"SecPinningDb\")) OR eventMessage CONTAINS \"trustd returned\"" \
    2>/dev/null | grep -E "^[0-9]{4}-" || true
}

# Lines from the last one matching $1, included. Empty when none matches.
from_last_match() {
  awk -v pattern="$1" '$0 ~ pattern { kept = ""; found = 1 } found { kept = kept $0 "\n" } END { printf "%s", kept }'
}

# Prints "finished", "not-started" or "pending".
update_state() {
  local logs since_trustd_start since_update trustd_started_at
  logs="$(trust_logs "$1")"

  # A reboot by check-simulators.sh restarts trustd, and with it the update.
  since_trustd_start="$(from_last_match "$TRUSTD_START_MARKER" <<<"$logs")"
  [[ -n "$since_trustd_start" ]] || since_trustd_start="$logs"

  since_update="$(from_last_match "$START_MARKER" <<<"$since_trustd_start")"
  if [[ -n "$since_update" ]]; then
    if tail -n +2 <<<"$since_update" | grep -qE "$END_MARKERS"; then echo finished; else echo pending; fi
    return
  fi

  trustd_started_at="$(to_epoch "$(grep -m1 "$TRUSTD_START_MARKER" <<<"$since_trustd_start")")"
  trustd_started_at="${trustd_started_at:-$WAIT_STARTED_AT}"
  if (($(date +%s) - trustd_started_at >= START_DEADLINE)); then echo not-started; else echo pending; fi
}

WAIT_STARTED_AT="$(date +%s)"
pending=()
for ((i = 1; i <= N; i++)); do pending+=("$i"); done

while ((${#pending[@]} > 0)); do
  waited=$(($(date +%s) - WAIT_STARTED_AT))
  if ((waited >= MAX_WAIT)); then
    for i in "${pending[@]}"; do
      echo "::warning::$(sim_name "$i") had not finished its trust store update after ${waited}s: its first TLS connections may fail"
    done
    exit 0
  fi

  still_pending=()
  for i in "${pending[@]}"; do
    name="$(sim_name "$i")"
    case "$(update_state "$name")" in
      finished) echo "✅ $name finished its trust store update (waited ${waited}s)" ;;
      not-started) echo "✅ $name has no trust store update to apply (waited ${waited}s)" ;;
      *) still_pending+=("$i") ;;
    esac
  done
  pending=(${still_pending[@]+"${still_pending[@]}"})
  if ((${#pending[@]} > 0)); then sleep "$POLL_INTERVAL"; fi
done

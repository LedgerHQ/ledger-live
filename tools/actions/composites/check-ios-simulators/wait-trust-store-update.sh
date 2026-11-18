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
# On CI the update started 56-220 s after trustd last started, on 35 of 42 simulators. Each finished
# update logs its own start offset, to show whether this still holds.
START_DEADLINE=240
# The longest update seen on CI blocked trust evaluations for 124 s.
MAX_WAIT=360
POLL_INTERVAL=5
LOG_SHOW_TIMEOUT=60

# Undocumented trustd log lines: a simulator whose logs have none of them gets a notice, since a
# rewording by a new runtime would otherwise turn this wait into a silent 240 s sleep.
START_MARKER="Pinning database should update"
# trustd logs this SecPinningDb line when the update fails, which it often does; otherwise the first
# evaluation answered after the start marker shows that it is over. Other SecPinningDb lines don't
# count: an iOS 26.2 runtime logs "error querying DB" on nearly every trust check.
END_MARKERS="SecPinningDb: unable to create pinning list|trustd returned"
TRUSTD_START_MARKER="Opening db with version"

if ((N < 1)); then
  echo "ℹ️ No simulators to wait for"
  exit 0
fi

if ! SIMCTL="$(xcrun -f simctl)"; then
  echo "::warning::simctl not found: Detox starts without waiting for the trust store update"
  exit 0
fi

source "$(dirname "${BASH_SOURCE[0]}")/simulator-helpers.sh"

to_epoch() {
  date -j -f "%Y-%m-%d %H:%M:%S" "${1:0:19}" +%s 2>/dev/null
}

remaining() {
  echo $((WAIT_STARTED_AT + MAX_WAIT - $(date +%s)))
}

# Returns non-zero when the query failed or was cut short: log show prints the oldest lines first,
# so a cut-off output lacks the newest ones. The query timeout never runs past the wait's deadline.
trust_logs() {
  local timeout output status
  timeout="$(remaining)"
  ((timeout < LOG_SHOW_TIMEOUT)) || timeout=$LOG_SHOW_TIMEOUT
  ((timeout > 0)) || return 1
  output="$(with_timeout "$timeout" "$SIMCTL" spawn "$1" log show --last 20m --style compact \
    --predicate "(process == \"trustd\" AND (eventMessage CONTAINS \"$TRUSTD_START_MARKER\" OR eventMessage CONTAINS \"$START_MARKER\" OR eventMessage CONTAINS \"SecPinningDb\")) OR eventMessage CONTAINS \"trustd returned\"" \
    2>/dev/null)"
  status=$?
  grep -E "^[0-9]{4}-" <<<"$output"
  return "$status"
}

# Lines from the last one matching $1, included. Empty when none matches.
from_last_match() {
  awk -v pattern="$1" '$0 ~ pattern { kept = ""; found = 1 } found { kept = kept $0 "\n" } END { printf "%s", kept }'
}

# The last "version N" on the last line matching $1: the version opened, or the one updated to.
last_version() {
  grep "$1" | tail -n 1 | grep -oE "version [0-9]+" | tail -n 1 | grep -oE "[0-9]+"
}

# Prints the state, then its detail:
#   finished <seconds from trustd start to update start, or ?>
#   up-to-date <version>     trustd restarted on the version an earlier update moved to
#   not-started <markers>    "markers" when the logs held a trustd start line
#   pending | query-failed
update_state() {
  local logs since_trustd_start since_update trustd_started_at update_started_at opened target
  if ! logs="$(trust_logs "$1")"; then
    echo query-failed
    return
  fi

  # A reboot by check-simulators.sh restarts trustd, and with it an unfinished update.
  since_trustd_start="$(from_last_match "$TRUSTD_START_MARKER" <<<"$logs")"
  [[ -n "$since_trustd_start" ]] || since_trustd_start="$logs"
  trustd_started_at="$(to_epoch "$(grep -m1 "$TRUSTD_START_MARKER" <<<"$since_trustd_start")")"

  since_update="$(from_last_match "$START_MARKER" <<<"$since_trustd_start")"
  if [[ -n "$since_update" ]]; then
    # grep reads all of its input: with -q it would exit early, tail would die of SIGPIPE, and
    # pipefail would turn a match into "pending".
    if tail -n +2 <<<"$since_update" | grep -E "$END_MARKERS" >/dev/null; then
      update_started_at="$(to_epoch "$since_update")"
      if [[ -n "$trustd_started_at" && -n "$update_started_at" ]]; then
        echo "finished $((update_started_at - trustd_started_at))"
      else
        echo "finished ?"
      fi
    else
      echo pending
    fi
    return
  fi

  # A trustd that restarted after an earlier update finished has nothing left to apply.
  opened="$(last_version "$TRUSTD_START_MARKER" <<<"$logs")"
  target="$(last_version "$START_MARKER" <<<"$logs")"
  if [[ -n "$opened" && -n "$target" ]] && ((opened >= target)); then
    echo "up-to-date $opened"
    return
  fi

  if (($(date +%s) - ${trustd_started_at:-$WAIT_STARTED_AT} < START_DEADLINE)); then
    echo pending
  elif [[ -n "$trustd_started_at" ]]; then
    echo "not-started markers"
  else
    echo "not-started"
  fi
}

WAIT_STARTED_AT="$(date +%s)"
pending=()
last_state=()
for ((i = 1; i <= N; i++)); do pending+=("$i"); done

warn_and_exit() {
  local waited=$(($(date +%s) - WAIT_STARTED_AT))
  for i in "$@"; do
    if [[ "${last_state[i]:-}" == query-failed ]]; then
      echo "::warning::$(sim_name "$i")'s trustd logs could not be read within ${waited}s: its first TLS connections may fail"
    else
      echo "::warning::$(sim_name "$i") had not finished its trust store update after ${waited}s: its first TLS connections may fail"
    fi
  done
  exit 0
}

while ((${#pending[@]} > 0)); do
  still_pending=()
  for i in "${pending[@]}"; do
    # Checked before each simulator: one slow log query must not push the wait past its deadline.
    if (($(remaining) <= 0)); then still_pending+=("$i"); continue; fi
    name="$(sim_name "$i")"
    waited=$(($(date +%s) - WAIT_STARTED_AT))
    read -r state detail <<<"$(update_state "$name")"
    last_state[i]="$state"
    case "$state" in
      finished)
        echo "✅ $name finished its trust store update (waited ${waited}s; it started ${detail}s after trustd)"
        ;;
      up-to-date)
        echo "✅ $name's trust store is already at version $detail (waited ${waited}s)"
        ;;
      not-started)
        echo "✅ $name has no trust store update to apply (waited ${waited}s)"
        if [[ "$detail" != markers ]]; then
          echo "::notice::$name's logs have none of the trustd lines this wait looks for: if a new simulator runtime reworded them, the wait no longer works"
        fi
        ;;
      *) still_pending+=("$i") ;;
    esac
  done
  pending=(${still_pending[@]+"${still_pending[@]}"})
  ((${#pending[@]} > 0)) || break

  left="$(remaining)"
  ((left > 0)) || warn_and_exit "${pending[@]}"
  ((left < POLL_INTERVAL)) || left=$POLL_INTERVAL
  sleep "$left"
done

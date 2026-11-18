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
# On CI the update started 49-220 s after trustd last started. Each finished update logs its own
# start offset, to show whether this still holds.
START_DEADLINE=240
# The longest update seen on CI blocked trust evaluations for 124 s.
MAX_WAIT=360
POLL_INTERVAL=5
LOG_SHOW_TIMEOUT=60

# Undocumented trustd log lines. When no simulator of the shard logs START_MARKER, a notice says so:
# a rewording by a new runtime would otherwise turn this wait into a silent 240 s sleep.
START_MARKER="Pinning database should update"
# trustd logs FAILED_UPDATE_MARKER when the update fails, which it often does; otherwise the first
# evaluation answered after the start marker shows that it is over. Other SecPinningDb lines don't
# count: an iOS 26.2 runtime logs "error querying DB" on nearly every trust check.
FAILED_UPDATE_MARKER="SecPinningDb: unable to create pinning list"
ANSWERED_MARKER="trustd returned"
END_MARKERS="$FAILED_UPDATE_MARKER|$ANSWERED_MARKER"
TRUSTD_START_MARKER="Opening db with version"

if ((N < 1)); then
  echo "ℹ️ No simulators to wait for"
  exit 0
fi

if ! SIMCTL="$(xcrun -f simctl)"; then
  echo "::warning::simctl not found: Detox starts without waiting for the trust store update"
  exit 0
fi

if ! source "$(dirname "${BASH_SOURCE[0]}")/simulator-helpers.sh"; then
  echo "::warning::simulator-helpers.sh not found: Detox starts without waiting for the trust store update"
  exit 0
fi

if ! LOGS_FILE="$(mktemp "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/trust-logs.XXXXXX")"; then
  echo "::warning::mktemp failed: Detox starts without waiting for the trust store update"
  exit 0
fi
trap 'rm -f "$LOGS_FILE"' EXIT

to_epoch() {
  date -j -f "%Y-%m-%d %H:%M:%S" "${1:0:19}" +%s 2>/dev/null
}

remaining() {
  echo $((WAIT_STARTED_AT + MAX_WAIT - $(date +%s)))
}

# Returns non-zero when the query failed or was cut short: log show prints the oldest lines first,
# so a cut-off output lacks the newest ones. The query timeout never runs past the wait's deadline.
# The output goes to a file rather than a `$(...)`, which would also wait for any process left
# holding it.
trust_logs() {
  local timeout status
  timeout="$(remaining)"
  ((timeout < LOG_SHOW_TIMEOUT)) || timeout=$LOG_SHOW_TIMEOUT
  ((timeout > 0)) || return 1
  with_timeout "$timeout" "$SIMCTL" spawn "$1" log show --last 20m --style compact \
    --predicate "(process == \"trustd\" AND (eventMessage CONTAINS \"$TRUSTD_START_MARKER\" OR eventMessage CONTAINS \"$START_MARKER\" OR eventMessage CONTAINS \"$FAILED_UPDATE_MARKER\")) OR eventMessage CONTAINS \"$ANSWERED_MARKER\"" \
    >"$LOGS_FILE" 2>/dev/null
  status=$?
  grep -E "^[0-9]{4}-" "$LOGS_FILE"
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
#   finished <seconds from trustd start to update start, or nothing when unknown>
#   up-to-date <version>     trustd restarted on the version an earlier update moved to
#   pending update           an update is under way
#   pending | not-started | query-failed
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
    if awk -v pattern="$END_MARKERS" 'NR > 1 && $0 ~ pattern { found = 1 } END { exit !found }' <<<"$since_update"; then
      update_started_at="$(to_epoch "$since_update")"
      if [[ -n "$trustd_started_at" && -n "$update_started_at" ]]; then
        echo "finished $((update_started_at - trustd_started_at))"
      else
        echo finished
      fi
    else
      echo pending update
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
  else
    echo not-started
  fi
}

WAIT_STARTED_AT="$(date +%s)"
pending=()
logs_read=()
any_update_seen=0
for ((i = 1; i <= N; i++)); do pending+=("$i"); done

finish() {
  if ((any_update_seen == 0)); then
    echo "::notice::No simulator logged \"$START_MARKER\": either this runtime needs no trust store update, or trustd reworded its log lines and this wait no longer works"
  fi
  exit 0
}

warn_and_finish() {
  local waited=$(($(date +%s) - WAIT_STARTED_AT))
  for i in "$@"; do
    if [[ -z "${logs_read[i]:-}" ]]; then
      echo "::warning::$(sim_name "$i")'s trustd logs could not be read within ${waited}s: its first TLS connections may fail"
    else
      echo "::warning::$(sim_name "$i") had not finished its trust store update after ${waited}s: its first TLS connections may fail"
    fi
  done
  finish
}

while ((${#pending[@]} > 0)); do
  still_pending=()
  for i in "${pending[@]}"; do
    # Checked before each simulator: one slow log query must not push the wait past its deadline.
    if (($(remaining) <= 0)); then still_pending+=("$i"); continue; fi
    name="$(sim_name "$i")"
    waited=$(($(date +%s) - WAIT_STARTED_AT))
    read -r state detail <<<"$(update_state "$name")"
    [[ "$state" == query-failed ]] || logs_read[i]=1
    [[ "$state" != finished && "$state" != up-to-date && "$detail" != update ]] || any_update_seen=1
    case "$state" in
      finished)
        if [[ -n "$detail" ]]; then
          echo "✅ $name finished its trust store update (waited ${waited}s; it started ${detail}s after trustd)"
        else
          echo "✅ $name finished its trust store update (waited ${waited}s; start offset unknown)"
        fi
        ;;
      up-to-date)
        echo "✅ $name's trust store is already at version $detail (waited ${waited}s)"
        ;;
      not-started)
        echo "✅ $name has no trust store update to apply (waited ${waited}s)"
        ;;
      *) still_pending+=("$i") ;;
    esac
  done
  pending=(${still_pending[@]+"${still_pending[@]}"})
  ((${#pending[@]} > 0)) || break

  left="$(remaining)"
  ((left > 0)) || warn_and_finish "${pending[@]}"
  ((left < POLL_INTERVAL)) || left=$POLL_INTERVAL
  sleep "$left"
done

finish

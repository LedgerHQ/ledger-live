#!/usr/bin/env bash
# Fails the job before Detox runs when a simulator from boot-ios-simulators-background cannot launch
# an app. Otherwise every spec on that simulator's Jest worker times out in launchApp, and the shard
# spends ~30 min reporting failures that say nothing about the app.
#
# Reads IOS_SIMULATOR_COUNT, IOS_SIMULATOR_BOOT_STATUS and IOS_SIMULATOR_BOOT_LOG, exported to the job
# by boot-ios-simulators-background.
set -uo pipefail

N="${IOS_SIMULATOR_COUNT:-}"
STATUS_FILE="${IOS_SIMULATOR_BOOT_STATUS:-}"
BOOT_LOG="${IOS_SIMULATOR_BOOT_LOG:-}"

# boot-simulators.sh starts before this step and writes STATUS_FILE within its 300 s budget, so
# this only runs out if the background boot died without writing it.
WAIT_TIMEOUT=360
PROBE_APP="com.apple.Preferences"
# The boot already launched an app on each simulator, so launches here take under a second on CI.
PROBE_TIMEOUT=30

fail() {
  echo "::error::$1"
  if [[ -f "$BOOT_LOG" ]]; then
    echo "::group::simulator-boot.log"
    cat "$BOOT_LOG"
    echo "::endgroup::"
  fi
  exit 1
}

if [[ -z "$N" || -z "$STATUS_FILE" ]]; then
  fail "No simulator boot to check: run boot-ios-simulators-background earlier in the job"
fi

# Called directly rather than through xcrun, so a timeout kills simctl itself.
SIMCTL="$(xcrun -f simctl)" || fail "simctl not found"

# macOS has no `timeout`: the alarm survives exec and its default action kills the command.
with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV or die "exec failed: $!\n"' "$seconds" "$@"
}

sim_name() {
  if [[ "$1" -eq 1 ]]; then echo "iOS Simulator"; else echo "iOS Simulator $1"; fi
}

can_launch_app() {
  with_timeout "$PROBE_TIMEOUT" "$SIMCTL" launch "$1" "$PROBE_APP" || return 1
  with_timeout "$PROBE_TIMEOUT" "$SIMCTL" terminate "$1" "$PROBE_APP" || true
}

waited=0
while [[ ! -f "$STATUS_FILE" ]]; do
  if ((waited >= WAIT_TIMEOUT)); then
    fail "The background simulator boot did not finish within ${WAIT_TIMEOUT}s"
  fi
  sleep 5
  waited=$((waited + 5))
done

# One ::warning:: per simulator rebooted and recovered, one ::error:: per simulator still unusable,
# written by the background boot, which cannot raise annotations itself.
if [[ -f "$STATUS_FILE.annotations" ]]; then
  cat "$STATUS_FILE.annotations"
fi

if [[ "$(cat "$STATUS_FILE")" != "0" ]]; then
  fail "Detox not started: the simulator boot left unusable simulators"
fi

# The boot already probed each simulator; probe again in case one died while the job was preparing.
unhealthy=()
for ((i = 1; i <= N; i++)); do
  name="$(sim_name "$i")"
  if can_launch_app "$name"; then
    echo "✅ $name launches apps"
  else
    unhealthy+=("$name")
  fi
done

if ((${#unhealthy[@]} > 0)); then
  fail "Simulators cannot launch apps: $(printf '"%s" ' "${unhealthy[@]}")"
fi

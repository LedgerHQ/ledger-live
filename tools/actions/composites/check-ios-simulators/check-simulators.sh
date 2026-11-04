#!/usr/bin/env bash
# Runs right before Detox: waits for boot-ios-simulators-background, then makes sure each simulator
# can launch an app. A simulator can reach "Booted" with SpringBoard never started (black screen);
# every app launch on it then hangs, so it gets one reboot. Fails the job when one is still unusable,
# since every spec on its Jest worker would otherwise time out in launchApp.
#
# The launches run here rather than in the background boot because a general-pool runner still
# building the job made them up to 10 times slower and failed healthy simulators.
#
# Reads IOS_SIMULATOR_COUNT, IOS_SIMULATOR_BOOT_STATUS and IOS_SIMULATOR_BOOT_LOG, exported to the job
# by boot-ios-simulators-background.
set -uo pipefail

N="${IOS_SIMULATOR_COUNT:-}"
STATUS_FILE="${IOS_SIMULATOR_BOOT_STATUS:-}"
BOOT_LOG="${IOS_SIMULATOR_BOOT_LOG:-}"

# boot-simulators.sh starts before this step and writes STATUS_FILE within its 480 s budget, so
# this only runs out if the background boot died without writing it.
WAIT_TIMEOUT=540
PROBE_APP="com.apple.Preferences"
# The first app launch after a boot can take ~30 s; later ones take under a second on an idle runner.
FIRST_PROBE_TIMEOUT=120
PROBE_TIMEOUT=60
SHUTDOWN_TIMEOUT=60
# A reboot takes 5-15 s; bootstatus waits forever on a wedged device.
BOOT_TIMEOUT=120

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

launch_timeout=$FIRST_PROBE_TIMEOUT

can_launch_app() {
  with_timeout "$launch_timeout" "$SIMCTL" launch "$1" "$PROBE_APP" || return 1
  # Only a launch that succeeded has paid the warm-up; a hang has not.
  launch_timeout=$PROBE_TIMEOUT
}

waited=0
while [[ ! -f "$STATUS_FILE" ]]; do
  if ((waited >= WAIT_TIMEOUT)); then
    fail "The background simulator boot did not finish within ${WAIT_TIMEOUT}s"
  fi
  sleep 5
  waited=$((waited + 5))
done

if [[ "$(cat "$STATUS_FILE")" != "0" ]]; then
  echo "ℹ️ The background boot left some simulators unfinished (see simulator-boot.log); probing them anyway"
fi

# Every simulator is probed before any reboot, so a healthy one's verdict never waits on a recovery.
needs_reboot=()
for ((i = 1; i <= N; i++)); do
  name="$(sim_name "$i")"
  if can_launch_app "$name"; then
    echo "✅ $name launches apps"
  else
    echo "⚠️ $name could not launch $PROBE_APP"
    needs_reboot[i]=1
  fi
done

# Annotations carry no title, so GitHub heads them with the job name, which includes the shard.
unhealthy=()
for ((i = 1; i <= N; i++)); do
  [[ -n "${needs_reboot[i]:-}" ]] || continue
  name="$(sim_name "$i")"
  echo "⚠️ Rebooting $name"
  with_timeout "$SHUTDOWN_TIMEOUT" "$SIMCTL" shutdown "$name" || echo "⚠️ shutdown failed for $name"
  with_timeout "$BOOT_TIMEOUT" "$SIMCTL" bootstatus "$name" -b || echo "⚠️ reboot failed for $name"
  if can_launch_app "$name"; then
    echo "::warning::$name was rebooted and recovered: it could not launch an app"
  else
    echo "::error::$name is unusable: it could not launch an app and still cannot launch apps after a reboot"
    unhealthy+=("$name")
  fi
done

if ((${#unhealthy[@]} > 0)); then
  fail "Detox not started: the simulator check left unusable simulators"
fi

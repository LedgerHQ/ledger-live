#!/usr/bin/env bash
# Boots the Detox simulators ("iOS Simulator", "iOS Simulator 2", …) and checks that each one can
# launch an app. A simulator can reach "Booted" with SpringBoard never started (black screen); every
# app launch on it then hangs, so it gets one reboot. Writes its exit code to STATUS_FILE, which
# check-ios-simulators waits for before Detox runs.
#
# Usage: boot-simulators.sh <worker_count> <status_file>
set -uo pipefail

N="$1"
STATUS_FILE="$2"
# Workflow commands in a background process never reach the job log, so check-ios-simulators prints
# this file in its own step, where GitHub turns the lines into run annotations.
ANNOTATIONS_FILE="$STATUS_FILE.annotations"
: > "$ANNOTATIONS_FILE"

PROBE_APP="com.apple.Preferences"
# On CI the first app launch in the VM pays a one-time ~30 s warm-up; later ones take a few seconds.
FIRST_PROBE_TIMEOUT=120
PROBE_TIMEOUT=30
SHUTDOWN_TIMEOUT=60
# A boot takes 5-30 s on CI; bootstatus waits forever on a wedged device.
BOOT_TIMEOUT=120
# check-ios-simulators starts after this script and waits BUDGET + 60 s for STATUS_FILE. Every
# command is cut short at DEADLINE, so the verdict comes from here rather than from that wait.
BUDGET=300
DEADLINE=$((SECONDS + BUDGET))

write_status() {
  local rc=$?
  echo "$rc" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
}
trap write_status EXIT

log() {
  echo "[$(date -u +%H:%M:%S)] $*"
}

# Usage: annotate <warning|error> <message>. Without a title, GitHub heads the annotation with the job
# name, which carries the shard.
annotate() {
  echo "::$1::$2" >> "$ANNOTATIONS_FILE"
}

# Called directly rather than through xcrun, so a timeout kills simctl itself.
SIMCTL="$(xcrun -f simctl)" || exit 1

# Runs a command for at most <seconds>, and never past DEADLINE. macOS has no `timeout`: the alarm
# survives exec and its default action kills the command.
with_timeout() {
  local seconds="$1"
  shift
  local remaining=$((DEADLINE - SECONDS))
  if ((remaining < seconds)); then
    seconds=$remaining
  fi
  if ((seconds <= 0)); then
    log "⚠️ ${BUDGET}s budget exhausted, skipping simctl $2 $3"
    return 1
  fi
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
  with_timeout "$PROBE_TIMEOUT" "$SIMCTL" terminate "$1" "$PROBE_APP" || true
}

for ((i = 1; i <= N; i++)); do
  with_timeout "$BOOT_TIMEOUT" "$SIMCTL" boot "$(sim_name "$i")" || true
done
# Indexed by simulator number, holding why it needs a reboot. A simulator that never finished
# booting goes straight to a reboot: probing it first would only spend the time its recovery needs.
needs_reboot=()
for ((i = 1; i <= N; i++)); do
  if ! with_timeout "$BOOT_TIMEOUT" "$SIMCTL" bootstatus "$(sim_name "$i")"; then
    log "⚠️ $(sim_name "$i") did not finish booting"
    needs_reboot[i]="did not finish booting"
  fi
done

# Every other simulator is probed before any reboot, so a slow recovery cannot use up their budget.
for ((i = 1; i <= N; i++)); do
  [[ -n "${needs_reboot[i]:-}" ]] && continue
  name="$(sim_name "$i")"
  if can_launch_app "$name"; then
    log "✅ $name launches apps"
  else
    log "⚠️ $name could not launch $PROBE_APP"
    needs_reboot[i]="could not launch an app"
  fi
done

unhealthy=()
for ((i = 1; i <= N; i++)); do
  [[ -n "${needs_reboot[i]:-}" ]] || continue
  name="$(sim_name "$i")"
  log "⚠️ Rebooting $name"
  with_timeout "$SHUTDOWN_TIMEOUT" "$SIMCTL" shutdown "$name" || log "⚠️ shutdown failed for $name"
  with_timeout "$BOOT_TIMEOUT" "$SIMCTL" bootstatus "$name" -b || log "⚠️ reboot failed for $name"
  if can_launch_app "$name"; then
    log "✅ $name launches apps after a reboot"
    annotate warning "$name was rebooted and recovered: it ${needs_reboot[i]}"
  else
    log "❌ $name still cannot launch apps after a reboot"
    annotate error "$name is unusable: it ${needs_reboot[i]} and still cannot launch apps after a reboot"
    unhealthy+=("$name")
  fi
done

if ((${#unhealthy[@]} > 0)); then
  log "❌ Unusable simulators: $(printf '"%s" ' "${unhealthy[@]}")"
  exit 1
fi
log "✅ All simulators booted"

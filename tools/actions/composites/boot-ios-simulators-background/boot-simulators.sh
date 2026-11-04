#!/usr/bin/env bash
# Boots the Detox simulators ("iOS Simulator", "iOS Simulator 2", …) and writes its exit code to
# STATUS_FILE when done. check-ios-simulators waits for that file, then makes sure each simulator can
# launch an app right before Detox runs, once the runner has stopped building the job.
#
# Usage: boot-simulators.sh <worker_count> <status_file>
set -uo pipefail

N="$1"
STATUS_FILE="$2"

# Limit for one simulator's boot or bootstatus: bootstatus waits forever on a wedged device.
BOOT_TIMEOUT=180
# Booting the simulators one after another took up to ~3.5 min on a busy general-pool runner.
# check-ios-simulators waits BUDGET + 60 s for STATUS_FILE, and every command here is cut short
# at DEADLINE.
BUDGET=480
DEADLINE=$((SECONDS + BUDGET))

write_status() {
  local rc=$?
  echo "$rc" > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"
}
trap write_status EXIT

log() {
  echo "[$(date -u +%H:%M:%S)] $*"
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

for ((i = 1; i <= N; i++)); do
  with_timeout "$BOOT_TIMEOUT" "$SIMCTL" boot "$(sim_name "$i")" || true
done

unbooted=0
for ((i = 1; i <= N; i++)); do
  if ! with_timeout "$BOOT_TIMEOUT" "$SIMCTL" bootstatus "$(sim_name "$i")"; then
    log "⚠️ $(sim_name "$i") did not finish booting"
    unbooted=$((unbooted + 1))
  fi
done

if ((unbooted > 0)); then
  exit 1
fi
log "✅ All simulators booted"

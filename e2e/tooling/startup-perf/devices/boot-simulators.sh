#!/usr/bin/env bash
# Creates and boots two simulators of the newest "iPhone N Pro", saves their ids as SIM_1 and SIM_2
# in GITHUB_ENV, and waits until the host is idle.
#
#   boot-simulators.sh
set -euo pipefail
: "${GITHUB_ENV:?}"

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BOOT_TIMEOUT_S=300
IDLE_WAIT_MAX_S=600

# simctl itself rather than xcrun, so the alarm kills it (macOS has no `timeout`).
simctl=$(xcrun -f simctl)
with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV or die "exec failed: $!\n"' "$seconds" "$@"
}

# A no-op on a fresh VM; on a reused one, a booted simulator would compete for the CPU.
xcrun simctl shutdown all || true
runtimes=$(xcrun simctl list runtimes iOS -j)
runtime=$(jq -r '[.runtimes[] | select(.isAvailable)] | last | .identifier' <<< "$runtimes")
# Newest "iPhone N Pro" of the runtime.
device_type=$(jq -r --arg rt "$runtime" '.runtimes[] | select(.identifier == $rt)
  | [.supportedDeviceTypes[] | select(.name | test("^iPhone [0-9]+ Pro$"))]
  | max_by(.name | capture("(?<n>[0-9]+)").n | tonumber) | .identifier' <<< "$runtimes")
if [[ -z "$device_type" || "$device_type" == null ]]; then
  echo "::error::no iPhone Pro device type for $runtime"
  exit 1
fi
echo "Runtime $runtime, device type $device_type"

# The Measure step reads the ids from GITHUB_ENV.
udids=()
for n in 1 2; do
  udid=$(xcrun simctl create "Startup Perf $n" "$device_type" "$runtime")
  echo "SIM_$n=$udid" >> "$GITHUB_ENV"
  udids+=("$udid")
done
for udid in "${udids[@]}"; do
  with_timeout "$BOOT_TIMEOUT_S" "$simctl" boot "$udid"
  with_timeout "$BOOT_TIMEOUT_S" "$simctl" bootstatus "$udid" -b
done

# bootstatus returns before first-boot work ends: the host load still rose 60 s later.
bash "$script_dir/wait-for-idle-host.sh" "$IDLE_WAIT_MAX_S"

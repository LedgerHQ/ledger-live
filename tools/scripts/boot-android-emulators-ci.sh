#!/usr/bin/env bash
# Boots three Android emulators in parallel for mobile E2E CI (Detox workers).
#
# Required environment:
#   AVD_NAME — base AVD name; also starts "${AVD_NAME}_2" and "${AVD_NAME}_3" (see duplicate-avd step).
#
# Optional environment:
#   AVD_OPTIONS       — extra emulator flags (word-split like the workflow; may be empty)
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554 emulator-5556 emulator-5558)
#
# Requires: ANDROID_HOME, adb on PATH

set -uo pipefail

# Derived from EMULATOR_SERIALS rather than fixed at 3, so the emulator count can be
# lowered for a run without editing this script. Three 2-vCPU emulators plus three Jest
# workers put the 8-vCPU runner at load 15-29, and qemu is crashing under that; being
# able to A/B the density is the point. Defaults are unchanged. See QAA-1497.
IFS=' ' read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"
readonly _EXPECTED_EMULATOR_COUNT="${#SERIALS[@]}"
if [[ "$_EXPECTED_EMULATOR_COUNT" -lt 1 ]]; then
  echo "ERROR: EMULATOR_SERIALS must name at least one serial"
  exit 1
fi

log() {
  echo "[$(date +%H:%M:%S)] $*"
}

ts() {
  local tag=$1
  while IFS= read -r line; do
    echo "[$(date +%H:%M:%S)] [$tag] $line"
  done
}

wait_boot_completed() {
  local serial=$1
  adb -s "$serial" wait-for-device shell "while [ \"\$(getprop sys.boot_completed)\" != 1 ]; do sleep 1; done"
}

disable_ui_animations() {
  local serial=$1
  adb -s "$serial" shell settings put global window_animation_scale 0
  adb -s "$serial" shell settings put global transition_animation_scale 0
  adb -s "$serial" shell settings put global animator_duration_scale 0
}

: "${AVD_NAME:?AVD_NAME is required}"
: "${ANDROID_HOME:?ANDROID_HOME is required}"

# One AVD per requested serial: "$AVD_NAME", then "${AVD_NAME}_2", "${AVD_NAME}_3", …
AVD_NAMES=("$AVD_NAME")
for ((n = 2; n <= _EXPECTED_EMULATOR_COUNT; n++)); do
  AVD_NAMES+=("${AVD_NAME}_${n}")
done

log "🛫 Starting emulators..."
i=1
for avd in "${AVD_NAMES[@]}"; do
  # shellcheck disable=SC2086
  "$ANDROID_HOME/emulator/emulator" -avd "$avd" ${AVD_OPTIONS:-} -no-snapshot-save 2>&1 | ts "EMU$i" &
  i=$((i + 1))
done

log "⏳ Waiting for $_EXPECTED_EMULATOR_COUNT emulators to connect..."
while [[ "$(adb devices 2>/dev/null | grep -c emulator || true)" -lt "$_EXPECTED_EMULATOR_COUNT" ]]; do
  sleep 2
done
log "✅ $_EXPECTED_EMULATOR_COUNT emulators connected"

log "⏳ Waiting for all emulators to finish booting..."
for serial in "${SERIALS[@]}"; do
  wait_boot_completed "$serial"
  log "✅ $serial booted"
done
log "✅ All $_EXPECTED_EMULATOR_COUNT emulators are fully booted"

for serial in "${SERIALS[@]}"; do
  disable_ui_animations "$serial"
done

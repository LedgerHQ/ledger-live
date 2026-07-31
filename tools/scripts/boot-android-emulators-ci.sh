#!/usr/bin/env bash
# Boots N Android emulators in parallel for mobile E2E CI (Detox workers).
#
# Required environment:
#   AVD_NAME — base AVD name; also starts "${AVD_NAME}_2" … "${AVD_NAME}_N" when N > 1
#              (see duplicate-avd step).
#
# Optional environment:
#   E2E_WORKER_COUNT  — number of emulators to boot (default: 3, max: 3)
#   AVD_OPTIONS       — extra emulator flags (word-split like the workflow; may be empty)
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554, emulator-5556, …)
#
# Requires: ANDROID_HOME, adb on PATH

set -uo pipefail

readonly _MAX_WORKER_COUNT=3
readonly _WORKER_COUNT="${E2E_WORKER_COUNT:-3}"

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

if ! [[ "$_WORKER_COUNT" =~ ^[1-9][0-9]*$ ]]; then
  log "ERROR: E2E_WORKER_COUNT must be a positive integer, got: $_WORKER_COUNT"
  exit 1
fi
if [ "$_WORKER_COUNT" -gt "$_MAX_WORKER_COUNT" ]; then
  log "ERROR: E2E_WORKER_COUNT max is $_MAX_WORKER_COUNT (detox.config.js device limit)"
  exit 1
fi

: "${AVD_NAME:?AVD_NAME is required}"
: "${ANDROID_HOME:?ANDROID_HOME is required}"

if [ -n "${EMULATOR_SERIALS:-}" ]; then
  IFS=' ' read -r -a SERIALS <<<"$EMULATOR_SERIALS"
else
  SERIALS=()
  for ((i = 0; i < _WORKER_COUNT; i++)); do
    SERIALS+=("emulator-$((5554 + 2 * i))")
  done
fi

if [[ "${#SERIALS[@]}" -ne "$_WORKER_COUNT" ]]; then
  log "ERROR: expected $_WORKER_COUNT serials in EMULATOR_SERIALS, got ${#SERIALS[@]}"
  exit 1
fi

AVD_NAMES=("$AVD_NAME")
for ((i = 2; i <= _WORKER_COUNT; i++)); do
  AVD_NAMES+=("${AVD_NAME}_${i}")
done

log "🛫 Starting $_WORKER_COUNT emulator(s)..."
i=1
for avd in "${AVD_NAMES[@]}"; do
  # shellcheck disable=SC2086
  "$ANDROID_HOME/emulator/emulator" -avd "$avd" ${AVD_OPTIONS:-} -no-snapshot-save 2>&1 | ts "EMU$i" &
  i=$((i + 1))
done

log "⏳ Waiting for $_WORKER_COUNT emulator(s) to connect..."
while [[ "$(adb devices 2>/dev/null | grep -c emulator || true)" -lt "$_WORKER_COUNT" ]]; do
  sleep 2
done
log "✅ $_WORKER_COUNT emulator(s) connected"

log "⏳ Waiting for all emulators to finish booting..."
for serial in "${SERIALS[@]}"; do
  wait_boot_completed "$serial"
  log "✅ $serial booted"
done
log "✅ All $_WORKER_COUNT emulator(s) are fully booted"

for serial in "${SERIALS[@]}"; do
  disable_ui_animations "$serial"
done

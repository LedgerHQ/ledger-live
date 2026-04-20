#!/usr/bin/env bash
# Boots four Android emulators in parallel for mobile E2E CI (Detox workers).
#
# Required environment:
#   AVD_NAME — base AVD name; also starts "${AVD_NAME}_2", "${AVD_NAME}_3", and "${AVD_NAME}_4" (see duplicate-avd step).
#
# Optional environment:
#   AVD_OPTIONS       — extra emulator flags (word-split like the workflow; may be empty)
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554 emulator-5556 emulator-5558 emulator-5560)
#   LOGCAT_DIR        — directory for per-emulator logcat files (default: e2e/mobile/artifacts)
#
# Requires: ANDROID_HOME, adb on PATH

set -uo pipefail

readonly _EXPECTED_EMULATOR_COUNT=4

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

IFS=' ' read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558 emulator-5560}"
if [[ "${#SERIALS[@]}" -ne "$_EXPECTED_EMULATOR_COUNT" ]]; then
  log "ERROR: expected $_EXPECTED_EMULATOR_COUNT serials in EMULATOR_SERIALS, got ${#SERIALS[@]}"
  exit 1
fi

AVD_NAMES=("$AVD_NAME" "${AVD_NAME}_2" "${AVD_NAME}_3" "${AVD_NAME}_4")

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

LOGCAT_DIR="${LOGCAT_DIR:-e2e/mobile/artifacts}"
mkdir -p "$LOGCAT_DIR"
for serial in "${SERIALS[@]}"; do
  logfile="${LOGCAT_DIR}/logcat-${serial}.log"
  log "📝 Starting logcat for $serial → $logfile"
  # nohup so logcat survives the boot script exiting (same pattern as workflow nohup bash … &).
  nohup adb -s "$serial" logcat -v threadtime >"$logfile" 2>&1 &
done

log "⏳ Waiting for all emulators to finish booting..."
for serial in "${SERIALS[@]}"; do
  wait_boot_completed "$serial"
  log "✅ $serial booted"
done
log "✅ All $_EXPECTED_EMULATOR_COUNT emulators are fully booted"

for serial in "${SERIALS[@]}"; do
  disable_ui_animations "$serial"
done

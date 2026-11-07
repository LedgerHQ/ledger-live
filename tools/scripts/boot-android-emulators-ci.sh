#!/usr/bin/env bash
# Boots three Android emulators in parallel for mobile E2E CI (Detox workers).
#
# Required environment:
#   AVD_NAME — base AVD name; also starts "${AVD_NAME}_2" and "${AVD_NAME}_3" (see duplicate-avd step).
#
# Optional environment:
#   AVD_OPTIONS       — extra emulator flags (word-split like the workflow; may be empty)
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554 emulator-5556 emulator-5558)
#   EMULATOR_CORE_DUMPS — non-empty to keep qemu core dumps (emulator diagnostics)
#
# Requires: ANDROID_HOME, adb on PATH, prlimit

set -uo pipefail

readonly _EXPECTED_EMULATOR_COUNT=3

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

# The emulated Wi-Fi delays every packet the guest receives by 100–300 ms; cellular does not.
use_cellular_network() {
  local serial=$1 dump net
  adb -s "$serial" shell svc wifi disable
  for _ in $(seq 30); do
    dump=$(adb -s "$serial" shell dumpsys connectivity)
    net=$(sed -n 's/.*Active default network: \([0-9]*\).*/\1/p' <<<"$dump")
    if [[ -n "$net" && "$(grep -F "NetworkAgentInfo{network{$net}" <<<"$dump")" == *"Transports: CELLULAR"* ]]; then
      log "📶 $serial is on cellular"
      return 0
    fi
    sleep 2
  done
  log "⚠️ $serial is not on cellular after 60 s"
}

: "${AVD_NAME:?AVD_NAME is required}"
: "${ANDROID_HOME:?ANDROID_HOME is required}"

# QAA-1509: a crashed qemu otherwise stays attached for up to a minute while it pipes a ~1 GB core
# to systemd-coredump. The kernel skips piped core dumps when RLIMIT_CORE is exactly 1 byte.
if [[ -n "${EMULATOR_CORE_DUMPS:-}" ]]; then
  log "🧯 Emulator core dumps on"
elif prlimit --pid $$ --core=1; then
  log "🧯 Emulator core dumps off"
else
  log "⚠️ Could not disable emulator core dumps"
fi

IFS=' ' read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"
if [[ "${#SERIALS[@]}" -ne "$_EXPECTED_EMULATOR_COUNT" ]]; then
  log "ERROR: expected $_EXPECTED_EMULATOR_COUNT serials in EMULATOR_SERIALS, got ${#SERIALS[@]}"
  exit 1
fi

AVD_NAMES=("$AVD_NAME" "${AVD_NAME}_2" "${AVD_NAME}_3")

GPU_EXPERIMENT="${EMULATOR_GPU_EXPERIMENT:-none}"
if [[ "$GPU_EXPERIMENT" == swangle ]]; then
  AVD_OPTIONS="${AVD_OPTIONS:-}"
  AVD_OPTIONS="${AVD_OPTIONS/-gpu swiftshader_indirect/-gpu swangle_indirect}"
fi
log "🧪 GPU experiment: $GPU_EXPERIMENT, options: ${AVD_OPTIONS:-}"

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
  use_cellular_network "$serial"
  if [[ "$GPU_EXPERIMENT" == hwui-gl ]]; then
    adb -s "$serial" shell setprop debug.hwui.renderer skiagl
    log "🧪 $serial debug.hwui.renderer=$(adb -s "$serial" shell getprop debug.hwui.renderer)"
  fi
  if [[ "$GPU_EXPERIMENT" == hwui-vk ]]; then
    adb -s "$serial" shell setprop debug.hwui.renderer skiavk
    log "🧪 $serial debug.hwui.renderer=$(adb -s "$serial" shell getprop debug.hwui.renderer)"
  fi
  if [[ "$GPU_EXPERIMENT" == webview-novulkan ]]; then
    adb -s "$serial" shell "echo '_ --disable-features=Vulkan' > /data/local/tmp/webview-command-line"
    log "🧪 $serial webview-command-line: $(adb -s "$serial" shell cat /data/local/tmp/webview-command-line)"
  fi
  log "✅ $serial booted"
done
log "✅ All $_EXPECTED_EMULATOR_COUNT emulators are fully booted"

for serial in "${SERIALS[@]}"; do
  disable_ui_animations "$serial"
done

GPU_LOG_DIR="${MOBILE_ARTIFACTS_ROOT:-e2e/mobile/artifacts}"
for serial in "${SERIALS[@]}"; do
  log "🔎 $serial ro.debuggable=$(adb -s "$serial" shell getprop ro.debuggable)" \
    "ro.hwui.use_vulkan=$(adb -s "$serial" shell getprop ro.hwui.use_vulkan)" \
    "debug.hwui.renderer=$(adb -s "$serial" shell getprop debug.hwui.renderer)" \
    "systemui $(adb -s "$serial" shell dumpsys gfxinfo com.android.systemui | grep -m1 Pipeline)"
  adb -s "$serial" logcat -v time 2>/dev/null \
    | grep --line-buffered -iE "webview-command-line|command.?line|vulkan|angle" \
      >"$GPU_LOG_DIR/logcat-gpu-$serial.log" &
done
while true; do
  for serial in "${SERIALS[@]}"; do
    pipeline=$(adb -s "$serial" shell dumpsys gfxinfo com.ledger.live.detox 2>/dev/null | grep -m1 Pipeline)
    if [[ -n "$pipeline" ]]; then
      echo "[$(date +%H:%M:%S)] $serial app $pipeline" >>"$GPU_LOG_DIR/hwui-pipeline.log"
    fi
  done
  sleep 20
done &

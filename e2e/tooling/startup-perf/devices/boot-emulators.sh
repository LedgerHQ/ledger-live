#!/usr/bin/env bash
# Boots the two Android emulators the measurement alternates on (emulator-5554 and emulator-5556)
# and waits until both are on cellular and idle. Run from the repo root, after the AVD and its
# copy exist (AVD_NAME, AVD_NAME_2):
#
#   boot-emulators.sh <log_dir>
set -euo pipefail
: "${ANDROID_HOME:?}" "${AVD_NAME:?}" "${PERF_AVD_CORES:?}"

log_dir="${1:?log directory}"
read -ra avd_options <<< "${AVD_OPTIONS:-}"
BOOT_TIMEOUT_S=900
CELLULAR_POLLS=30
IDLE_TIMEOUT_S=900
IDLE_POLL_S=15

# Cold boot: the cached snapshot was taken with 2 cores and cannot be loaded with 4.
start_emulator() {
  local avd="$1" port="$2" log="$3"
  nohup "$ANDROID_HOME/emulator/emulator" -avd "$avd" -port "$port" "${avd_options[@]}" \
    -no-snapshot-load -no-snapshot-save -cores "$PERF_AVD_CORES" > "$log" 2>&1 &
}

prepare() {
  local serial="$1"
  timeout "$BOOT_TIMEOUT_S" adb -s "$serial" wait-for-device
  timeout "$BOOT_TIMEOUT_S" adb -s "$serial" shell \
    'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 2; done'
  # The cached AVD was saved with animations off; a user's phone has them on.
  for key in window_animation_scale transition_animation_scale animator_duration_scale; do
    adb -s "$serial" shell settings put global "$key" 1
  done
  # Screen on and unlocked for the whole run, as Detox ensures for E2E.
  adb -s "$serial" shell input keyevent KEYCODE_WAKEUP
  adb -s "$serial" shell locksettings set-disabled true || true
  adb -s "$serial" shell wm dismiss-keyguard
  adb -s "$serial" shell settings put global stay_on_while_plugged_in 3
  adb -s "$serial" shell settings put system screen_off_timeout 2147483647
  echo "$serial booted, $(adb -s "$serial" shell nproc | tr -d '\r') CPUs"
}

# Cellular like the E2E emulators (tools/scripts/boot-android-emulators-ci.sh).
switch_to_cellular() {
  local serial="$1" dump net
  adb -s "$serial" shell svc wifi disable
  for _ in $(seq "$CELLULAR_POLLS"); do
    dump=$(adb -s "$serial" shell dumpsys connectivity)
    net=$(sed -n 's/.*Active default network: \([0-9]*\).*/\1/p' <<< "$dump" | head -1)
    if [[ -n "$net" && "$(grep -F "NetworkAgentInfo{network{$net}" <<< "$dump")" == *"Transports: CELLULAR"* ]]; then
      echo "$serial is on cellular"
      return 0
    fi
    sleep 2
  done
  echo "::warning title=Emulator not on cellular::$serial is not on cellular after $((CELLULAR_POLLS * 2)) s"
}

# Waits for a load average below 1, until the shared deadline.
wait_until_idle() {
  local serial="$1" deadline="$2" load=""
  while ((SECONDS < deadline)); do
    load=$(adb -s "$serial" shell cat /proc/loadavg | cut -d' ' -f1)
    if awk -v l="$load" 'BEGIN { exit !(l < 1.0) }'; then
      return 0
    fi
    echo "$serial load $load, waiting"
    sleep "$IDLE_POLL_S"
  done
  echo "::warning title=Emulator not idle::$serial load average still ${load:-unknown} after $((IDLE_TIMEOUT_S / 60)) min; measuring anyway"
}

# Experiment: each emulator's vCPU threads (the threads that count guest time, /proc stat field 43)
# on the first PERF_AVD_CORES runner CPUs, its other threads (lavapipe, render, qemu) on the rest.
# Threads started later take the CPUs of the thread that starts them.
pin_emulator_threads() {
  local last=$(($(nproc) - 1)) vcpu_cpus="0-$((PERF_AVD_CORES - 1))" pid task tid guest vcpus others
  local other_cpus="$PERF_AVD_CORES-$last"
  if ((last < PERF_AVD_CORES)); then
    echo "::warning title=Threads not pinned::$((last + 1)) runner CPUs for $PERF_AVD_CORES vCPUs"
    return 0
  fi
  for pid in $(pgrep -f qemu-system); do
    vcpus=0
    others=0
    for task in /proc/"$pid"/task/*; do
      tid="${task##*/}"
      guest=$(sed 's/.*) //' "$task/stat" 2> /dev/null | awk '{print $41}') || continue
      if ((${guest:-0} > 0)); then
        taskset -p -c "$vcpu_cpus" "$tid" > /dev/null && vcpus=$((vcpus + 1))
      else
        taskset -p -c "$other_cpus" "$tid" > /dev/null && others=$((others + 1))
      fi
    done
    echo "qemu $pid: $vcpus vCPU threads on CPUs $vcpu_cpus, $others other threads on $other_cpus"
  done
}

tools/scripts/cleanup-android-emulators.sh || true
mkdir -p "$log_dir"
start_emulator "$AVD_NAME" 5554 "$log_dir/emulator-1.log"
start_emulator "${AVD_NAME}_2" 5556 "$log_dir/emulator-2.log"
for serial in emulator-5554 emulator-5556; do prepare "$serial"; done
for serial in emulator-5554 emulator-5556; do switch_to_cellular "$serial"; done
deadline=$((SECONDS + IDLE_TIMEOUT_S))
for serial in emulator-5554 emulator-5556; do wait_until_idle "$serial" "$deadline"; done
pin_emulator_threads
adb devices

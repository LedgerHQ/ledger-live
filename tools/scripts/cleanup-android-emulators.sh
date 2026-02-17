#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="cleanup-android-emulators"
echo "[$SCRIPT_NAME] Starting cleanup..."

echo "== adb devices =="
if command -v adb &> /dev/null; then
  adb devices || true
  echo "== Killing running emulators via adb =="
  adb devices | awk '$1 ~ /^emulator-/ {print $1}' | while read -r serial; do
    echo "Killing $serial"
    adb -s "$serial" emu kill || true
  done
else
  echo "adb not found, skipping adb cleanup"
fi

echo "== Killing leftover emulator/qemu processes (runner hygiene) =="
if [[ -n "${ANDROID_HOME:-}" ]]; then
  pkill -f "$ANDROID_HOME/emulator/emulator" || true
fi
pkill -f "qemu-system" || true
pkill -f "crashpad_handler" || true

echo "== Removing stale AVD lock files (safe on CI) =="
rm -f ~/.android/avd/*.avd/*.lock || true

# Give the OS a moment to release ports/locks
sleep 5

echo "[$SCRIPT_NAME] Cleanup completed successfully!"

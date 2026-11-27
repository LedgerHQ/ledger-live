#!/usr/bin/env bash
# Prepare the booted E2E emulator before its quick-boot snapshot is saved, so every shard
# restores a guest that is already configured instead of redoing it after boot.
#
# Usage: slim-guest.sh   (one emulator attached to adb)
set -uo pipefail

log() {
  echo "[slim-guest $(date +%H:%M:%S)] $*"
}

# Apps the E2E tests never open. Kept: GMS (Firebase), the WebView provider (live apps),
# Chrome, and com.google.android.bluetooth, whose loss stops Android 16+ from booting.
readonly UNUSED_PACKAGES=(
  com.android.bips
  com.android.camera2
  com.android.DeviceAsWebcam
  com.android.emulator.multidisplay
  com.android.printspooler
  com.google.android.apps.accessibility.voiceaccess
  com.google.android.apps.docs
  com.google.android.apps.maps
  com.google.android.apps.messaging
  com.google.android.apps.photos
  com.google.android.apps.safetyhub
  com.google.android.apps.wellbeing
  com.google.android.apps.youtube.music
  com.google.android.calculator
  com.google.android.calendar
  com.google.android.contacts
  com.google.android.deskclock
  com.google.android.dialer
  com.google.android.googlequicksearchbox
  com.google.android.markup
  com.google.android.printservice.recommendation
  com.google.android.settings.intelligence
  com.google.android.tts
  com.google.android.youtube
)

adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'

enabled_before=$(adb shell pm list packages -e | tr -d '\r')
log "$(wc -l <<<"$enabled_before") packages enabled"

for pkg in "${UNUSED_PACKAGES[@]}"; do
  if grep -qx "package:${pkg}" <<<"$enabled_before"; then
    if adb shell pm disable-user --user 0 "$pkg" >/dev/null; then
      log "disabled $pkg"
    else
      log "could not disable $pkg"
    fi
  fi
done

log "turning off animations and the install-time package verifier"
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb shell settings put global package_verifier_enable 0
adb shell settings put global verifier_verify_adb_installs 0

# The emulated Wi-Fi delays every packet the guest receives by 100–300 ms; cellular does not.
adb shell svc wifi disable
log "Wi-Fi off"

log "$(adb shell pm list packages -e | wc -l) packages enabled"
log "packages left enabled:"
adb shell pm list packages -e | tr -d '\r' | sed 's/^package:/  /' | sort

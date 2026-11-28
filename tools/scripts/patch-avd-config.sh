#!/usr/bin/env bash
# Normalize AVD config.ini: cameras off, no sdcard.* lines.
# Intended after AVD files exist (e.g. pre-emulator-launch).
#
# Usage:
#   patch-avd-config.sh <avd-name>
set -euo pipefail

arg=${1:?usage: patch-avd-config.sh <avd-name>}

avd_root="${ANDROID_AVD_HOME:-$HOME/.android/avd}"
cfg="${avd_root}/${arg}.avd/config.ini"

[[ -f "$cfg" ]] || exit 0

tmp=$(mktemp)
{ grep -v '^hw\.camera\.back=' "$cfg" | grep -v '^hw\.camera\.front=' | grep -v '^sdcard\.' || true; } >"$tmp"
printf '%s\n' 'hw.camera.back=none' 'hw.camera.front=none' >>"$tmp"

# Optional screen override (AVD_LCD_WIDTH/HEIGHT/DENSITY from avd.env).
if [[ -n "${AVD_LCD_WIDTH:-}" && -n "${AVD_LCD_HEIGHT:-}" && -n "${AVD_LCD_DENSITY:-}" ]]; then
  lcd=$(mktemp)
  { grep -vE '^(hw\.lcd\.(width|height|density)|skin\.name)=' "$tmp" || true; } >"$lcd"
  printf '%s\n' "hw.lcd.width=${AVD_LCD_WIDTH}" "hw.lcd.height=${AVD_LCD_HEIGHT}" \
    "hw.lcd.density=${AVD_LCD_DENSITY}" "skin.name=${AVD_LCD_WIDTH}x${AVD_LCD_HEIGHT}" >>"$lcd"
  mv "$lcd" "$tmp"
fi
mv "$tmp" "$cfg"

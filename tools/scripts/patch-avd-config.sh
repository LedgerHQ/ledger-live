#!/usr/bin/env bash
# Normalize AVD config.ini: cameras off, no sdcard.* lines.
# Intended after AVD files exist (e.g. pre-emulator-launch).
#
# Usage:
#   patch-avd-source-config-ini.sh <avd-name>
set -euo pipefail

arg=${1:?usage: patch-avd-source-config-ini.sh <avd-name>}

avd_root="${ANDROID_AVD_HOME:-$HOME/.android/avd}"
cfg="${avd_root}/${arg}.avd/config.ini"

[[ -f "$cfg" ]] || exit 0

tmp=$(mktemp)
{ grep -v '^hw\.camera\.back=' "$cfg" | grep -v '^hw\.camera\.front=' | grep -v '^sdcard\.' || true; } >"$tmp"
printf '%s\n' 'hw.camera.back=none' 'hw.camera.front=none' >>"$tmp"
mv "$tmp" "$cfg"

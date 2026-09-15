#!/usr/bin/env bash
# Resolve which Speculos device each platform runs on, as step outputs.
#
# Scheduled nightlies pin one device per platform so the suite is exercised across the
# range over a week; every other trigger honours the speculos_device input for both.
#
# Env: GITHUB_OUTPUT, EVENT_NAME, SPECULOS_DEVICE_INPUT

set -euo pipefail

: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"

NIGHTLY_IOS_DEVICE="stax"
NIGHTLY_ANDROID_DEVICE="nanoX"

if [ "${EVENT_NAME:-}" = "schedule" ]; then
  IOS_DEVICE="$NIGHTLY_IOS_DEVICE"
  ANDROID_DEVICE="$NIGHTLY_ANDROID_DEVICE"
else
  IOS_DEVICE="${SPECULOS_DEVICE_INPUT:?SPECULOS_DEVICE_INPUT must be set}"
  ANDROID_DEVICE="$SPECULOS_DEVICE_INPUT"
fi

{
  echo "ios_device=$IOS_DEVICE"
  echo "android_device=$ANDROID_DEVICE"
} >> "$GITHUB_OUTPUT"

printf 'Speculos devices: iOS=%s Android=%s (event=%s)\n' \
  "$IOS_DEVICE" "$ANDROID_DEVICE" "${EVENT_NAME:-unknown}"

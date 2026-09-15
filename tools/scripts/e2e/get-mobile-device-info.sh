#!/usr/bin/env bash
# Resolve a human-readable DEVICE_INFO for the Slack/Allure report and publish it to
# $GITHUB_ENV. One script for both platforms so the two shard jobs stay symmetrical;
# the value itself necessarily differs (a booted simulator runtime vs the AVD profile).
#
# Env: PLATFORM (ios|android); then IOS_SIMULATOR_DEVICE, or AVD_PROFILE + AVD_API.

set -euo pipefail

: "${GITHUB_ENV:?GITHUB_ENV must be set}"

case "${PLATFORM:?PLATFORM must be set}" in
  ios)
    IOS_VERSION=$(xcrun simctl list runtimes iOS -j | jq -r '.runtimes[-1].version // "unknown"' || echo "unknown")
    echo "DEVICE_INFO=${IOS_SIMULATOR_DEVICE:-iPhone} (iOS ${IOS_VERSION})" >> "$GITHUB_ENV"
    ;;
  android)
    # pixel_9_pro -> Pixel 9 Pro
    DEVICE_NAME=$(printf '%s' "${AVD_PROFILE:?AVD_PROFILE must be set}" | sed 's/_/ /g; s/\b\w/\U&/g')
    echo "DEVICE_INFO=${DEVICE_NAME} (Android ${AVD_API:?AVD_API must be set})" >> "$GITHUB_ENV"
    ;;
  *)
    echo "::error::get-mobile-device-info: unknown PLATFORM '${PLATFORM}'"
    exit 1
    ;;
esac

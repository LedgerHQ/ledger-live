#!/usr/bin/env bash
# Shared platform helpers for the Maestro run scripts (sourced by run-eth.sh / run-send-doge.sh /
# run-swap.sh). Keeps the per-flow scripts identical across iOS and Android — only these functions
# branch on MAESTRO_PLATFORM. Everything else (harness, Speculos, bridge, flows) is shared.
#
# MAESTRO_PLATFORM = ios (default) | android
#
# Networking model (why the reverses below):
#   - bridge (wsPort): the app picks 10.0.2.2 on Android / localhost on iOS itself (client.ts), so
#     it reaches the host harness with no reverse.
#   - Metro (8081): the RN debug app loads JS from localhost:8081 on Android -> needs `adb reverse`.
#   - Speculos device-proxy: DEVICE_PROXY_URL = http://127.0.0.1:<speculosPort> (local Docker); on
#     Android that is reversed by the HARNESS (detox-stub.reverseTcpPort runs `adb reverse`) because
#     the port is dynamic. Remote Speculinho uses a real URL and needs no reverse.
#   - control endpoint (8100): only Maestro's JS (host) calls it -> no reverse.

MAESTRO_PLATFORM="${MAESTRO_PLATFORM:-ios}"
APP_ID="${APP_ID:-com.ledger.live.debug}"
ANDROID_SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="${ADB:-$ANDROID_SDK/platform-tools/adb}"
# Export ADB so the harness (detox-stub) reverses the dynamic Speculos port with the same binary.
export ADB MAESTRO_PLATFORM

platform_preflight_device() {
  case "$MAESTRO_PLATFORM" in
    ios)
      if ! xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
        echo "ERROR: No booted iOS simulator. Boot one: open Simulator.app (or maestro start-device --platform ios)."
        exit 1
      fi
      ;;
    android)
      [ -x "$ADB" ] || { echo "ERROR: adb not found at $ADB (set ANDROID_HOME or ADB)."; exit 1; }
      if ! "$ADB" devices | awk 'NR>1 && $2=="device"{f=1} END{exit !f}'; then
        echo "ERROR: No booted Android emulator/device. Boot one: $ANDROID_SDK/emulator/emulator -avd <name>"
        exit 1
      fi
      "$ADB" wait-for-device
      # Disable the "Try out your stylus" handwriting promo — on Android 14+ it pops as a system
      # dialog the moment a text field (e.g. the modular-drawer search) is focused, overlaying the UI
      # and blocking taps.
      "$ADB" shell settings put secure stylus_handwriting_enabled 0 >/dev/null 2>&1 || true
      platform_ensure_single_deeplink_handler
      ;;
    *) echo "ERROR: unknown MAESTRO_PLATFORM='$MAESTRO_PLATFORM' (use ios|android)."; exit 1 ;;
  esac
}

# Install the debug app onto the booted device if it isn't already there (Detox normally installs at
# test time; Maestro doesn't, so the run scripts do it). $1 = human label for the build command.
platform_install_app() {
  case "$MAESTRO_PLATFORM" in
    ios)
      xcrun simctl listapps booted 2>/dev/null | grep -q "$APP_ID" && return 0
      local app="../../apps/ledger-live-mobile/ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app"
      if [ -d "$app" ]; then
        echo ">> installing iOS app onto the booted simulator..."
        xcrun simctl install booted "$app"
      else
        echo "ERROR: app not installed and no build at $app. Run: pnpm e2e:mobile build:ios:debug"
        exit 1
      fi
      ;;
    android)
      "$ADB" shell pm list packages 2>/dev/null | grep -q "package:$APP_ID" && return 0
      local apk
      apk="$(ls -t ../../apps/ledger-live-mobile/android/app/build/outputs/apk/debug/*.apk 2>/dev/null | head -1)"
      if [ -n "$apk" ] && [ -f "$apk" ]; then
        echo ">> installing Android APK: $apk"
        "$ADB" install -r "$apk"
      else
        echo "ERROR: app not installed and no debug APK under android/app/build/outputs/apk/debug/. Run: pnpm e2e:mobile build:android:debug"
        exit 1
      fi
      ;;
  esac
}

# Android: the ledgerlive:// deeplink (used by some flows to open the accounts list, like Detox's
# openViaDeeplink) must resolve to a SINGLE app — otherwise Android pops an "Open with" chooser that
# the flow would have to click through. Leftover Detox app variants (com.ledger.live.detox[.test])
# also register the scheme; disable any handler that isn't our target app so the deeplink opens it
# directly. This is reversible: re-enable with `adb shell pm enable <pkg>`.
platform_ensure_single_deeplink_handler() {
  [ "$MAESTRO_PLATFORM" = "android" ] || return 0
  local pkg
  for pkg in $("$ADB" shell pm query-activities --components -a android.intent.action.VIEW \
    -d "ledgerlive://account" 2>/dev/null | sed 's#/.*##' | tr -d '\r' | sort -u); do
    [ -n "$pkg" ] && [ "$pkg" != "$APP_ID" ] || continue
    echo ">> disabling conflicting ledgerlive:// handler: $pkg (re-enable: adb shell pm enable $pkg)"
    "$ADB" shell pm disable-user --user 0 "$pkg" >/dev/null 2>&1 || true
  done
}

# Android-only: reverse the host ports the app reaches via localhost (Metro + the bridge as a
# belt-and-suspenders alongside 10.0.2.2). The dynamic Speculos port is reversed by the harness.
platform_reverse_host_ports() {
  [ "$MAESTRO_PLATFORM" = "android" ] || return 0
  echo ">> adb reverse: Metro 8081 + bridge ${MAESTRO_BRIDGE_PORT:-8099}"
  "$ADB" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
  "$ADB" reverse "tcp:${MAESTRO_BRIDGE_PORT:-8099}" "tcp:${MAESTRO_BRIDGE_PORT:-8099}" >/dev/null 2>&1 || true
}

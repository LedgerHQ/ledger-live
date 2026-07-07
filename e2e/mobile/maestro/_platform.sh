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
export ADB MAESTRO_PLATFORM APP_ID

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
      # Debug locally; Release/Staging in CI (the build reusable workflow ships Release-iphonesimulator).
      local app="" cfg products="../../apps/ledger-live-mobile/ios/build/Build/Products"
      for cfg in Debug Release Staging; do
        [ -d "$products/$cfg-iphonesimulator/ledgerlivemobile.app" ] && { app="$products/$cfg-iphonesimulator/ledgerlivemobile.app"; break; }
      done
      if [ -n "$app" ]; then
        echo ">> installing iOS app onto the booted simulator: $app"
        xcrun simctl install booted "$app"
      else
        echo "ERROR: no ledgerlivemobile.app under $products/{Debug,Release,Staging}-iphonesimulator/. Run: pnpm e2e:mobile build:ios:debug"
        exit 1
      fi
      ;;
    android)
      "$ADB" shell pm list packages 2>/dev/null | grep -q "package:$APP_ID" && return 0
      # debug locally; detox/detoxPreRelease in CI (the build reusable workflow ships the detox variant).
      local apk="" variant apks="../../apps/ledger-live-mobile/android/app/build/outputs/apk"
      for variant in debug detox detoxPreRelease; do
        apk="$(ls -t "$apks/$variant"/*.apk 2>/dev/null | head -1)"
        [ -n "$apk" ] && [ -f "$apk" ] && break
        apk=""
      done
      if [ -n "$apk" ]; then
        echo ">> installing Android APK: $apk"
        "$ADB" install -r "$apk"
      else
        echo "ERROR: no APK under $apks/{debug,detox,detoxPreRelease}/. Run: pnpm e2e:mobile build:android:debug"
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

# --- Backend harness (ts-node daemon) -------------------------------------------------------------
# The harness reuses the e2e/mobile bridge + Speculos seeding. It runs as a plain ts-node script (NOT
# a jest test): `ts-node --swc` transpiles via @swc/core, and `tsconfig-paths/register` resolves the
# package's `~/*` / `@shared/*` / `@ledgerhq/live-e2e-shared/*` aliases (+ the detox->stub remap) from
# maestro/harness/tsconfig.json. Mirrors the existing `e2e:loadConfig` ts-node bridge script.
HARNESS_ENTRY="maestro/harness/main.ts"
HARNESS_PROJECT="maestro/harness/tsconfig.json"
# Pattern the cleanup traps use to reap a detached harness if the PID-based kill misses it.
HARNESS_PKILL_PATTERN="ts-node .*${HARNESS_ENTRY}"

# Launch the harness in the background, redirecting its (verbose) logs to $1 unless VERBOSE=1.
# Sets HARNESS_PID in the caller's scope. $1 = log file path.
start_harness() {
  local logfile="$1"
  # The log lives under artifacts/, which doesn't exist on a clean checkout — create it so the
  # redirect below can't fail with "No such file or directory".
  mkdir -p "$(dirname "$logfile")"
  export TS_NODE_PROJECT="$HARNESS_PROJECT"
  if [ "${VERBOSE:-0}" = "1" ]; then
    pnpm exec ts-node --swc --require tsconfig-paths/register "$HARNESS_ENTRY" &
  else
    echo ">> harness backend logs -> e2e/mobile/$logfile (set VERBOSE=1 to stream them here)"
    pnpm exec ts-node --swc --require tsconfig-paths/register "$HARNESS_ENTRY" >"$logfile" 2>&1 &
  fi
  HARNESS_PID=$!
}

# --- Maestro run + Allure reporting --------------------------------------------------------------
MAESTRO_DEBUG_ROOT="${MAESTRO_DEBUG_ROOT:-artifacts/maestro-debug}"
MAESTRO_ALLURE_RESULTS="${MAESTRO_ALLURE_RESULTS:-artifacts/maestro-allure-results}"
MAESTRO_ALLURE_REPORT="${MAESTRO_ALLURE_REPORT:-artifacts/maestro-allure-report}"

# Run one Maestro flow, capturing the rich per-command trace + screenshots + maestro.log into a
# per-flow debug dir (so the Allure converter can read it). Writes meta.json with the context the
# converter needs (platform, appId, harness log). $1 = flow yaml; $@ = extra `maestro test` args.
# Returns Maestro's exit code (pipefail keeps it past the noise filter); callers guard with `|| rc=$?`.
run_maestro_flow() {
  local flow="$1"; shift
  local name; name="$(basename "$flow" .yaml)"
  local debug_dir="$MAESTRO_DEBUG_ROOT/$name"
  rm -rf "$debug_dir"; mkdir -p "$debug_dir"
  cat >"$debug_dir/meta.json" <<EOF
{"flow":"$name","platform":"$MAESTRO_PLATFORM","appId":"$APP_ID","speculosDevice":"${SPECULOS_DEVICE:-}","harnessLog":"${HARNESS_LOG:-}"}
EOF
  echo ">> running Maestro flow: $flow (debug -> e2e/mobile/$debug_dir)"
  # --debug-output gives commands JSON + maestro.log; --test-output-dir (same dir) adds screenshots;
  # --flatten-debug-output drops the per-run timestamp subfolder so the converter finds them.
  maestro test --platform "$MAESTRO_PLATFORM" --no-ansi \
    --debug-output "$debug_dir" --test-output-dir "$debug_dir" --flatten-debug-output \
    -e APP_ID="$APP_ID" \
    "$flow" "$@" 2>&1 | { grep -vaE "Running on (iOS Simulator|Android Emulator)" || true; }
}

# Convert every per-flow debug dir into Allure results, then build the HTML report. Safe to call even
# when a flow failed (the failure is captured in the report). No-op if there's no debug output.
generate_allure_report() {
  [ -d "$MAESTRO_DEBUG_ROOT" ] || { echo ">> no Maestro debug output to report on"; return 0; }
  echo ">> converting Maestro debug output -> Allure results ($MAESTRO_ALLURE_RESULTS)"
  MAESTRO_DEBUG_ROOT="$MAESTRO_DEBUG_ROOT" MAESTRO_ALLURE_RESULTS="$MAESTRO_ALLURE_RESULTS" \
    node maestro/reporting/maestro-to-allure.mjs || { echo "WARN: Allure conversion failed"; return 0; }
  if [ "${MAESTRO_ALLURE_HTML:-1}" = "1" ]; then
    echo ">> allure generate -> e2e/mobile/$MAESTRO_ALLURE_REPORT"
    pnpm exec allure generate "$MAESTRO_ALLURE_RESULTS" --clean -o "$MAESTRO_ALLURE_REPORT" || true
  fi
}

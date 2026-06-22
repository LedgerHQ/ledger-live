#!/usr/bin/env bash
#
# Orchestrates the Maestro ETH add-account POC:
#   1. preflight the prerequisites (fail fast with guidance)
#   2. start the backend harness (bridge [+ Speculos]) as a Jest process
#   3. run the Maestro flow (which launches the app pointed at the bridge)
#   4. tear the backend down on exit
#
# Usage:
#   bash maestro/run-eth.sh                  # full run (Speculos-backed)
#   MAESTRO_FULL=0 bash maestro/run-eth.sh   # seed-only smoke test (no Speculos)
#   bash maestro/run-eth.sh -d <udid>        # extra args forwarded to `maestro test`
#
# NOTE: ASCII only on purpose -- fancy glyphs broke variable parsing in some shells.
set -euo pipefail

# Run from the e2e/mobile package dir so userdata/ + Speculos + jest config resolve.
cd "$(dirname "$0")/.."

FULL="${MAESTRO_FULL:-1}"
export MAESTRO_FULL="$FULL"
export MAESTRO_BRIDGE_PORT="${MAESTRO_BRIDGE_PORT:-8099}"
export MOCK="${MOCK:-0}"
export SPECULOS_DEVICE="${SPECULOS_DEVICE:-nanoX}"
export SPECULOS_IMAGE_TAG="${SPECULOS_IMAGE_TAG:-ghcr.io/ledgerhq/speculos:latest}"
# Use the classic portfolio UI (the flow + testIDs in this POC were validated against it).
# Wallet 4.0 has a different layout; adapting the YAML to it is a follow-up.
export E2E_ENABLE_WALLET40="${E2E_ENABLE_WALLET40:-0}"

# --- Java (Maestro needs 17+; fall back to Android Studio's bundled JDK) ---
# NB: macOS ships a /usr/bin/java stub that exists but has no runtime, so test
# `java -version` actually working rather than `command -v java`.
if ! java -version >/dev/null 2>&1; then
  JBR="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  [ -d "$JBR" ] && export JAVA_HOME="$JBR" && export PATH="$JAVA_HOME/bin:$PATH"
fi
java -version >/dev/null 2>&1 || { echo "ERROR: Java 17+ not found (Maestro needs it). Install a JDK / set JAVA_HOME."; exit 1; }
command -v maestro >/dev/null 2>&1 || { echo "ERROR: maestro not found. Install: brew install maestro"; exit 1; }

# --- device + app preflight (iOS) ---
if ! xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
  echo "ERROR: No booted iOS simulator (this is the '0 devices' error)."
  echo "  Boot one, e.g.:  maestro start-device --platform ios   (or open Simulator.app)"
  exit 1
fi
if ! xcrun simctl listapps booted 2>/dev/null | grep -q "com.ledger.live.debug"; then
  # `build:ios:debug` only builds the .app; install it here (Detox normally installs at test time).
  APP_PATH="../../apps/ledger-live-mobile/ios/build/Build/Products/Debug-iphonesimulator/ledgerlivemobile.app"
  if [ -d "$APP_PATH" ]; then
    echo ">> installing built app onto the booted simulator..."
    xcrun simctl install booted "$APP_PATH"
  else
    echo "ERROR: Mock app not installed and no build found at:"
    echo "    $APP_PATH"
    echo "  Build it first (from repo root):  pnpm e2e:mobile build:ios:debug"
    echo "  (iOS debug also needs Metro running: pnpm mobile start)"
    exit 1
  fi
fi
if [ "$FULL" != "0" ] && ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker isn't running (needed for Speculos)."
  echo "  Start Docker (+ docker pull $SPECULOS_IMAGE_TAG), or run seed-only:  MAESTRO_FULL=0 $0"
  exit 1
fi
if [ "$FULL" != "0" ] && [ -z "${SEED:-}" ]; then
  echo "ERROR: SEED is not set (Speculos needs the test mnemonic to derive addresses)."
  echo "  export SEED=\"<24-word test mnemonic>\"  then re-run. (Sensitive -> keep it out of git.)"
  exit 1
fi

# Seed-only mode can't complete discovery (no device) -> run the smoke flow that
# stops after navigation. Full mode runs the complete ETH add-account flow.
FLOW="maestro/flows/add-account-eth.yaml"
[ "$FULL" = "0" ] && FLOW="maestro/flows/smoke-launch.yaml"

# Snapshot Speculos containers that already existed, so on exit we only remove the
# ones THIS run started (don't kill a Speculos you may be running elsewhere).
SPECULOS_FILTER="ancestor=$SPECULOS_IMAGE_TAG"
PRE_SPECULOS="$(docker ps -q --filter "$SPECULOS_FILTER" 2>/dev/null | tr '\n' ' ' || true)"

cleanup() {
  echo ">> stopping backend + Speculos..."
  # Kill the harness tree FIRST so jest can't be mid-managing Speculos while we remove
  # containers (otherwise it races with the framework's own async cleanup).
  if [ -n "${HARNESS_PID:-}" ]; then
    pkill -P "$HARNESS_PID" 2>/dev/null || true
    kill "$HARNESS_PID" 2>/dev/null || true
  fi
  pkill -f "jest --config maestro/harness/jest.config.js" 2>/dev/null || true
  [ -n "${HARNESS_PID:-}" ] && wait "$HARNESS_PID" 2>/dev/null || true
  # Now remove (synchronously) the Speculos containers started during this run.
  for c in $(docker ps -q --filter "$SPECULOS_FILTER" 2>/dev/null || true); do
    case " $PRE_SPECULOS " in
      *" $c "*) : ;;                                  # pre-existing -> leave it
      *) echo ">> removing Speculos container $c"; docker rm -f "$c" >/dev/null 2>&1 || true ;;
    esac
  done
}
trap cleanup EXIT

echo ">> starting backend harness (full=$FULL, port $MAESTRO_BRIDGE_PORT) via jest..."
# Quiet the verbose harness Jest output by default (it would drown the Maestro steps); VERBOSE=1 streams it.
HARNESS_LOG="artifacts/harness-add-account.log"
if [ "${VERBOSE:-0}" = "1" ]; then
  pnpm exec jest --config maestro/harness/jest.config.js --runInBand &
else
  echo ">> harness backend logs -> e2e/mobile/$HARNESS_LOG (set VERBOSE=1 to stream them here)"
  pnpm exec jest --config maestro/harness/jest.config.js --runInBand >"$HARNESS_LOG" 2>&1 &
fi
HARNESS_PID=$!

# Wait for the bridge port to open, then launch. In full mode the harness's Speculos
# registration polls the app (getEnvs), so the app MUST be able to connect during init;
# launch as soon as the port is open. The app boots to onboarding and switches to the
# portfolio once the seed (loadConfig) is applied (~1-2 min while Speculos boots).
echo ">> waiting for bridge on port $MAESTRO_BRIDGE_PORT ..."
for _ in $(seq 1 "${BACKEND_WAIT:-120}"); do
  nc -z localhost "$MAESTRO_BRIDGE_PORT" 2>/dev/null && break
  sleep 1
done

echo ">> running Maestro flow: $FLOW"
# --no-ansi: plain output (the default TUI redraws an ANSI box that garbles when logged).
# Drop the per-run "Running on iOS Simulator ..." device banner. pipefail (set above) keeps
# Maestro's exit code despite the trailing filter.
maestro test --no-ansi "$FLOW" "$@" 2>&1 | { grep -vaE "Running on (iOS Simulator|Android Emulator)" || true; }

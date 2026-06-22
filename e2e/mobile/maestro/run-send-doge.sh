#!/usr/bin/env bash
#
# Orchestrates the Maestro send-DOGE POC (Maestro port of Detox sendDOGE.spec.ts). Native flow:
# single Dogecoin Speculos (no Exchange handoff, no WebView). The harness seeds Dogecoin 1, derives
# the Dogecoin 2 recipient address (Maestro can't derive a device address), and signs on the device;
# Maestro drives the UI. The recipient address is read from the harness and passed via `-e RECIPIENT`.
#
# Usage:
#   SEED="..." SPECULINHO_URL=https://<host> bash maestro/run-send-doge.sh        # remote Speculos
#   REMOTE_SPECULOS=false SEED=... COINAPPS=/path bash maestro/run-send-doge.sh   # local Docker
set -euo pipefail

cd "$(dirname "$0")/.."

export MAESTRO_FLOW=send-doge
export MAESTRO_BRIDGE_PORT="${MAESTRO_BRIDGE_PORT:-8099}"
export MOCK="${MOCK:-0}"
export SPECULOS_DEVICE="${SPECULOS_DEVICE:-nanoX}"
export SPECULOS_IMAGE_TAG="${SPECULOS_IMAGE_TAG:-ghcr.io/ledgerhq/speculos:latest}"
# DETOX=1 in the harness/CLI env (the app's Config.DETOX is build-baked; this is harness-side).
export DETOX="${DETOX:-1}"
# Speculos backend (see run-swap.sh). Default to remote Speculinho — the device-signing concurrency
# (app DMK + harness polling) is proven reachable there. Set REMOTE_SPECULOS=false for local Docker.
export REMOTE_SPECULOS="${REMOTE_SPECULOS:-true}"
export DISABLE_TRANSACTION_BROADCAST="${DISABLE_TRANSACTION_BROADCAST:-1}"

IS_REMOTE=0
[ "$REMOTE_SPECULOS" = "true" ] && IS_REMOTE=1

FLOW="${SEND_FLOW:-maestro/flows/send-doge.yaml}"

# --- Java (Maestro needs 17+; macOS /usr/bin/java is a stub, so test `java -version`) ---
if ! java -version >/dev/null 2>&1; then
  JBR="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  [ -d "$JBR" ] && export JAVA_HOME="$JBR" && export PATH="$JAVA_HOME/bin:$PATH"
fi
java -version >/dev/null 2>&1 || { echo "ERROR: Java 17+ not found. Install a JDK / set JAVA_HOME."; exit 1; }
command -v maestro >/dev/null 2>&1 || { echo "ERROR: maestro not found. brew install maestro"; exit 1; }

# --- device + app preflight (platform-aware: iOS sim / Android emulator; see _platform.sh) ---
source "maestro/_platform.sh"
platform_preflight_device
platform_install_app

[ -n "${SEED:-}" ] || { echo "ERROR: SEED is not set (Speculos test mnemonic)."; exit 1; }
if [ "$IS_REMOTE" = "1" ]; then
  [ -n "${SPECULINHO_URL:-}" ] || {
    echo "ERROR: REMOTE_SPECULOS=true but SPECULINHO_URL is not set.";
    echo "  Set SPECULINHO_URL (Ledger internal; usually needs VPN), or use local Docker:";
    echo "    REMOTE_SPECULOS=false COINAPPS=/path/to/coin-apps bash maestro/run-send-doge.sh";
    exit 1;
  }
  echo ">> using REMOTE Speculos (Speculinho): $SPECULINHO_URL"
else
  docker info >/dev/null 2>&1 || { echo "ERROR: Docker isn't running (local Speculos). Or use REMOTE_SPECULOS=true."; exit 1; }
  [ -n "${COINAPPS:-}" ] && [ -d "${COINAPPS}" ] || { echo "ERROR: COINAPPS must point at a coin-apps clone (local Docker Speculos)."; exit 1; }
fi

# Snapshot pre-existing Speculos containers so we only remove the ones this run starts (local only).
SPECULOS_FILTER="ancestor=$SPECULOS_IMAGE_TAG"
PRE_SPECULOS=""
[ "$IS_REMOTE" = "0" ] && PRE_SPECULOS="$(docker ps -q --filter "$SPECULOS_FILTER" 2>/dev/null | tr '\n' ' ' || true)"

cleanup() {
  echo ">> stopping backend + Speculos..."
  if [ -n "${HARNESS_PID:-}" ]; then
    pkill -P "$HARNESS_PID" 2>/dev/null || true
    kill "$HARNESS_PID" 2>/dev/null || true
  fi
  pkill -f "$HARNESS_PKILL_PATTERN" 2>/dev/null || true
  [ -n "${HARNESS_PID:-}" ] && wait "$HARNESS_PID" 2>/dev/null || true
  if [ "$IS_REMOTE" = "0" ]; then
    for c in $(docker ps -q --filter "$SPECULOS_FILTER" 2>/dev/null || true); do
      case " $PRE_SPECULOS " in
        *" $c "*) : ;;
        *)
          docker logs "$c" >"artifacts/speculos-$c.log" 2>&1 || true
          echo ">> saved Speculos logs to artifacts/speculos-$c.log; removing container $c"
          docker rm -f "$c" >/dev/null 2>&1 || true ;;
      esac
    done
  fi
}
trap cleanup EXIT

# Free a stale bridge port (see run-swap.sh).
if lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" >/dev/null 2>&1; then
  echo ">> port $MAESTRO_BRIDGE_PORT is busy (stale harness?), freeing it..."
  lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Regenerate the nano-app catalog fresh, like Detox's jest.globalSetup (cleanupPreviousNanoAppJsonFile).
NANO_APP_CATALOG="artifacts/appVersion/nano-app-catalog.json"
[ -f "$NANO_APP_CATALOG" ] && { echo ">> removing stale nano-app catalog (regenerates fresh)"; rm -f "$NANO_APP_CATALOG"; }

CONTROL_PORT="${MAESTRO_CONTROL_PORT:-8100}"

echo ">> starting send-doge backend harness (port $MAESTRO_BRIDGE_PORT) via ts-node..."
HARNESS_LOG="artifacts/harness-send-doge.log"
start_harness "$HARNESS_LOG"

# The harness derives the Dogecoin 2 recipient address EARLY (in cliCommandsOnApp, before the
# app-dependent init steps) and serves it on its control endpoint (GET /recipient -> 200). Gate on
# that here so the flow's onFlowStart hook can fetch it over HTTP (no `-e` plumbing). Launching
# Maestro is also what lets the app connect so the harness's init can finish.
echo ">> waiting for the harness to derive the recipient (control endpoint :$CONTROL_PORT/recipient) ..."
recipient_ready() { [ "$(curl -s -o /dev/null -w '%{http_code}' "localhost:$CONTROL_PORT/recipient" 2>/dev/null)" = "200" ]; }
for _ in $(seq 1 "${BACKEND_WAIT:-300}"); do
  recipient_ready && break
  kill -0 "$HARNESS_PID" 2>/dev/null || { echo "ERROR: harness exited before producing the recipient address (see log above)."; exit 1; }
  sleep 1
done
recipient_ready || { echo "ERROR: harness did not produce a recipient within ${BACKEND_WAIT:-300}s."; exit 1; }
echo ">> recipient ready; the flow fetches it (+ amount) from the control endpoint via onFlowStart."

platform_reverse_host_ports   # Android: adb reverse Metro + bridge (no-op on iOS)

echo ">> running Maestro flow: $FLOW"
strip_maestro_noise() { grep -vaE "Running on (iOS Simulator|Android Emulator)" || true; }
if [ "${DUMP_HIERARCHY:-0}" = "1" ]; then
  maestro test --platform "$MAESTRO_PLATFORM" --no-ansi "$FLOW" 2>&1 | strip_maestro_noise || true
  echo ">> dumping view hierarchy + screenshot to artifacts/ ..."
  maestro hierarchy > artifacts/send-doge-hierarchy.json 2>/dev/null || true
  xcrun simctl io booted screenshot artifacts/send-doge-screen.png >/dev/null 2>&1 || true
else
  maestro test --platform "$MAESTRO_PLATFORM" --no-ansi "$FLOW" 2>&1 | strip_maestro_noise
fi

#!/usr/bin/env bash
#
# Orchestrates the Maestro swap (ETH -> ETH-USDT) POC. Mirrors run-eth.sh but starts the
# harness in swap mode (Exchange app + live-data seeding + swap live app) and points the
# swap WebView at the staging backend.
#
# Usage:
#   SEED="..." COINAPPS=/path/to/coin-apps bash maestro/run-swap.sh
#   SWAP_FLOW=maestro/flows/open-swap.yaml DUMP_HIERARCHY=1 SEED=... COINAPPS=... bash maestro/run-swap.sh
#     ^ Step-1 gate: open the swap screen, then dump the WebView hierarchy to artifacts/.
set -euo pipefail

cd "$(dirname "$0")/.."

export MAESTRO_FLOW=swap
export MAESTRO_BRIDGE_PORT="${MAESTRO_BRIDGE_PORT:-8099}"
export MOCK="${MOCK:-0}"
export SPECULOS_DEVICE="${SPECULOS_DEVICE:-nanoX}"
export SPECULOS_IMAGE_TAG="${SPECULOS_IMAGE_TAG:-ghcr.io/ledgerhq/speculos:latest}"
# DETOX=1 in the harness/CLI subprocess env. NB: the *app* reads Config.DETOX at BUILD time
# (react-native-config, baked from .env.mock); a runtime env/launch-arg does NOT change it. The app
# already has Config.DETOX set (its bridge init is gated on Config.DETOX and it connects), so this
# only affects harness-side code that reads process.env.DETOX.
export DETOX="${DETOX:-1}"
# Speculos backend selection.
#   REMOTE_SPECULOS=true  -> remote Speculos (Speculinho). The app's device-proxy + the harness's
#                            screen-polling both reach a remote Speculos over HTTPS, so they do NOT
#                            contend on a single local-Docker HTTP server (that contention is what
#                            makes the swap signing fail with GeneralDmkError / ECONNREFUSED on iOS).
#                            Needs SPECULINHO_URL (Ledger operator base URL; usually VPN/internal).
#   REMOTE_SPECULOS=false -> local Docker Speculos (needs Docker + COINAPPS; flaky for swap signing).
export REMOTE_SPECULOS="${REMOTE_SPECULOS:-true}"
# Swap runs with Wallet 4.0 enabled (the real test default). isWallet40 = E2E_ENABLE_WALLET40 != "0".
export E2E_ENABLE_WALLET40="${E2E_ENABLE_WALLET40:-1}"
export SWAP_API_BASE="${SWAP_API_BASE:-https://swap-stg.ledger-test.com/v5}"
export DISABLE_TRANSACTION_BROADCAST="${DISABLE_TRANSACTION_BROADCAST:-1}"

IS_REMOTE=0
[ "$REMOTE_SPECULOS" = "true" ] && IS_REMOTE=1

FLOW="${SWAP_FLOW:-maestro/flows/open-swap.yaml}"

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
  # Remote Speculos (Speculinho): no Docker, no COINAPPS (the app binaries live on the operator).
  [ -n "${SPECULINHO_URL:-}" ] || {
    echo "ERROR: REMOTE_SPECULOS=true but SPECULINHO_URL is not set.";
    echo "  Set SPECULINHO_URL to the Speculinho operator base URL (Ledger internal; usually needs VPN),";
    echo "  e.g.  export SPECULINHO_URL=https://<speculinho-host>";
    echo "  Or run against local Docker instead:  REMOTE_SPECULOS=false bash maestro/run-swap.sh";
    exit 1;
  }
  echo ">> using REMOTE Speculos (Speculinho): $SPECULINHO_URL"
else
  docker info >/dev/null 2>&1 || { echo "ERROR: Docker isn't running (needed for local Speculos). Or use REMOTE_SPECULOS=true."; exit 1; }
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
  pkill -f "jest --config maestro/harness/jest.config.js" 2>/dev/null || true
  [ -n "${HARNESS_PID:-}" ] && wait "$HARNESS_PID" 2>/dev/null || true
  # Remote Speculos (Speculinho) pods aren't local containers — they're released by the operator's
  # TTL (the harness is killed and can't run its own release). Only clean local Docker containers.
  if [ "$IS_REMOTE" = "0" ]; then
    for c in $(docker ps -q --filter "$SPECULOS_FILTER" 2>/dev/null || true); do
      case " $PRE_SPECULOS " in
        *" $c "*) : ;;
        *)
          # Dump the container's logs before removing it: a swap that fails with GeneralDmkError /
          # ECONNREFUSED is almost always a Speculos (Exchange) that crashed or never bound its REST
          # API port. These logs are the ground truth for why.
          docker logs "$c" >"artifacts/speculos-$c.log" 2>&1 || true
          echo ">> saved Speculos logs to artifacts/speculos-$c.log; removing container $c"
          docker rm -f "$c" >/dev/null 2>&1 || true ;;
      esac
    done
  fi
}
trap cleanup EXIT

# Free the bridge port if a previous run's harness is still holding it. Otherwise initBridge
# fails with EADDRINUSE, the harness crashes before seeding, and the app is left stuck on
# onboarding (no Speculos) while Maestro hangs waiting for the seeded portfolio.
if lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" >/dev/null 2>&1; then
  echo ">> port $MAESTRO_BRIDGE_PORT is busy (stale harness?), freeing it..."
  lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Regenerate the nano-app catalog fresh, exactly like the Detox jest.globalSetup does
# (cleanupPreviousNanoAppJsonFile). The Maestro harness sets globalSetup=undefined, so without this
# it REUSES a stale artifacts/appVersion/nano-app-catalog.json and requests OLDER Exchange / coin-app
# versions than a fresh Detox run spawns. With a stale catalog the Exchange Speculos can crash
# (HTTP 503 / "the app kills the speculos") at the swap signing step. Deleting it makes the harness's
# getNanoAppCatalogVersionMap refetch the current versions from the manager API.
NANO_APP_CATALOG="artifacts/appVersion/nano-app-catalog.json"
if [ -f "$NANO_APP_CATALOG" ]; then
  echo ">> removing stale nano-app catalog so it regenerates fresh (matches Detox globalSetup)"
  rm -f "$NANO_APP_CATALOG"
fi

echo ">> starting swap backend harness (port $MAESTRO_BRIDGE_PORT) via jest..."
# The harness is a Jest process whose console output (bridge/Speculos/[SCREEN]/CLI diagnostics) is
# verbose and would drown the Maestro step output. Send it to a log file by default; VERBOSE=1
# streams it to the terminal for debugging.
HARNESS_LOG="artifacts/harness-swap.log"
if [ "${VERBOSE:-0}" = "1" ]; then
  pnpm exec jest --config maestro/harness/jest.config.js --runInBand &
else
  echo ">> harness backend logs -> e2e/mobile/$HARNESS_LOG (set VERBOSE=1 to stream them here)"
  pnpm exec jest --config maestro/harness/jest.config.js --runInBand >"$HARNESS_LOG" 2>&1 &
fi
HARNESS_PID=$!

echo ">> waiting for bridge on port $MAESTRO_BRIDGE_PORT ..."
for _ in $(seq 1 "${BACKEND_WAIT:-120}"); do
  nc -z localhost "$MAESTRO_BRIDGE_PORT" 2>/dev/null && break
  sleep 1
done

platform_reverse_host_ports   # Android: adb reverse Metro + bridge (no-op on iOS)

echo ">> running Maestro flow: $FLOW"
# Maestro's default TUI redraws a box with ANSI cursor moves that becomes garbage when piped
# to a log; --no-ansi gives plain one-line-per-step output. Also drop the per-run
# "Running on iOS Simulator ..." device banner.
strip_maestro_noise() { grep -vaE "Running on (iOS Simulator|Android Emulator)" || true; }
if [ "${DUMP_HIERARCHY:-0}" = "1" ]; then
  maestro test --platform "$MAESTRO_PLATFORM" --no-ansi "$FLOW" 2>&1 | strip_maestro_noise || true
  echo ">> dumping view hierarchy + screenshot to artifacts/ ..."
  maestro hierarchy > artifacts/swap-hierarchy.json 2>/dev/null || true
  xcrun simctl io booted screenshot artifacts/swap-screen.png >/dev/null 2>&1 || true
else
  maestro test --platform "$MAESTRO_PLATFORM" --no-ansi "$FLOW" 2>&1 | strip_maestro_noise
fi

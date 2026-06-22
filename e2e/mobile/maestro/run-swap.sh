#!/usr/bin/env bash
#
# Orchestrates the Maestro swap E2E across currency pairs. Each pair is one harness + Speculos cycle
# (the FROM/TO coin apps differ) that runs flows/swap/<pair>.yaml. With no arg, runs every pair.
#
# Usage:
#   SEED=... SPECULINHO_URL=https://<host> bash maestro/run-swap.sh                  # all pairs (remote)
#   REMOTE_SPECULOS=false SEED=... COINAPPS=/path bash maestro/run-swap.sh btc-eth   # one pair (local)
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

# Stop the harness and remove the local Speculos containers it started (remote Speculinho pods are
# released by the operator TTL). Run after each pair and as the EXIT safety net.
teardown_harness() {
  if [ -n "${HARNESS_PID:-}" ]; then
    pkill -P "$HARNESS_PID" 2>/dev/null || true
    kill "$HARNESS_PID" 2>/dev/null || true
    wait "$HARNESS_PID" 2>/dev/null || true
  fi
  pkill -f "$HARNESS_PKILL_PATTERN" 2>/dev/null || true
  HARNESS_PID=""
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
trap teardown_harness EXIT

# Run one pair: derive FROM/TO from the pair name, seed the harness, run flows/swap/<pair>.yaml, tear down.
run_one_pair() {
  local pair="$1"
  local flow="maestro/flows/swap/$pair.yaml"
  [ -f "$flow" ] || { echo "ERROR: no flow for pair '$pair' ($flow)"; return 1; }
  export SWAP_FROM SWAP_TO
  SWAP_FROM="$(echo "${pair%%-*}" | tr '[:lower:]' '[:upper:]')"
  SWAP_TO="$(echo "${pair##*-}" | tr '[:lower:]' '[:upper:]')"
  echo
  echo ">> swap pair: $SWAP_FROM -> $SWAP_TO   ($flow)"
  # Free a stale bridge port (otherwise initBridge EADDRINUSEs and the app stays on onboarding).
  if lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" >/dev/null 2>&1; then
    lsof -ti tcp:"$MAESTRO_BRIDGE_PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  # Regenerate the nano-app catalog fresh, like Detox's jest.globalSetup (cleanupPreviousNanoAppJsonFile),
  # so the harness requests current Exchange/coin-app versions (a stale catalog can crash the Exchange).
  rm -f "artifacts/appVersion/nano-app-catalog.json"
  HARNESS_LOG="artifacts/harness-swap-$pair.log"
  echo ">> starting swap harness (logs -> e2e/mobile/$HARNESS_LOG)"
  start_harness "$HARNESS_LOG"
  echo ">> waiting for bridge on port $MAESTRO_BRIDGE_PORT ..."
  for _ in $(seq 1 "${BACKEND_WAIT:-120}"); do
    nc -z localhost "$MAESTRO_BRIDGE_PORT" 2>/dev/null && break
    sleep 1
  done
  platform_reverse_host_ports
  local rc=0
  run_maestro_flow "$flow" || rc=$?
  teardown_harness
  return "$rc"
}

# Pairs to run: the arg, else every flows/swap/*.yaml (the wrappers are the registry).
PAIRS=()
if [ -n "${1:-}" ]; then
  PAIRS=("$1")
else
  for f in maestro/flows/swap/*.yaml; do PAIRS+=("$(basename "$f" .yaml)"); done
fi

overall=0
results=""
for pair in "${PAIRS[@]}"; do
  if run_one_pair "$pair"; then
    results="${results}  PASS  ${pair}"$'\n'
  else
    results="${results}  FAIL  ${pair}"$'\n'
    overall=1
  fi
done

echo
echo "===================== Swap pairs ====================="
printf '%s' "$results"
echo "======================================================"
exit "$overall"

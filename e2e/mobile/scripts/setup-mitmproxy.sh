#!/usr/bin/env bash
# Install the local mitmproxy CA as a user-trusted certificate on every
# running Android emulator and point each one at the host's mitmproxy
# instance.
#
# Multi-emulator aware: CI boots three AVDs in parallel (Jest runs with
# maxWorkers=3), so this script discovers every booted serial via
# `adb devices` and configures all of them. Detox then assigns one
# emulator per worker; whichever serial it picks will already trust the
# CA and route traffic through the proxy.
#
# The Detox / detoxPreRelease build variants ship a network-security
# config that trusts user-installed CAs (see
# app/src/detox{,PreRelease}/res/xml/network_security_config.xml), so
# once this script runs, HTTPS traffic from those builds is intercepted
# by mitmproxy.
#
# Prerequisites:
#   - AOSP / "Google APIs" (non-Play) AVDs. Play system images block
#     `adb root`, so this script will refuse for any emulator that
#     rejects it.
#   - mitmproxy installed locally; running it once generates the CA at
#     ~/.mitmproxy/mitmproxy-ca-cert.pem.
#   - openssl on PATH.
#
# Usage:
#   ./scripts/setup-mitmproxy.sh              # install CA + set proxy
#   ./scripts/setup-mitmproxy.sh --clear      # unset proxy, leave cert in place
#   MITM_CERT=/path/to/ca.pem ./scripts/setup-mitmproxy.sh
#   MITM_PORT=9000 ./scripts/setup-mitmproxy.sh
#   MITM_BYPASS="localhost,10.0.2.2,*.internal" ./scripts/setup-mitmproxy.sh
#   MITM_BOOT_TIMEOUT=240 ./scripts/setup-mitmproxy.sh  # wait longer
#
# After this runs, start mitmdump on the host (default port 8080) and
# run the Detox suite as usual.

set -euo pipefail

# Locate adb: explicit $ADB → $ANDROID_HOME/platform-tools → $PATH →
# standard macOS / Linux SDK install paths. Mirrors the resolution logic
# in install-and-run-apk.sh.
if [[ -z "${ADB:-}" ]]; then
  if [[ -n "${ANDROID_HOME:-}" && -x "$ANDROID_HOME/platform-tools/adb" ]]; then
    ADB="$ANDROID_HOME/platform-tools/adb"
  elif command -v adb >/dev/null 2>&1; then
    ADB="$(command -v adb)"
  elif [[ -x "$HOME/Library/Android/sdk/platform-tools/adb" ]]; then
    ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  elif [[ -x "$HOME/Android/Sdk/platform-tools/adb" ]]; then
    ADB="$HOME/Android/Sdk/platform-tools/adb"
  else
    echo "Could not locate adb. Set ANDROID_HOME or pass ADB=/path/to/adb." >&2
    exit 1
  fi
fi

PROXY_HOST="${MITM_HOST:-10.0.2.2}"
PROXY_PORT="${MITM_PORT:-8080}"
# Hosts that should bypass the proxy. The emulator's loopback to the
# host (10.0.2.2) is included so mock backends on the host stay
# unproxied — only real network traffic goes through mitmproxy.
PROXY_BYPASS="${MITM_BYPASS:-localhost,127.0.0.1,10.0.2.2}"
CERT="${MITM_CERT:-$HOME/.mitmproxy/mitmproxy-ca-cert.pem}"
WAIT_TIMEOUT="${MITM_BOOT_TIMEOUT:-240}"

# List adb serials whose state is `device`. (Emulators not yet
# connected, or in `offline`/`unauthorized`, are excluded.)
list_emulator_serials() {
  "$ADB" devices 2>/dev/null \
    | awk -F'\t' '/^emulator-[0-9]+\tdevice$/ {print $1}'
}

# Wait until at least one emulator is in `device` state AND every
# device-state emulator has finished booting (sys.boot_completed=1).
# Echoes the booted serials on stdout, status messages on stderr.
wait_for_emulators() {
  local deadline=$(( $(date +%s) + WAIT_TIMEOUT ))
  local serials=()
  local last_devices=""

  while true; do
    mapfile -t serials < <(list_emulator_serials)
    if (( ${#serials[@]} >= 1 )); then
      local all_booted=1
      for serial in "${serials[@]}"; do
        local boot
        boot=$("$ADB" -s "$serial" shell getprop sys.boot_completed 2>/dev/null \
                 | tr -d '\r' || echo "")
        if [[ "$boot" != "1" ]]; then
          all_booted=0
          break
        fi
      done
      if (( all_booted == 1 )); then
        printf '%s\n' "${serials[@]}"
        return 0
      fi
    fi

    last_devices=$("$ADB" devices 2>/dev/null || true)
    if (( $(date +%s) >= deadline )); then
      echo "No fully-booted emulator after ${WAIT_TIMEOUT}s." >&2
      echo "Last adb devices output:" >&2
      echo "$last_devices" >&2
      return 1
    fi
    sleep 2
  done
}

configure_emulator() {
  local serial=$1
  local hash target adb_args
  hash=$(openssl x509 -inform PEM -subject_hash_old -in "$CERT" -noout)
  target="/data/misc/user/0/cacerts-added/${hash}.0"
  adb_args=(-s "$serial")

  echo "→ [$serial] Enabling adb root..."
  local root_out
  root_out=$("$ADB" "${adb_args[@]}" root 2>&1 || true)
  "$ADB" "${adb_args[@]}" wait-for-device
  if [[ "$root_out" == *"cannot run as root"* ]] \
     || [[ "$("$ADB" "${adb_args[@]}" shell id -u 2>/dev/null | tr -d '\r')" != "0" ]]; then
    echo "[$serial] adb root unavailable (output: ${root_out:-<empty>})." >&2
    echo "[$serial] Play-image AVDs reject root; only Google APIs/AOSP work." >&2
    return 1
  fi

  echo "→ [$serial] Installing CA at ${target}"
  "$ADB" "${adb_args[@]}" shell mkdir -p /data/misc/user/0/cacerts-added
  "$ADB" "${adb_args[@]}" push "$CERT" "$target" >/dev/null
  "$ADB" "${adb_args[@]}" shell "chmod 644 ${target}; chown system:system ${target}"
  "$ADB" "${adb_args[@]}" shell "restorecon ${target}" 2>/dev/null || true

  # KeyChain reads /data/misc/user/0/cacerts-added/ lazily when an app
  # queries the trust store, so no framework restart is needed.
  echo "→ [$serial] Notifying system of trust-store change..."
  "$ADB" "${adb_args[@]}" shell am broadcast \
    -a android.security.action.TRUST_STORE_CHANGED >/dev/null 2>&1 || true

  echo "→ [$serial] Setting http_proxy to ${PROXY_HOST}:${PROXY_PORT} (bypass: ${PROXY_BYPASS})"
  # Legacy combined key — read by older OkHttp paths and some platform code.
  "$ADB" "${adb_args[@]}" shell settings put global http_proxy "${PROXY_HOST}:${PROXY_PORT}"
  # Modern split keys — what current Android ProxySelector actually
  # reads, including the exclusion list. Setting all three is the only
  # reliable way to make the bypass list take effect.
  "$ADB" "${adb_args[@]}" shell settings put global global_http_proxy_host "${PROXY_HOST}"
  "$ADB" "${adb_args[@]}" shell settings put global global_http_proxy_port "${PROXY_PORT}"
  "$ADB" "${adb_args[@]}" shell settings put global global_http_proxy_exclusion_list "${PROXY_BYPASS}"
}

clear_emulator() {
  local serial=$1
  local adb_args=(-s "$serial")
  echo "→ [$serial] Clearing http_proxy..."
  "$ADB" "${adb_args[@]}" shell settings put global http_proxy :0
  "$ADB" "${adb_args[@]}" shell settings delete global global_http_proxy_host >/dev/null
  "$ADB" "${adb_args[@]}" shell settings delete global global_http_proxy_port >/dev/null
  "$ADB" "${adb_args[@]}" shell settings delete global global_http_proxy_exclusion_list >/dev/null
}

if [[ "${1:-}" == "--clear" ]]; then
  mapfile -t serials < <(list_emulator_serials)
  if (( ${#serials[@]} == 0 )); then
    echo "No emulators connected — nothing to clear." >&2
    exit 0
  fi
  for serial in "${serials[@]}"; do
    clear_emulator "$serial"
  done
  echo "✓ Proxy cleared on ${#serials[@]} emulator(s)."
  exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl not found on PATH. Install it (e.g. brew install openssl) and re-run." >&2
  exit 1
fi

if [[ ! -f "$CERT" ]]; then
  cat >&2 <<EOF
mitmproxy CA not found at: $CERT

Generate it by starting mitmproxy once:
  mitmweb

Or set MITM_CERT=/path/to/your-ca.pem before re-running.
EOF
  exit 1
fi

echo "→ Discovering booted emulators (timeout ${WAIT_TIMEOUT}s)..."
mapfile -t SERIALS < <(wait_for_emulators)
if (( ${#SERIALS[@]} == 0 )); then
  exit 1
fi
echo "✓ Booted emulators: ${SERIALS[*]}"

HASH=$(openssl x509 -inform PEM -subject_hash_old -in "$CERT" -noout)

for serial in "${SERIALS[@]}"; do
  configure_emulator "$serial"
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER="${SCRIPT_DIR}/mitm.sh"

cat <<EOF
✓ mitmproxy CA installed on ${#SERIALS[@]} emulator(s) (hash: ${HASH})
✓ Proxy set to ${PROXY_HOST}:${PROXY_PORT} (bypass: ${PROXY_BYPASS})

Start mitmdump via the wrapper — it loads the emulator-host addon
(rewrites upstream 10.0.2.2 → 127.0.0.1 so the Detox bridge keeps
working) and writes every captured request to a HAR file on exit:

  ${WRAPPER}                       # HAR → e2e/mobile/artifacts/mitm.har
  MITM_HAR=/tmp/run.har ${WRAPPER} # custom path

Then run the Detox suite. When you stop the process (Ctrl-C / SIGTERM),
the HAR is written. Open it in Chrome DevTools (Network → import) or
"mitmweb --rfile mitm.har" for a UI view.

To unset the proxy later:
  $0 --clear
EOF

#!/usr/bin/env bash
# Install the local mitmproxy CA as a user-trusted certificate on a running
# Android emulator, then point the emulator at the host's mitmproxy instance.
#
# The Detox / detoxPreRelease build variants ship a network-security config
# that trusts user-installed CAs (see app/src/detox{,PreRelease}/res/xml/
# network_security_config.xml), so once this script runs, HTTPS traffic
# from those builds is intercepted by mitmproxy.
#
# Prerequisites:
#   - An Android emulator running an AOSP / "Google APIs" (non-Play) AVD.
#     Play system images block `adb root`, so this script will refuse.
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
#
# After this runs, start mitmweb on the host (default port 8080) and run
# the Detox suite as usual.

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
# Hosts that should bypass the proxy. The emulator's loopback to the host
# (10.0.2.2) is included so mock backends on the host stay unproxied — only
# real network traffic goes through mitmproxy.
PROXY_BYPASS="${MITM_BYPASS:-localhost,127.0.0.1,10.0.2.2}"
CERT="${MITM_CERT:-$HOME/.mitmproxy/mitmproxy-ca-cert.pem}"

if [[ "${1:-}" == "--clear" ]]; then
  echo "→ Unsetting system http_proxy..."
  "$ADB" shell settings put global http_proxy :0
  "$ADB" shell settings delete global global_http_proxy_host >/dev/null
  "$ADB" shell settings delete global global_http_proxy_port >/dev/null
  "$ADB" shell settings delete global global_http_proxy_exclusion_list >/dev/null
  echo "✓ Proxy cleared. (CA cert left installed — re-run without --clear to restore proxy.)"
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

# Wait for the emulator to be online AND fully booted. In CI the AVD is
# booted asynchronously while Detox's globalSetup runs, so a one-shot
# `adb get-state` is racy and can fire before adb sees the device or
# before sys.boot_completed flips to 1. Override the wait window via
# MITM_BOOT_TIMEOUT (seconds).
WAIT_TIMEOUT="${MITM_BOOT_TIMEOUT:-180}"
echo "→ Waiting for emulator to finish booting (timeout ${WAIT_TIMEOUT}s)..."
deadline=$(( $(date +%s) + WAIT_TIMEOUT ))
last_state="?"
last_boot="?"
while true; do
  last_state=$("$ADB" get-state 2>/dev/null || echo "missing")
  if [[ "$last_state" == "device" ]]; then
    last_boot=$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "")
    if [[ "$last_boot" == "1" ]]; then
      break
    fi
  fi
  if (( $(date +%s) >= deadline )); then
    echo "Emulator not ready after ${WAIT_TIMEOUT}s (state=${last_state}, boot_completed=${last_boot:-?})." >&2
    exit 1
  fi
  sleep 2
done
echo "✓ Emulator online"

HASH=$(openssl x509 -inform PEM -subject_hash_old -in "$CERT" -noout)
TARGET="/data/misc/user/0/cacerts-added/${HASH}.0"

# `adb root` exits 0 on Play images too but prints
# "adbd cannot run as root in production builds" — capture the output and
# verify success by re-checking the effective uid afterwards.
echo "→ Enabling adb root..."
ROOT_OUT=$("$ADB" root 2>&1 || true)
"$ADB" wait-for-device
if [[ "$ROOT_OUT" == *"cannot run as root"* ]] \
   || [[ "$("$ADB" shell id -u 2>/dev/null | tr -d '\r')" != "0" ]]; then
  cat >&2 <<EOF
This emulator does not allow \`adb root\` (output: ${ROOT_OUT:-<empty>}).
Google Play system images block root. Create an AOSP / "Google APIs"
(non-Play) AVD — e.g. "Pixel 7, API 34, Google APIs" — and try again.
EOF
  exit 1
fi

echo "→ Installing CA at ${TARGET}"
"$ADB" shell mkdir -p /data/misc/user/0/cacerts-added
"$ADB" push "$CERT" "$TARGET" >/dev/null
"$ADB" shell "chmod 644 ${TARGET}; chown system:system ${TARGET}"
"$ADB" shell "restorecon ${TARGET}" 2>/dev/null || true

# KeyChain reads /data/misc/user/0/cacerts-added/ lazily when an app queries
# the trust store, so no framework restart is needed. (An earlier version of
# this script did `stop`/`start`, which raced SettingsProvider's debounced
# disk write and clobbered the proxy settings we'd just applied.) Apps
# already running won't pick up the new CA until restarted — for Detox
# that's fine because the app under test is launched after this script.
echo "→ Notifying system of trust-store change..."
"$ADB" shell am broadcast -a android.security.action.TRUST_STORE_CHANGED >/dev/null 2>&1 || true

echo "→ Setting system http_proxy to ${PROXY_HOST}:${PROXY_PORT} (bypass: ${PROXY_BYPASS})"
# Legacy combined key — read by older OkHttp paths and some platform code.
"$ADB" shell settings put global http_proxy "${PROXY_HOST}:${PROXY_PORT}"
# Modern split keys — what current Android ProxySelector actually reads,
# including the exclusion list. Setting all three is the only reliable
# way to make the bypass list take effect.
"$ADB" shell settings put global global_http_proxy_host "${PROXY_HOST}"
"$ADB" shell settings put global global_http_proxy_port "${PROXY_PORT}"
"$ADB" shell settings put global global_http_proxy_exclusion_list "${PROXY_BYPASS}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER="${SCRIPT_DIR}/mitm.sh"

cat <<EOF
✓ mitmproxy CA installed (hash: ${HASH})
✓ Emulator proxy set to ${PROXY_HOST}:${PROXY_PORT}
✓ Bypass list: ${PROXY_BYPASS}

Start mitmdump via the wrapper — it loads the emulator-host addon
(rewrites upstream 10.0.2.2 → 127.0.0.1 so the Detox bridge keeps working)
and writes every captured request to a HAR file on exit:

  ${WRAPPER}                       # HAR → e2e/mobile/artifacts/mitm.har
  MITM_HAR=/tmp/run.har ${WRAPPER} # custom path

Then run the Detox suite. When you stop the process (Ctrl-C / SIGTERM),
the HAR is written. Open the HAR in Chrome DevTools (Network → import)
or "mitmweb --rfile mitm.har" for a UI view.

To unset the proxy later:
  $0 --clear
EOF

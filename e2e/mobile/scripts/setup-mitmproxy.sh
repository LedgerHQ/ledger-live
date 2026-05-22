#!/usr/bin/env bash
# Configure Android emulators to trust the local mitmproxy CA and route
# traffic through a host-side mitmproxy instance.
#
# Modes:
#   ./scripts/setup-mitmproxy.sh                              # backward-compat:
#       discover every booted emulator and configure each at $MITM_PORT
#       (default 8080). Same as the original single-proxy behaviour.
#
#   ./scripts/setup-mitmproxy.sh list-serials                 # print booted
#       emulator serials (one per line, e.g. emulator-5554) and exit.
#       Used by e2e/mobile/helpers/mitm.ts to decide how many mitmdump
#       instances to spawn.
#
#   ./scripts/setup-mitmproxy.sh configure --serial <s> --port <p>
#       Install CA + set system http_proxy on emulator <s>, pointing at
#       host loopback :<p>. Used when each emulator gets its own
#       dedicated mitmdump (per-worker capture).
#
#   ./scripts/setup-mitmproxy.sh clear [--serial <s>]
#       Clear http_proxy on a single emulator (when --serial is given)
#       or every booted emulator (otherwise).
#
# Background: The Detox / detoxPreRelease build variants ship a network-
# security config that trusts user-installed CAs (see app/src/detox{,
# PreRelease}/res/xml/network_security_config.xml), so once the CA lands
# in /data/misc/user/0/cacerts-added/ the apk decrypts cleanly.
#
# Prerequisites:
#   - AOSP / "Google APIs" (non-Play) AVDs. Play system images block
#     `adb root`, so configure will refuse for any such emulator.
#   - mitmproxy installed locally so the CA at
#     ~/.mitmproxy/mitmproxy-ca-cert.pem exists. Override via MITM_CERT.
#   - openssl on PATH.
#
# Env vars (apply to all modes):
#   MITM_CERT         CA file (default ~/.mitmproxy/mitmproxy-ca-cert.pem)
#   MITM_HOST         Proxy host the emulator sees (default 10.0.2.2)
#   MITM_BYPASS       Comma list (default localhost,127.0.0.1,10.0.2.2)
#   MITM_PORT         Default port for the no-args backward-compat mode
#   MITM_BOOT_TIMEOUT Seconds to wait for emulator boot (default 240)
#   ADB               Path to adb (auto-detected otherwise)

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

# Portable replacement for `mapfile -t arr < <(cmd)` because macOS ships
# bash 3.2 (no mapfile builtin). Writes each line of stdin into the
# named global array; resets the array first.
#   read_lines_into <array_name> <<EOF
#   $(some_command)
#   EOF
# usage in this file is via process substitution: `read_lines_into arr < <(cmd)`.
read_lines_into() {
  local __target=$1
  eval "$__target=()"
  local __line
  while IFS= read -r __line; do
    eval "$__target+=(\"\$__line\")"
  done
}

PROXY_HOST="${MITM_HOST:-10.0.2.2}"
DEFAULT_PROXY_PORT="${MITM_PORT:-8080}"
# Hosts that should bypass the proxy. The emulator's loopback to the
# host (10.0.2.2) is included so mock backends on the host stay
# unproxied — only real network traffic goes through mitmproxy.
PROXY_BYPASS="${MITM_BYPASS:-localhost,127.0.0.1,10.0.2.2}"
CERT="${MITM_CERT:-$HOME/.mitmproxy/mitmproxy-ca-cert.pem}"
WAIT_TIMEOUT="${MITM_BOOT_TIMEOUT:-240}"

# ---- emulator discovery / boot wait ----

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
    read_lines_into serials < <(list_emulator_serials)
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

# ---- per-emulator operations ----

configure_emulator() {
  local serial=$1
  local port=$2
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

  echo "→ [$serial] Setting http_proxy to ${PROXY_HOST}:${port} (bypass: ${PROXY_BYPASS})"
  # Legacy combined key — read by older OkHttp paths and some platform code.
  "$ADB" "${adb_args[@]}" shell settings put global http_proxy "${PROXY_HOST}:${port}"
  # Modern split keys — what current Android ProxySelector actually
  # reads, including the exclusion list. Setting all three is the only
  # reliable way to make the bypass list take effect.
  "$ADB" "${adb_args[@]}" shell settings put global global_http_proxy_host "${PROXY_HOST}"
  "$ADB" "${adb_args[@]}" shell settings put global global_http_proxy_port "${port}"
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

# ---- arg parsing helpers ----

require_cert_and_openssl() {
  if ! command -v openssl >/dev/null 2>&1; then
    echo "openssl not found on PATH. Install it (e.g. brew install openssl) and re-run." >&2
    exit 1
  fi
  if [[ ! -f "$CERT" ]]; then
    cat >&2 <<EOF
mitmproxy CA not found at: $CERT

Generate it by starting mitmproxy once (or run e2e/mobile/scripts/mitm.sh,
which triggers CA creation during its startup):
  mitmdump --listen-port 0

Or set MITM_CERT=/path/to/your-ca.pem before re-running.
EOF
    exit 1
  fi
}

# Parse --serial / --port flags out of remaining positional args. Sets
# globals OPT_SERIAL and OPT_PORT.
parse_serial_port() {
  OPT_SERIAL=""
  OPT_PORT=""
  while (( $# > 0 )); do
    case $1 in
      --serial)
        OPT_SERIAL=$2
        shift 2
        ;;
      --port)
        OPT_PORT=$2
        shift 2
        ;;
      *)
        echo "Unknown argument: $1" >&2
        exit 1
        ;;
    esac
  done
}

# ---- subcommands ----

cmd_list_serials() {
  read_lines_into serials < <(wait_for_emulators)
  if (( ${#serials[@]} == 0 )); then
    exit 1
  fi
  printf '%s\n' "${serials[@]}"
}

cmd_configure() {
  parse_serial_port "$@"
  if [[ -z "$OPT_SERIAL" || -z "$OPT_PORT" ]]; then
    echo "configure requires --serial <s> --port <p>" >&2
    exit 1
  fi
  require_cert_and_openssl
  configure_emulator "$OPT_SERIAL" "$OPT_PORT"
}

cmd_clear() {
  parse_serial_port "$@"
  if [[ -n "$OPT_SERIAL" ]]; then
    clear_emulator "$OPT_SERIAL"
    return
  fi
  read_lines_into serials < <(list_emulator_serials)
  if (( ${#serials[@]} == 0 )); then
    echo "No emulators connected — nothing to clear." >&2
    return
  fi
  for serial in "${serials[@]}"; do
    clear_emulator "$serial"
  done
  echo "✓ Proxy cleared on ${#serials[@]} emulator(s)."
}

# Backward-compat: no subcommand → discover every booted emulator and
# configure each at the same port ($MITM_PORT). Useful for local manual
# capture where one mitmproxy serves every emulator on the machine.
cmd_default() {
  require_cert_and_openssl
  echo "→ Discovering booted emulators (timeout ${WAIT_TIMEOUT}s)..."
  read_lines_into serials < <(wait_for_emulators)
  if (( ${#serials[@]} == 0 )); then
    exit 1
  fi
  echo "✓ Booted emulators: ${serials[*]}"

  local hash
  hash=$(openssl x509 -inform PEM -subject_hash_old -in "$CERT" -noout)
  for serial in "${serials[@]}"; do
    configure_emulator "$serial" "$DEFAULT_PROXY_PORT"
  done

  local script_dir wrapper
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  wrapper="${script_dir}/mitm.sh"
  cat <<EOF
✓ mitmproxy CA installed on ${#serials[@]} emulator(s) (hash: ${hash})
✓ Proxy set to ${PROXY_HOST}:${DEFAULT_PROXY_PORT} (bypass: ${PROXY_BYPASS})

Start mitmdump via the wrapper — it loads the emulator-host addon
(rewrites upstream 10.0.2.2 → 127.0.0.1 so the Detox bridge keeps
working) and writes every captured request to a HAR file on exit:

  ${wrapper}                       # HAR → e2e/mobile/artifacts/mitm.har
  MITM_HAR=/tmp/run.har ${wrapper} # custom path

Then run the Detox suite. When you stop the process (Ctrl-C / SIGTERM),
the HAR is written. Open it in Chrome DevTools (Network → import) or
"mitmweb --rfile mitm.har" for a UI view.

To unset the proxy later:
  $0 clear
EOF
}

# ---- dispatch ----

# Legacy `--clear` flag → forward to `clear` subcommand.
if [[ "${1:-}" == "--clear" ]]; then
  shift
  cmd_clear "$@"
  exit 0
fi

case "${1:-}" in
  list-serials)
    shift
    cmd_list_serials "$@"
    ;;
  configure)
    shift
    cmd_configure "$@"
    ;;
  clear)
    shift
    cmd_clear "$@"
    ;;
  ""|--*)
    cmd_default "$@"
    ;;
  *)
    echo "Unknown subcommand: $1" >&2
    echo "Run with no arguments, or use: list-serials | configure | clear" >&2
    exit 1
    ;;
esac

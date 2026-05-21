#!/usr/bin/env bash
# Launch mitmdump (headless mitmproxy) pre-configured for the Detox /
# Ledger Live Mobile workflow:
#   - loads mitm-emulator-addon.py so traffic to 10.0.2.2 resolves to the
#     host loopback (otherwise the Detox bridge times out)
#   - writes a HAR file containing every captured flow when the process
#     exits (Ctrl-C, SIGTERM, normal shutdown all trigger the dump)
#
# Headless on purpose — same binary runs locally and in CI without any
# UI. Inspect the resulting HAR with any tool (e.g. mitmweb opens HAR
# files, Chrome DevTools imports them, etc.).
#
# Usage:
#   ./e2e/mobile/scripts/mitm.sh                       # default port 8080,
#                                                       HAR → ./artifacts/mitm.har
#   MITM_PORT=9000 ./e2e/mobile/scripts/mitm.sh        # custom port
#   MITM_HAR=/tmp/run.har ./e2e/mobile/scripts/mitm.sh # custom HAR path
#   ./e2e/mobile/scripts/mitm.sh --set foo=bar         # extra mitmdump args
#
# Companion: ./setup-mitmproxy.sh sets the proxy + CA on the emulator.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

ADDON="${SCRIPT_DIR}/mitm-emulator-addon.py"
PORT="${MITM_PORT:-8080}"
HAR="${MITM_HAR:-${E2E_DIR}/artifacts/mitm.har}"

if ! command -v mitmdump >/dev/null 2>&1; then
  echo "mitmdump not found on PATH. Install mitmproxy (brew install mitmproxy)." >&2
  exit 1
fi

if [[ ! -f "$ADDON" ]]; then
  echo "Missing emulator addon at $ADDON" >&2
  exit 1
fi

mkdir -p "$(dirname "$HAR")"
# Pre-clear any stale HAR from a previous run so partial writes can't masquerade
# as up-to-date capture data.
rm -f "$HAR"

echo "→ mitmdump listening on :${PORT}"
echo "→ Emulator addon:  ${ADDON}"
echo "→ HAR output:      ${HAR} (written on exit)"
echo

# `hardump` is a built-in mitmproxy option (>= 10.4); it dumps every recorded
# flow as HAR on shutdown. Pass everything via --set so the option works
# regardless of arg order, and forward any extra "$@" to allow ad-hoc
# overrides (e.g. --listen-host 0.0.0.0).
exec mitmdump \
  --listen-port "${PORT}" \
  -s "${ADDON}" \
  --set "hardump=${HAR}" \
  "$@"

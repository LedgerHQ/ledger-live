#!/usr/bin/env bash

set -euo pipefail

#MISE description="Start mitmdump with the firebase_capture addon so one Remote Config fetch serves every app launch of a desktop E2E run. Never fails the job: if the proxy can't start, tests run without it."
#MISE tools={mitmproxy="12.2.1"}
#MISE raw=true

#USAGE flag "--port [number]" default="8080" help="Port mitmdump listens on, on 127.0.0.1"

CONF_DIR="${HOME}/.mitmproxy"
CERT="${CONF_DIR}/mitmproxy-ca-cert.pem"
LOG_DIR="${RUNNER_TEMP:-${CONF_DIR}/logs}"
LOG_FILE="${LOG_DIR}/firebase-capture.log"
SUMMARY_FILE="${LOG_DIR}/firebase-capture-summary.json"
FIREBASE_HOST="firebaseremoteconfig.googleapis.com"

# Disable colors when not in a terminal or when NO_COLOR is set (e.g. CI log parsers)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
	_CYAN="\033[0;36m" _GREEN="\033[0;32m" _RESET="\033[0m"
else
	_CYAN="" _GREEN="" _RESET=""
fi

log_info() { echo -e "${_CYAN}[INFO]${_RESET} ${*}"; }
log_success() { echo -e "${_GREEN}[SUCCESS]${_RESET} ${*}"; }

MITMDUMP_PID=""

# Fail open: without the E2E_FIREBASE_PROXY* variables, the app calls Firebase directly, as before.
proxy_off() {
	if [ -n "${MITMDUMP_PID}" ]; then
		kill "${MITMDUMP_PID}" 2>/dev/null || true
	fi
	echo "::warning title=Remote Config capture proxy is off::${*}"
	if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
		echo "Remote Config capture proxy: **off** (${*})" >>"${GITHUB_STEP_SUMMARY}"
	fi
	exit 0
}

mkdir -p "${LOG_DIR}"
rm -f "${SUMMARY_FILE}"

log_info "Starting mitmdump on 127.0.0.1:${usage_port}, logging to ${LOG_FILE}"
mitmdump \
	--set confdir="${CONF_DIR}" \
	--listen-host 127.0.0.1 \
	--listen-port "${usage_port}" \
	--allow-hosts 'firebaseremoteconfig\.googleapis\.com' \
	--set flow_detail=0 \
	-s "$(dirname "$0")/firebase_capture.py" \
	--set firebase_capture_summary="${SUMMARY_FILE}" \
	>"${LOG_FILE}" 2>&1 &
MITMDUMP_PID=$!

READY=false
for _ in $(seq 1 15); do
	kill -0 "${MITMDUMP_PID}" 2>/dev/null || proxy_off "mitmdump exited during start-up, see ${LOG_FILE}"
	if (echo >"/dev/tcp/127.0.0.1/${usage_port}") 2>/dev/null && [ -f "${CERT}" ]; then
		READY=true
		break
	fi
	sleep 1
done
[ "${READY}" = "true" ] || proxy_off "mitmdump did not listen within 15 seconds"

# Any HTTP status proves the proxy decrypts this host with its own CA and reaches Firebase.
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
	--proxy "http://127.0.0.1:${usage_port}" --cacert "${CERT}" "https://${FIREBASE_HOST}/" || true)
[[ "${STATUS}" =~ ^[1-5][0-9][0-9]$ ]] || proxy_off "health check through the proxy failed (status '${STATUS}')"

SPKI=$(openssl x509 -in "${CERT}" -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64)
[ -n "${SPKI}" ] || proxy_off "could not hash the mitmproxy CA public key"

log_success "Remote Config capture proxy is on (PID ${MITMDUMP_PID}, health check HTTP ${STATUS})"

if [ -n "${GITHUB_ENV:-}" ]; then
	{
		echo "FIREBASE_CAPTURE_PID=${MITMDUMP_PID}"
		echo "E2E_FIREBASE_PROXY=127.0.0.1:${usage_port}"
		echo "E2E_FIREBASE_PROXY_SPKI=${SPKI}"
	} >>"${GITHUB_ENV}"
else
	echo "export FIREBASE_CAPTURE_PID=${MITMDUMP_PID} E2E_FIREBASE_PROXY=127.0.0.1:${usage_port} E2E_FIREBASE_PROXY_SPKI=${SPKI}"
fi

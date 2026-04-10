#!/usr/bin/env bash

set -euo pipefail

#MISE description="Stop mitmproxy, archive and optionally encrypt and upload its logs."
#MISE tools={mitmproxy="12.2.1"}
#MISE raw=true

#USAGE flag "--mitmproxy-pid <pid>" env="MITMPROXY_PID" required=#true help="PID of mitmproxy to gracefully interrupt the process"
#USAGE flag "--encrypt-key <string>" env="MITMPROXY_LOGS_KEY" required=#true help="Key used to encrypt mitmproxy log files"

# Disable colors when not in a terminal or when NO_COLOR is set (e.g. CI log parsers)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
	_RED="\033[0;31m" _CYAN="\033[0;36m" _GREEN="\033[0;32m" _RESET="\033[0m"
else
	_RED="" _CYAN="" _GREEN="" _RESET=""
fi

log_error() {
	echo -e "${_RED}[ERROR]${_RESET} ${*}" >&2
	exit 1
}

log_info() {
	echo -e "${_CYAN}[INFO]${_RESET} ${*}"
}

log_success() {
	echo -e "${_GREEN}[SUCCESS]${_RESET} ${*}"
}

CONF_DIR="${HOME}/.mitmproxy"
CERT="${CONF_DIR}/mitmproxy-ca-cert.pem"

function stop_mitmproxy() {
	if ! kill -0 "${usage_mitmproxy_pid}" 2>/dev/null; then
		log_info "mitmproxy (PID: ${usage_mitmproxy_pid}) is not running"
		return
	fi

	log_info "Sending SIGINT to mitmproxy (PID: ${usage_mitmproxy_pid})"
	kill -SIGINT "${usage_mitmproxy_pid}"

	# wait cannot be used here since mitmproxy was started in a different shell.
	# Poll until the process exits, then SIGKILL if it takes too long.
	local elapsed=0
	local timeout=30
	while kill -0 "${usage_mitmproxy_pid}" 2>/dev/null; do
		if [ "${elapsed}" -ge "${timeout}" ]; then
			log_info "mitmproxy did not stop gracefully after ${timeout}s, sending SIGKILL"
			kill -SIGKILL "${usage_mitmproxy_pid}" 2>/dev/null || true
			break
		fi
		sleep 1
		elapsed=$((elapsed + 1))
	done

	log_success "mitmproxy stopped"
}

function remove_certificate_macos() {
	if [ ! -f "${CERT}" ]; then
		log_info "Certificate not found at ${CERT}, skipping removal"
		return
	fi

	log_info "Removing mitmproxy certificate from macOS keychain"
	sudo security remove-trusted-cert -d "${CERT}"
	log_success "Certificate removed from macOS keychain"
}

function remove_certificate_linux() {
	if command -v update-ca-certificates &>/dev/null; then
		log_info "Removing certificate (Debian/Ubuntu)"
		sudo rm -f /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
		sudo update-ca-certificates --fresh
		log_success "Certificate removed from system CA store"
	elif command -v update-ca-trust &>/dev/null; then
		log_info "Removing certificate (RHEL/CentOS/Fedora)"
		sudo rm -f /etc/pki/ca-trust/source/anchors/mitmproxy-ca-cert.pem
		sudo update-ca-trust extract
		log_success "Certificate removed from system CA store"
	else
		log_info "No supported CA trust tool found, skipping certificate removal"
	fi
}

function remove_certificate() {
	case "${OSTYPE}" in
	darwin*) remove_certificate_macos ;;
	linux*) remove_certificate_linux ;;
	esac
}

function unset_http_proxy_macos() {
	local NETWORK_SERVICE
	NETWORK_SERVICE=$(/usr/sbin/networksetup -listallnetworkservices | grep -iE "wi-fi|ethernet|airport" | head -1)
	if [ -n "${NETWORK_SERVICE}" ]; then
		log_info "Disabling proxy on network service: ${NETWORK_SERVICE}"
		/usr/sbin/networksetup -setwebproxystate "${NETWORK_SERVICE}" off
		/usr/sbin/networksetup -setsecurewebproxystate "${NETWORK_SERVICE}" off
	else
		log_info "No network service found, skipping proxy unset"
	fi
}

function unset_http_proxy_linux() {
	local ENV_FILE="/etc/environment"
	for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY; do
		if grep -q "^${VAR}=" "${ENV_FILE}" 2>/dev/null; then
			sudo sed -i "/^${VAR}=/d" "${ENV_FILE}"
		fi
	done
}

function unset_http_proxy() {
	case "${OSTYPE}" in
	darwin*) unset_http_proxy_macos ;;
	linux*) unset_http_proxy_linux ;;
	esac

	if [ -n "${GITHUB_ENV:-}" ]; then
		log_info "GitHub Actions detected: unsetting proxy vars in \$GITHUB_ENV"
		for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY NODE_EXTRA_CA_CERTS; do
			echo "${VAR}=" >>"${GITHUB_ENV}"
		done
	fi

	log_success "Proxy configuration cleared"
}

function encrypt_logs() {
	mise run mitmproxy:encrypt --encrypt-key "${usage_encrypt_key}" || \
		log_info "Encryption failed or no logs to archive, skipping"
}

function main() {
	stop_mitmproxy
	unset_http_proxy
	remove_certificate
	encrypt_logs
}

main "${@}"

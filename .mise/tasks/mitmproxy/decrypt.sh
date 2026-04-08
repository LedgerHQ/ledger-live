#!/usr/bin/env bash

set -euo pipefail

#MISE description="Decrypt mitmproxy log files captured in CI."
#MISE raw=true

#USAGE flag "--file <file>" required=#true help="Path to the encrypted archive (.tar.gz.enc)"
#USAGE flag "--encrypt-key <string>" env="MITMPROXY_LOGS_KEY" required=#true help="Key used to decrypt the archive"
#USAGE flag "--output-dir <string>" default="." help="Directory where the decrypted files will be extracted"

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
log_info() { echo -e "${_CYAN}[INFO]${_RESET} ${*}"; }
log_success() { echo -e "${_GREEN}[SUCCESS]${_RESET} ${*}"; }

function main() {
	local encrypted_file="${usage_file}"
	local output_dir="${usage_output_dir}"
	local archive="${encrypted_file%.enc}"

	if [ ! -f "${encrypted_file}" ]; then
		log_error "File not found: ${encrypted_file}"
	fi

	mkdir -p "${output_dir}"

	log_info "Decrypting ${encrypted_file}"
	MITMPROXY_LOGS_KEY="${usage_encrypt_key}" openssl enc -d -aes-256-cbc -pbkdf2 \
		-pass env:MITMPROXY_LOGS_KEY \
		-in "${encrypted_file}" \
		-out "${archive}"

	log_info "Extracting archive"
	tar -xzf "${archive}" -C "${output_dir}"
	rm -f "${archive}"

	log_success "Logs extracted to ${output_dir}"
}

main ${@+"${@}"}

#!/usr/bin/env bash

set -euo pipefail

#MISE description="Archive and encrypt mitmproxy log files."
#MISE raw=true

#USAGE flag "--encrypt-key <string>" env="MITMPROXY_LOGS_KEY" required=#true help="Key used to encrypt mitmproxy log files"
#USAGE flag "--out-file <string>" help="Output path for the encrypted archive (default: ~/.mitmproxy/logs/mitmproxy-logs.tar.gz.enc)"
#USAGE arg "<files>" var=#true default="" help="Which files will be encrypted (default: ~/.mitmproxy/logs/mitmproxy.log and ~/.mitmproxy/logs/mitmproxy.flows)"

# Parse the variadic arg without eval: split on whitespace and drop tokens that
# are empty or are mise's default-variadic placeholders ("" or '').
IFS=' ' read -r -a _raw <<< "${usage_files:-}"
_clean=()
for _f in "${_raw[@]+"${_raw[@]}"}"; do
	[[ -z "$_f" || "$_f" == '""' || "$_f" == "''" ]] && continue
	_clean+=("$_f")
done
files=("${_clean[@]+"${_clean[@]}"}")
unset _f _clean _raw
if [ ${#files[@]} -eq 0 ]; then
	files=(
		"${HOME}/.mitmproxy/logs/mitmproxy.log"
		"${HOME}/.mitmproxy/logs/mitmproxy.flows"
	)
fi

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

ENCRYPTED_ARCHIVE="${usage_out_file:-${HOME}/.mitmproxy/logs/mitmproxy-logs.tar.gz.enc}"
ARCHIVE="${ENCRYPTED_ARCHIVE%.enc}"

collect_files() {
	local existing=()
	for f in "${files[@]}"; do
		if [ -f "$f" ]; then
			existing+=("$f")
		else
			log_info "File not found, skipping: $f" >&2
		fi
	done

	if [ ${#existing[@]} -eq 0 ]; then
		log_info "No files found to archive, skipping" >&2
		return 1
	fi

	printf '%s\n' "${existing[@]}"
}

create_archive() {
	local -a existing=("$@")
	local -a tar_args=()
	mkdir -p "$(dirname "${ARCHIVE}")"
	for f in "${existing[@]}"; do
		tar_args+=(-C "$(dirname "$f")" "$(basename "$f")")
	done
	tar -czf "${ARCHIVE}" "${tar_args[@]}"
	log_info "Archive created: ${ARCHIVE}"
}

encrypt_archive() {
	# Ensure the intermediate plaintext archive is removed even if openssl fails
	trap 'rm -f "${ARCHIVE}"' EXIT

	# We need to test if this works on macos, since macos uses libreSSL and not openSSL
	# Pass the key via the environment to avoid it appearing in the process list
	MITMPROXY_LOGS_KEY="${usage_encrypt_key}" openssl enc -aes-256-cbc -pbkdf2 \
		-pass env:MITMPROXY_LOGS_KEY \
		-in "${ARCHIVE}" \
		-out "${ENCRYPTED_ARCHIVE}"

	rm -f "${ARCHIVE}"
	trap - EXIT
}

report_output() {
	log_success "Logs encrypted: ${ENCRYPTED_ARCHIVE}"

	# Expose archive path for subsequent workflow steps
	if [ -n "${GITHUB_OUTPUT:-}" ]; then
		echo "mitmproxy_logs_archive=${ENCRYPTED_ARCHIVE}" >>"${GITHUB_OUTPUT}"
	fi
}

main() {
	local -a existing=()
	while IFS= read -r line; do
		existing+=("$line")
	done < <(collect_files)

	if [ ${#existing[@]} -eq 0 ]; then
		return 0
	fi

	create_archive "${existing[@]}"
	encrypt_archive
	report_output
}

main ${@+"${@}"}

#!/usr/bin/env bash

set -euo pipefail

#MISE description="Update apt repositories with mirror fallback on failure. Optionally install packages after update."
#MISE raw=true

#USAGE flag "--mirrors <mirrors>" help="Comma-separated list of mirror URLs to use (overrides defaults)"
#USAGE flag "--packages <packages>" help="Space-separated list of packages to install after update"
#USAGE flag "--max-attempts <number>" default="5" help="Maximum number of retry attempts"
#USAGE flag "--timeout <seconds>" default="300" help="Per-attempt timeout in seconds for update and install (0 to disable)"

# Disable colors when not in a terminal or when NO_COLOR is set (e.g. CI log parsers).
# Check both fd 1 and fd 2: log_error writes to stderr, so an fd-1-only guard
# would leak ANSI codes to stderr in runners that pipe stdout but keep stderr as a TTY.
if [ -t 1 ] && [ -t 2 ] && [ -z "${NO_COLOR:-}" ]; then
	_RED="\033[0;31m" _CYAN="\033[0;36m" _GREEN="\033[0;32m" _RESET="\033[0m"
else
	_RED="" _CYAN="" _GREEN="" _RESET=""
fi

log_error()   { echo -e "${_RED}[ERROR]${_RESET} ${*}" >&2; exit 1; }
log_info()    { echo -e "${_CYAN}[INFO]${_RESET} ${*}" >&2; }
log_success() { echo -e "${_GREEN}[SUCCESS]${_RESET} ${*}" >&2; }

DEFAULT_MIRRORS=(
	"https://archive.ubuntu.com/ubuntu"
	"https://us.archive.ubuntu.com/ubuntu"
	"https://uk.archive.ubuntu.com/ubuntu"
	"https://de.archive.ubuntu.com/ubuntu"
	"https://fr.archive.ubuntu.com/ubuntu"
)

validate_mirror_url() {
	local mirror="${1}"
	if [ -z "${mirror}" ]; then
		log_error "Empty mirror entry in --mirrors list"
	fi
	if [[ ! "${mirror}" =~ ^https?://[a-zA-Z0-9._/-]+$ ]]; then
		log_error "Invalid mirror URL (must start with http:// or https://): '${mirror}'"
	fi
}

resolve_mirrors() {
	if [ -n "${usage_mirrors:-}" ]; then
		local raw
		IFS=',' read -ra raw <<< "${usage_mirrors}"
		MIRRORS=()
		local entry
		for entry in "${raw[@]}"; do
			# trim leading/trailing whitespace
			entry="${entry#"${entry%%[![:space:]]*}"}"
			entry="${entry%"${entry##*[![:space:]]}"}"
			validate_mirror_url "${entry}"
			MIRRORS+=("${entry}")
		done
	else
		MIRRORS=("${DEFAULT_MIRRORS[@]}")
	fi
}

resolve_packages() {
	if [ -n "${usage_packages:-}" ]; then
		read -ra PACKAGES <<< "${usage_packages}"
	else
		PACKAGES=()
	fi
}

# Runs a command under sudo, wrapping it with `timeout` when --timeout > 0.
# timeout runs inside sudo (sudo → timeout → apt-get) so SIGTERM on expiry
# reaches apt-get directly, not just the sudo wrapper.
# --kill-after=10 sends SIGKILL 10s later if apt-get ignores SIGTERM.
# timeout exits with code 124 on expiry, which run_with_retry checks explicitly.
run_sudo() {
	if [ "${usage_timeout:-300}" -gt 0 ]; then
		sudo timeout --kill-after=10 "${usage_timeout:-300}" "${@}"
	else
		sudo "${@}"
	fi
}

set_apt_mirror() {
	local mirror="${1}"
	# Escape & and \ which are special in sed replacement strings
	local mirror_escaped
	mirror_escaped=$(printf '%s' "${mirror}" | sed 's/[&\]/\\&/g')
	log_info "Switching apt mirror to: ${mirror}"

	# Apply to sources.list and all traditional-format drop-in files.
	# deb822 (.sources) files use a different format and are not touched.
	local changed=0
	local file
	for file in /etc/apt/sources.list /etc/apt/sources.list.d/*.list; do
		[ -f "${file}" ] || continue
		local count=0
		count=$(sudo grep -c "https\?://[^ ]*ubuntu\.com/ubuntu" "${file}" 2>/dev/null || true)
		if [ "${count}" -gt 0 ]; then
			sudo sed -i "s|https\?://[^ ]*ubuntu\.com/ubuntu|${mirror_escaped}|g" "${file}"
			changed=$(( changed + count ))
		fi
	done

	# Handle apt mirrorlist file used by Ubuntu 24.04+ runners (e.g. GitHub Actions ubuntu-latest).
	# These runners reference file:/etc/apt/apt-mirrors.txt in their deb822 sources instead of
	# embedding a direct URL, so the loop above finds nothing.
	local mirrorlist_count=0
	if sudo test -f /etc/apt/apt-mirrors.txt; then
		mirrorlist_count=$(sudo grep -c "https\?://[^ ]*ubuntu\.com" /etc/apt/apt-mirrors.txt 2>/dev/null || true)
		if [ "${mirrorlist_count}" -gt 0 ]; then
			sudo sed -i "s|https\?://[^ ]*ubuntu\.com[^ ]*|${mirror_escaped}|g" /etc/apt/apt-mirrors.txt
			changed=$(( changed + mirrorlist_count ))
		fi
	fi

	if [ "${changed}" -eq 0 ]; then
		log_info "Warning: no ubuntu.com mirror entries found in apt sources or mirrorlist — mirror switch had no effect"
	fi
}

backup_sources_list() {
	# Use sudo mktemp so root owns the file — prevents a local user from swapping
	# it between the write and the restore read (TOCTOU).
	SOURCES_BACKUP_FILE=$(sudo mktemp --suffix=.tar)
	trap restore_sources_list EXIT

	# Conditionally include sources.list.d/ and the apt mirrorlist so tar does
	# not fail on systems that omit them (e.g. deb822-only or older hosts).
	local -a paths=( sources.list )
	sudo test -d /etc/apt/sources.list.d && paths+=( sources.list.d/ ) || true
	sudo test -f /etc/apt/apt-mirrors.txt && paths+=( apt-mirrors.txt ) || true

	sudo tar -cf "${SOURCES_BACKUP_FILE}" -C /etc/apt "${paths[@]}" \
		|| log_error "Failed to backup /etc/apt sources — aborting before any mirror modification"
}

restore_sources_list() {
	[ -f "${SOURCES_BACKUP_FILE:-}" ] || return 0
	log_info "Restoring /etc/apt sources configuration"
	# Cannot call log_error (exit 1) from an EXIT trap — emit directly to stderr.
	if sudo tar -xf "${SOURCES_BACKUP_FILE}" -C /etc/apt; then
		sudo rm -f "${SOURCES_BACKUP_FILE}"
	else
		echo "[ERROR] Failed to restore /etc/apt sources — backup preserved at: ${SOURCES_BACKUP_FILE}" >&2
	fi
}

apt_update() {
	run_sudo apt-get update -qq
}

apt_install() {
	if [ "${#PACKAGES[@]}" -eq 0 ]; then
		return 0
	fi
	log_info "Installing packages: ${PACKAGES[*]}"
	run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y -- "${PACKAGES[@]}"
}

run_with_retry() {
	local max_attempts="${usage_max_attempts}"
	local num_mirrors="${#MIRRORS[@]}"
	local last_mirror="" last_rc=0 prev_mirror=""
	backup_sources_list

	for (( attempt=1; attempt<=max_attempts; attempt++ )); do
		local mirror_index mirror
		mirror_index=$(( (attempt - 1) % num_mirrors ))
		mirror="${MIRRORS[${mirror_index}]}"
		last_mirror="${mirror}"

		log_info "Attempt ${attempt}/${max_attempts} using mirror: ${mirror}"

		# Only rewrite sources when the mirror actually changes
		if [ "${mirror}" != "${prev_mirror}" ]; then
			set_apt_mirror "${mirror}"
			prev_mirror="${mirror}"
		fi

		local update_rc=0
		apt_update || update_rc=$?
		last_rc=${update_rc}
		if [ "${update_rc}" -eq 124 ]; then
			log_info "Attempt ${attempt}: timed out after ${usage_timeout:-300}s, switching mirror"
			continue
		elif [ "${update_rc}" -ne 0 ]; then
			log_info "Attempt ${attempt}: apt-get update failed (exit ${update_rc})"
			continue
		fi

		local install_rc=0
		apt_install || install_rc=$?
		last_rc=${install_rc}
		if [ "${install_rc}" -eq 124 ]; then
			log_info "Attempt ${attempt}: installation timed out after ${usage_timeout:-300}s, switching mirror"
			continue
		elif [ "${install_rc}" -eq 0 ]; then
			if [ "${#PACKAGES[@]}" -gt 0 ]; then
				log_success "apt update and package installation completed successfully"
			else
				log_success "apt update completed successfully"
			fi
			return 0
		else
			log_info "Attempt ${attempt}: package installation failed (exit ${install_rc})"
			continue
		fi
	done

	log_error "apt update failed after ${max_attempts} attempts (last mirror: ${last_mirror}, last exit: ${last_rc})"
}

main() {
	if ! [[ "${usage_max_attempts}" =~ ^[0-9]+$ ]] || [ "${usage_max_attempts}" -lt 1 ]; then
		log_error "--max-attempts must be a positive integer, got: '${usage_max_attempts}'"
	fi
	if ! [[ "${usage_timeout:-300}" =~ ^[0-9]+$ ]]; then
		log_error "--timeout must be a non-negative integer, got: '${usage_timeout:-}'"
	fi
	resolve_mirrors
	resolve_packages
	run_with_retry
}

main "${@}"

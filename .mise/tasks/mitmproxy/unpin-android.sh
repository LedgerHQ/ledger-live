#!/usr/bin/env bash

set -euo pipefail

#MISE description="Patch an Android APK for certificate unpinning and install it on all provisioned AVDs."
#MISE tools={"python"="3.12"}
#MISE raw=true

#USAGE flag "--apk <path>" required=#true help="Path to the APK to patch and install"
#USAGE flag "--package [pkg]" help="Android package name (e.g. com.ledger.live) — required by unpin-app; logs a warning if omitted"
#USAGE flag "--android-simulator-name [name]" default="avd-emulator" help="Comma-separated list of AVD names to install the patched APK on"

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

function install_android_unpinner() {
	if command -v android-unpinner &>/dev/null; then
		log_info "android-unpinner already installed: $(android-unpinner --version 2>/dev/null || true)"
		return
	fi
	log_info "Installing android-unpinner from GitHub..."
	pip install --quiet git+https://github.com/mitmproxy/android-unpinner
	log_success "android-unpinner installed"
}

function patch_apk() {
	local APK="${usage_apk}"

	if [ ! -f "${APK}" ]; then
		log_error "APK not found: ${APK}"
	fi

	log_info "Patching APK: ${APK}"
	android-unpinner patch-apks "${APK}"

	PATCHED_APK="${APK%.apk}.unpinned.apk"
	if [ ! -f "${PATCHED_APK}" ]; then
		log_error "Expected patched APK not found: ${PATCHED_APK}"
	fi

	log_success "Patched APK: ${PATCHED_APK}"
}

function install_on_avds() {
	IFS=',' read -ra AVD_NAMES <<<"${usage_android_simulator_name}"
	local PORT=5554
	for AVD_NAME in "${AVD_NAMES[@]}"; do
		AVD_NAME="$(printf '%s\n' "${AVD_NAME}" | xargs)" # trim whitespace
		local SERIAL="emulator-${PORT}"

		log_info "=== Installing on ${SERIAL} (AVD: ${AVD_NAME}) ==="

		log_info "Installing patched APK on ${SERIAL}"
		android-unpinner install --force -d "${SERIAL}" "${PATCHED_APK}"
		log_success "APK installed on ${SERIAL}"

		log_info "Pushing Frida resources to ${SERIAL}"
		android-unpinner push-resources --force -d "${SERIAL}"
		log_success "Frida resources pushed to ${SERIAL}"

		PORT=$((PORT + 2))
	done
}

function export_package() {
	if [ -z "${usage_package:-}" ]; then
		log_info "WARNING: --package not provided. mitmproxy:unpin-app must be called with --package explicitly."
		return
	fi

	export ANDROID_UNPIN_PACKAGE="${usage_package}"

	if [ -n "${GITHUB_ENV:-}" ]; then
		log_info "GitHub Actions detected: writing ANDROID_UNPIN_PACKAGE to \$GITHUB_ENV"
		echo "ANDROID_UNPIN_PACKAGE=${usage_package}" >>"${GITHUB_ENV}"
	fi

	log_success "Package exported: ${usage_package}"
}

function main() {
	install_android_unpinner
	patch_apk
	install_on_avds
	export_package
}

main ${@+"${@}"}

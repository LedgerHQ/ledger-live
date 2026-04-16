#!/usr/bin/env bash

set -euo pipefail

#MISE description="Inject Frida Gadget into an Android app via JDWP on all provisioned AVDs. Run immediately before Detox tests."
#MISE tools={"python"="3.12"}
#MISE raw=true

#USAGE flag "--package <pkg>" env="ANDROID_UNPIN_PACKAGE" required=#true help="Android package name to inject into (e.g. com.ledger.live)"
#USAGE flag "--android-simulator-name [name]" default="avd-emulator" help="Comma-separated list of AVD names to inject into"

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

function inject_on_avds() {
	IFS=',' read -ra AVD_NAMES <<<"${usage_android_simulator_name}"
	local PORT=5554
	for AVD_NAME in "${AVD_NAMES[@]}"; do
		AVD_NAME="$(printf '%s\n' "${AVD_NAME}" | xargs)" # trim whitespace
		local SERIAL="emulator-${PORT}"

		log_info "Injecting Frida Gadget into ${usage_package} on ${SERIAL} (AVD: ${AVD_NAME})"
		android-unpinner start-app --force -d "${SERIAL}" "${usage_package}"
		log_success "Frida Gadget injected on ${SERIAL}"

		PORT=$((PORT + 2))
	done
}

function main() {
	inject_on_avds
}

main ${@+"${@}"}

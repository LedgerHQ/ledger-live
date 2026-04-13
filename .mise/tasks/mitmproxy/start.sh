#!/usr/bin/env bash

set -euo pipefail

#MISE description="Install and setup mitmproxy. Automatically detect the host OS and configure it. Optionally configure the iOS/Android Simulator."
#MISE tools={"mitmproxy"="12.2.1", "pipx"="1.11.1", python="3.12"}
#MISE raw=true

#USAGE flag "--setup-ios-simulator [boolean]" default="false" help="Configure iOS Simulator"
#USAGE flag "--setup-android-simulator [boolean]" default="false" help="Configure Android Simulator"
#USAGE flag "--ios-simulator-name [name]" default="iOS Simulator" help="Comma-separated list of simulator names to provision the certificate to"
#USAGE flag "--android-simulator-name [name]" default="avd-emulator" help="Comma-separated list of AVD names to provision the certificate to"
#USAGE flag "--port [number]" default="8080" help="Port where mitmproxy will listen to"
#USAGE flag "--mock-responses-file [path]" help="Path to a JSON file of mocked responses (enables mock_responses addon)"
#USAGE flag "--allow-hosts [pattern]" help="Regex pattern of hosts to intercept — all other hosts are forwarded as raw tunnels without interception"

CONF_DIR="${HOME}/.mitmproxy"
CERT="${CONF_DIR}/mitmproxy-ca-cert.pem"

# Domains that must bypass the proxy — includes loopback addresses and all
# GitHub Actions infrastructure required for self-hosted runners to operate.
NO_PROXY_DOMAINS="localhost,127.0.0.1,169.254.169.254,::1,github.com,api.github.com,codeload.github.com,ghcr.io,*.actions.githubusercontent.com,results-receiver.actions.githubusercontent.com,*.blob.core.windows.net,objects.githubusercontent.com,objects-origin.githubusercontent.com,github-releases.githubusercontent.com,github-registry-files.githubusercontent.com,release-assets.githubusercontent.com,github-cloud.githubusercontent.com,github-cloud.s3.amazonaws.com,*.pkg.github.com,pkg-containers.githubusercontent.com,dependabot-actions.githubapp.com,api.snapcraft.io"

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

function setup_macos() {
	# Configure host to use mitmproxy
	log_info "Configure host to use mitmproxy"

	local NETWORK_SERVICE
	NETWORK_SERVICE=$(/usr/sbin/networksetup -listallnetworkservices | grep -iE "wi-fi|ethernet|airport" | head -1)

	if [ -z "$NETWORK_SERVICE" ]; then
		log_error "Failed to detect network service"
	fi
	log_info "Using network service: $NETWORK_SERVICE"

	log_info "Adding certificate to host OS"
	sudo security add-trusted-cert -d -p ssl -p basic -k /Library/Keychains/System.keychain "${CERT}"

	# Set Web Proxy in the macOS system
	/usr/sbin/networksetup -setwebproxy "$NETWORK_SERVICE" 127.0.0.1 ${usage_port}
	/usr/sbin/networksetup -setwebproxystate "$NETWORK_SERVICE" on
	/usr/sbin/networksetup -setsecurewebproxy "$NETWORK_SERVICE" 127.0.0.1 ${usage_port}
	/usr/sbin/networksetup -setsecurewebproxystate "$NETWORK_SERVICE" on
	# shellcheck disable=SC2046
	/usr/sbin/networksetup -setproxybypassdomains "$NETWORK_SERVICE" $(echo "${NO_PROXY_DOMAINS}" | tr ',' ' ')

	if [ -n "${GITHUB_ENV:-}" ]; then
		local PROXY_URL="http://127.0.0.1:${usage_port}"
		log_info "GitHub Actions detected: writing proxy vars to \$GITHUB_ENV"
		for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY; do
			echo "${VAR}=${PROXY_URL}" >>"${GITHUB_ENV}"
		done
		for VAR in no_proxy NO_PROXY; do
			echo "${VAR}=${NO_PROXY_DOMAINS}" >>"${GITHUB_ENV}"
		done
		echo "NODE_EXTRA_CA_CERTS=${CERT}" >>"${GITHUB_ENV}"
	fi

	log_success "macOS proxy configuration complete"
}

function provision_simulator_cert() {
	local SIMULATOR_NAME="${1}"

	log_info "Boot the simulator: ${SIMULATOR_NAME}"
	xcrun simctl boot "${SIMULATOR_NAME}" 2>/dev/null || true

	log_info "Waiting for simulator to reach Booted state: ${SIMULATOR_NAME}"
	local BOOTED=false
	for i in $(seq 1 30); do
		if xcrun simctl list devices booted | grep -Fq "${SIMULATOR_NAME} ("; then
			BOOTED=true
			break
		fi
		sleep 2
	done

	if [ "${BOOTED}" != "true" ]; then
		log_error "Simulator '${SIMULATOR_NAME}' did not reach Booted state within 60 seconds"
	fi

	log_info "Add certificate to simulator: ${SIMULATOR_NAME}"
	xcrun simctl keychain "${SIMULATOR_NAME}" add-root-cert "${CERT}"
	log_success "Certificate provisioned to simulator: ${SIMULATOR_NAME}"
}

function setup_ios_simulator() {
	if [ "${usage_setup_ios_simulator}" != "true" ]; then
		return
	fi

	log_info "Available simulators:"
	xcrun simctl list devices

	IFS=',' read -ra SIMULATOR_NAMES <<< "${usage_ios_simulator_name}"
	for SIMULATOR_NAME in "${SIMULATOR_NAMES[@]}"; do
		SIMULATOR_NAME="$(printf '%s\n' "${SIMULATOR_NAME}" | xargs)"  # trim whitespace
		provision_simulator_cert "${SIMULATOR_NAME}"
	done
}

function provision_emulator_cert() {
	local AVD_NAME="${1}"
	local PORT="${2}"
	local SERIAL="emulator-${PORT}"
	local EMULATOR_BIN="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/usr/local/lib/android/sdk}}/emulator/emulator"
	local AVD_DIR="${HOME}/.android/avd"

	log_info "=== Provisioning AVD '${AVD_NAME}' on ${SERIAL} ==="

	log_info "Checking AVD directory: ${AVD_DIR}/${AVD_NAME}.avd"
	if [ ! -d "${AVD_DIR}/${AVD_NAME}.avd" ]; then
		log_info "Available AVDs:"
		ls -la "${AVD_DIR}/" 2>/dev/null || log_info "(AVD directory not found or empty)"
		log_error "AVD '${AVD_NAME}' not found at ${AVD_DIR}/${AVD_NAME}.avd"
	fi
	log_success "AVD directory found"

	log_info "Emulator binary: ${EMULATOR_BIN}"
	log_info "Launching AVD '${AVD_NAME}' on port ${PORT} (proxy configured post-boot via adb reverse)"
	"${EMULATOR_BIN}" \
		-avd "${AVD_NAME}" \
		-port "${PORT}" \
		-no-window -gpu swiftshader_indirect -noaudio -no-boot-anim \
		-camera-back none \
		&>/dev/null &
	log_info "Emulator process launched (PID: $!)"

	log_info "Waiting for ${SERIAL} to come online (adb wait-for-device)..."
	adb -s "${SERIAL}" wait-for-device
	log_success "${SERIAL} is online"

	log_info "Polling sys.boot_completed on ${SERIAL} (up to 120s)..."
	local BOOTED=false
	for i in $(seq 1 60); do
		local BOOT_VAL
		BOOT_VAL=$(adb -s "${SERIAL}" shell getprop sys.boot_completed 2>/dev/null | tr -d '[:space:]')
		log_info "  [${i}/60] sys.boot_completed='${BOOT_VAL}'"
		if [ "${BOOT_VAL}" = "1" ]; then
			BOOTED=true
			break
		fi
		sleep 2
	done
	[ "${BOOTED}" != "true" ] && log_error "AVD '${AVD_NAME}' did not boot within 120 seconds"
	log_success "${SERIAL} boot complete"

	log_info "Gaining root on ${SERIAL} (retrying up to 45s)..."
	local ROOT_OK=false
	for i in $(seq 1 15); do
		local ROOT_EXIT=0
		local ROOT_OUT
		ROOT_OUT=$(adb -s "${SERIAL}" root 2>&1) || ROOT_EXIT=$?
		log_info "  [${i}/15] adb root exit=${ROOT_EXIT} output='${ROOT_OUT}'"
		if [ ${ROOT_EXIT} -eq 0 ]; then
			ROOT_OK=true
			break
		fi
		sleep 3
	done
	[ "${ROOT_OK}" != "true" ] && log_error "Could not gain root on ${SERIAL} after 45 seconds"
	log_success "Root acquired on ${SERIAL}"
	sleep 2

	log_info "Computing certificate hash for ${CERT}"
	local CERT_HASH
	CERT_HASH=$(openssl x509 -inform PEM -subject_hash_old -in "${CERT}" | head -1)
	log_info "Certificate hash: ${CERT_HASH}"

	log_info "Pushing certificate to ${SERIAL}:/data/local/tmp/${CERT_HASH}.0"
	adb -s "${SERIAL}" push "${CERT}" "/data/local/tmp/${CERT_HASH}.0"
	log_success "Certificate pushed"

	log_info "Mounting tmpfs over /system/etc/security/cacerts and installing cert (API 34+ method)"
	# Mount a tmpfs over the legacy system cert dir and populate it with the
	# existing Conscrypt certs plus our mitmproxy cert.
	# On API 34+, the live trust store is in the immutable APEX at
	# /apex/com.android.conscrypt/cacerts/ — pushing there directly has no effect.
	# The fix: bind-mount our populated tmpfs into each Zygote's mount namespace
	# so all new processes (and Zygote itself) see the updated cert store.
	adb -s "${SERIAL}" shell "
		mount -t tmpfs tmpfs /system/etc/security/cacerts
		cp /apex/com.android.conscrypt/cacerts/* /system/etc/security/cacerts/
		mv /data/local/tmp/${CERT_HASH}.0 /system/etc/security/cacerts/
		chmod 644 /system/etc/security/cacerts/${CERT_HASH}.0
		chown root:root /system/etc/security/cacerts/${CERT_HASH}.0
		chcon u:object_r:system_file:s0 /system/etc/security/cacerts/${CERT_HASH}.0
		echo 'Cert files in /system/etc/security/cacerts:'
		ls /system/etc/security/cacerts/ | grep -c '.' | xargs echo '  count:'
	"
	log_success "tmpfs cert store populated"

	log_info "Bind-mounting cert store into Zygote mount namespaces"
	adb -s "${SERIAL}" shell "
		ZYGOTE_PIDS=\$(pidof zygote zygote64 2>/dev/null)
		echo \"Zygote PIDs: \${ZYGOTE_PIDS}\"
		for Z_PID in \${ZYGOTE_PIDS}; do
			echo \"  nsenter for PID \${Z_PID}\"
			nsenter --mount=/proc/\${Z_PID}/ns/mnt -- \
				/bin/mount --bind /system/etc/security/cacerts \
				/apex/com.android.conscrypt/cacerts
		done
		echo 'Zygote namespace bind-mounts complete'
	"
	# Route the emulator's HTTP/HTTPS through mitmproxy using the Proxyman-style
	# approach: adb reverse creates a reliable TCP tunnel from the emulator's own
	# loopback (127.0.0.1:PORT) to the host's mitmproxy port, completely bypassing
	# the QEMU virtual network. The Android system proxy is then pointed at that
	# loopback address.
	#
	# Why this is better than -http-proxy:
	#   -http-proxy intercepts ALL TCP at the QEMU level — including connections the
	#   app makes to its own 127.0.0.1 (e.g. Detox server, ADB-reversed ports). Those
	#   get misrouted to the runner host which has no such service, causing Errno 111
	#   timeouts that disrupt the test run.
	#
	# With adb reverse + system proxy:
	#   - App HTTP/HTTPS → 127.0.0.1:PORT (emulator loopback)
	#                    → ADB reverse tunnel → host mitmproxy  ✓
	#   - Direct socket connections to 127.0.0.1 (non-HTTP, e.g. Detox WebSocket)
	#     bypass the HTTP proxy entirely — they are raw TCP, not CONNECT  ✓
	#   - Connections to 10.0.2.2 (host alias) also bypass the system proxy  ✓
	log_info "Setting up adb reverse tunnel: emulator 127.0.0.1:${usage_port} → host mitmproxy"
	adb -s "${SERIAL}" reverse tcp:"${usage_port}" tcp:"${usage_port}"
	log_success "adb reverse tunnel established"

	log_info "Configuring Android system proxy to 127.0.0.1:${usage_port}"
	adb -s "${SERIAL}" shell settings put global http_proxy "127.0.0.1:${usage_port}"
	adb -s "${SERIAL}" shell settings put global global_http_proxy_exclusion_list "localhost,127.0.0.1,10.0.2.2,::1"
	log_success "Android system proxy configured"

	log_success "Certificate and proxy provisioned to AVD '${AVD_NAME}' (${SERIAL}) — emulator left running for Detox"
}

function setup_android_simulator() {
	if [ "${usage_setup_android_simulator}" != "true" ]; then
		return
	fi

	log_info "Provisioning Android AVDs with mitmproxy certificate"
	log_info "AVDs to provision: '${usage_android_simulator_name}'"

	IFS=',' read -ra AVD_NAMES <<< "${usage_android_simulator_name}"
	local PORT=5554
	for AVD_NAME in "${AVD_NAMES[@]}"; do
		AVD_NAME="$(printf '%s\n' "${AVD_NAME}" | xargs)"  # trim whitespace
		provision_emulator_cert "${AVD_NAME}" "${PORT}"
		PORT=$((PORT + 2))
	done

	log_success "All Android AVDs provisioned"
}

function setup_linux() {
	log_info "Configure host to use mitmproxy"

	log_info "Adding certificate to host OS"
	if command -v update-ca-certificates &>/dev/null; then
		# Debian/Ubuntu
		log_info "Detected system as Debian/Ubuntu"
		sudo cp "${CERT}" /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
		sudo update-ca-certificates
	elif command -v update-ca-trust &>/dev/null; then
		# RHEL/CentOS/Fedora
		log_info "Detected system as RHEL/CentOS/Fedora"
		sudo cp "${CERT}" /etc/pki/ca-trust/source/anchors/mitmproxy-ca-cert.pem
		sudo update-ca-trust extract
	else
		log_error "Unsupported Linux distribution: cannot install CA certificate"
	fi

	# Add the Android emulator gateway IP as a loopback alias on the host.
	# When the Android system proxy is active, the app routes all traffic (including
	# the Detox e2e bridge WebSocket) through mitmproxy. The bridge client connects
	# to ws://10.0.2.2:PORT. Mitmproxy receives a CONNECT 10.0.2.2:PORT and tries
	# to forward it — but 10.0.2.2 only exists inside the emulator, not on the host.
	# By aliasing 10.0.2.2 to the host loopback, mitmproxy's forwarded CONNECT reaches
	# the actual service (Detox server, etc.) at 127.0.0.1:PORT.
	if command -v ip &>/dev/null; then
		sudo ip addr add 10.0.2.2/32 dev lo 2>/dev/null || true
		log_info "Aliased 10.0.2.2 → loopback on host"
	fi

	log_info "Setting webproxy on host OS"
	if command -v gsettings &>/dev/null && gsettings list-schemas 2>/dev/null | grep -q "^org.gnome.system.proxy$"; then
		gsettings set org.gnome.system.proxy mode 'manual'
		gsettings set org.gnome.system.proxy.http host '127.0.0.1'
		gsettings set org.gnome.system.proxy.http port ${usage_port}
		gsettings set org.gnome.system.proxy.https host '127.0.0.1'
		gsettings set org.gnome.system.proxy.https port ${usage_port}
	else
		log_info "GNOME proxy schema not available, skipping gsettings proxy configuration"
	fi

	# Set system-wide proxy environment variables.
	# /etc/environment is read at login shell startup (PAM/SSH), so it covers
	# local dev usage but has no effect on GitHub Actions, where each step is
	# a new process spawned from the runner agent — not a login shell.
	local ENV_FILE="/etc/environment"
	local PROXY_URL="http://127.0.0.1:${usage_port}"
	for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY; do
		if grep -q "^${VAR}=" "${ENV_FILE}" 2>/dev/null; then
			sudo sed -i "s|^${VAR}=.*|${VAR}=\"${PROXY_URL}\"|" "${ENV_FILE}"
		else
			echo "${VAR}=\"${PROXY_URL}\"" | sudo tee -a "${ENV_FILE}" >/dev/null
		fi
	done
	for VAR in no_proxy NO_PROXY; do
		if grep -q "^${VAR}=" "${ENV_FILE}" 2>/dev/null; then
			sudo sed -i "s|^${VAR}=.*|${VAR}=\"${NO_PROXY_DOMAINS}\"|" "${ENV_FILE}"
		else
			echo "${VAR}=\"${NO_PROXY_DOMAINS}\"" | sudo tee -a "${ENV_FILE}" >/dev/null
		fi
	done

	# In GitHub Actions, $GITHUB_ENV is a file that the runner agent reads
	# between steps and injects into the environment of every subsequent step.
	# This is the only reliable way to propagate env vars across steps.
	# The guard ensures this block is skipped outside of GitHub Actions.
	if [ -n "${GITHUB_ENV:-}" ]; then
		log_info "GitHub Actions detected: writing proxy vars to \$GITHUB_ENV"
		for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY; do
			echo "${VAR}=${PROXY_URL}" >>"${GITHUB_ENV}"
		done
		for VAR in no_proxy NO_PROXY; do
			echo "${VAR}=${NO_PROXY_DOMAINS}" >>"${GITHUB_ENV}"
		done
		echo "NODE_EXTRA_CA_CERTS=${CERT}" >>"${GITHUB_ENV}"
	fi

	log_success "Linux proxy configuration complete"
}

function generate_certificate() {

	if [ ! -f "${CERT}" ]; then
		log_info "Certificate does not exist. Creating..."

		# Generate certificate first if it doesn't exist
		mitmdump --set confdir="${CONF_DIR}" --listen-port ${usage_port} --showhost &
		local MITMPROXY_PID=$!

		for i in $(seq 1 10); do
			[ -f "${CERT}" ] && break
			sleep 1
		done

		kill $MITMPROXY_PID 2>/dev/null || true
		wait $MITMPROXY_PID 2>/dev/null || true

		if [ -f "${CERT}" ]; then
			log_success "Created certificate" "${CERT}"
		else
			log_error "Failed to create certificate" "${CERT}"
		fi

	else
		log_info "Certificate already exists. Skipping creation."
	fi
}

function start_mitmproxy() {
	local LOG_DIR="${HOME}/.mitmproxy/logs"
	local LOG_FILE="${LOG_DIR}/mitmproxy.log"
	local FLOW_FILE="${LOG_DIR}/mitmproxy.flows"

	mkdir -p "${LOG_DIR}"

	log_info "Starting mitmproxy on port ${usage_port}, logging to ${LOG_FILE}"

	local ADDON_ARGS=()
	if [ -n "${usage_mock_responses_file:-}" ]; then
		log_info "Mock responses enabled: ${usage_mock_responses_file}"
		ADDON_ARGS+=(-s "$(dirname "$0")/mock_responses.py" --set "mock_responses_file=${usage_mock_responses_file}")
	fi

	local ALLOW_HOSTS_ARGS=()
	if [ -n "${usage_allow_hosts:-}" ]; then
		ALLOW_HOSTS_ARGS+=(--allow-hosts "${usage_allow_hosts}")
	fi

	mitmdump \
		--set confdir="${CONF_DIR}" \
		--listen-port "${usage_port}" \
		--showhost \
		"${ALLOW_HOSTS_ARGS[@]+"${ALLOW_HOSTS_ARGS[@]}"}" \
		"${ADDON_ARGS[@]+"${ADDON_ARGS[@]}"}" \
		-w "${FLOW_FILE}" \
		>"${LOG_FILE}" 2>&1 &

	local MITMPROXY_PID=$!

	# Wait up to 10 seconds for mitmproxy to be ready
	local READY=false
	for i in $(seq 1 10); do
		if ! kill -0 "${MITMPROXY_PID}" 2>/dev/null; then
			log_error "mitmproxy process died unexpectedly. Check logs: ${LOG_FILE}"
		fi
		if (echo >/dev/tcp/127.0.0.1/${usage_port}) 2>/dev/null; then
			READY=true
			break
		fi
		sleep 1
	done

	if [ "${READY}" != "true" ]; then
		log_error "mitmproxy did not start within 10 seconds. Check logs: ${LOG_FILE}"
	fi

	log_success "mitmproxy started (PID: ${MITMPROXY_PID})"
	log_info "Flows: ${FLOW_FILE}"
	log_info "Logs:  ${LOG_FILE}"

	export MITMPROXY_PID

	# In GitHub Actions, propagate the PID to subsequent steps via $GITHUB_ENV
	if [ -n "${GITHUB_ENV:-}" ]; then
		log_info "GitHub Actions detected: writing MITMPROXY_PID to \$GITHUB_ENV"
		echo "MITMPROXY_PID=${MITMPROXY_PID}" >>"${GITHUB_ENV}"
	fi
}

function main() {
	generate_certificate
	start_mitmproxy

	case "${OSTYPE}" in
	darwin*)
		setup_macos
		setup_ios_simulator
		;;
	linux*)
		setup_linux
		setup_android_simulator
		;;
	*)
		log_error "Unknown system can't setup mitmproxy"
		;;
	esac
}

main ${@+"${@}"}

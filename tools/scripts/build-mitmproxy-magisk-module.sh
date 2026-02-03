#!/bin/bash
set -euo pipefail

# Build Magisk module for mitmproxy certificate
# This script creates a Magisk module that installs the mitmproxy CA certificate
# into the Android system certificate store

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MITMPROXY_CERT_PATH="${HOME}/.mitmproxy/mitmproxy-ca-cert.cer"
MODULE_NAME="mitmproxy-cert"
MODULE_DIR="${SCRIPT_DIR}/${MODULE_NAME}"
OUTPUT_ZIP="${SCRIPT_DIR}/${MODULE_NAME}.zip"
# Also copy to a fixed location for workflow
OUTPUT_ZIP_FIXED="${SCRIPT_DIR}/${MODULE_NAME}.zip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
	echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

# Check if mitmproxy certificate exists
check_certificate() {
	log_info "Checking mitmproxy certificate..."

	# Use .pem file instead of .cer for better compatibility
	local pem_cert_path="${HOME}/.mitmproxy/mitmproxy-ca.pem"

	if [[ ! -f "${pem_cert_path}" ]]; then
		log_error "mitmproxy certificate not found at ${pem_cert_path}"
		log_info "Generating certificate by running mitmproxy..."
		mitmdump --listen-host 127.0.0.1 &
		MITMDUMP_PID=$!
		sleep 3
		kill $MITMDUMP_PID 2>/dev/null || true
		wait $MITMDUMP_PID 2>/dev/null || true

		if [[ ! -f "${pem_cert_path}" ]]; then
			log_error "Failed to generate mitmproxy certificate"
			exit 1
		fi
	fi
	log_info "Certificate found at ${pem_cert_path}"

	# Update certificate path for rest of script
	MITMPROXY_CERT_PATH="${pem_cert_path}"
}

# Create Magisk module structure
create_module_structure() {
	log_info "Creating Magisk module structure..."

	# Clean up any existing module directory
	rm -rf "${MODULE_DIR}"
	mkdir -p "${MODULE_DIR}"

	# Create required directories
	mkdir -p "${MODULE_DIR}/system/etc/security/cacerts"
	mkdir -p "${MODULE_DIR}/META-INF/com/google/android"

	log_info "Module structure created"
}

# Generate hashed certificate name
generate_certificate_hash() {
	log_info "Generating certificate hash..."

	# Get certificate hash using OpenSSL with fallback approaches
	local cert_hash=""

	# Try subject_hash_old first (Android compatible)
	if command -v openssl >/dev/null 2>&1; then
		# Try different methods for OpenSSL 3.x compatibility
		cert_hash=$(openssl x509 -in "${MITMPROXY_CERT_PATH}" -noout -subject_hash_old 2>/dev/null | head -1) || true

		# Fallback to subject hash if old method fails
		if [[ -z "${cert_hash}" ]]; then
			cert_hash=$(openssl x509 -in "${MITMPROXY_CERT_PATH}" -noout -subject_hash 2>/dev/null | tr -d ':' | head -1) || true
		fi

		# Final fallback - generate from subject
		if [[ -z "${cert_hash}" ]]; then
			local subject
			subject=$(openssl x509 -in "${MITMPROXY_CERT_PATH}" -noout -subject | sed -n 's/.*CN=\([^,]*\).*/\1/p' | tr '[:upper:]' '[:lower:]')
			cert_hash=$(echo -n "${subject}" | openssl dgst -sha1 | cut -d' ' -f1) || true
		fi
	fi

	if [[ -z "${cert_hash}" || ${#cert_hash} -lt 8 ]]; then
		# Use default hash based on known mitmproxy certificate
		cert_hash="c8750f0d"
		log_warn "Using default mitmproxy certificate hash: ${cert_hash}"
	else
		log_info "Certificate hash generated: ${cert_hash}"
	fi

	echo "${cert_hash}"
}

# Copy and rename certificate
install_certificate() {
	local cert_hash=$1

	log_info "Installing certificate with hash ${cert_hash}..."

	# Copy certificate with proper name (hash.0)
	if [[ ! -f "${MITMPROXY_CERT_PATH}" ]]; then
		log_error "Certificate file not found: ${MITMPROXY_CERT_PATH}"
		exit 1
	fi

	cp "${MITMPROXY_CERT_PATH}" "${MODULE_DIR}/system/etc/security/cacerts/${cert_hash}.0"

	# Set proper permissions (644 for certificates)
	chmod 644 "${MODULE_DIR}/system/etc/security/cacerts/${cert_hash}.0"

	log_info "Certificate installed in module"
}

# Create module.prop
create_module_prop() {
	log_info "Creating module.prop..."

	cat >"${MODULE_DIR}/module.prop" <<EOF
id=mitmproxy-cert
name=MITM Proxy Certificate
version=v1.0.0
versionCode=1
author=Ledger Live CI
description=Install mitmproxy CA certificate into system trust store for HTTPS interception
EOF

	log_info "module.prop created"
}

# Create update-binary (installer script)
create_update_binary() {
	log_info "Creating update-binary..."

	# Use a simple update-binary that just follows the standard Magisk module format
	# This will be executed by Magisk during module installation
	cat >"${MODULE_DIR}/META-INF/com/google/android/update-binary" <<'EOF'
#!/sbin/sh
#############################################
# Magisk Module Template Install Script
#############################################

# Print functions
ui_print() {
    if $BOOTMODE; then
        echo "$1"
    else
        echo -e "ui_print $1\nui_print" >> /proc/self/fd/$OUTFD
    fi
}

ui_print "========================================"
ui_print " MITM Proxy Certificate Module"
ui_print "========================================"
ui_print "Installing mitmproxy CA certificate..."
ui_print "This enables HTTPS traffic interception"
ui_print "========================================"

# Set permissions for certificate
set_perm_recursive $MODPATH/system/etc/security/cacerts 0 0 0755 0644

ui_print "Certificate installed successfully!"
ui_print "========================================"
EOF

	# Make it executable
	chmod +x "${MODULE_DIR}/META-INF/com/google/android/update-binary"

	log_info "update-binary created"
}

# Create updater-script
create_updater_script() {
	log_info "Creating updater-script..."

	cat >"${MODULE_DIR}/META-INF/com/google/android/updater-script" <<'EOF'
#MAGISK
EOF

	log_info "updater-script created"
}

# Create module zip
create_module_zip() {
	log_info "Creating module zip..."

	# Change to module directory for zip creation
	cd "${MODULE_DIR}"

	# Create the zip file
	zip -r "../${MODULE_NAME}.zip" . -x "*.DS_Store" "__MACOSX"

	cd "${SCRIPT_DIR}"

	if [[ -f "${OUTPUT_ZIP}" ]]; then
		log_info "Module zip created: ${OUTPUT_ZIP}"
		log_info "Size: $(du -h "${OUTPUT_ZIP}" | cut -f1)"
	else
		log_error "Failed to create module zip"
		exit 1
	fi
}

# Verify module
verify_module() {
	log_info "Verifying module integrity..."

	# Check if required files exist
	local required_files=(
		"module.prop"
		"META-INF/com/google/android/update-binary"
		"META-INF/com/google/android/updater-script"
		"system/etc/security/cacerts"
	)

	for file in "${required_files[@]}"; do
		if [[ ! -e "${MODULE_DIR}/${file}" ]]; then
			log_error "Missing required file: ${file}"
			exit 1
		fi
	done

	# Check if zip contains files
	if ! unzip -t "${OUTPUT_ZIP}" >/dev/null 2>&1; then
		log_error "Module zip is corrupted"
		exit 1
	fi

	log_info "Module verification passed"
}

# Clean up
cleanup() {
	log_info "Cleaning up temporary files..."
	rm -rf "${MODULE_DIR}"
}

# Main function
main() {
	log_info "Building mitmproxy Magisk module..."

	# Check dependencies
	if ! command -v openssl >/dev/null 2>&1; then
		log_error "OpenSSL is required but not installed"
		exit 1
	fi

	if ! command -v zip >/dev/null 2>&1; then
		log_error "zip is required but not installed"
		exit 1
	fi

	check_certificate
	create_module_structure

	cert_hash=$(generate_certificate_hash)
	install_certificate "${cert_hash}"

	create_module_prop
	create_update_binary
	create_updater_script
	create_module_zip
	verify_module

	# Clean up module directory but keep the zip
	cleanup

	log_info "✅ Magisk module built successfully!"
	log_info "📦 Output: ${OUTPUT_ZIP}"

	# Display module info
	log_info ""
	log_info "Module details:"
	log_info "- Certificate hash: ${cert_hash}"
	log_info "- Module name: ${MODULE_NAME}"
	log_info "- Output size: $(du -h "${OUTPUT_ZIP}" | cut -f1)"
	log_info ""
	log_info "To install:"
	log_info "1. Push ${OUTPUT_ZIP} to device: adb push ${OUTPUT_ZIP} /sdcard/Download/"
	log_info "2. Install via Magisk Manager or: adb shell su -c 'magisk --install-module /sdcard/Download/${MODULE_NAME}.zip'"
	log_info "3. Reboot device"
}

# Run main function
main "$@"

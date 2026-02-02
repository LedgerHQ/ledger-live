#!/bin/bash
set -euo pipefail

# Install Magisk on Android Emulator
# This script patches the emulator's ramdisk.img to install Magisk
# Based on https://github.com/shakalaca/MagiskOnEmulator

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AVD_NAME="${AVD_NAME:-Android_Emulator}"
ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
AVD_API="${AVD_API:-35}"
AVD_ARCH="${AVD_ARCH:-x86_64}"
AVD_TARGET="${AVD_TARGET:-google_apis}"

# Set defaults if not provided
if [[ -z "${AVD_API}" ]]; then AVD_API="35"; fi
if [[ -z "${AVD_ARCH}" ]]; then AVD_ARCH="x86_64"; fi
if [[ -z "${AVD_TARGET}" ]]; then AVD_TARGET="google_apis"; fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
	echo -e "${BLUE}[STEP]${NC} $1"
}

# Check dependencies (minimal for patching)
check_dependencies() {
	log_info "Checking environment for Magisk patching..."

	# Handle both ANDROID_SDK_ROOT and ANDROID_HOME
	if [[ -z "${ANDROID_SDK_ROOT}" && -n "${ANDROID_HOME}" ]]; then
		export ANDROID_SDK_ROOT="${ANDROID_HOME}"
		log_info "Using ANDROID_HOME as ANDROID_SDK_ROOT: ${ANDROID_HOME}"
	fi

	if [[ -z "${ANDROID_SDK_ROOT}" ]]; then
		log_error "Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set"
		exit 1
	fi

	# Verify the SDK directory actually exists
	if [[ ! -d "${ANDROID_SDK_ROOT}" ]]; then
		log_error "Android SDK directory does not exist: ${ANDROID_SDK_ROOT}"
		exit 1
	fi

	# Add common Android SDK paths to search (literal paths)
	local sdk_root="${ANDROID_SDK_ROOT}"
	local found_sdk=""

	# Try to find the actual Android SDK with system-images
	if [[ ! -d "${sdk_root}/system-images" ]]; then
		# Common Android SDK installation paths
		local common_paths=(
			"/usr/local/lib/android/sdk"
			"/usr/local/lib/android-sdk"
			"${ANDROID_HOME}"
			"$HOME/Android/Sdk"
			"$HOME/Library/Android/sdk"
		)

		for path in "${common_paths[@]}"; do
			if [[ -d "${path}" && -d "${path}/system-images" ]]; then
				found_sdk="$path"
				break
			fi
		done

		if [[ -n "$found_sdk" ]]; then
			log_warn "Using detected Android SDK path: $found_sdk"
			sdk_root="$found_sdk"
		else
			log_error "Could not find Android SDK with system-images"
			log_info "Searched paths:"
			printf '  %s\n' "${common_paths[@]}"
			exit 1
		fi
	fi

	export ANDROID_SDK_ROOT="$sdk_root"

	# Check if AVD system image exists (this is what we actually need)
	local system_image_base="${ANDROID_SDK_ROOT}/system-images"
	local system_image_dir="${system_image_base}/android-${AVD_API}/${AVD_TARGET}/${AVD_ARCH}/"
	local ramdisk_path="${system_image_dir}/ramdisk.img"

	log_info "Final Android SDK path: ${ANDROID_SDK_ROOT}"
	log_info "Looking for system image in: ${system_image_dir}"

	if [[ ! -f "$ramdisk_path" ]]; then
		log_error "System image not found at: ${system_image_dir}"
		log_error "Expected ramdisk.img at: $ramdisk_path"
		log_info "Available system images:"
		ls -la "${system_image_base}/" 2>/dev/null || log_info "No system images directory found"
		ls -la "${system_image_base}/android-${AVD_API}/" 2>/dev/null || log_info "No images for API ${AVD_API}"
		exit 1
	fi

	# Check if required tools are available
	if ! command -v "avdmanager" >/dev/null 2>&1; then
		log_warn "avdmanager not found, but continuing..."
	fi

	if ! command -v "adb" >/dev/null 2>&1; then
		log_warn "adb not found, but continuing with patch..."
		# ADB is only needed for verification, not patching
	fi

	# Add Android tools to PATH
	export PATH="${ANDROID_SDK_ROOT}/emulator:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/tools:$PATH"

	log_info "Environment check passed"
	log_info "System image: $ramdisk_path"
}

# Download Magisk
download_magisk() {
	local magisk_dir="${SCRIPT_DIR}/magisk"
	local magisk_zip="${magisk_dir}/magisk.zip"

	log_info "Setting up Magisk..."
	mkdir -p "${magisk_dir}"

	# Use latest stable Magisk
	local magisk_url="https://github.com/topjohnwu/Magisk/releases/download/v27.0/Magisk-v27.0.apk"

	if [[ ! -f "${magisk_zip}" ]]; then
		log_info "Downloading Magisk from ${magisk_url}..."
		curl -L -o "${magisk_zip}" "${magisk_url}"
	else
		log_info "Magisk already downloaded"
	fi

	echo "${magisk_zip}"
}

# Find ramdisk.img
find_ramdisk() {
	local system_image_dir="${ANDROID_SDK_ROOT}/system-images/android-${AVD_API}/${AVD_TARGET}/${AVD_ARCH}"
	local ramdisk_path="${system_image_dir}/ramdisk.img"

	log_info "Looking for ramdisk.img at ${ramdisk_path}..."

	if [[ ! -f "${ramdisk_path}" ]]; then
		log_error "ramdisk.img not found at ${ramdisk_path}"
		log_error "Please ensure the AVD system image is installed"
		exit 1
	fi

	echo "${ramdisk_path}"
}

# Backup original ramdisk
backup_ramdisk() {
	local ramdisk_path=$1
	local backup_path="${ramdisk_path}.backup"

	log_info "Backing up original ramdisk.img..."

	if [[ ! -f "${backup_path}" ]]; then
		cp "${ramdisk_path}" "${backup_path}"
		log_info "Backup created at ${backup_path}"
	else
		log_info "Backup already exists at ${backup_path}"
	fi

	echo "${backup_path}"
}

# Patch ramdisk with Magisk
patch_ramdisk() {
	local ramdisk_path=$1
	local magisk_zip=$2
	local work_dir="${SCRIPT_DIR}/magisk_work"

	log_step "Patching ramdisk with Magisk..."

	# Clean up work directory
	rm -rf "${work_dir}"
	mkdir -p "${work_dir}"

	# Copy ramdisk to work directory
	cp "${ramdisk_path}" "${work_dir}/"

	# Download and use the MagiskOnEmulator patch script
	local patch_script="${work_dir}/patch.sh"
	cat >"${patch_script}" <<'EOF'
#!/bin/bash
set -euo pipefail

# Simplified Magisk patch script for emulator
# Based on shakalaca/MagiskOnEmulator approach

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAMDISK_PATH="${SCRIPT_DIR}/ramdisk.img"
MAGISK_ZIP="${SCRIPT_DIR}/magisk.zip"
WORK_DIR="${SCRIPT_DIR}/patch_work"

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
}

# Check if files exist
if [[ ! -f "${RAMDISK_PATH}" ]]; then
    log_error "ramdisk.img not found"
    exit 1
fi

if [[ ! -f "${MAGISK_ZIP}" ]]; then
    log_error "magisk.zip not found"
    exit 1
fi

# Create work directory
mkdir -p "${WORK_DIR}"

# Extract ramdisk
log_info "Extracting ramdisk..."
cd "${WORK_DIR}"
mkdir -p ramdisk_extracted
cd ramdisk_extracted
magiskboot decompress "../${RAMDISK_PATH}" ramdisk.cpio

# Extract Magisk
log_info "Extracting Magisk..."
mkdir -p magisk_extracted
cd magisk_extracted
unzip -q "../../${MAGISK_ZIP}"

# Find and copy Magisk files
if [[ -f "lib/arm64-v8a/libmagisk.so" ]]; then
    cp "lib/arm64-v8a/libmagisk.so" "../ramdisk_extracted/.magisk/"
    cp "lib/arm64-v8a/libmagiskinit.so" "../ramdisk_extracted/.magisk/"
elif [[ -f "lib/x86_64/libmagisk.so" ]]; then
    cp "lib/x86_64/libmagisk.so" "../ramdisk_extracted/.magisk/"
    cp "lib/x86_64/libmagiskinit.so" "../ramisk_extracted/.magisk/"
else
    log_error "Magisk libraries not found"
    exit 1
fi

# Create magisk init script
cat > "../ramdisk_extracted/init.magisk.rc" << 'MAGISK_RC'
on init
    import /init.magisk.rc
MAGISK_RC

# Repack ramdisk
log_info "Repacking ramdisk..."
cd "../ramdisk_extracted"
magiskboot compress ramdisk.cpio "../${RAMDISK_PATH}"

log_info "Ramdisk patched successfully"
EOF

	chmod +x "${patch_script}"

	# Copy magisk to work directory
	cp "${magisk_zip}" "${work_dir}/magisk.zip"

	# Run patch script
	cd "${work_dir}"
	if ! ./patch.sh; then
		log_error "Failed to patch ramdisk"
		exit 1
	fi

	# Copy patched ramdisk back
	cp "${work_dir}/ramdisk.img" "${ramdisk_path}"

	# Clean up
	rm -rf "${work_dir}"

	log_info "Ramdisk patched successfully"
}

# Install Magisk Manager (optional)
install_magisk_manager() {
	log_info "Magisk Manager installation skipped (not needed for certificate module)"
}

# Verify Magisk installation
verify_magisk() {
	log_info "Verifying Magisk installation..."

	# Wait for emulator to be ready
	local timeout=60
	local count=0

	while [[ $count -lt $timeout ]]; do
		if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
			break
		fi
		sleep 1
		((count++))
	done

	if [[ $count -ge $timeout ]]; then
		log_warn "Emulator not ready after ${timeout} seconds"
	fi

	# Check if Magisk is installed
	if adb shell "command -v magisk" >/dev/null 2>&1; then
		log_info "✅ Magisk is installed and working"
		local magisk_version
		magisk_version=$(adb shell magisk -v 2>/dev/null || echo "unknown")
		log_info "Magisk version: ${magisk_version}"
	else
		log_warn "⚠️  Magisk command not found, but patching may still have worked"
	fi
}

# Main installation function
main() {
	log_info "Installing Magisk on Android Emulator..."
	log_info "AVD: ${AVD_NAME}"
	log_info "API: ${AVD_API}"
	log_info "Arch: ${AVD_ARCH}"
	log_info "Target: ${AVD_TARGET}"

	check_dependencies

	# Download Magisk
	local magisk_zip
	magisk_zip=$(download_magisk)

	# Find and backup ramdisk
	local ramdisk_path
	ramdisk_path=$(find_ramdisk)

	local backup_path
	backup_path=$(backup_ramdisk "${ramdisk_path}")

	# Patch ramdisk
	patch_ramdisk "${ramdisk_path}" "${magisk_zip}"

	log_info "✅ Magisk installation completed!"
	log_info ""
	log_info "Next steps:"
	log_info "1. Stop the emulator if it's running"
	log_info "2. Start the emulator with cold boot"
	log_info "3. Verify Magisk is working with: adb shell magisk -v"
	log_info ""
	log_info "Note: Original ramdisk backed up to ${backup_path}"
}

# Run main function
main "$@"

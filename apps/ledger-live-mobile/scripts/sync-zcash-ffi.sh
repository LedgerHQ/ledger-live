#!/usr/bin/env bash
#
# Copies the prebuilt Zcash engine into the app from a local checkout of
# LedgerHQ/ledger-zcash-utils.
#
# The artifacts are binaries (~4 MB for iOS, ~2 MB per Android ABI) built from
# Rust, so they are fetched rather than committed. Without them the app still
# builds: the iOS pod is skipped, CMake declares no target, and the JS layer
# reports the engine as unavailable.
#
# Usage:
#   ZCASH_UTILS_DIR=../../../ledger-zcash-utils ./scripts/sync-zcash-ffi.sh
#   ./scripts/sync-zcash-ffi.sh --clean
#
# Build the artifacts first, in the zcash-utils checkout:
#   pnpm build:mobile:ios
#   pnpm build:mobile:android
#
# After syncing iOS, run `pnpm pod` so CocoaPods picks up the new pod.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The framework keeps its own name; only the pod that wraps it is named
# ZcashFfiBridge, so the two Clang modules do not collide (see the podspec).
IOS_DEST="$APP_DIR/ios/ZcashFfiBridge"
ANDROID_JNI_DEST="$APP_DIR/android/app/src/main/jniLibs"
ANDROID_HEADER_DEST="$APP_DIR/android/app/src/main/cpp/include"

ABIS=(arm64-v8a armeabi-v7a x86_64 x86)

if [[ "${1:-}" == "--clean" ]]; then
  rm -rf "$IOS_DEST/ZcashFfiMobile.xcframework" "$ANDROID_HEADER_DEST"
  for abi in "${ABIS[@]}"; do
    rm -f "$ANDROID_JNI_DEST/$abi/libzcash_ffi_mobile.so"
  done
  echo "Removed the Zcash engine artifacts. Re-run pnpm pod for iOS."
  exit 0
fi

ZCASH_UTILS_DIR="${ZCASH_UTILS_DIR:-}"
if [[ -z "$ZCASH_UTILS_DIR" ]]; then
  echo "error: set ZCASH_UTILS_DIR to a checkout of LedgerHQ/ledger-zcash-utils" >&2
  exit 1
fi

SRC="$(cd "$ZCASH_UTILS_DIR" && pwd)"
DIST="$SRC/dist"
HEADER="$SRC/crates/zcash-ffi-mobile/include/zcash_ffi_mobile.h"

if [[ ! -f "$HEADER" ]]; then
  echo "error: $HEADER not found -- is ZCASH_UTILS_DIR a ledger-zcash-utils checkout?" >&2
  exit 1
fi

synced_any=0

# ── iOS ──────────────────────────────────────────────────────────────────────
if [[ -d "$DIST/ZcashFfiMobile.xcframework" ]]; then
  mkdir -p "$IOS_DEST"
  rm -rf "$IOS_DEST/ZcashFfiMobile.xcframework"
  cp -R "$DIST/ZcashFfiMobile.xcframework" "$IOS_DEST/"
  echo "ios: ZcashFfiMobile.xcframework"
  synced_any=1
else
  echo "ios: skipped -- run 'pnpm build:mobile:ios' in $SRC"
fi

# ── Android ──────────────────────────────────────────────────────────────────
# The JNI shim includes the same header the Rust crate publishes, so the C ABI
# has exactly one source of truth.
if [[ -d "$DIST/android" ]]; then
  mkdir -p "$ANDROID_HEADER_DEST"
  cp "$HEADER" "$ANDROID_HEADER_DEST/"

  for abi in "${ABIS[@]}"; do
    lib="$DIST/android/$abi/libzcash_ffi_mobile.so"
    if [[ -f "$lib" ]]; then
      mkdir -p "$ANDROID_JNI_DEST/$abi"
      cp "$lib" "$ANDROID_JNI_DEST/$abi/"
      echo "android: $abi/libzcash_ffi_mobile.so"
      synced_any=1
    else
      # A missing ABI is not fatal: Gradle packages what is there, and a device
      # of that architecture simply finds no engine.
      echo "android: $abi missing in $DIST/android"
    fi
  done
else
  echo "android: skipped -- run 'pnpm build:mobile:android' in $SRC"
fi

if [[ "$synced_any" -eq 0 ]]; then
  echo "error: nothing was synced; build the artifacts in $SRC first" >&2
  exit 1
fi

echo
echo "Done. For iOS, run 'pnpm pod' so CocoaPods links the new pod."

#!/usr/bin/env bash
# Emit every cache key the mobile E2E run needs, as step outputs.
#
# hashFiles() is a workflow expression and cannot run here, so the caller passes the
# digests in: HASH_IOS_NATIVE, HASH_ANDROID_NATIVE, HASH_SPECS.
#
# Native builds are keyed on the platform source tree, so they survive across commits
# and are near-always a cache hit. JS bundles are keyed on the checked-out SHA, so a
# dispatch only reuses the PR's bundle when it is dispatched with
# ref=refs/pull/<N>/merge, matching the SHA the PR built.
#
# The AVD key carries /usr/local/lib/android/sdk/emulator/, which means the emulator
# binary every shard runs is whichever one sdkmanager installed the last time this key
# changed — the setup job is skipped for as long as the object exists. Bump AVD_KEY_VERSION
# to force a rebuild onto a current emulator. The build pinned when AVD_API moved to 36
# segfaulted mid-run, which is what that mechanism is for.
#
# Shared by the nightly and the PR smoke workflow. The four build keys are always
# emitted; the extras are emitted only when their inputs are supplied, so each caller
# asks for exactly the keys it consumes.
#
# Env: GITHUB_OUTPUT, REF_NAME, PROD_SUFFIX, HASH_IOS_NATIVE, HASH_ANDROID_NATIVE
#      optional: HASH_SPECS (timing keys), HASH_PODFILE (pod check key),
#                RUNNER_OS + AVD_* (AVD key)

set -euo pipefail

: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"

AVD_KEY_VERSION="r2-v9"

PREFIX=""
if [ "${REF_NAME:-}" = "develop" ]; then
  PREFIX="develop/"
fi

HEAD_SHA=$(git rev-parse HEAD)
SUFFIX="${PROD_SUFFIX:-3}"

{
  echo "ios_native_key=${PREFIX}longterm-${HASH_IOS_NATIVE:?}-detox-native-ios-${SUFFIX}"
  echo "android_native_key=${PREFIX}longterm-${HASH_ANDROID_NATIVE:?}-detox-native-android-${SUFFIX}"
  echo "ios_js_key=${PREFIX}${HEAD_SHA}-detox-js-ios"
  echo "android_js_key=${PREFIX}${HEAD_SHA}-detox-js-android"

  if [ -n "${HASH_SPECS:-}" ]; then
    echo "ios_timing_cache_key=${PREFIX}ios-e2e-timing-${HASH_SPECS}-2"
    echo "android_timing_cache_key=${PREFIX}android-e2e-timing-${HASH_SPECS}-2"
  fi

  if [ -n "${HASH_PODFILE:-}" ]; then
    echo "pod_check_key=${HASH_PODFILE}-pod-lockfile-validated"
  fi

  if [ -n "${AVD_NAME:-}" ]; then
    echo "avd_cache_key=${RUNNER_OS:?}-detox-avd-${AVD_NAME}_5-${AVD_PROFILE:?}-${AVD_TARGET:?}-${AVD_API:?}-${AVD_ARCH:?}-${AVD_CORES:?}-${AVD_RAM_SIZE:?}-${AVD_HEAP_SIZE:?}-${AVD_KEY_VERSION}"
  fi
} >> "$GITHUB_OUTPUT"

#!/usr/bin/env bash
# Startup performance: checks after the build that the binary is the prepared prod-like build.
#
#   verify-build.sh android <apk> [app_dir]
#   verify-build.sh ios <ledgerlivemobile.app> [app_dir]
#
# Prints counts only, never env values (the generated config also holds API keys).
set -euo pipefail

platform="${1:?android|ios}"
artifact="${2:?apk or .app}"
app="${3:-apps/ledger-live-mobile}"

fail() {
  echo "::error::startup-perf verify-build ($platform): $*" >&2
  exit 1
}
# grep -c exits 1 on zero matches; keep the count.
count() { grep -a -c "$@" || true; }

grep -q 'startup-perf prod-like' "$app/src/index.tsx" || fail "the checkout was not prepared (prepare-build.sh)"

case "$platform" in
  android)
    # dotenv.gradle turns every key into a BuildConfig field and a string resValue.
    gen="$app/android/app/build/generated"
    cfg="$gen/source/buildConfig/detoxPreRelease/com/ledger/live/BuildConfig.java"
    res="$gen/res/resValues/detoxPreRelease/values/gradleResValues.xml"
    if [ -f "$cfg" ]; then
      mock=$(count -E '[[:space:]]String MOCK = ' "$cfg")
      detox=$(count -E '[[:space:]]String DETOX = ' "$cfg")
      debug=$(count -F 'String FORCE_DEBUG_VISIBLE = "1";' "$cfg")
    elif [ -f "$res" ]; then
      mock=$(count -F '<string name="MOCK"' "$res")
      detox=$(count -F '<string name="DETOX"' "$res")
      debug=$(count -F '<string name="FORCE_DEBUG_VISIBLE"' "$res")
    else
      fail "neither $cfg nor $res found"
    fi
    unzip -l "$artifact" assets/index.android.bundle > /dev/null || fail "no JS bundle in $artifact"
    bundle_count() { unzip -p "$artifact" assets/index.android.bundle | grep -a -c -F "$1" || true; }
    ;;
  ios)
    rnc="$(cd "$app" && node -p 'require("path").dirname(require.resolve("react-native-config/package.json"))')"
    cfg="$rnc/ios/ReactNativeConfig/GeneratedDotEnv.m"
    [ -f "$cfg" ] || fail "$cfg not found"
    mock=$(count -F '@"MOCK":' "$cfg")
    detox=$(count -F '@"DETOX":' "$cfg")
    debug=$(count -F '@"FORCE_DEBUG_VISIBLE":@"1"' "$cfg")
    bundle="$artifact/main.jsbundle"
    [ -f "$bundle" ] || fail "$bundle not found"
    bundle_count() { grep -a -c -F "$1" "$bundle" || true; }
    ;;
  *) fail "unknown platform $platform" ;;
esac

blur_mock=$(bundle_count BlurViewMock)
blur_real=$(bundle_count ReactNativeBlurView)
echo "config: MOCK lines=$mock DETOX lines=$detox FORCE_DEBUG_VISIBLE=1 lines=$debug; bundle: BlurViewMock=$blur_mock ReactNativeBlurView=$blur_real"
[ "$debug" -ge 1 ] || fail "FORCE_DEBUG_VISIBLE=1 is not in the generated config: Maestro cannot open Debug"
[ "$mock" = 0 ] && [ "$detox" = 0 ] || fail "MOCK or DETOX is still in the generated config"
[ "$blur_mock" = 0 ] || fail "the JS bundle still has the E2E blur mock"
[ "$blur_real" -ge 1 ] || echo "::warning::no ReactNativeBlurView string in the bundle: check the marker before trusting the blur check"

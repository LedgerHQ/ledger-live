#!/usr/bin/env bash
# TEST-BRANCH ONLY (LIVE-39321): runs mobile e2e specs, keeps the device log of every test, and builds a
# report of unhandled promise rejections. Needs the app patch apps/ledger-live-mobile/src/rejectionScan.ts.
# Do not merge.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_DIR="$(cd "$E2E_DIR/../.." && pwd)"
APP_DIR="$REPO_DIR/apps/ledger-live-mobile"

DEFAULT_FILTER='specs/(portfolio|postOnboarding|account|addAccount|deposit|send|swap|settings|market|wallet40Q2|userOpensApplication|languageChange|deeplinks)'
PLATFORM="android"
FILTER="$DEFAULT_FILTER"
BUILD=0
OUT_DIR=""
REPORT_ONLY=""
AVD_NAME=""

usage() {
  cat <<EOF
Usage: scripts/rejection-scan/run.sh [options]

Runs e2e specs with device logs kept for every test, then writes report.md + report.json.

  --platform android|ios   default: android (release build, no Metro needed)
  --filter <regex>         spec path regex (default: main flows)
  --all                    run every spec
  --build                  build the app (and e2e deps) before running
  --avd <name>             Android emulator (AVD) name, if not "Android_Emulator"
  --out <dir>              output dir (default: artifacts/rejection-scan-<timestamp>)
  --report-only <dir>      only rebuild the report from an existing output dir
  -h, --help
EOF
}

die() { echo "ERROR: $*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform) PLATFORM="$2"; shift 2 ;;
    --filter) FILTER="$2"; shift 2 ;;
    --all) FILTER='specs/'; shift ;;
    --build) BUILD=1; shift ;;
    --avd) AVD_NAME="$2"; shift 2 ;;
    --out) OUT_DIR="$2"; shift 2 ;;
    --report-only) REPORT_ONLY="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; die "unknown option $1" ;;
  esac
done

if [[ -n "$REPORT_ONLY" ]]; then
  exec node "$SCRIPT_DIR/report.mjs" "$REPORT_ONLY"
fi

[[ "$PLATFORM" == "android" || "$PLATFORM" == "ios" ]] || die "--platform must be android or ios"
cd "$E2E_DIR" || die "cannot cd to $E2E_DIR"

echo "==> checking prerequisites"
grep -q 'import "./src/rejectionScan"' "$APP_DIR/index.js" ||
  die "app patch missing: index.js must import ./src/rejectionScan"
if ! (command -v docker >/dev/null && docker info >/dev/null 2>&1); then
  echo "    WARNING: Docker is not running. Specs that need Speculos will fail."
fi
[[ -n "${SEED:-}" ]] || echo "    WARNING: SEED is not set. Specs that need Speculos will fail."
[[ -n "${COINAPPS:-}" && -d "${COINAPPS:-}" ]] ||
  echo "    WARNING: COINAPPS is not set to a coin-apps clone. Specs that need Speculos will fail."
[[ -n "${SPECULOS_DEVICE:-}" ]] || echo "    WARNING: SPECULOS_DEVICE is not set (e.g. nanoX)."
if [[ "$PLATFORM" == "android" ]]; then
  command -v adb >/dev/null || die "adb not on PATH"
  EMULATORS="$(adb devices | awk '/^emulator-.*device$/{print $1}')"
  [[ "$(printf '%s' "$EMULATORS" | grep -c .)" == "1" ]] ||
    die "start exactly one Android emulator first (attached: ${EMULATORS:-none})"
  SERIAL="$EMULATORS"
  # Another Ledger build also handles ledgerlive:// deep links: Android then shows an
  # "Open with" chooser over the app and the tests fail.
  OTHER_LEDGER_APPS="$(adb -s "$SERIAL" shell pm list packages 2>/dev/null | tr -d '\r' | sed 's/^package://' |
    grep -E '^com\.ledger\.live' | grep -vE '^com\.ledger\.live\.detox(\.test)?$' || true)"
  [[ -z "$OTHER_LEDGER_APPS" ]] ||
    die "other Ledger apps on $SERIAL steal ledgerlive:// links: $(echo $OTHER_LEDGER_APPS). Uninstall them (adb -s $SERIAL uninstall <pkg>) or use another emulator."
fi

MATCHED="$(find specs -name '*.spec.ts' | grep -E -- "$FILTER" | grep -v '\.skip\.spec\.ts$' || true)"
COUNT="$(printf '%s' "$MATCHED" | grep -c . || true)"
[[ "$COUNT" -gt 0 ]] || die "filter '$FILTER' matched 0 spec files"
echo "==> $COUNT spec file(s) match '$FILTER'"

if [[ "$BUILD" == "1" ]]; then
  echo "==> building e2e deps and the $PLATFORM app (this takes a while)"
  (cd "$REPO_DIR" && pnpm exec nx run ledger-live-mobile-e2e-tests:build-e2e-deps) || die "build-e2e-deps failed"
  (cd "$REPO_DIR" && pnpm e2e:mobile "build:$PLATFORM") || die "app build failed"
fi

echo "==> checking the built app contains the patch"
if [[ "$PLATFORM" == "android" ]]; then
  APK="$(find "$APP_DIR/android/app/build/outputs/apk" -name '*.apk' -not -path '*androidTest*' -not -path '*/debug/*' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)"
  [[ -n "$APK" ]] || die "no release APK found. Run again with --build"
  # grep -c reads the whole stream: grep -q would exit early and SIGPIPE unzip, failing under pipefail.
  PATCH_MATCHES="$(unzip -p "$APK" assets/index.android.bundle 2>/dev/null | LC_ALL=C grep -ac "REJECTION_SCAN_READY" || true)"
  [[ "${PATCH_MATCHES:-0}" -gt 0 ]] ||
    die "APK $APK has no rejection-scan patch. Gradle may have reused an old bundle: delete $APP_DIR/android/app/build and run with --build"
  echo "    ok: $(basename "$APK")"
else
  BUNDLE="$(find "$APP_DIR/ios/build/Build/Products" -path '*Release-iphonesimulator*' -name 'main.jsbundle' 2>/dev/null | head -1)"
  [[ -n "$BUNDLE" ]] || die "no iOS release build found. Run again with --build"
  LC_ALL=C grep -aq "REJECTION_SCAN_READY" "$BUNDLE" ||
    die "iOS build has no rejection-scan patch. Run again with --build"
  echo "    ok: $BUNDLE"
fi

OUT_DIR="${OUT_DIR:-$E2E_DIR/artifacts/rejection-scan-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT_DIR"
echo "==> running specs, output in $OUT_DIR (test output: $OUT_DIR/test-run.log)"

# The bridge server always writes to artifacts/unhandled-rejections-*.jsonl: park old files first.
BRIDGE_FILES_GLOB="$E2E_DIR/artifacts/unhandled-rejections-*.jsonl"
if compgen -G "$BRIDGE_FILES_GLOB" >/dev/null; then
  STALE_DIR="$E2E_DIR/artifacts/rejection-scan-stale-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$STALE_DIR" && mv $BRIDGE_FILES_GLOB "$STALE_DIR/"
  echo "    moved old bridge files to $STALE_DIR"
fi

LOGCAT_PID=""
if [[ "$PLATFORM" == "android" ]]; then
  # Detox does not keep logcat for us here, so record the JS log tag ourselves for the whole run.
  adb -s "$SERIAL" logcat -c
  adb -s "$SERIAL" logcat -v threadtime -s ReactNativeJS:V >"$OUT_DIR/device-logcat.log" 2>&1 &
  LOGCAT_PID=$!
  trap '[[ -n "$LOGCAT_PID" ]] && kill "$LOGCAT_PID" 2>/dev/null' EXIT
fi

DEVICE_ARGS=()
[[ -n "$AVD_NAME" ]] && DEVICE_ARGS=(--device-name "$AVD_NAME")

# Broadcast stays off: the scan must never send real transactions.
# Detox runs jest through /bin/sh without quoting, so pass plain file paths, never the regex.
SPEC_FILES=()
while IFS= read -r spec; do SPEC_FILES+=("$spec"); done <<<"$MATCHED"
DISABLE_TRANSACTION_BROADCAST=1 E2E_RETRIES=0 pnpm "test:$PLATFORM" "${SPEC_FILES[@]}" \
  ${DEVICE_ARGS[@]+"${DEVICE_ARGS[@]}"} \
  --record-logs all \
  --artifacts-location "$OUT_DIR/detox/" \
  2>&1 | tee "$OUT_DIR/test-run.log"
TEST_RC="${PIPESTATUS[0]}"
echo "==> tests finished with exit code $TEST_RC (failures are fine: we only need the logs)"
if [[ -n "$LOGCAT_PID" ]]; then
  kill "$LOGCAT_PID" 2>/dev/null
  wait "$LOGCAT_PID" 2>/dev/null
  LOGCAT_PID=""
fi
if compgen -G "$BRIDGE_FILES_GLOB" >/dev/null; then
  mv $BRIDGE_FILES_GLOB "$OUT_DIR/"
else
  echo "    WARNING: no bridge file (unhandled-rejections-*.jsonl). The report falls back to logcat."
fi

node "$SCRIPT_DIR/report.mjs" "$OUT_DIR"

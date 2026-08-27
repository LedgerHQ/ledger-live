#!/usr/bin/env bash
# Runs a mobile e2e spec repeatedly on an Android emulator degraded to CI-like conditions, so a
# timing-sensitive test fails here instead of in CI.
#
#   scripts/flake-check.sh <spec-filter> [options]
#   scripts/flake-check.sh myWallet --runs 5
#
# Recommended before committing any change to a spec, a page object or a wait helper: CI runs on a
# slower, software-rendered emulator, so a wait that is only just long enough passes locally and
# fails there.
#
# Deliberately not `set -e`: a failing run is the result, not an error, and cleanup must always run.
set -uo pipefail

RUNS=5
LOAD=4
NETWORK=gprs
GPU=swiftshader_indirect
AVD=Android_Emulator
KEEP_EMULATOR=0
DRY_RUN=0
FILTER=""

BOOTED_BY_US=0
LOAD_APPLIED=0
LOOPS_SPAWNED=0
NETWORK_APPLIED=0

# BSD (macOS) and GNU (Linux) disagree on both of these; try BSD, fall back to GNU.
file_mtime() {
  local path="$1"
  stat -f %m "$path" 2>/dev/null || stat -c %Y "$path" 2>/dev/null
  return 0
}

fmt_epoch() {
  local epoch="$1"
  date -r "$epoch" '+%b %d %H:%M' 2>/dev/null || date -d "@$epoch" '+%b %d %H:%M' 2>/dev/null
  return 0
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_value() {
  local flag="$1" value="${2:-}"
  [[ -n "$value" && "$value" != -* ]] || die "$flag requires a value"
  return 0
}

usage() {
  sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  cat <<'USAGE'

Options:
  --runs N           how many times to run the spec (default 5)
  --load N           CPU busy loops inside the guest (default 4, 0 to disable).
                     4 suits native flows; WebView live-app specs (buy/sell) need 2-3,
                     because at 4 the app gets ~1/3 of a 2-vCPU guest and its own
                     60s web-element waits expire.
  --network PROFILE  full | gsm | hscsd | gprs | edge | umts | hsdpa | lte (default gprs)
  --gpu MODE         swiftshader_indirect (CI-like) | angle_indirect | host | auto | guest | off
  --avd NAME         AVD to boot (default Android_Emulator)
  --keep-emulator    leave the emulator running on exit
  --dry-run          run the preflight checks and stop
USAGE
  return 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs) require_value --runs "${2:-}"; RUNS="$2"; shift 2 ;;
    --load) require_value --load "${2:-}"; LOAD="$2"; shift 2 ;;
    --network) require_value --network "${2:-}"; NETWORK="$2"; shift 2 ;;
    --gpu) require_value --gpu "${2:-}"; GPU="$2"; shift 2 ;;
    --avd) require_value --avd "${2:-}"; AVD="$2"; shift 2 ;;
    --keep-emulator) KEEP_EMULATOR=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) die "unknown option: $1" ;;
    *) [[ -n "$FILTER" ]] && die "only one spec filter is supported (got '$FILTER' and '$1')"; FILTER="$1"; shift ;;
  esac
done

[[ -n "$FILTER" ]] || { usage; exit 1; }
[[ "$RUNS" =~ ^[0-9]+$ && "$RUNS" -gt 0 ]] || die "--runs must be a positive integer"
[[ "$LOAD" =~ ^[0-9]+$ ]] || die "--load must be an integer"
case "$NETWORK" in
  full | gsm | hscsd | gprs | edge | umts | hsdpa | lte) ;;
  *) die "--network '$NETWORK' is not an emulator profile (full, gsm, hscsd, gprs, edge, umts, hsdpa, lte)" ;;
esac
case "$GPU" in
  swiftshader_indirect | angle_indirect | host | auto | guest | off) ;;
  *) die "--gpu '$GPU' is not an emulator gpu mode (swiftshader_indirect, angle_indirect, host, auto, guest, off)" ;;
esac

# Absolute cwd, echoed: a harness that silently runs from the wrong directory reports false negatives.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$E2E_DIR" || die "cannot cd to $E2E_DIR"
echo "==> cwd: $PWD"

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"
[[ -x "$EMULATOR_BIN" ]] || die "emulator not found at $EMULATOR_BIN (set ANDROID_HOME)"
command -v adb >/dev/null || die "adb not on PATH"

# The filter must match something. `grep -c` on an empty match would exit 1 and print 0 either way,
# so count explicitly and refuse to "pass" against zero specs.
MATCHED_SPECS="$(find specs -name '*.spec.ts' -print | grep -E -- "$FILTER")"
GREP_RC=$?
[[ "$GREP_RC" -le 1 ]] || die "filter '$FILTER' is not a valid extended regular expression (grep exit $GREP_RC)"
MATCHED_COUNT="$(printf '%s' "$MATCHED_SPECS" | grep -c . )"
[[ "$MATCHED_COUNT" -gt 0 ]] || die "filter '$FILTER' matched 0 spec files under specs/"
echo "==> filter '$FILTER' matches $MATCHED_COUNT spec file(s):"
printf '%s\n' "$MATCHED_SPECS" | head -10 | sed 's/^/      /'
if [[ "$MATCHED_COUNT" -gt 10 ]]; then
  echo "      ... and $(( MATCHED_COUNT - 10 )) more"
  echo "    WARNING: that is a lot of specs for $RUNS run(s). Narrow the filter unless you meant it."
fi

APK_DIR="$E2E_DIR/../../apps/ledger-live-mobile/android/app/build/outputs/apk"
# Only the variant Detox installs: a stray debug APK is not what the run under test uses.
NEWEST_APK="$(find "$APK_DIR" -name '*.apk' -not -path '*androidTest*' -not -path '*/debug/*' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)"
[[ -n "$NEWEST_APK" && -f "$NEWEST_APK" && "$NEWEST_APK" == *.apk ]] ||
  die "no release/detox APK under $APK_DIR — build first: pnpm build:android"
APK_EPOCH="$(file_mtime "$NEWEST_APK")"
[[ -n "$APK_EPOCH" ]] || die "cannot read the mtime of $NEWEST_APK"
echo "==> apk: $(basename "$NEWEST_APK") (built $(( ($(date +%s) - APK_EPOCH) / 60 )) min ago)"
# The Detox APK carries the app's JS bundle, so an APK older than the checked-out app code runs
# yesterday's app against today's specs and fails wholesale.
APP_EPOCH="$(git -C "$E2E_DIR" log -1 --format=%ct -- ../../apps/ledger-live-mobile ../../features ../../libs 2>/dev/null)"
if [[ -n "$APP_EPOCH" && "$APP_EPOCH" -gt "$APK_EPOCH" ]]; then
  echo "    WARNING: app code checked out here is newer than this APK ($(fmt_epoch "$APP_EPOCH") vs $(fmt_epoch "$APK_EPOCH"))."
  echo "             Rebuild before trusting a failure: pnpm build:android"
  echo "             Gradle reports UP-TO-DATE for pnpm-symlinked features/, so trash the bundle outputs first."
fi

if [[ -n "${MOCK:-}" ]]; then
  echo "    WARNING: MOCK='$MOCK' is set. Any non-empty value enables mock mode, '0' included."
fi

AUTH_TOKEN="$HOME/.emulator_console_auth_token"
if [[ -f "$AUTH_TOKEN" && ! -s "$AUTH_TOKEN" ]]; then
  die "$AUTH_TOKEN is empty, so 'adb emu' is refused. Delete it and restart the emulator from the CLI."
fi

# One spawned loop shows up as 3 guest processes; the wrapper is the countable one.
LOOP_PATTERN='^timeout [0-9]+ sh -c'
GUEST_PS='ps -A -o ARGS'

count_guest_loops() {
  adb shell "$GUEST_PS" 2>/dev/null | grep -cE "$LOOP_PATTERN"
  return 0
}

kill_guest_loops() {
  # Killing the host-side adb shell leaves the inner loop running in the guest forever.
  adb shell 'for p in $(ps -A -o PID,ARGS | grep "while :" | grep -v grep | awk "{print \$1}"); do kill -9 $p; done' >/dev/null 2>&1
  return 0
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "==> dry run: preflight only, stopping here"
  exit 0
fi

cleanup() {
  echo
  echo "==> cleanup"
  if [[ "$LOOPS_SPAWNED" -eq 1 || "$LOAD_APPLIED" -gt 0 ]]; then
    kill_guest_loops
    echo "    guest load stopped, idle now: $(adb shell "top -b -n 1 | grep -m1 '%idle'" 2>/dev/null | awk '{for(i=1;i<=NF;i++) if ($i ~ /%idle/) print $i}')"
  fi
  if [[ "$NETWORK_APPLIED" -eq 1 ]]; then
    adb emu network speed full >/dev/null 2>&1
    adb emu network delay none >/dev/null 2>&1
    echo "    network restored: $(adb emu network status 2>/dev/null | awk '/download speed/{print $3, $4}')"
  fi
  adb reverse --remove-all >/dev/null 2>&1
  if [[ "$BOOTED_BY_US" -eq 1 && "$KEEP_EMULATOR" -eq 0 ]]; then
    adb emu kill >/dev/null 2>&1
    echo "    emulator stopped (booted by this script)"
  fi
  return 0
}
trap cleanup EXIT INT TERM

ATTACHED="$(adb devices | grep -c '^emulator-')"
[[ "$ATTACHED" -le 1 ]] ||
  die "$ATTACHED emulators attached. Stop the extras: the degradation and Detox must target the same device."
RUNNING="$(adb devices | awk '/^emulator-/{print $1; exit}')"
if [[ -n "$RUNNING" ]]; then
  export ANDROID_SERIAL="$RUNNING"
  RUNNING_AVD="$(adb -s "$RUNNING" emu avd name 2>/dev/null | head -1 | tr -d '\r')"
  echo "==> reusing running emulator $RUNNING ($RUNNING_AVD)"
  echo "    --gpu $GPU not applied: it is a boot flag. Stop the emulator first for CI-like rendering."
else
  echo "==> booting $AVD (gpu $GPU)"
  BOOT_LOG="$(mktemp "${TMPDIR:-/tmp}/flake-check-emulator.XXXXXX")"
  "$EMULATOR_BIN" -avd "$AVD" -gpu "$GPU" -no-snapshot-save -no-boot-anim >"$BOOT_LOG" 2>&1 &
  BOOTED_BY_US=1
  adb wait-for-device
  for _ in $(seq 1 150); do
    [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] && break
    sleep 2
  done
  [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] ||
    die "emulator did not finish booting within 5 min (log: $BOOT_LOG)"
  echo "    booted"
fi

adb reverse --remove-all >/dev/null 2>&1

if [[ "$NETWORK" != "full" ]]; then
  echo "==> throttling network to $NETWORK"
  adb emu network speed "$NETWORK" >/dev/null 2>&1
  adb emu network delay "$NETWORK" >/dev/null 2>&1
  NETWORK_APPLIED=1
  SPEED="$(adb emu network status 2>/dev/null | awk '/download speed/{print $3}')"
  [[ -n "$SPEED" && "$SPEED" != "0" ]] ||
    die "throttle did not take (download speed reads '$SPEED'); check the emulator console auth token"
  echo "    applied, download speed now $SPEED bits/s"
fi

if [[ "$LOAD" -gt 0 ]]; then
  VCPU_PCT="$(adb shell "top -b -n 1 | grep -m1 'cpu' | awk '{print \$1}'" 2>/dev/null | tr -d '\r%cpu')"
  [[ "$LOAD" -le 6 ]] ||
    echo "    WARNING: >6 loops usually breaks Detox device allocation; failures then are infra noise, not flakes."
  echo "==> starting $LOAD busy loop(s) in the guest (guest cpu capacity: ${VCPU_PCT:-unknown}%)"
  # Loops orphaned by an earlier interrupted run would silently add to the requested load.
  STALE="$(count_guest_loops)"
  if [[ "$STALE" -gt 0 ]]; then
    echo "    killing $STALE stale loop(s) from a previous run"
    kill_guest_loops
  fi
  BUDGET=$(( RUNS * 600 + 300 ))
  LOOPS_SPAWNED=1
  for _ in $(seq 1 "$LOAD"); do
    adb shell "timeout $BUDGET sh -c 'while :; do :; done'" >/dev/null 2>&1 &
  done
  sleep 3
  ACTUAL="$(count_guest_loops)"
  [[ "$ACTUAL" -eq "$LOAD" ]] ||
    die "requested $LOAD busy loops, the guest reports $ACTUAL — the load applied is not the load asked for"
  LOAD_APPLIED="$ACTUAL"
  echo "    $ACTUAL running, guest loadavg: $(adb shell cat /proc/loadavg 2>/dev/null | awk '{print $1}')"
fi

LOG_DIR="$E2E_DIR/artifacts/flake-check"
mkdir -p "$LOG_DIR"
# Logs from an earlier invocation would otherwise be read as this run's results.
find "$LOG_DIR" -maxdepth 1 -name '*.log' -delete
PASS=0; FAIL=0; INFRA=0; WHOLESALE=0; SETUP_FAILURE=0; RESULTS=()

echo
echo "==> running '$FILTER' $RUNS time(s)"
for i in $(seq 1 "$RUNS"); do
  if [[ "$LOAD" -gt 0 ]]; then
    LIVE="$(count_guest_loops)"
    if [[ "$LIVE" -lt "$LOAD" ]]; then
      echo "    topping up load: $LIVE of $LOAD loops alive"
      for _ in $(seq 1 $(( LOAD - LIVE )) ); do
        adb shell "timeout $BUDGET sh -c 'while :; do :; done'" >/dev/null 2>&1 &
      done
      sleep 3
      LOAD_APPLIED="$(count_guest_loops)"
    fi
  fi
  LOG="$LOG_DIR/run-$i.log"
  START=$SECONDS
  E2E_RETRIES=0 pnpm test:android "$FILTER" >"$LOG" 2>&1
  RC=$?
  ELAPSED=$(( SECONDS - START ))
  if [[ "$RC" -eq 0 ]]; then
    PASS=$(( PASS + 1 )); RESULTS+=("run $i: PASS  ${ELAPSED}s")
    echo "    run $i/$RUNS: PASS (${ELAPSED}s)"
  elif grep -qE 'Another emulator instance is running|response not received|cannot bind listener|Test suite failed to run' "$LOG" &&
    ! grep -qE 'error TS[0-9]+|Cannot find module|SyntaxError' "$LOG"; then
    INFRA=$(( INFRA + 1 )); RESULTS+=("run $i: INFRA ${ELAPSED}s  $LOG")
    echo "    run $i/$RUNS: INFRA NOISE (${ELAPSED}s) — not a flake, see $LOG"
  else
    FAIL=$(( FAIL + 1 ))
    FAILED_TESTS="$(grep -cE '✕' "$LOG")"
    TOTAL_TESTS="$(grep -cE '✓|✕' "$LOG")"
    RESULTS+=("run $i: FAIL  ${ELAPSED}s  ${FAILED_TESTS}/${TOTAL_TESTS} tests  $LOG")
    echo "    run $i/$RUNS: FAIL (${ELAPSED}s, ${FAILED_TESTS}/${TOTAL_TESTS} tests) — $LOG"
    grep -E '✕' "$LOG" | head -3 | sed 's/^/        /'
    if [[ "$TOTAL_TESTS" -eq 0 ]]; then
      SETUP_FAILURE=1
    elif [[ "$FAILED_TESTS" -eq "$TOTAL_TESTS" && "$TOTAL_TESTS" -gt 1 ]]; then
      WHOLESALE=1
    fi
  fi
done

echo
echo "==> result: $PASS passed, $FAIL failed, $INFRA infra noise (of $RUNS)"
printf '    %s\n' "${RESULTS[@]}"
echo "    conditions: network $NETWORK, $LOAD_APPLIED busy loop(s), gpu $GPU"

if [[ "$FAIL" -gt 0 ]]; then
  echo
  if [[ "$SETUP_FAILURE" -eq 1 ]]; then
    echo "    A run ended before any test executed, so this is a build or setup failure, not a wait."
    echo "    A compile or launch failure is printed at the end of the run log."
  elif [[ "$WHOLESALE" -eq 1 ]]; then
    echo "    Every test in the spec failed, which is a build or setup problem rather than a tight wait."
    echo "    Check the APK is newer than the app code, then re-run before reading anything into this."
  elif [[ "$FAIL" -eq "$RUNS" && "$RUNS" -gt 1 ]]; then
    echo "    Every run failed, so this is deterministic under these conditions, not a flake."
    echo "    Re-run with a lower --load (or --load 0) to tell 'conditions too harsh for this flow'"
    echo "    apart from a real breakage. A WebView live-app spec fails this way at --load 4."
  else
    echo "    Do not commit yet. A failure here means a wait is only just long enough."
    echo "    Fix the wait — anchor on the element that proves the state (a sheet's own content id,"
    echo "    fully visible) — rather than adding a retry or a longer timeout."
  fi
  exit 1
fi
if [[ "$PASS" -eq 0 ]]; then
  echo "    Inconclusive: no run completed. Fix the setup before trusting this as a pass."
  exit 2
fi

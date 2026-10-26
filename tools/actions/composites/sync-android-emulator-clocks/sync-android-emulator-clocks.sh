#!/usr/bin/env bash
# QAA-1665: an emulator quick-booted from the AVD snapshot can keep the clock of the moment the
# snapshot was taken, and Android then rejects every server certificate issued after it.
# Waits for each emulator to finish booting, sets its clock to the runner's UTC time when they
# differ by more than the tolerance, and fails when a clock can't be read or corrected.
#
# Optional environment:
#   EMULATOR_SERIALS     — space-separated adb serials (default: emulator-5554 emulator-5556 emulator-5558)
#   BOOT_TIMEOUT         — seconds to wait for all emulators to finish booting (default: 300)
#   CLOCK_TOLERANCE      — largest difference in seconds left as is (default: 60)
#   GITHUB_STEP_SUMMARY  — when set, gets each emulator's clock before and after
#
# Requires: adb on PATH

set -uo pipefail

readonly ADB_CALL_TIMEOUT=30

IFS=' ' read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"
BOOT_TIMEOUT=${BOOT_TIMEOUT:-300}
CLOCK_TOLERANCE=${CLOCK_TOLERANCE:-60}

log() {
  echo "[$(date -u +%H:%M:%S)] $*"
}

# GNU date on the runner, BSD date for a local run.
utc() {
  date -u -d "@$1" +%FT%TZ 2>/dev/null || date -u -r "$1" +%FT%TZ
}

duration() {
  local s=$1
  if ((s >= 86400)); then
    echo "$((s / 86400))d $((s % 86400 / 3600))h"
  elif ((s >= 3600)); then
    echo "$((s / 3600))h $((s % 3600 / 60))m"
  elif ((s >= 60)); then
    echo "$((s / 60))m $((s % 60))s"
  else
    echo "${s}s"
  fi
}

# "3d 4h behind" for a negative offset (guest minus runner), "12s ahead" for a positive one.
describe_offset() {
  local offset=$1
  if ((offset < 0)); then
    echo "$(duration $((-offset))) behind"
  elif ((offset > 0)); then
    echo "$(duration "$offset") ahead"
  else
    echo "0s"
  fi
}

guest_epoch() {
  timeout "$ADB_CALL_TIMEOUT" adb -s "$1" shell date -u +%s 2>/dev/null | tr -d '\r'
}

fail() {
  local serial=$1 message=$2
  echo "::error title=Android emulator clock (QAA-1665)::${serial}: ${message}"
  failures=$((failures + 1))
}

failures=0
rows=()
runner_start=$(date -u +%s)
deadline=$((runner_start + BOOT_TIMEOUT))

for serial in "${SERIALS[@]}"; do
  # A floor, so an emulator that never boots doesn't leave none for the ones after it.
  remaining=$((deadline - $(date -u +%s)))
  ((remaining < 5)) && remaining=5
  if ! timeout "$remaining" adb -s "$serial" wait-for-device shell \
    'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'; then
    fail "$serial" "did not finish booting within ${BOOT_TIMEOUT}s, so its clock can't be checked"
    rows+=("| \`${serial}\` | not booted | | | ❌ |")
    continue
  fi

  before=$(guest_epoch "$serial")
  runner=$(date -u +%s)
  if ! [[ "$before" =~ ^[0-9]+$ ]]; then
    fail "$serial" "could not read the clock (got '${before}')"
    rows+=("| \`${serial}\` | unreadable | | | ❌ |")
    continue
  fi
  offset=$((before - runner))

  if ((${offset#-} <= CLOCK_TOLERANCE)); then
    log "✅ ${serial} clock $(utc "$before") is in sync with the runner (offset $(describe_offset "$offset"))"
    rows+=("| \`${serial}\` | $(utc "$before") | $(describe_offset "$offset") | unchanged | ✅ in sync |")
    continue
  fi

  log "⏰ ${serial} clock $(utc "$before") vs runner $(utc "$runner"): $(describe_offset "$offset"); setting it"
  # Toybox date's POSIX format MMDDhhmmCCYY.ss, read as UTC with -u.
  set_output=$(timeout "$ADB_CALL_TIMEOUT" adb -s "$serial" shell su 0 date -u "$(date -u +%m%d%H%M%Y.%S)" 2>&1 | tr -d '\r')
  after=$(guest_epoch "$serial")
  runner=$(date -u +%s)
  if [[ "$after" =~ ^[0-9]+$ ]]; then
    drift=$((after - runner))
    if ((${drift#-} <= CLOCK_TOLERANCE)); then
      log "✅ ${serial} clock set to $(utc "$after")"
      rows+=("| \`${serial}\` | $(utc "$before") | $(describe_offset "$offset") | $(utc "$after") | ✅ corrected |")
      continue
    fi
    after_utc=$(utc "$after")
  else
    after_utc=unreadable
  fi
  fail "$serial" "clock is ${after_utc} after setting it to the runner's $(utc "$runner") (date said: ${set_output})"
  rows+=("| \`${serial}\` | $(utc "$before") | $(describe_offset "$offset") | ${after_utc} | ❌ not corrected |")
done

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo "### Android emulator clocks"
    echo "Runner clock $(utc "$runner_start"), tolerance ${CLOCK_TOLERANCE}s. A clock far behind is the age of the AVD snapshot."
    echo
    echo "| Emulator | Clock before | Offset from runner | Clock after | Result |"
    echo "|---|---|---|---|---|"
    printf '%s\n' "${rows[@]}"
  } >>"$GITHUB_STEP_SUMMARY"
fi

if ((failures > 0)); then
  log "❌ ${failures} of ${#SERIALS[@]} emulators could not be checked or corrected; tests would fail with TLS errors"
  exit 1
fi
log "✅ All ${#SERIALS[@]} emulator clocks are within ${CLOCK_TOLERANCE}s of the runner"

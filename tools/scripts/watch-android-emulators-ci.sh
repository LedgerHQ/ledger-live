#!/usr/bin/env bash
# Watches the Android emulators for the duration of a mobile E2E shard and records the
# moment one disappears, plus whatever host-side evidence we can still reach.
#
# Why this exists (QAA-1497): since 2026-08-14 one of the three emulators terminates
# silently mid-run. Detox then fails every later spec with a misleading assertion error
# ("element not found", "blank screen"), so the real cause is invisible in the report and
# the shard burns its remaining budget. The emulator writes nothing to its own log when
# this happens, so absence of evidence is itself the signal we need to capture.
#
# Required environment:
#   ARTIFACTS_DIR     — directory collected by the upload-artifact step
#
# Optional environment:
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554 emulator-5556 emulator-5558)
#   WATCH_INTERVAL    — seconds between polls (default: 5)
#
# Requires: adb on PATH. Never exits non-zero: this must not be able to fail a shard.

set -uo pipefail

readonly ARTIFACTS_DIR="${ARTIFACTS_DIR:-e2e/mobile/artifacts}"
readonly DEATH_LOG="${ARTIFACTS_DIR}/emulator-deaths.log"
readonly DIAG_DIR="${ARTIFACTS_DIR}/host-diagnostics"
readonly INTERVAL="${WATCH_INTERVAL:-5}"
read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"

mkdir -p "$ARTIFACTS_DIR" "$DIAG_DIR" 2>/dev/null || true

log() { echo "[watchdog $(date -u +%H:%M:%S)] $*"; }

# Snapshot the host state that our artifacts cannot otherwise show. Each item is
# best-effort: on a hardened runner most of these are simply unavailable, and an empty
# file is still a useful answer (it rules the source out).
capture_diagnostics() {
  local serial="$1"
  local stamp="$2"
  local out="${DIAG_DIR}/${stamp}_${serial}"
  mkdir -p "$out" 2>/dev/null || true

  # Was the process OOM-killed, or did the kernel see it die?
  { dmesg -T 2>/dev/null || sudo -n dmesg -T 2>/dev/null; } | tail -400 >"${out}/dmesg.txt" 2>/dev/null || true
  # The emulator's own crash database. If the emulator crashed it records itself here;
  # an empty/absent entry is positive evidence of an EXTERNAL kill.
  cp -a /tmp/android-runner/emu-crash-*.db "${out}/" 2>/dev/null || true
  ls -la /tmp/android-runner 2>/dev/null >"${out}/android-runner-ls.txt" || true
  # Per-process memory, which the host-aggregate usage sampler cannot show.
  ps -eo pid,ppid,rss,pcpu,etime,comm --sort=-rss 2>/dev/null | head -40 >"${out}/ps.txt" || true
  free -m 2>/dev/null >"${out}/free.txt" || true
  # cgroup limits: a per-job cap well under the host total would kill a qemu while the
  # host still looks healthy in usage-metrics.
  for f in /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory.events /sys/fs/cgroup/cpu.max; do
    [ -r "$f" ] && { echo "== $f"; cat "$f"; } >>"${out}/cgroup.txt" 2>/dev/null
  done
  adb devices >"${out}/adb-devices.txt" 2>&1 || true
  log "diagnostics for $serial written to ${out}"
}

log "watching ${SERIALS[*]} every ${INTERVAL}s"
declare -A reported=()

while true; do
  online="$(adb devices 2>/dev/null || true)"
  for serial in "${SERIALS[@]}"; do
    if ! grep -q "^${serial}[[:space:]]*device" <<<"$online"; then
      if [ -z "${reported[$serial]:-}" ]; then
        reported[$serial]=1
        stamp="$(date -u +%Y%m%dT%H%M%SZ)"
        log "❌ $serial is GONE at ${stamp}"
        echo "${stamp} ${serial} disappeared from adb devices" >>"$DEATH_LOG"
        capture_diagnostics "$serial" "$stamp"
      fi
    else
      # Came back (Detox relaunches a replacement) — allow it to be reported again.
      reported[$serial]=""
    fi
  done
  sleep "$INTERVAL"
done

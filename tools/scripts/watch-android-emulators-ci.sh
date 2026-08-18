#!/usr/bin/env bash
# Watches the Android emulators during a mobile E2E shard, records the moment one
# disappears, and captures the host-side evidence our artifacts cannot otherwise show.
#
# Why this exists (QAA-1497): since 2026-08-14 an emulator terminates silently partway
# through a shard. Detox then fails every later spec with a misleading assertion error,
# so the real cause never reaches the report.
#
# What the first run of this script established, and what shaped it:
#   - at the moment of death the host had 17 GB free of 32 GB — OOM is ruled out with
#     direct host evidence, not inference
#   - the kernel ring buffer contains nothing after boot, so no OOM-killer, segfault or
#     kill was ever logged
#   - the qemu process is simply absent from the process table
# The gap that remained: we only ever saw the host AFTER the death. Hence the rolling
# pre-death snapshots below, which are the point of this script.
#
# Required environment:
#   ARTIFACTS_DIR     — directory collected by the upload-artifact step
#
# Optional environment:
#   EMULATOR_SERIALS  — space-separated adb serials (default: emulator-5554 5556 5558)
#   WATCH_INTERVAL    — seconds between polls (default: 5)
#   WATCH_STOP_FILE   — watcher exits once this file exists (workflow writes it after Detox)
#
# Requires: adb on PATH. Never exits non-zero: this must not be able to fail a shard.

set -uo pipefail

readonly ARTIFACTS_DIR="${ARTIFACTS_DIR:-e2e/mobile/artifacts}"
readonly DEATH_LOG="${ARTIFACTS_DIR}/emulator-deaths.log"
readonly DIAG_DIR="${ARTIFACTS_DIR}/host-diagnostics"
readonly TREND_LOG="${DIAG_DIR}/host-trend.tsv"
readonly INTERVAL="${WATCH_INTERVAL:-5}"
readonly STOP_FILE="${WATCH_STOP_FILE:-${ARTIFACTS_DIR}/.watchdog-stop}"
read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"

mkdir -p "$ARTIFACTS_DIR" "$DIAG_DIR" 2>/dev/null || true

log() { echo "[watchdog $(date -u +%H:%M:%S)] $*"; }

# Rolling snapshots of the host, kept so a death can be read in context. Without these we
# only ever see the aftermath, by which point the process is already gone.
RING_DIR="$(mktemp -d 2>/dev/null || echo "${DIAG_DIR}/.ring")"
mkdir -p "$RING_DIR" 2>/dev/null || true
readonly RING_DIR
readonly RING_DEPTH=6

snapshot() {
  local slot="$1"
  {
    echo "== $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "-- qemu processes"
    local pids
    pids="$(pgrep -d, qemu-system 2>/dev/null || true)"
    [ -n "$pids" ] && ps -o pid,rss,pcpu,stat,etime,comm -p "$pids" 2>/dev/null || echo "(no qemu process)"
    echo "-- memory"
    free -m 2>/dev/null || true
    echo "-- adb"
    adb devices 2>&1 || true
  } >"${RING_DIR}/snap_${slot}.txt" 2>/dev/null || true
}

# One line per poll: cheap, and makes a slow squeeze (e.g. Hyper-V dynamic memory
# reclaiming from the VM) visible as a trend rather than a single reading.
trend() {
  local mem qemu
  mem="$(free -m 2>/dev/null | awk '/^Mem:/{print $2"\t"$3"\t"$4"\t"$7}')"
  qemu="$(pgrep -c qemu-system 2>/dev/null || echo 0)"
  printf '%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${mem:-?}" "$qemu" >>"$TREND_LOG" 2>/dev/null || true
}

capture_diagnostics() {
  local serial="$1"
  local stamp="$2"
  local out="${DIAG_DIR}/${stamp}_${serial}"
  mkdir -p "$out" 2>/dev/null || true

  # The seconds BEFORE the death — the whole reason this script keeps a ring buffer.
  cp -a "${RING_DIR}"/snap_*.txt "${out}/" 2>/dev/null || true

  # Kernel view. dmesg on this runner has only ever contained boot messages, so try
  # journalctl too before concluding "the kernel logged nothing".
  { dmesg -T 2>/dev/null || sudo -n dmesg -T 2>/dev/null; } | tail -400 >"${out}/dmesg.txt" 2>/dev/null || true
  { journalctl -k --since "-10 min" --no-pager 2>/dev/null || sudo -n journalctl -k --since "-10 min" --no-pager 2>/dev/null; } \
    >"${out}/journal-kernel.txt" 2>/dev/null || true

  # The emulator's own crash database. A qemu that crashes records itself here, so an
  # empty entry is positive evidence of an EXTERNAL kill rather than a self-crash.
  cp -a /tmp/android-runner/emu-crash-*.db "${out}/" 2>/dev/null || true
  ls -laR /tmp/android-runner >"${out}/android-runner-ls.txt" 2>/dev/null || true

  ps -eo pid,ppid,rss,pcpu,stat,etime,comm --sort=-rss 2>/dev/null | head -40 >"${out}/ps.txt" || true
  free -m 2>/dev/null >"${out}/free.txt" || true
  cat /proc/meminfo 2>/dev/null | head -20 >"${out}/meminfo.txt" || true

  # cgroup limits, v2 then v1. A per-job cap well under the host total would kill a qemu
  # while `free` still looks healthy.
  {
    cat /proc/self/cgroup 2>/dev/null
    for f in /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory.events /sys/fs/cgroup/cpu.max \
             /sys/fs/cgroup/memory/memory.limit_in_bytes /sys/fs/cgroup/memory/memory.failcnt; do
      [ -r "$f" ] && { echo "== $f"; cat "$f"; }
    done
  } >"${out}/cgroup.txt" 2>/dev/null || true

  adb devices >"${out}/adb-devices.txt" 2>&1 || true
  log "diagnostics for $serial written to ${out}"
}

log "watching ${SERIALS[*]} every ${INTERVAL}s (stop file: ${STOP_FILE})"
declare -A alive=()      # serial has been seen up at least once
declare -A reported=()
slot=0

while true; do
  [ -f "$STOP_FILE" ] && { log "stop file present — exiting"; break; }

  trend
  snapshot "$((slot % RING_DEPTH))"
  slot=$((slot + 1))

  online="$(adb devices 2>/dev/null || true)"
  for serial in "${SERIALS[@]}"; do
    if grep -q "^${serial}[[:space:]]*device" <<<"$online"; then
      alive[$serial]=1
      reported[$serial]=""
    elif [ -n "${alive[$serial]:-}" ] && [ -z "${reported[$serial]:-}" ]; then
      # Only a serial that was previously UP can have "disappeared". Without this gate the
      # first polls, before the emulators finish booting, report three phantom deaths.
      reported[$serial]=1
      stamp="$(date -u +%Y%m%dT%H%M%SZ)"
      log "❌ $serial is GONE at ${stamp}"
      echo "${stamp} ${serial} disappeared from adb devices" >>"$DEATH_LOG"
      capture_diagnostics "$serial" "$stamp"
    fi
  done
  sleep "$INTERVAL"
done

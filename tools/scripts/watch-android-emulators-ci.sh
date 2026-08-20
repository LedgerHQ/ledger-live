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
# the death log and core-dump capture below, which are the point of this script.
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
readonly WEDGE_LOG="${ARTIFACTS_DIR}/emulator-wedges.log"
readonly DIAG_DIR="${ARTIFACTS_DIR}/host-diagnostics"
readonly TREND_LOG="${DIAG_DIR}/host-trend.tsv"
readonly INTERVAL="${WATCH_INTERVAL:-5}"
readonly STOP_FILE="${WATCH_STOP_FILE:-${ARTIFACTS_DIR}/.watchdog-stop}"
read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"

mkdir -p "$ARTIFACTS_DIR" "$DIAG_DIR" 2>/dev/null || true

log() { echo "[watchdog $(date -u +%H:%M:%S)] $*"; }

# qemu segfaults, and the kernel then spends 2-4 minutes writing a ~1 GB core dump
# before the process leaves the table. During that window RSS is frozen to the byte and
# ps reports I rather than S, so the loss is detectable minutes before adb notices.
# Surfacing it early beats discovering it one 60s timeout at a time.
# See: https://ledgerhq.atlassian.net/browse/QAA-1497
readonly WEDGE_POLLS=4 # consecutive polls with a byte-identical RSS before we call it
declare -A rss_prev=() rss_same=() wedge_reported=()

check_wedges() {
  local pids
  pids="$(pgrep -d, qemu-system 2>/dev/null || true)"
  [ -z "$pids" ] && return 0

  local pid rss stat
  while read -r pid rss stat; do
    [ -z "${pid:-}" ] && continue
    if [ "${rss_prev[$pid]:-}" = "$rss" ]; then
      rss_same[$pid]=$(( ${rss_same[$pid]:-0} + 1 ))
    else
      rss_same[$pid]=0
    fi
    rss_prev[$pid]="$rss"

    # Frozen memory alone is not enough - an idle emulator can hold steady. The state
    # flip is what separates a wedged process from a quiet one: every healthy sibling
    # stays S while the one that is about to disappear reads I.
    if [ "${rss_same[$pid]:-0}" -ge "$WEDGE_POLLS" ] && [[ "$stat" == I* ]] &&
      [ -z "${wedge_reported[$pid]:-}" ]; then
      wedge_reported[$pid]=1
      local stamp
      stamp="$(date -u +%Y%m%dT%H%M%SZ)"
      log "⚠️  qemu pid ${pid} looks WEDGED at ${stamp} (rss ${rss} kB unchanged for $((WEDGE_POLLS * INTERVAL))s, state ${stat})"
      echo "${stamp} pid=${pid} rss=${rss} state=${stat} frozen_for=$((WEDGE_POLLS * INTERVAL))s" >>"$WEDGE_LOG"
      # Capture here, not only at the death. This is the first moment we know something
      # is wrong and the process still exists - by the time it leaves the table there is
      # nothing left to inspect.
      capture_diagnostics "wedge-pid${pid}" "$stamp"
    fi
  done < <(ps -o pid=,rss=,stat= -p "$pids" 2>/dev/null || true)
}

# One line per poll: cheap, and makes a slow squeeze (e.g. Hyper-V dynamic memory
# reclaiming from the VM) visible as a trend rather than a single reading. The socket
# and fd columns are here rather than only in the ring buffer because exhaustion is a
# ramp, not an event - it has to be readable across the whole run to be recognisable.
#
# Columns: ts, mem_total, mem_used, mem_free, mem_avail (MB), qemu_count,
#          load1, tcp_inuse, tcp_tw (TIME_WAIT), qemu_fds_total, qemu_socks_total
trend() {
  local mem qemu load tcp_inuse tcp_tw fds socks pids
  mem="$(free -m 2>/dev/null | awk '/^Mem:/{print $2"\t"$3"\t"$4"\t"$7}')"
  qemu="$(pgrep -c qemu-system 2>/dev/null || echo 0)"
  load="$(awk '{print $1}' /proc/loadavg 2>/dev/null)"
  tcp_inuse="$(awk '/^TCP:/{print $3}' /proc/net/sockstat 2>/dev/null)"
  tcp_tw="$(awk '/^TCP:/{print $7}' /proc/net/sockstat 2>/dev/null)"
  fds=0
  socks=0
  pids="$(pgrep qemu-system 2>/dev/null || true)"
  for p in $pids; do
    fds=$((fds + $(find "/proc/${p}/fd" -mindepth 1 2>/dev/null | wc -l)))
    socks=$((socks + $(find "/proc/${p}/fd" -mindepth 1 -lname 'socket:*' 2>/dev/null | wc -l)))
  done
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${mem:-?}" "$qemu" \
    "${load:-?}" "${tcp_inuse:-?}" "${tcp_tw:-?}" "$fds" "$socks" >>"$TREND_LOG" 2>/dev/null || true
}

capture_diagnostics() {
  local serial="$1"
  local stamp="$2"
  local out="${DIAG_DIR}/${stamp}_${serial}"
  mkdir -p "$out" 2>/dev/null || true

  # The seconds BEFORE the death — the whole reason this script keeps a ring buffer.

  # Kernel view. dmesg on this runner has only ever contained boot messages, so try
  # journalctl too before concluding "the kernel logged nothing".
  { dmesg -T 2>/dev/null || sudo -n dmesg -T 2>/dev/null; } | tail -400 >"${out}/dmesg.txt" 2>/dev/null || true

  # qemu is not hanging, it is dying: every thread of a "wedged" emulator sits in
  # do_exit with one in vfs_coredump, i.e. the kernel is writing a core file and the
  # minutes before the process vanishes are that write. The dump is therefore the one
  # artefact that can name the crash, so record where it goes and what was collected.
  {
    echo "-- core_pattern"
    cat /proc/sys/kernel/core_pattern 2>/dev/null || true
    echo "-- core_uses_pid / core limit"
    cat /proc/sys/kernel/core_uses_pid 2>/dev/null || true
    ulimit -c 2>/dev/null || true
    echo "-- systemd-coredump"
    coredumpctl list --no-pager 2>/dev/null | tail -20 || echo "(coredumpctl unavailable)"
    echo "-- core files on disk"
    find /var/lib/systemd/coredump /var/crash /tmp /cores -maxdepth 2 -name 'core*' \
      -newermt '-30 minutes' -printf '%p\t%s bytes\t%TY-%Tm-%Td %TH:%TM\n' 2>/dev/null | head -20 || true
    echo "-- apport"
    find /var/crash -maxdepth 1 -name '*.crash' -newermt '-30 minutes' 2>/dev/null | head -10 || true
  } >"${out}/coredump.txt" 2>/dev/null || true
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

while true; do
  [ -f "$STOP_FILE" ] && { log "stop file present — exiting"; break; }

  trend
  check_wedges

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

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
readonly WEDGE_LOG="${ARTIFACTS_DIR}/emulator-wedges.log"
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

# Per-process detail that says *what a process is waiting on*, which is the whole
# question for a wedge. wchan is the kernel function each thread is blocked in; a
# healthy qemu shows a spread of poll/futex waits, while a wedged one collapses onto
# one. The fd and socket counts test the other hypothesis directly: the Buy screen
# fires several hundred concurrent requests through the emulator's user-mode network
# stack, so if the wedge is socket exhaustion it has to show up here first.
proc_detail() {
  local pid="$1"
  echo "   pid ${pid}"
  awk '/^(Threads|voluntary_ctxt_switches|nonvoluntary_ctxt_switches|VmRSS|SigQ):/{print "     "$0}' \
    "/proc/${pid}/status" 2>/dev/null || true
  local fds
  fds="$(find "/proc/${pid}/fd" -mindepth 1 2>/dev/null | wc -l)"
  local socks
  socks="$(find "/proc/${pid}/fd" -mindepth 1 -lname 'socket:*' 2>/dev/null | wc -l)"
  echo "     fds: ${fds:-?}  sockets: ${socks:-?}"
  echo "     threads blocked in (wchan x count):"
  # shellcheck disable=SC2016
  for t in "/proc/${pid}/task"/*; do
    cat "${t}/wchan" 2>/dev/null && echo
  done | sort | uniq -c | sort -rn | head -8 | sed 's/^/       /'
}

snapshot() {
  local slot="$1"
  {
    echo "== $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "-- qemu processes"
    local pids
    pids="$(pgrep -d, qemu-system 2>/dev/null || true)"
    [ -n "$pids" ] && ps -o pid,rss,pcpu,stat,etime,comm -p "$pids" 2>/dev/null || echo "(no qemu process)"
    echo "-- per-process detail"
    if [ -n "$pids" ]; then
      for p in ${pids//,/ }; do proc_detail "$p"; done
      local nspid
      nspid="$(pgrep -x netsimd 2>/dev/null | head -1)"
      [ -n "${nspid:-}" ] && { echo "   -- netsimd (shared by all emulators)"; proc_detail "$nspid"; }
    fi
    echo "-- memory"
    free -m 2>/dev/null || true
    echo "-- load"
    cat /proc/loadavg 2>/dev/null || true
    echo "-- sockets (host-wide)"
    ss -s 2>/dev/null | head -6 || true
    grep -E '^(TCP|sockets):' /proc/net/sockstat 2>/dev/null || true
    echo "-- adb"
    adb devices 2>&1 || true
  } >"${RING_DIR}/snap_${slot}.txt" 2>/dev/null || true
}

# A dying emulator is not killed out of a running state: it wedges first. Across every
# death captured so far the qemu process stops logging, its RSS freezes to the byte, and
# ps reports it I (idle/uninterruptible) rather than S, for minutes before it leaves the
# process table. That is a detectable precursor, and it is worth surfacing while the
# shard still has time to react instead of discovering the loss one 60s timeout at a
# time. See QAA-1497.
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
  check_wedges
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

#!/usr/bin/env bash
# Watches the Android emulators during a mobile E2E shard and records the moment one
# disappears, so a lost device stops masquerading as four unrelated assertion timeouts.
#
# Two tiers:
#   always on   - poll adb, log the loss, annotate the job summary. One adb call per
#                 poll, no artifacts written unless something actually dies.
#   opt-in      - host forensics on a death: dmesg, the emulator crash database, memory,
#                 cgroup limits and coredumpctl state, plus a per-poll host trend and a
#                 warning when a device looks like it is going. Enabled with
#                 WATCH_DIAGNOSTICS=1 (the emulator_diagnostics workflow input).
#
# The forensics are opt-in because their question is answered: qemu takes SIGSEGV and
# the kernel then spends 2-4 minutes writing a ~1 GB core, which is why dmesg is always
# empty - core_pattern pipes to systemd-coredump. Turn them on when investigating a
# recurrence. See: https://ledgerhq.atlassian.net/browse/QAA-1509
#
# Required environment:
#   ARTIFACTS_DIR     - directory collected by the upload-artifact step
#
# Optional environment:
#   EMULATOR_SERIALS  - space-separated adb serials
#                       (default: "emulator-5554 emulator-5556 emulator-5558")
#   WATCH_INTERVAL    - seconds between polls (default: 5)
#   WATCH_STOP_FILE   - watcher exits once this file exists (workflow writes it after Detox)
#   WATCH_CONFIRM_POLLS - polls a serial must stay missing to count as a death (default: 3)
#   WATCH_DIAGNOSTICS - any non-empty value enables the opt-in tier
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
# Polls a serial must stay missing before it counts as a death rather than teardown.
readonly CONFIRM_POLLS="${WATCH_CONFIRM_POLLS:-3}"
readonly DIAGNOSTICS="${WATCH_DIAGNOSTICS:-}"
read -r -a SERIALS <<<"${EMULATOR_SERIALS:-emulator-5554 emulator-5556 emulator-5558}"

mkdir -p "$ARTIFACTS_DIR" 2>/dev/null || true
[ -n "$DIAGNOSTICS" ] && mkdir -p "$DIAG_DIR" 2>/dev/null
true

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
  # Emit all four memory columns or four placeholders - never one "?" standing in for
  # the group, which would shift every later column and silently corrupt the TSV.
  mem="$(free -m 2>/dev/null | awk '/^Mem:/{print $2"\t"$3"\t"$4"\t"$7}')"
  [ -z "$mem" ] && mem="$(printf '?\t?\t?\t?')"
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
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$mem" "$qemu" \
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
  #
  # Metadata only - never the reports themselves. A crashpad `.dmp` is a partial memory
  # image of the emulator process, and everything written here lands in a build artifact
  # that anyone can download from this public repository. The question above is settled by
  # a listing (is there an entry, and when), so there is nothing to gain from the payload.
  ls -laR /tmp/android-runner >"${out}/android-runner-ls.txt" 2>/dev/null || true
  find /tmp/android-runner -maxdepth 3 -name '*.dmp' \
    -printf '%p\t%s bytes\t%TY-%Tm-%Td %TH:%TM\n' 2>/dev/null | head -40 \
    >"${out}/emu-crash-reports.txt" || true

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

diag_label="off"
[ -n "$DIAGNOSTICS" ] && diag_label="on"
log "watching ${SERIALS[*]} every ${INTERVAL}s (diagnostics: ${diag_label})"
declare -A alive=()      # serial has been seen up at least once
declare -A reported=()
declare -A pending=()    # serial -> timestamp it first looked gone
declare -A misses=()     # serial -> consecutive polls it has been missing

# Discard every unconfirmed loss: the stop file proves we are in teardown.
drop_pending_as_teardown() {
  local serial
  for serial in "${!pending[@]}"; do
    [ -n "${pending[$serial]:-}" ] &&
      log "$serial went away at ${pending[$serial]} and the stop file followed — teardown, not a death"
    pending[$serial]=""
    misses[$serial]=0
  done
}

while true; do
  if [ -f "$STOP_FILE" ]; then
    drop_pending_as_teardown
    log "stop file present — exiting"
    break
  fi

  [ -n "$DIAGNOSTICS" ] && trend
  [ -n "$DIAGNOSTICS" ] && check_wedges

  online="$(adb devices 2>/dev/null || true)"
  for serial in "${SERIALS[@]}"; do
    if grep -q "^${serial}[[:space:]]*device" <<<"$online"; then
      alive[$serial]=1
      reported[$serial]=""
      pending[$serial]=""
      misses[$serial]=0
    elif [ -n "${alive[$serial]:-}" ] && [ -z "${reported[$serial]:-}" ]; then
      # Only a serial that was previously UP can have "disappeared". Without this gate the
      # first polls, before the emulators finish booting, report three phantom deaths.
      #
      # Do not report on first sight. Detox tears the emulators down inside its own step,
      # seconds before the workflow can write the stop file, so at this instant a normal
      # teardown is indistinguishable from a real death -- and reporting immediately turned
      # every shard's shutdown into three "deaths" in the job summary. Hold the loss until
      # it survives CONFIRM_POLLS polls with no stop file. A real death is permanent, so
      # the delay costs nothing; qemu spends 2-4 minutes writing its core either way.
      misses[$serial]=$(( ${misses[$serial]:-0} + 1 ))
      if [ -z "${pending[$serial]:-}" ]; then
        pending[$serial]="$(date -u +%Y%m%dT%H%M%SZ)"
        log "⏳ $serial not in adb devices — confirming over $((CONFIRM_POLLS * INTERVAL))s"
      elif [ "${misses[$serial]}" -ge "$CONFIRM_POLLS" ]; then
        stamp="${pending[$serial]}"
        reported[$serial]=1
        pending[$serial]=""
        log "❌ $serial is GONE at ${stamp} (confirmed after ${misses[$serial]} polls)"
        echo "${stamp} ${serial} disappeared from adb devices" >>"$DEATH_LOG"
        [ -n "$DIAGNOSTICS" ] && capture_diagnostics "$serial" "$stamp"
      fi
    fi
  done
  sleep "$INTERVAL"
done

#!/usr/bin/env bash
# Start a background sampler that records runner resource usage to a CSV.
#
# Samples CPU / memory / disk-free / network throughput from Linux procfs
# every 5s and appends one row per interval. The sampler is backgrounded and
# keeps running after this script exits; stop it later with the PID written to
# GITHUB_OUTPUT (see stop-usage-sampler).
#
# Required env:
#   RUNNER_TEMP   — writable temp dir (set automatically on GitHub runners)
#
# Optional env:
#   GITHUB_OUTPUT — when set, writes `csv_path` and `sampler_pid`
#
# CSV columns:
#   timestamp,cpu_percent,mem_used_mb,mem_total_mb,disk_free_gb,net_rx_kbps,net_tx_kbps

set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"

mkdir -p "${RUNNER_TEMP}/usage-metrics"
CSV="${RUNNER_TEMP}/usage-metrics/usage-metrics.csv"
echo "timestamp,cpu_percent,mem_used_mb,mem_total_mb,disk_free_gb,net_rx_kbps,net_tx_kbps" > "$CSV"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "csv_path=$CSV" >> "$GITHUB_OUTPUT"
fi

# First non-loopback interface, used to read rx/tx byte counters.
iface=$(awk -F: '$1 !~ /lo/ && NR>2 {gsub(/ /,"",$1); print $1; exit}' /proc/net/dev)

(
  prev_idle=0; prev_total=0; prev_rx=0; prev_tx=0; first=1
  while true; do
    read -r u n s i w x y z < <(awk '/^cpu /{print $2, $3, $4, $5, $6, $7, $8, $9}' /proc/stat)
    idle=$((i + w)); total=$((u + n + s + i + w + x + y + z))

    read -r rx tx < <(awk -v ifc="${iface}:" '{for (k=1;k<=NF;k++) if ($k==ifc) {print $(k+1), $(k+9); exit}}' /proc/net/dev)
    rx=${rx:-0}; tx=${tx:-0}

    if [ "$first" = "0" ]; then
      totald=$((total - prev_total)); idled=$((idle - prev_idle))
      cpu_pct=0
      [ "$totald" -gt 0 ] && cpu_pct=$(( (1000 * (totald - idled) / totald + 5) / 10 ))
      rx_kbps=$(( (rx - prev_rx) / 1024 / 5 ))
      tx_kbps=$(( (tx - prev_tx) / 1024 / 5 ))
      read -r mem_total mem_avail < <(awk '/MemTotal/{t=$2} /MemAvailable/{a=$2} END{print t, a}' /proc/meminfo)
      mem_used_mb=$(( (mem_total - mem_avail) / 1024 )); mem_total_mb=$(( mem_total / 1024 ))
      disk_free_gb=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
      echo "$(date -u +%FT%TZ),$cpu_pct,$mem_used_mb,$mem_total_mb,$disk_free_gb,$rx_kbps,$tx_kbps" >> "$CSV"
    fi
    prev_idle=$idle; prev_total=$total; prev_rx=$rx; prev_tx=$tx; first=0
    sleep 5
  done
# Redirect stdout/stderr off the step's pipe so the runner never waits on it
# (which could hang the step), and disown so the loop isn't SIGHUP'd when this
# script exits — the sampler must outlive this step and run across the job.
) >/dev/null 2>&1 &
sampler_pid=$!
disown 2>/dev/null || true

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "sampler_pid=$sampler_pid" >> "$GITHUB_OUTPUT"
fi

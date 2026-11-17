#!/usr/bin/env bash
# Waits until the macOS host's 1-minute load average is below its CPU count, so the simulators'
# first-boot work is over before the first launch. Gives up with a warning after $1 seconds.
#
#   wait-for-idle-host.sh [max_wait_s]
set -euo pipefail
# sysctl and awk print and read the load with the locale's decimal separator: "3,04" in French
# compares as text and never as below the CPU count.
export LC_ALL=C

max_wait_s="${1:-600}"
poll_s=15
# /usr/sbin is not on the runner's PATH.
cpus=$(/usr/sbin/sysctl -n hw.ncpu)
# vm.loadavg reads "{ 1min 5min 15min }".
load_1min() { /usr/sbin/sysctl -n vm.loadavg | awk '{ print $2 }'; }

start=$SECONDS
while :; do
  load=$(load_1min)
  echo "host load $load over 1 min, $cpus CPUs, after $((SECONDS - start)) s"
  awk -v load="$load" -v cpus="$cpus" 'BEGIN { exit !(load < cpus) }' && break
  if ((SECONDS - start >= max_wait_s)); then
    echo "::warning title=Host not idle::load $load on $cpus CPUs after ${max_wait_s} s; measuring anyway"
    break
  fi
  sleep "$poll_s"
done

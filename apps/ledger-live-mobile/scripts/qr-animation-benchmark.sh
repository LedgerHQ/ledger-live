#!/usr/bin/env bash
# Plays the QR animation benchmark scenarios on a booted iOS simulator or Android emulator.
# Usage: scripts/qr-animation-benchmark.sh ios|android <out-dir>
# Needs a staging build with SKIP_ONBOARDING=1, the terms of use accepted once, and on iOS the
# AXe CLI to confirm deep links. Set IOS_UDID or ANDROID_SERIAL to pick the device.
set -euo pipefail

PLATFORM="$1"
OUT="$2"
WARMUP="${WARMUP:-12}"
WINDOW="${WINDOW:-10}"
IOS_BUNDLE="${IOS_BUNDLE:-com.ledger.live}"
ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.ledger.live.staging}"
ADB="${ADB:-adb}"
IOS_UDID="${IOS_UDID:-booted}"
BASE="ledgerlive://settings/debug/qr-animation-benchmark"

mkdir -p "$OUT/shots"
CSV="$OUT/results.csv"
echo "platform,scenario,implementation,animation,content,copies,app_cpu_avg,render_cpu_avg,mem_mb,frames,janky_pct,p50_ms,p90_ms,p95_ms,p99_ms" > "$CSV"

open_url() {
  if [ "$PLATFORM" = ios ]; then
    # Cold start per scenario; iOS 26 asks to confirm a URL opened from simctl, AXe taps "Open".
    xcrun simctl terminate "$IOS_UDID" "$IOS_BUNDLE" > /dev/null 2>&1 || true
    xcrun simctl openurl "$IOS_UDID" "$1"
    # The confirmation does not always show up: try for a few seconds, then go on.
    for _ in 1 2 3 4 5; do
      sleep 1
      axe tap --label Open --udid "$IOS_UDID" > /dev/null 2>&1 && break
    done || true
  else
    # -S: cold start per scenario, so screens from earlier scenarios cannot keep animating.
    "$ADB" shell am start -S -W -a android.intent.action.VIEW -d "'$1'" "$ANDROID_PACKAGE" > /dev/null
  fi
}

screenshot() {
  if [ "$PLATFORM" = ios ]; then
    xcrun simctl io "$IOS_UDID" screenshot --type=png "$1" > /dev/null 2>&1
  else
    "$ADB" exec-out screencap -p > "$1"
  fi
}

ios_pid() {
  xcrun simctl spawn "$IOS_UDID" launchctl list | awk -v b="$IOS_BUNDLE" '$3 ~ "UIKitApplication:"b"\\[" {print $1; exit}'
}

# The render server of this simulator: the backboardd child of its launchd_sim.
ios_render_pid() {
  local launchd
  launchd=$(ps -axo pid,args | awk -v u="$IOS_UDID" '/launchd_sim/ && index($0, u) {print $1; exit}')
  ps -axo pid,ppid,comm | awk -v p="$launchd" '$2 == p && /\/backboardd$/ {print $1; exit}'
}

android_pid() {
  "$ADB" shell pidof "$ANDROID_PACKAGE" | tr -d '\r'
}

# CPU averaged over the whole window (the second `top` sample covers it), and memory at its end.
sample_ios() {
  local pid render stats
  pid=$(ios_pid)
  render=$(ios_render_pid)
  stats=$(top -l 2 -s "$WINDOW" -pid "$pid" -pid "$render" -stats pid,cpu,mem | awk -v n=0 '/^PID/ {n++} n == 2 && $1 ~ /^[0-9]+$/')
  local app_cpu render_cpu mem
  app_cpu=$(echo "$stats" | awk -v p="$pid" '$1 == p {print $2}')
  render_cpu=$(echo "$stats" | awk -v p="$render" '$1 == p {print $2}')
  mem=$(echo "$stats" | awk -v p="$pid" '$1 == p {print $3}')
  echo "$app_cpu,$render_cpu,$(to_mb "$mem"),,,,,,"
}

# top prints memory as 512M, 1.2G or 900K.
to_mb() {
  echo "$1" | awk '{v=$1; u=substr(v, length(v)); n=substr(v, 1, length(v)-1); gsub(/[+-]/, "", n);
    if (u == "G") print int(n * 1024); else if (u == "K") print int(n / 1024); else print int(n)}'
}

sample_android() {
  local pid cpu_sum=0 n=0 gfx
  pid=$(android_pid)
  "$ADB" shell dumpsys gfxinfo "$ANDROID_PACKAGE" reset > /dev/null
  for _ in $(seq "$WINDOW"); do
    cpu=$("$ADB" shell top -b -n 1 -p "$pid" | awk -v p="$pid" '$1 == p {print $9}' | tr -d '\r')
    cpu_sum=$(echo "$cpu_sum + ${cpu:-0}" | bc)
    n=$((n + 1))
    sleep 1
  done
  gfx=$("$ADB" shell dumpsys gfxinfo "$ANDROID_PACKAGE" | tr -d '\r')
  local pss frames janky p50 p90 p95 p99
  pss=$("$ADB" shell dumpsys meminfo "$ANDROID_PACKAGE" | tr -d '\r' | awk '/TOTAL PSS:/ {print $3; exit}')
  frames=$(echo "$gfx" | awk -F': ' '/^Total frames rendered/ {print $2; exit}')
  janky=$(echo "$gfx" | awk '/^Janky frames:/ {gsub(/[()%]/, "", $4); print $4; exit}')
  p50=$(echo "$gfx" | awk '/^50th percentile/ {gsub("ms", "", $3); print $3; exit}')
  p90=$(echo "$gfx" | awk '/^90th percentile/ {gsub("ms", "", $3); print $3; exit}')
  p95=$(echo "$gfx" | awk '/^95th percentile/ {gsub("ms", "", $3); print $3; exit}')
  p99=$(echo "$gfx" | awk '/^99th percentile/ {gsub("ms", "", $3); print $3; exit}')
  echo "$(echo "scale=1; $cpu_sum / $n" | bc),,$((${pss:-0} / 1024)),$frames,$janky,$p50,$p90,$p95,$p99"
}

run() {
  local name="$1" implementation="$2" animation="$3" content="$4" copies="$5" autoplay="${6:-1}"
  open_url "$BASE?mode=single&implementation=$implementation&animation=$animation&content=$content&copies=$copies&autoPlay=$autoplay"
  sleep "$WARMUP"
  local metrics
  if [ "$PLATFORM" = ios ]; then metrics=$(sample_ios); else metrics=$(sample_android); fi
  screenshot "$OUT/shots/$name.png"
  echo "$PLATFORM,$name,$implementation,$animation,$content,$copies,$metrics" | tee -a "$CSV"
}

# Idle reference: a code that does not move.
run "native-idle-address-1" native copy address 1 0
run "reanimated-idle-address-1" reanimated copy address 1 0

for animation in shimmer copy hover; do
  for implementation in native reanimated; do
    run "$implementation-$animation-address-1" "$implementation" "$animation" address 1
    run "$implementation-$animation-huge-1" "$implementation" "$animation" huge 1
    run "$implementation-$animation-uri-9" "$implementation" "$animation" uri 9
  done
done

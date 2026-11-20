#!/usr/bin/env bash
# Study only. Stops the samplers from start.sh and writes the two files that get uploaded:
#   iface.csv: epoch,rx_bytes,tx_bytes (cumulative interface counters)
#   proc.csv:  epoch,process,rx_bytes,tx_bytes (bytes since the previous sample, per process name; PIDs dropped)
set -uo pipefail

DIR="${RUNNER_TEMP:?RUNNER_TEMP is required}/study-net"
OUT="$DIR/out"
mkdir -p "$OUT"
[ -f "$DIR/meta.env" ] || { echo "No sampler data"; exit 0; }
# shellcheck disable=SC1091
. "$DIR/meta.env"

# SIGINT lets nettop flush its last sample; the shell loop only reacts to SIGTERM.
[ -f "$DIR/iface.pid" ] && kill -TERM "$(cat "$DIR/iface.pid")" 2>/dev/null
[ -f "$DIR/proc.pid" ] && kill -INT "$(cat "$DIR/proc.pid")" 2>/dev/null
sleep 1
[ -f "$DIR/proc.pid" ] && kill -TERM "$(cat "$DIR/proc.pid")" 2>/dev/null

{ echo "epoch,rx_bytes,tx_bytes"; cat "$DIR/iface.raw" 2>/dev/null; } > "$OUT/iface.csv"

awk -F, -v midnight="$local_midnight_epoch" '
  $1 == "time" || NF < 4 { next }
  {
    split($1, hms, ":")
    secs = hms[1] * 3600 + hms[2] * 60 + int(hms[3])
    if (seen_time && secs < last_secs - 3600) day += 86400
    last_secs = secs; seen_time = 1
    t = midnight + day + secs
    if (first_t == "") first_t = t
    key = $2; rx = $3 + 0; tx = $4 + 0
    if (key in prev_rx) { drx = rx - prev_rx[key]; dtx = tx - prev_tx[key] }
    else if (t == first_t) { drx = 0; dtx = 0 }
    else { drx = rx; dtx = tx }
    prev_rx[key] = rx; prev_tx[key] = tx
    if (drx <= 0 && dtx <= 0) next
    name = key; sub(/\.[0-9]+$/, "", name)
    k = t SUBSEP name
    if (!(k in sum_rx)) order[++n] = k
    sum_rx[k] += (drx > 0 ? drx : 0); sum_tx[k] += (dtx > 0 ? dtx : 0)
  }
  END {
    print "epoch,process,rx_bytes,tx_bytes"
    for (i = 1; i <= n; i++) { split(order[i], p, SUBSEP); print p[1] "," p[2] "," sum_rx[order[i]] "," sum_tx[order[i]] }
  }
' "$DIR/proc.raw" > "$OUT/proc.csv"

echo "Interface $iface totals since sampler start (MB in / out):"
awk -F, 'NR == 2 { r0 = $2; t0 = $3 } NR > 1 { r = $2; t = $3 } END { if (NR > 2) printf "  %.1f / %.1f\n", (r - r0) / 1e6, (t - t0) / 1e6 }' "$OUT/iface.csv"
echo "Top processes (MB in / out):"
awk -F, 'NR > 1 { rx[$2] += $3; tx[$2] += $4 } END { for (p in rx) printf "  %-32s %10.1f %10.1f\n", p, rx[p] / 1e6, tx[p] / 1e6 }' "$OUT/proc.csv" \
  | sort -k2 -nr | head -15

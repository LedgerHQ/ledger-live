#!/usr/bin/env bash
# Study only (bandwidth study, macOS runners). Records byte counts and nothing else:
# no addresses, hosts, ports or payloads.
#   iface.raw: epoch,rx_bytes,tx_bytes of the default-route interface, every second
#   proc.raw:  nettop per-process cumulative bytes on external interfaces (no loopback), every 2 s
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
DIR="${RUNNER_TEMP}/study-net"
mkdir -p "$DIR"

IFACE=$(/sbin/route -n get default 2>/dev/null | awk '/interface:/ {print $2}')
IFACE=${IFACE:-en0}
{
  echo "iface=$IFACE"
  echo "start_epoch=$(date +%s)"
  echo "local_midnight_epoch=$(date -j -f '%Y-%m-%d %H:%M:%S' "$(date +%Y-%m-%d) 00:00:00" +%s)"
} > "$DIR/meta.env"

nohup bash -c '
  while :; do
    /usr/sbin/netstat -ibn -I "$1" 2>/dev/null \
      | awk -v t="$(date +%s)" '"'"'$3 ~ /^<Link/ {print t "," $7 "," $10; exit}'"'"'
    sleep 1
  done
' _ "$IFACE" >> "$DIR/iface.raw" 2>/dev/null &
echo $! > "$DIR/iface.pid"

nohup /usr/bin/nettop -P -x -t external -J time,bytes_in,bytes_out -s 2 -L 0 \
  > "$DIR/proc.raw" 2>/dev/null &
echo $! > "$DIR/proc.pid"

echo "Byte sampler started on $IFACE (dir $DIR)"

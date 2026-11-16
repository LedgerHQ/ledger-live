#!/usr/bin/env bash
# Times the same fixed work inside each emulator, alternating between them like the measurement, to
# show how much the emulated phone's own timing varies without the app: a shell loop on one CPU, the
# same loop on 4 CPUs at once, and a sha256 of a framework jar. One JSON line per timing:
#
#   noise-floor.sh <out.jsonl> <label>
set -uo pipefail

out="${1:?output file}"
label="${2:?label}"
REPS=30
LOOP=400000

declare -A WORK=(
  [loop]="i=0; while [ \$i -lt $LOOP ]; do i=\$((i+1)); done"
  [loop4]="for k in 1 2 3 4; do (i=0; while [ \$i -lt $LOOP ]; do i=\$((i+1)); done) & done; wait"
  [sha]="sha256sum /system/framework/framework.jar > /dev/null"
)

timed() {
  local serial="$1" kind="$2" rep="$3" times
  times=$(adb -s "$serial" shell "s=\$EPOCHREALTIME; ${WORK[$kind]}; e=\$EPOCHREALTIME; echo \$s \$e" | tr -d '\r')
  LC_ALL=C awk -v label="$label" -v serial="$serial" -v kind="$kind" -v rep="$rep" -v t="$times" 'BEGIN {
    split(t, p, " ")
    if (p[1] == "" || p[2] == "") { printf "{\"label\":\"%s\",\"device\":\"%s\",\"kind\":\"%s\",\"rep\":%d,\"error\":\"%s\"}\n", label, serial, kind, rep, t; exit }
    printf "{\"label\":\"%s\",\"device\":\"%s\",\"kind\":\"%s\",\"rep\":%d,\"ms\":%.2f}\n", label, serial, kind, rep, (p[2] - p[1]) * 1000
  }' >> "$out"
}

for rep in $(seq "$REPS"); do
  for serial in emulator-5554 emulator-5556; do
    for kind in loop loop4 sha; do
      timed "$serial" "$kind" "$rep"
      sleep 0.5
    done
  done
done
awk -F'"ms":' -v label="$label" '/"ms":/ { n++ } END { print label ": " n " timings" }' "$out"

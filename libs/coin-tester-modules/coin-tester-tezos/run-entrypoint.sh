#!/bin/sh
set -e
ROOT=/tmp/flextesa-daemons-upgrade-adaptive-issuance-box
if [ -f "$ROOT/node-N000/data-dir/config.json" ]; then
  octez-node run \
    --config-file "$ROOT/node-N000/data-dir/config.json" \
    --data-dir "$ROOT/node-N000/data-dir" \
    --private-mode \
    --no-bootstrap-peers \
    --synchronisation-threshold 0 \
    --connections 1 \
    --singleprocess \
    --sandbox "$ROOT/protocol-default-and-command-line/sandbox.json" &
  NODE_PID=$!
  until curl -sf http://localhost:20000/chains/main/blocks/head/header >/dev/null 2>&1; do
    sleep 1
  done
  octez-baker-Proxford \
    --endpoint http://localhost:20000 \
    --base-dir "$ROOT/Client-base-C-N000" \
    run with local node "$ROOT/node-N000/data-dir" \
    bootacc-0 \
    --adaptive-issuance-vote pass \
    --liquidity-baking-toggle-vote pass &
  BAKER_PID=$!
  trap "kill $NODE_PID $BAKER_PID 2>/dev/null" INT TERM
  wait $NODE_PID
else
  exec oxfordbox start
fi

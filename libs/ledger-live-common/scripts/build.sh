#!/bin/bash

set -e

rm -rf lib src/data/icons/react* src/data/flags/react*
bash ./scripts/sync-families-dispatch.sh
node scripts/buildReactIcons.js
node scripts/buildReactFlags.js

BABEL_ENV=cjs babel --ignore __tests__ -s -d lib src
flow-copy-source -i \"__tests__/**\" src lib

# disabled for now, we need to figure out better entry point solution to make it work properly (not dep on */lib/*)
# BABEL_ENV=es babel --ignore __tests__ -s -d lib-es src
# flow-copy-source -i \"__tests__/**\" src lib-es

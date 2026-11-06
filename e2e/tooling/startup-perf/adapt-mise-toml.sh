#!/usr/bin/env bash
# Drops what an older commit's mise.toml declares that no longer installs: its [plugins] (read as
# local folders) and the npm pin. Run from the root of the checked-out ref.
set -euo pipefail

adapted="$(mktemp)"
awk '/^\[/{section=$0} section=="[plugins]"{next} section=="[tools]" && /^npm *=/{next} {print}' mise.toml > "$adapted"
if ! cmp -s mise.toml "$adapted"; then
  diff mise.toml "$adapted" || true
  cp "$adapted" mise.toml
fi

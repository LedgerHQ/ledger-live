#!/usr/bin/env bash
# Print the AVD configuration from avd.env as KEY=value lines, plus AVD_CACHE_KEY, the
# R2 object key the built AVD is stored under. Append the output to $GITHUB_ENV or
# $GITHUB_OUTPUT.
#
# Usage: avd-config.sh
set -euo pipefail

env_file="$(dirname "${BASH_SOURCE[0]}")/avd.env"
grep -E '^AVD_[A-Z_]+=' "$env_file"

# Plain KEY=value lines (no quoting), so read them the same way the runner does.
while IFS='=' read -r key value; do
  declare "$key=$value"
done < <(grep -E '^AVD_[A-Z_]+=' "$env_file")

# QAA-1509: the key includes the emulator build, so changing it rebuilds the AVD.
# Bump the trailing version to rebuild onto a newer system image (not pinnable).
echo "AVD_CACHE_KEY=${RUNNER_OS:-Linux}-detox-avd-${AVD_NAME}_5-${AVD_PROFILE}-${AVD_TARGET}-${AVD_API}-${AVD_ARCH}-${AVD_CORES}-${AVD_RAM_SIZE}-${AVD_HEAP_SIZE}-emu${AVD_EMULATOR_BUILD}-r2-v9"

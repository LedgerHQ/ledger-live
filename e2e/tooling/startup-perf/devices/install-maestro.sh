#!/usr/bin/env bash
# Installs Maestro MAESTRO_VERSION, checked against MAESTRO_SHA256, and puts it on the job's PATH.
set -euo pipefail
: "${MAESTRO_VERSION:?}" "${MAESTRO_SHA256:?}" "${RUNNER_TEMP:?}" "${GITHUB_PATH:?}"

zip="$RUNNER_TEMP/maestro.zip"
curl --proto '=https' --tlsv1.2 -fsSL -o "$zip" "https://github.com/mobile-dev-inc/maestro/releases/download/cli-${MAESTRO_VERSION}/maestro.zip"
if command -v sha256sum > /dev/null; then sha256=(sha256sum); else sha256=(shasum -a 256); fi
echo "${MAESTRO_SHA256}  $zip" | "${sha256[@]}" -c -
mkdir -p "$RUNNER_TEMP/maestro-cli"
unzip -q "$zip" -d "$RUNNER_TEMP/maestro-cli"
bin=$(dirname "$(find "$RUNNER_TEMP/maestro-cli" -type f -name maestro -path "*/bin/*" | head -1)")
echo "$bin" >> "$GITHUB_PATH"
"$bin/maestro" --version

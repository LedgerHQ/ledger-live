#!/usr/bin/env bash

set -euo pipefail

readonly SCRCPY_VERSION="3.3.4"
readonly ARCHIVE="scrcpy-linux-x86_64-v${SCRCPY_VERSION}.tar.gz"
readonly ARCHIVE_SHA256="0305d98c06178c67e12427bbf340c436d0d58c9e2a39bf9ffbbf8f54d7ef95a5"
readonly RELEASE_URL="https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_VERSION}/${ARCHIVE}"
readonly RELEASE_DIRECTORY="scrcpy-linux-x86_64-v${SCRCPY_VERSION}"
readonly TEMP_DIRECTORY="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIRECTORY"' EXIT

curl --fail --location --retry 3 --retry-all-errors --connect-timeout 30 \
  --output "$TEMP_DIRECTORY/$ARCHIVE" \
  "$RELEASE_URL"
printf '%s  %s\n' "$ARCHIVE_SHA256" "$ARCHIVE" | (cd "$TEMP_DIRECTORY" && sha256sum --check)
tar --extract --gzip --file="$TEMP_DIRECTORY/$ARCHIVE" \
  --directory="$TEMP_DIRECTORY" --no-same-owner --no-same-permissions \
  "$RELEASE_DIRECTORY/scrcpy" "$RELEASE_DIRECTORY/scrcpy-server"

sudo install --mode=0755 "$TEMP_DIRECTORY/$RELEASE_DIRECTORY/scrcpy" /usr/local/bin/scrcpy
sudo install --mode=0755 "$TEMP_DIRECTORY/$RELEASE_DIRECTORY/scrcpy-server" /usr/local/bin/scrcpy-server
echo /usr/local/bin >> "$GITHUB_PATH"

scrcpy --version

#!/bin/bash
set -euo pipefail

# Compress PNG files in a directory using pngquant
# Usage: compress-pngs.sh <directory>

TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
  echo "::error::No directory specified"
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "::warning::Directory '$TARGET_DIR' not found. Skipping PNG compression."
  exit 0
fi

# On Linux the caller installs pngquant via the apt-install composite; brew
# covers macOS, which that composite skips.
if ! command -v pngquant &> /dev/null; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Installing pngquant..."
    brew install pngquant
  else
    echo "::warning::pngquant not available. Skipping PNG compression."
    exit 0
  fi
fi

PNG_COUNT=$(find "$TARGET_DIR" -type f -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
echo "Found $PNG_COUNT PNG files to compress"

if [ "$PNG_COUNT" -gt 0 ]; then
  find "$TARGET_DIR" -type f -name "*.png" -exec pngquant --quality=65-80 --skip-if-larger --ext .png --force {} \;
  echo "PNG compression completed"
fi

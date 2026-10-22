#!/usr/bin/env bash
# Extracts one output file of a cached Nx task straight from the @nx/s3-cache bucket, without
# running Nx. Each entry is stored at <cacheKeyPrefix>/<hash> as a gzipped tarball holding the
# task outputs under outputs/<path relative to the workspace root>.
#
# Usage: fetch-nx-cached-file.sh <hash> <workspace-relative path>
# Env: CACHE_BUCKET, REGION, NX_CACHE_KEY_PREFIX (set by setup-caches), optional ENDPOINT,
# plus the AWS credentials.
set -euo pipefail

HASH="$1"
FILE="$2"
ENDPOINT_URL="https://${ENDPOINT:-s3.${REGION}.amazonaws.com}"

aws s3 cp "s3://${CACHE_BUCKET}/${NX_CACHE_KEY_PREFIX}/${HASH}" - --endpoint-url "$ENDPOINT_URL" --region "$REGION" --no-progress |
  tar -xzf - --strip-components=1 "outputs/${FILE}"

ls -l "$FILE"

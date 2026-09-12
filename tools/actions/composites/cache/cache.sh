#!/usr/bin/env bash
# S3 cache transport for the cache/* actions.
#
# Transfers with s5cmd instead of the AWS CLI, and compresses with pzstd
# instead of zstdmt. Measured on an 8-core Linux runner against a 1.03 GB pnpm
# store cache:
#
#   download   aws s3 cp 12.1s  ->  s5cmd 1.0s   (single stream vs 16 parts)
#   decode     unzstd    4.0s   ->  pzstd 0.6s   (1 thread vs 8)
#
# pzstd writes standard zstd frames plus skippable frames carrying the chunk
# sizes, so the two codecs read each other's archives: a cache written by the
# old zstdmt path still restores here, and one written here still restores on
# a runner that only has unzstd. That is what makes this swappable without
# bumping any cache key, and what makes a rollback safe.
#
# Subcommands:
#   install     put s5cmd on disk (pinned + checksum verified), report pzstd
#   probe       exit status alone: 0 if the object is there, 1 if not
#   exists      same check, reported as the cache-hit step output
#   download    fetch and extract into CACHE_DESTINATION
#   upload      archive CACHE_PATH and store it at <key>/cache.tzst
#
# Env (required): CACHE_KEY CACHE_BUCKET CACHE_REGION
# Env (optional): CACHE_ENDPOINT       host only, no scheme; default AWS S3
#                 CACHE_PATH           upload: newline-separated paths
#                 CACHE_RESTORE_KEYS   download: newline-separated key prefixes,
#                                      tried in order when the exact key misses
#                 CACHE_DESTINATION    download: default $GITHUB_WORKSPACE
#                 CACHE_CONCURRENCY    s5cmd parts in flight, default 16
#                 CACHE_PART_SIZE      s5cmd part size in MiB, default 64
#                 S5CMD_VERSION        default 2.3.0
# Credentials come from the ambient AWS_* environment, as before.

set -euo pipefail

# Runner shells do not reliably carry these: gtar and pzstd live in the
# homebrew prefix, and sysctl in /usr/sbin. A macOS runner without /usr/sbin is
# what made cores() come back empty once.
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/sbin:/sbin:$PATH"
export PATH

CACHE_ENDPOINT="${CACHE_ENDPOINT:-}"
CACHE_CONCURRENCY="${CACHE_CONCURRENCY:-16}"
CACHE_PART_SIZE="${CACHE_PART_SIZE:-64}"
S5CMD_VERSION="${S5CMD_VERSION:-2.3.0}"

BIN_DIR="${RUNNER_TEMP:-/tmp}/ll-cache-bin"
S5CMD_BIN="$BIN_DIR/s5cmd"
ARCHIVE="${RUNNER_TEMP:-/tmp}/cache.tzst"

# GNU tar. macOS ships bsdtar as `tar`, which takes neither --posix nor -T the
# same way, so the runners provide gtar there — as the AWS CLI version of these
# actions already assumed.
# CACHE_TAR overrides for runners that keep GNU tar somewhere else.
if [ -n "${CACHE_TAR:-}" ]; then TAR="$CACHE_TAR"
elif [ "$(uname -s)" = "Darwin" ]; then TAR=gtar
else TAR=tar; fi

# Must always print a positive integer. An empty value here silently becomes a
# bare "-p" in the pzstd command line, which then swallows the next flag and
# yields a corrupt stream rather than an error.
cores() {
  n=""
  if command -v nproc >/dev/null 2>&1; then n=$(nproc 2>/dev/null || true)
  elif command -v sysctl >/dev/null 2>&1; then n=$(sysctl -n hw.ncpu 2>/dev/null || true)
  fi
  case "$n" in
    ""|*[!0-9]*) n=4 ;;
    0) n=4 ;;
  esac
  echo "$n"
}

die() { echo "::error title=Cache::$*" >&2; exit 1; }

# Release asset and its sha256, pinned per platform. The published checksums
# file ships from the same release as the binary, so it proves transit only —
# pinning here is what stops a later release silently changing the tool.
s5cmd_asset() {
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)   echo "s5cmd_${S5CMD_VERSION}_Linux-64bit.tar.gz de0fdbfa3aceae55e069ba81a0fc17b2026567637603734a387b2fca06c299b4" ;;
    Linux-aarch64)  echo "s5cmd_${S5CMD_VERSION}_Linux-arm64.tar.gz 1439f0d00ecedcd2a2f1f2c6749bbb0152b2257bf5086f29646ec8ae38798e24" ;;
    Linux-arm64)    echo "s5cmd_${S5CMD_VERSION}_Linux-arm64.tar.gz 1439f0d00ecedcd2a2f1f2c6749bbb0152b2257bf5086f29646ec8ae38798e24" ;;
    Darwin-arm64)   echo "s5cmd_${S5CMD_VERSION}_macOS-arm64.tar.gz ae007bc96276f498ae3c1fb017e57630cf93ef260cfe7e97b365522e240c973f" ;;
    Darwin-x86_64)  echo "s5cmd_${S5CMD_VERSION}_macOS-64bit.tar.gz df6f76f6d317c4d051ad083219ed36eb8d8e5ebc55ceeeb91f5e66cdc3ac71fb" ;;
    *) echo "" ;;
  esac
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  else shasum -a 256 "$1" | awk '{print $1}'; fi
}

ensure_s5cmd() {
  [ -x "$S5CMD_BIN" ] && return 0
  asset=$(s5cmd_asset)
  [ -n "$asset" ] || die "No pinned s5cmd build for $(uname -s)-$(uname -m)."
  name="${asset%% *}"; want="${asset##* }"
  mkdir -p "$BIN_DIR"
  curl -sSfL -o "$BIN_DIR/$name" \
    "https://github.com/peak/s5cmd/releases/download/v${S5CMD_VERSION}/${name}" \
    || die "Could not download ${name}."
  got=$(sha256_of "$BIN_DIR/$name")
  if [ "$got" != "$want" ]; then
    rm -f "$BIN_DIR/$name"
    die "s5cmd checksum mismatch for ${name}: expected ${want}, got ${got}."
  fi
  tar -xzf "$BIN_DIR/$name" -C "$BIN_DIR" s5cmd || die "Could not unpack ${name}."
  chmod +x "$S5CMD_BIN"
  rm -f "$BIN_DIR/$name"
}

# pzstd is optional. Falling back to zstdmt/unzstd costs the parallel codec but
# nothing else, because the archive format is identical either way.
compress_program() {
  if command -v pzstd >/dev/null 2>&1; then echo "pzstd -p $(cores)"
  else echo "zstdmt"; fi
}
decompress_program() {
  if command -v pzstd >/dev/null 2>&1; then echo "pzstd -d -p $(cores)"
  else echo "unzstd"; fi
}

s5() {
  if [ -n "$CACHE_ENDPOINT" ]; then
    "$S5CMD_BIN" --endpoint-url "https://${CACHE_ENDPOINT}" "$@"
  else
    "$S5CMD_BIN" "$@"
  fi
}

# Paths are stored relative to the workspace, using ".." when the target sits
# outside it — which the pnpm store does. Storing absolute paths instead would
# tie an archive to one runner's directory layout. GNU tar needs -P to keep
# those ".." components on both create and extract.
relpath() {
  target=$1; base=$2; prefix=""
  while [ "$base" != "/" ] && [ "${target#"$base"/}" = "$target" ]; do
    base=$(dirname "$base")
    prefix="../$prefix"
  done
  if [ "$base" = "/" ]; then echo "${prefix}${target#/}"; else echo "${prefix}${target#"$base"/}"; fi
}

# Exact key first, then each restore-key prefix in order, newest object wins —
# the same precedence actions/cache and tespkg use. Without this a changed
# lockfile misses outright instead of falling back to the previous store.
resolve_object() {
  if s5 ls "$(object_url)" >/dev/null 2>&1; then
    echo "${CACHE_KEY}/cache.tzst"
    return 0
  fi
  [ -n "${CACHE_RESTORE_KEYS:-}" ] || return 1
  old_ifs=$IFS
  IFS='
'
  set -- $CACHE_RESTORE_KEYS
  IFS=$old_ifs
  for prefix in "$@"; do
    [ -n "$prefix" ] || continue
    match=$(s5 ls "s3://${CACHE_BUCKET}/${prefix}*" 2>/dev/null \
      | grep -E 'cache\.tzst$' | sort -k1,2 | tail -n1 | awk '{print $NF}')
    if [ -n "$match" ]; then
      echo "$match"
      return 0
    fi
  done
  return 1
}

object_url() {
  : "${CACHE_KEY:?CACHE_KEY is required}"
  : "${CACHE_BUCKET:?CACHE_BUCKET is required}"
  echo "s3://${CACHE_BUCKET}/${CACHE_KEY}/cache.tzst"
}

cmd_install() {
  ensure_s5cmd
  echo "s5cmd: $("$S5CMD_BIN" version 2>&1 | head -1)"
  if command -v pzstd >/dev/null 2>&1; then
    echo "pzstd: $(pzstd --version 2>&1 | head -1), $(cores) threads"
  else
    echo "::warning title=pzstd missing::Falling back to zstdmt/unzstd; archives stay compatible but decode runs on one core."
  fi
}

# Exit status only, no output file written — this is what the node action uses
# to tell a miss from a transport error before it decides to download.
cmd_probe() {
  ensure_s5cmd
  s5 ls "$(object_url)" >/dev/null 2>&1
}

cmd_exists() {
  ensure_s5cmd
  url=$(object_url)
  if s5 ls "$url" >/dev/null 2>&1; then
    echo "cache-hit=true" >> "$GITHUB_OUTPUT"
    echo "Cache found: ${url}"
  else
    echo "cache-hit=false" >> "$GITHUB_OUTPUT"
    echo "Cache not found: ${url}"
  fi
}

cmd_download() {
  ensure_s5cmd
  object=$(resolve_object) || die "No cache object for ${CACHE_KEY} (and no restore-key matched)."
  url="s3://${CACHE_BUCKET}/${object}"
  dest="${CACHE_DESTINATION:-${GITHUB_WORKSPACE}}"
  [ "$object" = "${CACHE_KEY}/cache.tzst" ] || echo "Exact key missed; restored from ${object}"

  start=$SECONDS
  s5 cp --concurrency "$CACHE_CONCURRENCY" --part-size "$CACHE_PART_SIZE" "$url" "$ARCHIVE"
  download=$((SECONDS - start))

  start=$SECONDS
  # Piped rather than --use-compress-program: bsdtar has no such flag, and GNU
  # tar appends its own -d when decompressing, which a pzstd invocation would
  # then receive twice.
  $(decompress_program) -c "$ARCHIVE" | "$TAR" -xf - -P -C "$dest"
  extract=$((SECONDS - start))

  bytes=$(wc -c < "$ARCHIVE" | tr -d ' ')
  rm -f "$ARCHIVE"
  echo "Restored ${url} -> ${dest} (${bytes} bytes, download ${download}s, extract ${extract}s)"
}

cmd_upload() {
  ensure_s5cmd
  : "${CACHE_PATH:?CACHE_PATH is required}"
  url=$(object_url)
  workspace="${GITHUB_WORKSPACE}"
  file_list=$(mktemp "${RUNNER_TEMP:-/tmp}/file-list.XXXXXX")
  trap 'rm -f "$file_list" "$ARCHIVE"' EXIT

  # Paths are recorded relative to the workspace so the archive extracts under
  # whatever destination the download side is given.
  printf '%s\n' "$CACHE_PATH" | while IFS= read -r filePath; do
    [ -n "$filePath" ] || continue
    if [ -d "$filePath" ] || [ -f "$filePath" ]; then
      find "$filePath" -type f | while IFS= read -r foundPath; do
        case "$foundPath" in
          "$workspace"/*) echo "${foundPath#"$workspace"/}" ;;
          "$workspace")   echo "." ;;
          /*)             relpath "$foundPath" "$workspace" ;;
          *)              echo "$foundPath" ;;
        esac
      done
    else
      echo "Warning: path $filePath not found, skipping." >&2
    fi
  done >> "$file_list"

  if [ ! -s "$file_list" ]; then
    echo "::warning title=Nothing to cache::No files matched CACHE_PATH; skipping upload."
    return 0
  fi

  start=$SECONDS
  "$TAR" --posix -cf - -P -C "$workspace" --files-from "$file_list" | $(compress_program) -o "$ARCHIVE" -f -
  compress=$((SECONDS - start))

  start=$SECONDS
  s5 cp --concurrency "$CACHE_CONCURRENCY" --part-size "$CACHE_PART_SIZE" "$ARCHIVE" "$url"
  upload=$((SECONDS - start))

  bytes=$(wc -c < "$ARCHIVE" | tr -d ' ')
  echo "Saved ${url} ($(wc -l < "$file_list" | tr -d ' ') files, ${bytes} bytes, compress ${compress}s, upload ${upload}s)"
}

case "${1:-}" in
  install)  cmd_install ;;
  probe)    cmd_probe ;;
  exists)   cmd_exists ;;
  download) cmd_download ;;
  upload)   cmd_upload ;;
  *) echo "Usage: $0 {install|probe|exists|download|upload}" >&2; exit 2 ;;
esac

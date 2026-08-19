#!/usr/bin/env bash
# Install apt packages, doing nothing when they are already present.
#
# Runner images already ship most of what we ask for, so the common path touches
# no network at all. When something really is missing, apt is bounded so that a
# stalled mirror fails over instead of hanging until the job timeout:
#   - Acquire timeouts/retries cap how long a single index fetch can block
#   - each apt-get runs under `timeout`; expiry moves on to the next mirror
#   - attempt 1 keeps the runner's own apt configuration, so a healthy runner
#     never has its sources rewritten
#
# /etc/apt is backed up before the first rewrite and restored on exit, leaving
# persistent (self-hosted) runners as they were found.

set -euo pipefail

PACKAGES_RAW="${INPUTS_PACKAGES:-}"
MIRRORS_RAW="${INPUTS_MIRRORS:-}"
MAX_ATTEMPTS="${INPUTS_MAX_ATTEMPTS:-4}"
TIMEOUT="${INPUTS_TIMEOUT:-60}"

DEFAULT_MIRRORS=(
  "https://mirrors.edge.kernel.org/ubuntu"
  "https://ubuntu.mirrors.ovh.net/ubuntu"
  "https://mirror.leaseweb.net/ubuntu"
  "https://archive.ubuntu.com/ubuntu"
)

APT_CONF="/etc/apt/apt.conf.d/99-ci-apt-install"
BACKUP=""

log() { echo "$*"; }
die() { echo "::error::$*" >&2; exit 1; }

# Only rewrite the Ubuntu archive hosts. A looser ubuntu.com match would also
# hit esm.ubuntu.com, whose paths do not exist on a public mirror. The trailing
# class excludes all whitespace, so tab-separated mirrorlist metadata
# (`<url>\tpriority:1`) survives the substitution.
ARCHIVE_URL_RE='https?://[a-z0-9.-]*(archive|security)\.ubuntu\.com[^[:space:]]*'

parse_inputs() {
  [[ "$MAX_ATTEMPTS" =~ ^[0-9]+$ ]] && [ "$MAX_ATTEMPTS" -ge 1 ] \
    || die "max_attempts must be a positive integer, got '$MAX_ATTEMPTS'"
  [[ "$TIMEOUT" =~ ^[0-9]+$ ]] \
    || die "timeout must be a non-negative integer, got '$TIMEOUT'"

  read -ra PACKAGES <<< "$PACKAGES_RAW"
  [ "${#PACKAGES[@]}" -gt 0 ] || die "packages input is empty"
  local pkg
  for pkg in "${PACKAGES[@]}"; do
    [[ "$pkg" =~ ^[a-zA-Z0-9][a-zA-Z0-9+._:-]*$ ]] || die "invalid package name: '$pkg'"
  done

  if [ -n "$MIRRORS_RAW" ]; then
    local raw entry
    IFS=',' read -ra raw <<< "$MIRRORS_RAW"
    MIRRORS=()
    for entry in "${raw[@]}"; do
      entry="${entry#"${entry%%[![:space:]]*}"}"
      entry="${entry%"${entry##*[![:space:]]}"}"
      [ -n "$entry" ] || continue
      [[ "$entry" =~ ^https?://[a-zA-Z0-9._~/-]+$ ]] || die "invalid mirror URL: '$entry'"
      MIRRORS+=("$entry")
    done
    [ "${#MIRRORS[@]}" -gt 0 ] || die "mirrors input parsed to an empty list"
  else
    MIRRORS=("${DEFAULT_MIRRORS[@]}")
  fi
}

# Populates MISSING with the requested packages dpkg does not report installed.
find_missing() {
  local pkg
  MISSING=()
  for pkg in "${PACKAGES[@]}"; do
    if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q "^install ok installed"; then
      MISSING+=("$pkg")
    fi
  done
}

restore_apt_sources() {
  sudo test -f "$BACKUP" || return 0
  sudo tar -xf "$BACKUP" -C /etc/apt
}

cleanup() {
  sudo rm -f "$APT_CONF"
  [ -n "$BACKUP" ] && sudo test -f "$BACKUP" || return 0
  log "Restoring /etc/apt sources"
  if restore_apt_sources; then
    sudo rm -f "$BACKUP"
  else
    # Cannot die() from an EXIT trap.
    echo "::warning::Failed to restore /etc/apt; backup kept at $BACKUP" >&2
  fi
}

backup_apt_sources() {
  [ -z "$BACKUP" ] || return 0
  local paths=()
  sudo test -f /etc/apt/sources.list && paths+=(sources.list) || true
  sudo test -d /etc/apt/sources.list.d && paths+=(sources.list.d) || true
  sudo test -f /etc/apt/apt-mirrors.txt && paths+=(apt-mirrors.txt) || true
  [ "${#paths[@]}" -gt 0 ] || die "found no apt sources under /etc/apt to back up"

  BACKUP=$(sudo mktemp "${RUNNER_TEMP:-/tmp}/apt-sources-backup.XXXXXX")
  sudo tar -cf "$BACKUP" -C /etc/apt "${paths[@]}" \
    || die "failed to back up /etc/apt before rewriting sources"
}

set_apt_mirror() {
  local mirror="$1" escaped file count changed=0
  backup_apt_sources
  restore_apt_sources
  escaped=$(printf '%s' "$mirror" | sed 's/[&\#]/\\&/g')

  for file in /etc/apt/sources.list /etc/apt/sources.list.d/*.list \
              /etc/apt/sources.list.d/*.sources /etc/apt/apt-mirrors.txt; do
    sudo test -f "$file" || continue
    # -o, not -c: the mirrorlist packs several URLs onto one line.
    count=$(sudo grep -oE "$ARCHIVE_URL_RE" "$file" 2>/dev/null | wc -l | tr -d ' ' || true)
    if [ "${count:-0}" -gt 0 ]; then
      sudo sed -i -E "s#$ARCHIVE_URL_RE#${escaped}#g" "$file"
      changed=$((changed + count))
    fi
  done

  if [ "$changed" -gt 0 ]; then
    log "Switched apt sources to $mirror ($changed replacement(s))"
  else
    echo "::warning::No Ubuntu archive entries found in apt sources; mirror switch had no effect"
  fi
}

run_apt() {
  if [ "$TIMEOUT" -gt 0 ]; then
    sudo timeout --kill-after=10 "$TIMEOUT" "$@"
  else
    sudo "$@"
  fi
}

report_apt_failure() {
  local what="$1" rc="$2"
  if [ "$rc" -eq 124 ]; then
    log "$what timed out after ${TIMEOUT}s"
  else
    log "$what failed (exit $rc)"
  fi
}

install_with_retry() {
  sudo tee "$APT_CONF" >/dev/null <<'EOF'
Acquire::http::Timeout "15";
Acquire::https::Timeout "15";
Acquire::Retries "2";
Acquire::Languages "none";
EOF
  trap cleanup EXIT

  local attempt rc
  for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
    if [ "$attempt" -eq 1 ]; then
      log "Attempt $attempt/$MAX_ATTEMPTS using the runner's own apt configuration"
    else
      set_apt_mirror "${MIRRORS[$(((attempt - 2) % ${#MIRRORS[@]}))]}"
      log "Attempt $attempt/$MAX_ATTEMPTS"
    fi

    rc=0
    run_apt apt-get update -qq || rc=$?
    if [ "$rc" -ne 0 ]; then
      report_apt_failure "apt-get update" "$rc"
      continue
    fi

    find_missing
    if [ "${#MISSING[@]}" -eq 0 ]; then
      log "Nothing left to install"
      return 0
    fi

    rc=0
    run_apt env DEBIAN_FRONTEND=noninteractive apt-get install -y -- "${MISSING[@]}" || rc=$?
    if [ "$rc" -ne 0 ]; then
      report_apt_failure "apt-get install" "$rc"
      continue
    fi

    find_missing
    [ "${#MISSING[@]}" -eq 0 ] \
      || die "apt-get install reported success but these are still missing: ${MISSING[*]}"
    log "Installed: ${PACKAGES[*]}"
    return 0
  done

  die "Failed to install after $MAX_ATTEMPTS attempt(s): ${MISSING[*]}"
}

main() {
  command -v apt-get >/dev/null 2>&1 \
    || die "apt-get not found; this action supports Debian/Ubuntu runners only"
  parse_inputs

  find_missing
  if [ "${#MISSING[@]}" -eq 0 ]; then
    log "Already installed, skipping apt: ${PACKAGES[*]}"
    exit 0
  fi
  log "Missing: ${MISSING[*]}"

  install_with_retry
}

main "$@"

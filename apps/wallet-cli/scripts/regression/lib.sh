# Shared harness plumbing for the wallet-cli 2.1.0 non-regression suites.
# Sourced by run-nr.sh — not executable on its own.

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
FAILED_IDS=()
CURRENT_ID=""
CURRENT_DESC=""
CASE_ERRORS=()

c_green=$'\033[32m'; c_red=$'\033[31m'; c_yellow=$'\033[33m'; c_dim=$'\033[2m'; c_off=$'\033[0m'

log() { printf '%s\n' "$*" >>"$LOG_FILE"; }

case_start() {
  CURRENT_ID="$1"; CURRENT_DESC="$2"; CASE_ERRORS=()
  log ""; log "=== $CURRENT_ID — $CURRENT_DESC ==="
}

case_end() {
  if [ ${#CASE_ERRORS[@]} -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf '%s[PASS]%s %-5s %s\n' "$c_green" "$c_off" "$CURRENT_ID" "$CURRENT_DESC"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED_IDS+=("$CURRENT_ID")
    printf '%s[FAIL]%s %-5s %s\n' "$c_red" "$c_off" "$CURRENT_ID" "$CURRENT_DESC"
    for e in "${CASE_ERRORS[@]}"; do
      printf '       %s%s%s\n' "$c_dim" "$e" "$c_off"
      log "  FAILURE: $e"
    done
  fi
}

case_skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  printf '%s[SKIP]%s %-5s %s %s(%s)%s\n' "$c_yellow" "$c_off" "$1" "$2" "$c_dim" "$3" "$c_off"
  log "=== $1 — SKIPPED: $3 ==="
}

fail_case() { CASE_ERRORS+=("$1"); }

# --- assertions -------------------------------------------------------------

assert_rc() { # assert_rc <expected> <actual>
  [ "$2" = "$1" ] || fail_case "exit code: expected $1, got $2"
}

assert_rc_nonzero() {
  [ "$1" != "0" ] || fail_case "exit code: expected non-zero, got 0"
}

assert_has() { # assert_has <haystack> <needle> [label]
  case "$1" in
    *"$2"*) : ;;
    *) fail_case "${3:-output} does not contain: $2" ;;
  esac
}

assert_lacks() {
  case "$1" in
    *"$2"*) fail_case "${3:-output} unexpectedly contains: $2" ;;
    *) : ;;
  esac
}

assert_empty() {
  [ -z "${1//[[:space:]]/}" ] || fail_case "${2:-output} expected empty, got: $(printf '%s' "$1" | head -c 200)"
}

assert_nonempty() {
  [ -n "${1//[[:space:]]/}" ] || fail_case "${2:-output} expected non-empty"
}

assert_file() { [ -f "$1" ] || fail_case "missing file: $1"; }
assert_no_file() { [ ! -e "$1" ] || fail_case "file should not exist: $1"; }
assert_dir() { [ -d "$1" ] || fail_case "missing dir: $1"; }

assert_json() { # assert_json <text> [label]
  printf '%s' "$1" | jq -e . >/dev/null 2>&1 || fail_case "${2:-output} is not valid JSON"
}

assert_jq() { # assert_jq <json> <filter> <expected> [label]
  local got
  got=$(printf '%s' "$1" | jq -r "$2" 2>/dev/null)
  [ "$got" = "$3" ] || fail_case "${4:-jq $2}: expected '$3', got '$got'"
}

assert_jq_true() { # assert_jq_true <json> <filter>
  printf '%s' "$1" | jq -e "$2" >/dev/null 2>&1 || fail_case "jq assertion false: $2"
}

assert_mode() { # assert_mode <path> <expected octal>
  local got
  got=$(stat -f '%Lp' "$1" 2>/dev/null || stat -c '%a' "$1" 2>/dev/null)
  [ "$got" = "$2" ] || fail_case "mode of $1: expected $2, got $got"
}

# --- CLI invocation ---------------------------------------------------------

# Run the CLI capturing stdout/stderr separately into OUT/ERR/RC.
# Extra env is passed as VAR=value pairs before the subcommand via CLI_ENV array.
cli() {
  local outf errf
  outf=$(mktemp "$TMP_ROOT/out.XXXXXX"); errf=$(mktemp "$TMP_ROOT/err.XXXXXX")
  log "\$ ${CLI_ENV[*]:-} $BIN_LABEL $*"
  if [ ${#CLI_ENV[@]} -gt 0 ]; then
    timeout "$CASE_TIMEOUT" env "${CLI_ENV[@]}" "${BIN_ARR[@]}" "$@" >"$outf" 2>"$errf"
  else
    timeout "$CASE_TIMEOUT" env "${BIN_ARR[@]}" "$@" >"$outf" 2>"$errf"
  fi
  RC=$?
  OUT=$(cat "$outf"); ERR=$(cat "$errf")
  log "--- rc=$RC"
  log "--- stdout"; log "$OUT"
  log "--- stderr"; log "$ERR"
  [ "$RC" = 124 ] && fail_case "timed out after ${CASE_TIMEOUT}s"
  return 0
}

# Default env for non-nudge cases: isolated state dir, nudge muted.
iso_env() {
  CLI_ENV=(WALLET_CLI_NO_NUDGE=1 "XDG_STATE_HOME=$ISO_STATE" "HOME=$ISO_HOME")
}

# Env that keeps the developer's real session (needed for read commands).
real_env() {
  CLI_ENV=(WALLET_CLI_NO_NUDGE=1)
}

fresh_state() { mktemp -d "$TMP_ROOT/state.XXXXXX"; }
fresh_dir() { mktemp -d "$TMP_ROOT/work.XXXXXX"; }

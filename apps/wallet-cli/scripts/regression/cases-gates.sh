# Suite A — repo / artifact gates. Slow; opt in with --with-gates.
# These are the same checks CI runs, plus the packaging smoke tests that matter
# for a release. No device, no session.

gate() { # gate <ID> <desc> <cmd...>
  case_start "$1" "$2"
  local id="$1" desc="$2"; shift 2
  log "\$ $*"
  local outf; outf=$(mktemp "$TMP_ROOT/gate.XXXXXX")
  ( cd "$WALLET_CLI_DIR" && timeout "$GATE_TIMEOUT" "$@" ) >"$outf" 2>&1
  local rc=$?
  log "--- rc=$rc"; log "$(tail -100 "$outf")"
  if [ "$rc" = 124 ]; then fail_case "timed out after ${GATE_TIMEOUT}s"
  elif [ "$rc" != 0 ]; then fail_case "exit $rc — see $LOG_FILE (tail: $(tail -3 "$outf" | tr '\n' ' ' | head -c 300))"; fi
  case_end
}

suite_a() {
  gate A1 "unit tests (bun test src/)"            pnpm test
  gate A2 "typecheck (tsc --noEmit)"              pnpm typecheck
  gate A3 "lint (oxlint --quiet)"                 pnpm lint:ci
  gate A4 "format check (oxfmt --check)"          pnpm format:check
  gate A5 "embedded skill generation (check:skills)" pnpm check:skills
  gate A6 "third-party notices up to date"        pnpm check:notices

  if [ "$WITH_BUILD" = 1 ]; then
    gate A7 "build all platform binaries"         pnpm build
    gate A8 "npm tarball layout (pack:check)"     pnpm pack:check
    gate A9 "install-and-run smoke (smoke:npm)"   pnpm smoke:npm
  else
    case_skip A7 "build all platform binaries" "pass --with-build"
    case_skip A8 "npm tarball layout"          "pass --with-build"
    case_skip A9 "install-and-run smoke"       "pass --with-build"
  fi
}

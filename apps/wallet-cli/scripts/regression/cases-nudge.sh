# Suite C — the one-time, agent-aware first-run nudge (introduced in 2.1.0).
# Every case gets a pristine XDG_STATE_HOME so the "once per user" marker is
# never inherited. `session view` is used as the cheapest "real command".

MARKER_REL="ledger-wallet-cli/first-run.json"

nudge_env() { # nudge_env <stateDir> [extra VAR=val ...]
  # `env` requires its -u options before any VAR=value assignment, so unset the
  # inherited agent/opt-out signals first and let callers opt back in.
  local s="$1"; shift
  CLI_ENV=(-u WALLET_CLI_NO_NUDGE -u CLAUDECODE -u CLAUDE_CODE -u CURSOR_AGENT -u CODEX_ENABLED \
           -u GEMINI_CLI -u OPENCODE -u AMP_CURRENT_THREAD_ID -u AGENT \
           "XDG_STATE_HOME=$s" "HOME=$ISO_HOME" "$@")
}

suite_c() {
  local s

  # ---- C1: shown once for a detected agent -----------------------------------
  s=$(fresh_state)
  case_start C1 "first real command prints the Claude Code nudge on stderr only"
  nudge_env "$s" CLAUDECODE=1
  cli session view
  assert_rc 0 "$RC"
  assert_has "$ERR" "wallet-cli skill install --agent claude" "stderr"
  assert_has "$ERR" "Claude Code" "stderr"
  assert_lacks "$OUT" "skill install" "stdout"
  case_end

  # ---- C2: never shown twice --------------------------------------------------
  case_start C2 "the nudge is not repeated on the next command"
  nudge_env "$s" CLAUDECODE=1
  cli session view
  assert_rc 0 "$RC"
  assert_lacks "$ERR" "skill install" "stderr"
  case_end

  # ---- C3: marker file --------------------------------------------------------
  case_start C3 "the marker is persisted under XDG_STATE_HOME with 0600/0700 perms"
  assert_file "$s/$MARKER_REL"
  assert_mode "$s/$MARKER_REL" 600
  assert_mode "$s/ledger-wallet-cli" 700
  assert_jq "$(cat "$s/$MARKER_REL")" '.version' "$EXPECTED_VERSION" "marker.version"
  assert_jq_true "$(cat "$s/$MARKER_REL")" '.nudgeShownAt | test("^[0-9]{4}-")'
  case_end

  # ---- C4: silent under --output json, and not consumed ----------------------
  s=$(fresh_state)
  case_start C4 "--output json is nudge-free and does not consume the one-time hint"
  nudge_env "$s" CLAUDECODE=1
  cli session view --output json
  assert_rc 0 "$RC"
  assert_empty "$ERR" "stderr"
  assert_json "$OUT"
  assert_no_file "$s/$MARKER_REL"
  nudge_env "$s" CLAUDECODE=1
  cli session view
  assert_has "$ERR" "skill install" "stderr (after a json run)"
  case_end

  # ---- C5: opt-out ------------------------------------------------------------
  s=$(fresh_state)
  case_start C5 "WALLET_CLI_NO_NUDGE=1 suppresses the nudge and writes no marker"
  nudge_env "$s" CLAUDECODE=1 WALLET_CLI_NO_NUDGE=1
  cli session view
  assert_rc 0 "$RC"
  assert_lacks "$ERR" "skill install" "stderr"
  assert_no_file "$s/$MARKER_REL"
  case_end

  # ---- C6: quiet in plain pipes ----------------------------------------------
  s=$(fresh_state)
  case_start C6 "no agent env and a non-TTY stderr stays silent"
  nudge_env "$s"
  cli session view
  assert_rc 0 "$RC"
  assert_lacks "$ERR" "skill install" "stderr"
  assert_no_file "$s/$MARKER_REL"
  case_end

  # ---- C7: per-agent tailoring -----------------------------------------------
  case_start C7 "each detected agent maps to its own --agent value"
  local pairs=("CURSOR_AGENT=1:--agent cursor:Cursor"
               "CODEX_ENABLED=1:--agent codex:Codex"
               "GEMINI_CLI=1:--agent agents:Gemini CLI"
               "OPENCODE=1:--agent agents:opencode"
               "AMP_CURRENT_THREAD_ID=x:--agent agents:amp")
  local p envvar expect label
  for p in "${pairs[@]}"; do
    envvar=${p%%:*}; rest=${p#*:}; expect=${rest%%:*}; label=${rest#*:}
    s=$(fresh_state)
    nudge_env "$s" "$envvar"
    cli session view
    assert_has "$ERR" "wallet-cli skill install $expect" "stderr for $envvar"
    assert_has "$ERR" "$label" "stderr label for $envvar"
  done
  case_end

  # ---- C8: non-command invocations do not consume the nudge ------------------
  for inv in --help --version; do
    s=$(fresh_state)
    case_start "C8${inv//-/}" "$inv does not consume the one-time nudge"
    nudge_env "$s" CLAUDECODE=1
    cli "$inv"
    assert_no_file "$s/$MARKER_REL"
    assert_lacks "$ERR" "skill install" "stderr of $inv"
    nudge_env "$s" CLAUDECODE=1
    cli session view
    assert_has "$ERR" "skill install" "stderr of the following real command"
    case_end
  done

  # ---- C9: skill commands are exempt -----------------------------------------
  s=$(fresh_state)
  case_start C9 "skill * commands never show the nudge nor consume it"
  nudge_env "$s" CLAUDECODE=1
  cli skill list
  assert_rc 0 "$RC"
  assert_lacks "$ERR" "Tip: install" "stderr"
  assert_no_file "$s/$MARKER_REL"
  case_end

  # ---- C10: exit codes are untouched -----------------------------------------
  s=$(fresh_state)
  case_start C10 "the nudge does not alter a failing command's exit code"
  nudge_env "$s" CLAUDECODE=1
  cli balances no-such-label-9
  assert_rc 1 "$RC"
  assert_has "$ERR" "skill install" "stderr"
  case_end

  # ---- C11: hostile state dir -------------------------------------------------
  s=$(fresh_state)
  case_start C11 "a read-only state dir never breaks the command"
  chmod 500 "$s"
  nudge_env "$s" CLAUDECODE=1
  cli session view --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  chmod 700 "$s"
  case_end
}

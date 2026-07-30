# Suite B — the `skill` command group (introduced in 2.1.0) (list / retrieve / install / doctor).
# No device, no network. Every case runs in a throwaway cwd with an isolated HOME
# and XDG_STATE_HOME so nothing touches the developer's real agent directories.

# Recompute the canonical skill content hash over the files on disk, mirroring
# src/skills/hash.ts (sha256 over `path\0sha256(content)\n`, files sorted by path).
# Used to forge a provenance sidecar for the `outdated` case, which otherwise
# needs a genuinely older binary.
skill_disk_hash() { # skill_disk_hash <skillRoot> <relpath...>
  local root="$1"; shift
  node -e '
    const { createHash } = require("node:crypto");
    const { readFileSync } = require("node:fs");
    const [root, ...files] = process.argv.slice(1);
    const one = c => createHash("sha256").update(c, "utf8").digest("hex");
    const sorted = [...files].sort();
    const h = createHash("sha256");
    const per = {};
    for (const f of sorted) {
      const c = readFileSync(require("node:path").join(root, f), "utf8");
      per[f] = one(c);
      h.update(`${f}\0${per[f]}\n`, "utf8");
    }
    console.log(JSON.stringify({ contentHash: h.digest("hex"), files: per }));
  ' "$root" "$@"
}

suite_b() {
  local w skillroot sidecar json

  # ---- B1: skill list (human) -------------------------------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  case_start B1 "skill list names the embedded skill"
  cli skill list
  assert_rc 0 "$RC"
  assert_has "$OUT" "ledger-wallet-cli" "stdout"
  case_end

  # ---- B2: skill list --output json ------------------------------------------
  case_start B2 "skill list --output json emits a valid envelope"
  cli skill list --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.status' 'success'
  assert_jq "$OUT" '.command' 'skill list'
  assert_jq_true "$OUT" '.skills | map(.name) | index("ledger-wallet-cli") != null'
  assert_jq_true "$OUT" '.skills[0].description | length > 20'
  case_end

  # ---- B3: skill retrieve (default file) --------------------------------------
  case_start B3 "skill retrieve prints SKILL.md from the binary"
  cli skill retrieve
  assert_rc 0 "$RC"
  assert_has "$OUT" "name: ledger-wallet-cli" "stdout"
  assert_has "$OUT" "account discover" "stdout"
  case_end

  # ---- B4: skill retrieve --file ---------------------------------------------
  case_start B4 "skill retrieve --file returns a reference doc"
  cli skill retrieve --file references/business-logic.md
  assert_rc 0 "$RC"
  assert_nonempty "$OUT" "stdout"
  assert_has "$OUT" "business logic" "stdout"
  case_end

  # ---- B5: skill retrieve unknown file ---------------------------------------
  case_start B5 "skill retrieve --file <unknown> fails and lists available files"
  cli skill retrieve --file no-such.md
  assert_rc 1 "$RC"
  assert_has "$ERR$OUT" "Available files:" "output"
  assert_has "$ERR$OUT" "SKILL.md" "output"
  case_end

  # ---- B6: install --agent claude --------------------------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  case_start B6 "skill install --agent claude writes SKILL.md, references and sidecar"
  cli skill install --agent claude
  assert_rc 0 "$RC"
  skillroot="$w/.claude/skills/ledger-wallet-cli"
  assert_file "$skillroot/SKILL.md"
  assert_file "$skillroot/references/business-logic.md"
  assert_file "$skillroot/.wallet-cli-skill.json"
  case_end

  # ---- B7: sidecar provenance content ----------------------------------------
  case_start B7 "provenance sidecar records name, cliVersion and content hashes"
  sidecar=$(cat "$skillroot/.wallet-cli-skill.json")
  assert_json "$sidecar" "sidecar"
  assert_jq "$sidecar" '.name' 'ledger-wallet-cli' "sidecar.name"
  assert_jq "$sidecar" '.cliVersion' "$EXPECTED_VERSION" "sidecar.cliVersion"
  assert_jq_true "$sidecar" '.contentHash | test("^[0-9a-f]{64}$")'
  assert_jq_true "$sidecar" '.files | has("SKILL.md") and has("references/business-logic.md")'
  assert_jq_true "$sidecar" '.installedAt | test("^[0-9]{4}-")'
  # the recorded hash must equal the hash of what is actually on disk
  local disk
  disk=$(skill_disk_hash "$skillroot" SKILL.md references/business-logic.md)
  assert_jq "$sidecar" '.contentHash' "$(printf '%s' "$disk" | jq -r .contentHash)" "sidecar hash vs disk"
  case_end

  # ---- B8: install refuses to clobber ----------------------------------------
  case_start B8 "second skill install without --force refuses to overwrite"
  cli skill install --agent claude
  assert_rc 1 "$RC"
  assert_has "$ERR$OUT" "Refusing to overwrite" "output"
  assert_has "$ERR$OUT" "--force" "output"
  case_end

  # ---- B9: install --force ---------------------------------------------------
  case_start B9 "skill install --force overwrites and refreshes the sidecar"
  local before after
  before=$(jq -r .installedAt "$skillroot/.wallet-cli-skill.json")
  sleep 1
  cli skill install --agent claude --force
  assert_rc 0 "$RC"
  after=$(jq -r .installedAt "$skillroot/.wallet-cli-skill.json")
  [ "$before" != "$after" ] || fail_case "sidecar installedAt not refreshed under --force"
  case_end

  # ---- B10: sidecar never blocks a first install -----------------------------
  case_start B10 "install succeeds when only the sidecar remains (sidecar excluded from clash check)"
  rm -f "$skillroot/SKILL.md" "$skillroot/references/business-logic.md"
  cli skill install --agent claude
  assert_rc 0 "$RC"
  assert_file "$skillroot/SKILL.md"
  case_end

  # ---- B11: every supported agent maps to its own directory ------------------
  case_start B11 "--agent cursor/codex/agents install into .cursor/.codex/.agents"
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --agent cursor;  assert_rc 0 "$RC"; assert_file "$w/.cursor/skills/ledger-wallet-cli/SKILL.md"
  cli skill install --agent codex;   assert_rc 0 "$RC"; assert_file "$w/.codex/skills/ledger-wallet-cli/SKILL.md"
  cli skill install --agent agents;  assert_rc 0 "$RC"; assert_file "$w/.agents/skills/ledger-wallet-cli/SKILL.md"
  case_end

  # ---- B12: default agent is claude -----------------------------------------
  case_start B12 "bare skill install defaults to the claude directory"
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install
  assert_rc 0 "$RC"
  assert_file "$w/.claude/skills/ledger-wallet-cli/SKILL.md"
  case_end

  # ---- B13: --dir overrides -------------------------------------------------
  case_start B13 "skill install --dir writes to an explicit directory"
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --dir ./custom-skills
  assert_rc 0 "$RC"
  assert_file "$w/custom-skills/ledger-wallet-cli/SKILL.md"
  assert_no_file "$w/.claude"
  case_end

  # ---- B14: --global installs under HOME ------------------------------------
  case_start B14 "skill install --global installs under the home directory"
  w=$(fresh_dir); cd "$w"
  local ghome; ghome=$(fresh_dir)
  CLI_ENV=(WALLET_CLI_NO_NUDGE=1 "XDG_STATE_HOME=$ISO_STATE" "HOME=$ghome")
  cli skill install --agent claude --global
  assert_rc 0 "$RC"
  assert_file "$ghome/.claude/skills/ledger-wallet-cli/SKILL.md"
  assert_no_file "$w/.claude"
  case_end

  # ---- B15: --all ------------------------------------------------------------
  case_start B15 "skill install --all installs every embedded skill"
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill list --output json; local names
  names=$(printf '%s' "$OUT" | jq -r '.skills[].name')
  cli skill install --all --agent claude
  assert_rc 0 "$RC"
  while IFS= read -r n; do [ -n "$n" ] && assert_file "$w/.claude/skills/$n/SKILL.md"; done <<<"$names"
  case_end

  # ---- B16: install --output json envelope ----------------------------------
  case_start B16 "skill install --output json surfaces version, hashes and paths"
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --agent claude --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.status' 'success'
  assert_jq "$OUT" '.command' 'skill install'
  assert_jq "$OUT" '.cliVersion' "$EXPECTED_VERSION" "envelope.cliVersion"
  assert_jq_true "$OUT" '.root | test("\\.claude/skills$")'
  assert_jq_true "$OUT" '.skills | index("ledger-wallet-cli") != null'
  assert_jq_true "$OUT" '.contentHashes["ledger-wallet-cli"] | test("^[0-9a-f]{64}$")'
  assert_jq_true "$OUT" '.installed | length >= 2'
  case_end

  # ---- B17: unknown agent ----------------------------------------------------
  case_start B17 "unknown --agent fails with the supported list (human + json)"
  cli skill install --agent bogus
  assert_rc 1 "$RC"
  assert_has "$ERR$OUT" 'Unknown agent "bogus"' "output"
  assert_has "$ERR$OUT" "claude, cursor, codex, agents" "output"
  cli skill install --agent bogus --output json
  assert_rc 1 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.ok' 'false'
  assert_jq "$OUT" '.error.command' 'skill install'
  case_end

  # ---- B18: unknown skill name ----------------------------------------------
  case_start B18 "unknown skill name fails and points at skill list"
  cli skill install definitely-not-a-skill --agent claude
  assert_rc 1 "$RC"
  assert_has "$ERR$OUT" "not found" "output"
  assert_has "$ERR$OUT" "skill list" "output"
  case_end

  # ---- B19: doctor up-to-date ------------------------------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --agent claude >/dev/null
  skillroot="$w/.claude/skills/ledger-wallet-cli"
  case_start B19 "skill doctor reports up-to-date after a fresh install (exit 0)"
  cli skill doctor
  assert_rc 0 "$RC"
  assert_has "$OUT" "up-to-date" "stdout"
  assert_has "$OUT" "All skills up-to-date." "stdout"
  case_end

  # ---- B20: doctor json shape ------------------------------------------------
  case_start B20 "skill doctor --output json exposes results/fixed/remainingDrift"
  cli skill doctor --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  assert_jq "$OUT" '.command' 'skill doctor'
  assert_jq "$OUT" '.fixed | length' '0'
  assert_jq "$OUT" '.remainingDrift | length' '0'
  assert_jq "$OUT" '.results[0].status' 'up-to-date'
  assert_jq "$OUT" '.results[0].installedVersion' "$EXPECTED_VERSION"
  assert_jq "$OUT" '.results[0].shippedVersion' "$EXPECTED_VERSION"
  assert_jq_true "$OUT" '.results[0].diskHash == .results[0].shippedHash'
  case_end

  # ---- B21: modified-locally -------------------------------------------------
  case_start B21 "local edit is reported modified-locally and exits non-zero"
  printf '\n<!-- local edit -->\n' >>"$skillroot/SKILL.md"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "modified-locally" "stdout"
  assert_has "$OUT" "still drifting" "stdout"
  assert_has "$OUT" "--fix --force" "stdout"
  case_end

  # ---- B22: --fix leaves local edits alone -----------------------------------
  case_start B22 "skill doctor --fix does NOT overwrite a locally modified skill"
  cli skill doctor --fix
  assert_rc 1 "$RC"
  assert_has "$OUT" "modified-locally" "stdout"
  grep -q "local edit" "$skillroot/SKILL.md" || fail_case "local edit was overwritten by --fix without --force"
  case_end

  # ---- B23: --fix --force heals ---------------------------------------------
  case_start B23 "skill doctor --fix --force restores the shipped content"
  cli skill doctor --fix --force
  assert_rc 0 "$RC"
  assert_has "$OUT" "Fixed 1 skill(s)." "stdout"
  assert_has "$OUT" "All skills up-to-date." "stdout"
  grep -q "local edit" "$skillroot/SKILL.md" && fail_case "local edit survived --fix --force"
  case_end

  # ---- B24: deleted tracked file counts as drift ----------------------------
  case_start B24 "a deleted tracked file is detected as drift and healed by --fix --force"
  rm -f "$skillroot/references/business-logic.md"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "modified-locally" "stdout"
  cli skill doctor --fix --force
  assert_rc 0 "$RC"
  assert_file "$skillroot/references/business-logic.md"
  case_end

  # ---- B25: missing ----------------------------------------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  case_start B25 "skill doctor reports missing when nothing is installed (exit 1)"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "missing" "stdout"
  assert_has "$OUT" "installed none" "stdout"
  case_end

  # ---- B26: missing + --fix --------------------------------------------------
  case_start B26 "skill doctor --fix installs a missing skill without --force"
  cli skill doctor --fix
  assert_rc 0 "$RC"
  assert_has "$OUT" "Fixed 1 skill(s)." "stdout"
  assert_file "$w/.claude/skills/ledger-wallet-cli/SKILL.md"
  assert_file "$w/.claude/skills/ledger-wallet-cli/.wallet-cli-skill.json"
  case_end

  # ---- B27: outdated (forged older-version sidecar) -------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --agent claude >/dev/null
  skillroot="$w/.claude/skills/ledger-wallet-cli"
  case_start B27 "an install from an older wallet-cli is reported outdated and healed by --fix"
  # Simulate "installed by 2.0.0": edit the content, then make the sidecar agree
  # with what is on disk (so it is provenance-consistent) but disagree with the
  # binary's shipped hash — exactly the outdated signature.
  printf '\n<!-- shipped by an older cli -->\n' >>"$skillroot/SKILL.md"
  local forged
  forged=$(skill_disk_hash "$skillroot" SKILL.md references/business-logic.md)
  jq -n --argjson h "$forged" '{name:"ledger-wallet-cli", cliVersion:"2.0.0", contentHash:$h.contentHash, files:$h.files, installedAt:"2026-01-01T00:00:00.000Z"}' \
    >"$skillroot/.wallet-cli-skill.json"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "outdated" "stdout"
  assert_has "$OUT" "installed 2.0.0@" "stdout"
  cli skill doctor --fix
  assert_rc 0 "$RC"
  assert_has "$OUT" "Fixed 1 skill(s)." "stdout"
  assert_jq "$(cat "$skillroot/.wallet-cli-skill.json")" '.cliVersion' "$EXPECTED_VERSION" "healed sidecar version"
  case_end

  # ---- B28: sidecar-less install that matches shipped content ---------------
  w=$(fresh_dir); cd "$w"; iso_env
  cli skill install --agent claude >/dev/null
  skillroot="$w/.claude/skills/ledger-wallet-cli"
  case_start B28 "a manual install with no sidecar but matching content is up-to-date"
  rm -f "$skillroot/.wallet-cli-skill.json"
  cli skill doctor
  assert_rc 0 "$RC"
  assert_has "$OUT" "up-to-date" "stdout"
  assert_has "$OUT" "installed none" "stdout"
  case_end

  # ---- B29: sidecar-less install that differs is conservative ---------------
  case_start B29 "a sidecar-less install whose content differs is treated as modified-locally"
  printf '\n<!-- hand edit -->\n' >>"$skillroot/SKILL.md"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "modified-locally" "stdout"
  cli skill doctor --fix
  assert_rc 1 "$RC"
  grep -q "hand edit" "$skillroot/SKILL.md" || fail_case "--fix overwrote a sidecar-less install without --force"
  case_end

  # ---- B30: doctor --dir -----------------------------------------------------
  w=$(fresh_dir); cd "$w"; iso_env
  case_start B30 "skill doctor --dir scans an explicit directory only"
  cli skill install --dir ./elsewhere >/dev/null
  cli skill doctor --dir ./elsewhere
  assert_rc 0 "$RC"
  assert_has "$OUT" "up-to-date" "stdout"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "missing" "stdout"
  case_end

  # ---- B31: doctor --global --------------------------------------------------
  case_start B31 "skill doctor --global also scans the home directory"
  w=$(fresh_dir); cd "$w"
  local ghome2; ghome2=$(fresh_dir)
  CLI_ENV=(WALLET_CLI_NO_NUDGE=1 "XDG_STATE_HOME=$ISO_STATE" "HOME=$ghome2")
  cli skill install --agent claude --global >/dev/null
  cli skill doctor --global --output json
  assert_rc 0 "$RC"
  assert_json "$OUT"
  # Compare on the home dir's basename: macOS resolves /var -> /private/var, so a
  # full-path prefix match would fail for reasons unrelated to --global.
  assert_jq_true "$OUT" "[.results[].root] | map(test(\"$(basename "$ghome2")\")) | any"
  assert_jq_true "$OUT" '[.results[].status] | map(. == "up-to-date") | any'
  case_end

  # ---- B32: a regular file where a skill dir is expected --------------------
  case_start B32 "a regular file at the skill path is not mistaken for an install"
  w=$(fresh_dir); cd "$w"; iso_env
  mkdir -p "$w/.claude/skills"
  printf 'not a skill\n' >"$w/.claude/skills/ledger-wallet-cli"
  cli skill doctor
  assert_rc 1 "$RC"
  assert_has "$OUT" "missing" "stdout"
  case_end

  cd "$REPO_ROOT"
}

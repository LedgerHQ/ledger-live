// Suite B — the `skill` command group (introduced in 2.1.0) (list / retrieve / install / doctor).
// No device, no network. Every case runs in a throwaway cwd with an isolated home
// and state dir so nothing touches the developer's real agent directories.

import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { hashOne, hashSkillFiles } from "../../src/skills/hash";
import { asArray, asRecord, asString, isolatedEnv, jsonAt, type Harness } from "./lib";

const SKILL_FILES = ["SKILL.md", "references/business-logic.md"] as const;

/**
 * Canonical skill content hash of the files on disk, using the very
 * implementation under test (src/skills/hash.ts) so the harness cannot drift
 * from it. Used to forge a provenance sidecar for the `outdated` case, which
 * otherwise needs a genuinely older binary.
 */
function skillDiskHash(
  root: string,
  files: readonly string[],
): { contentHash: string; files: Record<string, string> } {
  const contents = files.map(path => ({ path, content: readFileSync(`${root}/${path}`, "utf8") }));
  const perFile: Record<string, string> = {};
  for (const { path, content } of contents) perFile[path] = hashOne(content);
  return { contentHash: hashSkillFiles(contents), files: perFile };
}

export async function suiteB(h: Harness): Promise<void> {
  const { expectedVersion } = h.config;

  // ---- B1: skill list (human) -----------------------------------------------
  let w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  h.caseStart("B1", "skill list names the embedded skill");
  await h.cli("skill", "list");
  h.assertRc(0);
  h.assertHas(h.out, "ledger-wallet-cli", "stdout");
  h.caseEnd();

  // ---- B2: skill list --output json -----------------------------------------
  h.caseStart("B2", "skill list --output json emits a valid envelope");
  await h.cli("skill", "list", "--output", "json");
  h.assertRc(0);
  let json = h.assertJson(h.out);
  h.assertField(json, "status", "success");
  h.assertField(json, "command", "skill list");
  h.assertThat(
    asArray(jsonAt(json, "skills")).some(s => jsonAt(s, "name") === "ledger-wallet-cli"),
    "skills[] does not list ledger-wallet-cli",
  );
  h.assertThat(
    (asString(jsonAt(json, "skills.0.description")) ?? "").length > 20,
    "skills[0].description is too short to be a real description",
  );
  h.caseEnd();

  // ---- B3: skill retrieve (default file) ------------------------------------
  h.caseStart("B3", "skill retrieve prints SKILL.md from the binary");
  await h.cli("skill", "retrieve");
  h.assertRc(0);
  h.assertHas(h.out, "name: ledger-wallet-cli", "stdout");
  h.assertHas(h.out, "account discover", "stdout");
  h.caseEnd();

  // ---- B4: skill retrieve --file --------------------------------------------
  h.caseStart("B4", "skill retrieve --file returns a reference doc");
  await h.cli("skill", "retrieve", "--file", "references/business-logic.md");
  h.assertRc(0);
  h.assertNonEmpty(h.out, "stdout");
  h.assertHas(h.out, "business logic", "stdout");
  h.caseEnd();

  // ---- B5: skill retrieve unknown file --------------------------------------
  h.caseStart("B5", "skill retrieve --file <unknown> fails and lists available files");
  await h.cli("skill", "retrieve", "--file", "no-such.md");
  h.assertRc(1);
  h.assertHas(h.err + h.out, "Available files:");
  h.assertHas(h.err + h.out, "SKILL.md");
  h.caseEnd();

  // ---- B6: install --agent claude -------------------------------------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  h.caseStart("B6", "skill install --agent claude writes SKILL.md, references and sidecar");
  await h.cli("skill", "install", "--agent", "claude");
  h.assertRc(0);
  let skillroot = `${w}/.claude/skills/ledger-wallet-cli`;
  h.assertFile(`${skillroot}/SKILL.md`);
  h.assertFile(`${skillroot}/references/business-logic.md`);
  h.assertFile(`${skillroot}/.wallet-cli-skill.json`);
  h.caseEnd();

  // ---- B7: sidecar provenance content ---------------------------------------
  h.caseStart("B7", "provenance sidecar records name, cliVersion and content hashes");
  const sidecar = h.assertJson(
    readFileSync(`${skillroot}/.wallet-cli-skill.json`, "utf8"),
    "sidecar",
  );
  h.assertField(sidecar, "name", "ledger-wallet-cli", "sidecar.name");
  h.assertField(sidecar, "cliVersion", expectedVersion, "sidecar.cliVersion");
  h.assertThat(
    /^[0-9a-f]{64}$/.test(asString(jsonAt(sidecar, "contentHash")) ?? ""),
    "sidecar.contentHash is not a 64-hex digest",
  );
  const sidecarFiles = asRecord(jsonAt(sidecar, "files")) ?? {};
  h.assertThat(
    SKILL_FILES.every(file => file in sidecarFiles),
    "sidecar.files does not cover both shipped files",
  );
  h.assertThat(
    /^\d{4}-/.test(asString(jsonAt(sidecar, "installedAt")) ?? ""),
    "sidecar.installedAt is not an ISO timestamp",
  );
  // the recorded hash must equal the hash of what is actually on disk
  h.assertField(
    sidecar,
    "contentHash",
    skillDiskHash(skillroot, SKILL_FILES).contentHash,
    "sidecar hash vs disk",
  );
  h.caseEnd();

  // ---- B8: install refuses to clobber ---------------------------------------
  h.caseStart("B8", "second skill install without --force refuses to overwrite");
  await h.cli("skill", "install", "--agent", "claude");
  h.assertRc(1);
  h.assertHas(h.err + h.out, "Refusing to overwrite");
  h.assertHas(h.err + h.out, "--force");
  h.caseEnd();

  // ---- B9: install --force --------------------------------------------------
  h.caseStart("B9", "skill install --force overwrites and refreshes the sidecar");
  const sidecarPath = `${skillroot}/.wallet-cli-skill.json`;
  const before = jsonAt(h.assertJson(readFileSync(sidecarPath, "utf8"), "sidecar"), "installedAt");
  await Bun.sleep(1000);
  await h.cli("skill", "install", "--agent", "claude", "--force");
  h.assertRc(0);
  const after = jsonAt(h.assertJson(readFileSync(sidecarPath, "utf8"), "sidecar"), "installedAt");
  h.assertThat(before !== after, "sidecar installedAt not refreshed under --force");
  h.caseEnd();

  // ---- B10: sidecar never blocks a first install ----------------------------
  h.caseStart(
    "B10",
    "install succeeds when only the sidecar remains (sidecar excluded from clash check)",
  );
  rmSync(`${skillroot}/SKILL.md`, { force: true });
  rmSync(`${skillroot}/references/business-logic.md`, { force: true });
  await h.cli("skill", "install", "--agent", "claude");
  h.assertRc(0);
  h.assertFile(`${skillroot}/SKILL.md`);
  h.caseEnd();

  // ---- B11: every supported agent maps to its own directory -----------------
  h.caseStart("B11", "--agent cursor/codex/agents install into .cursor/.codex/.agents");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  for (const agent of ["cursor", "codex", "agents"]) {
    await h.cli("skill", "install", "--agent", agent);
    h.assertRc(0);
    h.assertFile(`${w}/.${agent}/skills/ledger-wallet-cli/SKILL.md`);
  }
  h.caseEnd();

  // ---- B12: default agent is claude -----------------------------------------
  h.caseStart("B12", "bare skill install defaults to the claude directory");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install");
  h.assertRc(0);
  h.assertFile(`${w}/.claude/skills/ledger-wallet-cli/SKILL.md`);
  h.caseEnd();

  // ---- B13: --dir overrides -------------------------------------------------
  h.caseStart("B13", "skill install --dir writes to an explicit directory");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install", "--dir", "./custom-skills");
  h.assertRc(0);
  h.assertFile(`${w}/custom-skills/ledger-wallet-cli/SKILL.md`);
  h.assertNoFile(`${w}/.claude`);
  h.caseEnd();

  // ---- B14: --global installs under HOME ------------------------------------
  h.caseStart("B14", "skill install --global installs under the home directory");
  w = h.freshDir();
  h.cwd = w;
  const globalHome = h.freshDir();
  h.setEnv({ WALLET_CLI_NO_NUDGE: "1", ...isolatedEnv(h.config.isoState, globalHome) });
  await h.cli("skill", "install", "--agent", "claude", "--global");
  h.assertRc(0);
  h.assertFile(`${globalHome}/.claude/skills/ledger-wallet-cli/SKILL.md`);
  h.assertNoFile(`${w}/.claude`);
  h.caseEnd();

  // ---- B15: --all -----------------------------------------------------------
  h.caseStart("B15", "skill install --all installs every embedded skill");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "list", "--output", "json");
  const names = asArray(jsonAt(h.assertJson(h.out), "skills"))
    .map(s => asString(jsonAt(s, "name")))
    .filter((name): name is string => Boolean(name));
  await h.cli("skill", "install", "--all", "--agent", "claude");
  h.assertRc(0);
  for (const name of names) h.assertFile(`${w}/.claude/skills/${name}/SKILL.md`);
  h.caseEnd();

  // ---- B16: install --output json envelope ----------------------------------
  h.caseStart("B16", "skill install --output json surfaces version, hashes and paths");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install", "--agent", "claude", "--output", "json");
  h.assertRc(0);
  json = h.assertJson(h.out);
  h.assertField(json, "status", "success");
  h.assertField(json, "command", "skill install");
  h.assertField(json, "cliVersion", expectedVersion, "envelope.cliVersion");
  h.assertThat(
    (asString(jsonAt(json, "root")) ?? "").replaceAll("\\", "/").endsWith(".claude/skills"),
    "envelope.root does not end with .claude/skills",
  );
  h.assertThat(
    asArray(jsonAt(json, "skills")).includes("ledger-wallet-cli"),
    "envelope.skills does not list ledger-wallet-cli",
  );
  h.assertThat(
    /^[0-9a-f]{64}$/.test(asString(jsonAt(json, "contentHashes.ledger-wallet-cli")) ?? ""),
    "envelope.contentHashes[ledger-wallet-cli] is not a 64-hex digest",
  );
  h.assertThat(
    asArray(jsonAt(json, "installed")).length >= 2,
    "envelope.installed has < 2 entries",
  );
  h.caseEnd();

  // ---- B17: unknown agent ---------------------------------------------------
  h.caseStart("B17", "unknown --agent fails with the supported list (human + json)");
  await h.cli("skill", "install", "--agent", "bogus");
  h.assertRc(1);
  h.assertHas(h.err + h.out, 'Unknown agent "bogus"');
  h.assertHas(h.err + h.out, "claude, cursor, codex, agents");
  await h.cli("skill", "install", "--agent", "bogus", "--output", "json");
  h.assertRc(1);
  json = h.assertJson(h.out);
  h.assertField(json, "ok", "false");
  h.assertField(json, "error.command", "skill install");
  h.caseEnd();

  // ---- B18: unknown skill name ----------------------------------------------
  h.caseStart("B18", "unknown skill name fails and points at skill list");
  await h.cli("skill", "install", "definitely-not-a-skill", "--agent", "claude");
  h.assertRc(1);
  h.assertHas(h.err + h.out, "not found");
  h.assertHas(h.err + h.out, "skill list");
  h.caseEnd();

  // ---- B19: doctor up-to-date -----------------------------------------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install", "--agent", "claude");
  skillroot = `${w}/.claude/skills/ledger-wallet-cli`;
  h.caseStart("B19", "skill doctor reports up-to-date after a fresh install (exit 0)");
  await h.cli("skill", "doctor");
  h.assertRc(0);
  h.assertHas(h.out, "up-to-date", "stdout");
  h.assertHas(h.out, "All skills up-to-date.", "stdout");
  h.caseEnd();

  // ---- B20: doctor json shape -----------------------------------------------
  h.caseStart("B20", "skill doctor --output json exposes results/fixed/remainingDrift");
  await h.cli("skill", "doctor", "--output", "json");
  h.assertRc(0);
  json = h.assertJson(h.out);
  h.assertField(json, "command", "skill doctor");
  h.assertThat(asArray(jsonAt(json, "fixed")).length === 0, "doctor.fixed is not empty");
  h.assertThat(
    asArray(jsonAt(json, "remainingDrift")).length === 0,
    "doctor.remainingDrift is not empty",
  );
  h.assertField(json, "results.0.status", "up-to-date");
  h.assertField(json, "results.0.installedVersion", expectedVersion);
  h.assertField(json, "results.0.shippedVersion", expectedVersion);
  h.assertThat(
    jsonAt(json, "results.0.diskHash") === jsonAt(json, "results.0.shippedHash"),
    "results[0].diskHash differs from results[0].shippedHash",
  );
  h.caseEnd();

  // ---- B21: modified-locally ------------------------------------------------
  h.caseStart("B21", "local edit is reported modified-locally and exits non-zero");
  appendFileSync(`${skillroot}/SKILL.md`, "\n<!-- local edit -->\n");
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "modified-locally", "stdout");
  h.assertHas(h.out, "still drifting", "stdout");
  h.assertHas(h.out, "--fix --force", "stdout");
  h.caseEnd();

  // ---- B22: --fix leaves local edits alone ----------------------------------
  h.caseStart("B22", "skill doctor --fix does NOT overwrite a locally modified skill");
  await h.cli("skill", "doctor", "--fix");
  h.assertRc(1);
  h.assertHas(h.out, "modified-locally", "stdout");
  h.assertFileContains(
    `${skillroot}/SKILL.md`,
    "local edit",
    "local edit was overwritten by --fix without --force",
  );
  h.caseEnd();

  // ---- B23: --fix --force heals ---------------------------------------------
  h.caseStart("B23", "skill doctor --fix --force restores the shipped content");
  await h.cli("skill", "doctor", "--fix", "--force");
  h.assertRc(0);
  h.assertHas(h.out, "Fixed 1 skill(s).", "stdout");
  h.assertHas(h.out, "All skills up-to-date.", "stdout");
  h.assertFileLacks(`${skillroot}/SKILL.md`, "local edit", "local edit survived --fix --force");
  h.caseEnd();

  // ---- B24: deleted tracked file counts as drift ----------------------------
  h.caseStart("B24", "a deleted tracked file is detected as drift and healed by --fix --force");
  rmSync(`${skillroot}/references/business-logic.md`, { force: true });
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "modified-locally", "stdout");
  await h.cli("skill", "doctor", "--fix", "--force");
  h.assertRc(0);
  h.assertFile(`${skillroot}/references/business-logic.md`);
  h.caseEnd();

  // ---- B25: missing ---------------------------------------------------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  h.caseStart("B25", "skill doctor reports missing when nothing is installed (exit 1)");
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "missing", "stdout");
  h.assertHas(h.out, "installed none", "stdout");
  h.caseEnd();

  // ---- B26: missing + --fix -------------------------------------------------
  h.caseStart("B26", "skill doctor --fix installs a missing skill without --force");
  await h.cli("skill", "doctor", "--fix");
  h.assertRc(0);
  h.assertHas(h.out, "Fixed 1 skill(s).", "stdout");
  h.assertFile(`${w}/.claude/skills/ledger-wallet-cli/SKILL.md`);
  h.assertFile(`${w}/.claude/skills/ledger-wallet-cli/.wallet-cli-skill.json`);
  h.caseEnd();

  // ---- B27: outdated (forged older-version sidecar) -------------------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install", "--agent", "claude");
  skillroot = `${w}/.claude/skills/ledger-wallet-cli`;
  h.caseStart(
    "B27",
    "an install from an older wallet-cli is reported outdated and healed by --fix",
  );
  // Simulate "installed by 2.0.0": edit the content, then make the sidecar agree
  // with what is on disk (so it is provenance-consistent) but disagree with the
  // binary's shipped hash — exactly the outdated signature.
  appendFileSync(`${skillroot}/SKILL.md`, "\n<!-- shipped by an older cli -->\n");
  const forged = skillDiskHash(skillroot, SKILL_FILES);
  writeFileSync(
    `${skillroot}/.wallet-cli-skill.json`,
    JSON.stringify({
      name: "ledger-wallet-cli",
      cliVersion: "2.0.0",
      contentHash: forged.contentHash,
      files: forged.files,
      installedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "outdated", "stdout");
  h.assertHas(h.out, "installed 2.0.0@", "stdout");
  await h.cli("skill", "doctor", "--fix");
  h.assertRc(0);
  h.assertHas(h.out, "Fixed 1 skill(s).", "stdout");
  h.assertField(
    h.assertJson(readFileSync(`${skillroot}/.wallet-cli-skill.json`, "utf8"), "sidecar"),
    "cliVersion",
    expectedVersion,
    "healed sidecar version",
  );
  h.caseEnd();

  // ---- B28: sidecar-less install that matches shipped content ---------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  await h.cli("skill", "install", "--agent", "claude");
  skillroot = `${w}/.claude/skills/ledger-wallet-cli`;
  h.caseStart("B28", "a manual install with no sidecar but matching content is up-to-date");
  rmSync(`${skillroot}/.wallet-cli-skill.json`, { force: true });
  await h.cli("skill", "doctor");
  h.assertRc(0);
  h.assertHas(h.out, "up-to-date", "stdout");
  h.assertHas(h.out, "installed none", "stdout");
  h.caseEnd();

  // ---- B29: sidecar-less install that differs is conservative ---------------
  h.caseStart("B29", "a sidecar-less install whose content differs is treated as modified-locally");
  appendFileSync(`${skillroot}/SKILL.md`, "\n<!-- hand edit -->\n");
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "modified-locally", "stdout");
  await h.cli("skill", "doctor", "--fix");
  h.assertRc(1);
  h.assertFileContains(
    `${skillroot}/SKILL.md`,
    "hand edit",
    "--fix overwrote a sidecar-less install without --force",
  );
  h.caseEnd();

  // ---- B30: doctor --dir ----------------------------------------------------
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  h.caseStart("B30", "skill doctor --dir scans an explicit directory only");
  await h.cli("skill", "install", "--dir", "./elsewhere");
  await h.cli("skill", "doctor", "--dir", "./elsewhere");
  h.assertRc(0);
  h.assertHas(h.out, "up-to-date", "stdout");
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "missing", "stdout");
  h.caseEnd();

  // ---- B31: doctor --global -------------------------------------------------
  h.caseStart("B31", "skill doctor --global also scans the home directory");
  w = h.freshDir();
  h.cwd = w;
  const doctorHome = h.freshDir();
  h.setEnv({ WALLET_CLI_NO_NUDGE: "1", ...isolatedEnv(h.config.isoState, doctorHome) });
  await h.cli("skill", "install", "--agent", "claude", "--global");
  await h.cli("skill", "doctor", "--global", "--output", "json");
  h.assertRc(0);
  json = h.assertJson(h.out);
  // Compare on the home dir's basename: macOS resolves /var -> /private/var, so a
  // full-path prefix match would fail for reasons unrelated to --global.
  const results = asArray(jsonAt(json, "results"));
  h.assertThat(
    results.some(r => (asString(jsonAt(r, "root")) ?? "").includes(basename(doctorHome))),
    "no results[].root under the home directory",
  );
  h.assertThat(
    results.some(r => jsonAt(r, "status") === "up-to-date"),
    "no results[] with status up-to-date",
  );
  h.caseEnd();

  // ---- B32: a regular file where a skill dir is expected --------------------
  h.caseStart("B32", "a regular file at the skill path is not mistaken for an install");
  w = h.freshDir();
  h.cwd = w;
  h.isoEnv();
  const impostor = `${w}/.claude/skills/ledger-wallet-cli`;
  mkdirSync(dirname(impostor), { recursive: true });
  writeFileSync(impostor, "not a skill\n");
  await h.cli("skill", "doctor");
  h.assertRc(1);
  h.assertHas(h.out, "missing", "stdout");
  h.caseEnd();

  h.cwd = h.config.repoRoot;
}

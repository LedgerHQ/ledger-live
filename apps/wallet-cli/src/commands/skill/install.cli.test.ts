import { describe, it, expect, afterEach } from "bun:test";
import {
  access,
  appendFile,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../testing/cli-runner";
import { readTrackedFromDisk, stampSidecar } from "../../testing/skill-fixtures";
import { getSkill, renderSkillMarkdown, SIDECAR_FILENAME } from "../../skills/registry";

const SKILL_NAME = "wallet-cli-usage";
const LEGACY_SKILL_NAME = "ledger-wallet-cli";

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

let tmpDir: string | undefined;
afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

async function installOlderSkill(dir: string): Promise<string> {
  const first = await runCli(["skill", "install", SKILL_NAME, "--dir", dir]);
  expect(first.exitCode).toBe(0);
  const skillRoot = path.join(dir, SKILL_NAME);
  for (const file of ["SKILL.md", "references/business-logic.md"]) {
    await appendFile(path.join(skillRoot, file), "\n<!-- shipped by older wallet-cli -->\n");
  }
  await stampSidecar(skillRoot, "0.0.1");
  return skillRoot;
}

async function installOlderSkillWithoutTheReference(
  dir: string,
): Promise<{ reference: string; shippedReference: string }> {
  const first = await runCli(["skill", "install", SKILL_NAME, "--dir", dir]);
  expect(first.exitCode).toBe(0);
  const skillRoot = path.join(dir, SKILL_NAME);
  const reference = path.join(skillRoot, "references", "business-logic.md");
  const shippedReference = await readFile(reference, "utf8");
  await appendFile(path.join(skillRoot, "SKILL.md"), "\n<!-- shipped by older wallet-cli -->\n");
  const olderFiles = (await readTrackedFromDisk(skillRoot)).filter(f => f.path === "SKILL.md");
  await stampSidecar(skillRoot, "0.0.1", olderFiles);
  await rm(reference);
  return { reference, shippedReference };
}

const DROPPED = { path: "references/dropped.md", content: "a reference since removed\n" };

async function installOlderSkillWithAFileThisOneDropped(
  dir: string,
  dropped: { path: string; content: string },
): Promise<{ skillRoot: string; shippedSkillMd: string }> {
  const first = await runCli(["skill", "install", SKILL_NAME, "--dir", dir]);
  expect(first.exitCode).toBe(0);
  const skillRoot = path.join(dir, SKILL_NAME);
  const skillMd = path.join(skillRoot, "SKILL.md");
  const shippedSkillMd = await readFile(skillMd, "utf8");
  await appendFile(skillMd, "\n<!-- shipped by older wallet-cli -->\n");
  await writeFile(path.resolve(skillRoot, dropped.path), dropped.content, "utf8");
  await stampSidecar(skillRoot, "0.0.1", [...(await readTrackedFromDisk(skillRoot)), dropped]);
  return { skillRoot, shippedSkillMd };
}

describe("skill install", () => {
  it("writes SKILL.md and reference files under --dir", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "install",
      SKILL_NAME,
      "--dir",
      tmpDir,
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const skillMd = path.join(tmpDir, SKILL_NAME, "SKILL.md");
    const reference = path.join(tmpDir, SKILL_NAME, "references", "business-logic.md");
    expect(await exists(skillMd)).toBe(true);
    expect(await exists(reference)).toBe(true);
    expect(await readFile(skillMd, "utf8")).toContain("# wallet-cli");
    expect(stdout).toContain(skillMd);
  });

  it("reinstalls an unedited skill without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));

    const first = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(first.exitCode).toBe(0);

    const second = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(second.exitCode, `stderr: ${second.stderr}`).toBe(0);
  });

  it("replaces a skill an older wallet-cli installed without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const first = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(first.exitCode).toBe(0);
    const skillRoot = path.join(tmpDir, SKILL_NAME);
    const skillMd = path.join(skillRoot, "SKILL.md");
    const shipped = await readFile(skillMd, "utf8");
    await appendFile(skillMd, "\n<!-- shipped by older wallet-cli -->\n");
    await stampSidecar(skillRoot, "0.0.1");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(skillMd, "utf8")).toBe(shipped);
  });

  it("replaces an older skill that had a file this one dropped, and deletes that file, without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { skillRoot, shippedSkillMd } = await installOlderSkillWithAFileThisOneDropped(
      tmpDir,
      DROPPED,
    );

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(path.join(skillRoot, "SKILL.md"), "utf8")).toBe(shippedSkillMd);
    expect(await exists(path.join(skillRoot, DROPPED.path))).toBe(false);
  });

  it("keeps a file this skill dropped if it was edited since install, even with --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { skillRoot } = await installOlderSkillWithAFileThisOneDropped(tmpDir, DROPPED);
    const droppedOnDisk = path.join(skillRoot, DROPPED.path);
    await appendFile(droppedOnDisk, "my own notes\n");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir, "--force"]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(droppedOnDisk, "utf8")).toBe(`${DROPPED.content}my own notes\n`);
  });

  it("doesn't delete a dropped file through a linked directory", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const outsideDir = path.join(tmpDir, "outside");
    await mkdir(outsideDir);
    await mkdir(path.join(tmpDir, SKILL_NAME));
    await symlink(outsideDir, path.join(tmpDir, SKILL_NAME, "old-references"));
    const dropped = { path: "old-references/dropped.md", content: DROPPED.content };
    await installOlderSkillWithAFileThisOneDropped(tmpDir, dropped);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir, "--force"]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(path.join(outsideDir, "dropped.md"), "utf8")).toBe(DROPPED.content);
  });

  it("doesn't delete a dropped file the sidecar records outside the skill directory", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const outside = { path: "../outside.md", content: "not part of the skill\n" };
    await installOlderSkillWithAFileThisOneDropped(tmpDir, outside);
    const outsideOnDisk = path.join(tmpDir, "outside.md");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir, "--force"]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(outsideOnDisk, "utf8")).toBe(outside.content);
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)(
    "updates the skill when a dropped file can't be deleted",
    async () => {
      tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
      const lockedDir = path.join(tmpDir, SKILL_NAME, "old-references");
      await mkdir(lockedDir, { recursive: true });
      const dropped = { path: "old-references/dropped.md", content: DROPPED.content };
      const { skillRoot, shippedSkillMd } = await installOlderSkillWithAFileThisOneDropped(
        tmpDir,
        dropped,
      );
      await chmod(lockedDir, 0o555);

      try {
        const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

        expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
        expect(await readFile(path.join(skillRoot, "SKILL.md"), "utf8")).toBe(shippedSkillMd);
      } finally {
        await chmod(lockedDir, 0o755);
      }
    },
  );

  it("adds a file an older skill lacked without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference, shippedReference } = await installOlderSkillWithoutTheReference(tmpDir);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(reference, "utf8")).toBe(shippedReference);
  });

  it("keeps the user's own file where the new skill adds one, without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference } = await installOlderSkillWithoutTheReference(tmpDir);
    await writeFile(reference, "my own notes\n", "utf8");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await readFile(reference, "utf8")).toBe("my own notes\n");
  });

  it("keeps the older skill when a directory sits where the new skill adds a file", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference } = await installOlderSkillWithoutTheReference(tmpDir);
    await mkdir(reference);
    const skillMd = path.join(tmpDir, SKILL_NAME, "SKILL.md");
    const olderSkillMd = await readFile(skillMd, "utf8");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await readFile(skillMd, "utf8")).toBe(olderSkillMd);
  });

  it("doesn't write through a dangling link where the new skill adds a file", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference } = await installOlderSkillWithoutTheReference(tmpDir);
    const outsideTheSkill = path.join(tmpDir, "outside.md");
    await symlink(outsideTheSkill, reference);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await exists(outsideTheSkill)).toBe(false);
  });

  it("doesn't write through a dangling link in a skill without a sidecar", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference } = await installOlderSkillWithoutTheReference(tmpDir);
    await rm(path.join(tmpDir, SKILL_NAME, SIDECAR_FILENAME));
    const outsideTheSkill = path.join(tmpDir, "outside.md");
    await symlink(outsideTheSkill, reference);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await exists(outsideTheSkill)).toBe(false);
  });

  it("replaces a dangling link instead of writing through it with --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference, shippedReference } = await installOlderSkillWithoutTheReference(tmpDir);
    const outsideTheSkill = path.join(tmpDir, "outside.md");
    await symlink(outsideTheSkill, reference);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir, "--force"]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await exists(outsideTheSkill)).toBe(false);
    expect(await readFile(reference, "utf8")).toBe(shippedReference);
  });

  it("keeps a SKILL.md that links to the user's own copy without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const skillRoot = await installOlderSkill(tmpDir);
    const skillMd = path.join(skillRoot, "SKILL.md");
    const userCopy = path.join(tmpDir, "my-SKILL.md");
    await rename(skillMd, userCopy);
    await symlink(userCopy, skillMd);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect((await lstat(skillMd)).isSymbolicLink()).toBe(true);
  });

  it("doesn't write through a references directory that links outside the skill", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const skillRoot = await installOlderSkill(tmpDir);
    const sharedReferences = path.join(tmpDir, "shared-references");
    await rename(path.join(skillRoot, "references"), sharedReferences);
    await symlink(sharedReferences, path.join(skillRoot, "references"));
    const sharedReference = path.join(sharedReferences, "business-logic.md");
    const olderReference = await readFile(sharedReference, "utf8");

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await readFile(sharedReference, "utf8")).toBe(olderReference);
  });

  it("doesn't add a file through a directory that links outside the skill", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { reference } = await installOlderSkillWithoutTheReference(tmpDir);
    const sharedReferences = path.join(tmpDir, "shared-references");
    await mkdir(sharedReferences);
    await rm(path.dirname(reference), { recursive: true });
    await symlink(sharedReferences, path.dirname(reference));

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode).toBe(1);
    expect(await exists(path.join(sharedReferences, "business-logic.md"))).toBe(false);
  });

  it("updates a skill whose directory links to another agent's without --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const agentsSkills = path.join(tmpDir, ".agents", "skills");
    const claudeSkills = path.join(tmpDir, ".claude", "skills");
    const skillRoot = await installOlderSkill(agentsSkills);
    await mkdir(claudeSkills, { recursive: true });
    await symlink(skillRoot, path.join(claudeSkills, SKILL_NAME));

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", claudeSkills]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(path.join(skillRoot, "SKILL.md"), "utf8")).toBe(
      renderSkillMarkdown(getSkill(SKILL_NAME)!),
    );
  });

  it("replaces a linked sidecar instead of writing through it", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const first = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(first.exitCode).toBe(0);
    const sidecar = path.join(tmpDir, SKILL_NAME, SIDECAR_FILENAME);
    const userFile = path.join(tmpDir, "notes.txt");
    await writeFile(userFile, "my own notes\n", "utf8");
    await rm(sidecar);
    await symlink(userFile, sidecar);

    const update = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);

    expect(update.exitCode, `stderr: ${update.stderr}`).toBe(0);
    expect(await readFile(userFile, "utf8")).toBe("my own notes\n");
    expect(JSON.parse(await readFile(sidecar, "utf8")).name).toBe(SKILL_NAME);
  });

  it("keeps a skill edited since install without --force, then overwrites it with --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));

    const first = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(first.exitCode).toBe(0);
    const skillMd = path.join(tmpDir, SKILL_NAME, "SKILL.md");
    const shipped = await readFile(skillMd, "utf8");
    await appendFile(skillMd, "\nlocal hand edit\n");

    const second = await runCli([
      "skill",
      "install",
      SKILL_NAME,
      "--dir",
      tmpDir,
      "--output",
      "json",
    ]);
    expect(second.exitCode).toBe(1);
    const err = JSON.parse(second.stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toBe(
      `Refusing to overwrite skill "${SKILL_NAME}", whose files changed since wallet-cli installed it:\n  ${skillMd}\nRe-run with --force to overwrite.`,
    );
    expect(await readFile(skillMd, "utf8")).toBe(`${shipped}\nlocal hand edit\n`);

    const forced = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir, "--force"]);
    expect(forced.exitCode).toBe(0);
    expect(await readFile(skillMd, "utf8")).toBe(shipped);
  });

  it("returns a json envelope listing installed paths and root", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { stdout, exitCode } = await runCli([
      "skill",
      "install",
      SKILL_NAME,
      "--dir",
      tmpDir,
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill install");
    expect(data.root).toBe(tmpDir);
    expect(data.skills).toContain(SKILL_NAME);
    expect(Array.isArray(data.installed)).toBe(true);
    expect(data.installed.length).toBeGreaterThanOrEqual(2);
  });

  it("exits non-zero for an unknown --agent, listing supported values", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "install",
      SKILL_NAME,
      "--agent",
      "bogus",
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/claude/);
    expect(err.error.message).toMatch(/cursor/);
    expect(err.error.message).toMatch(/codex/);
    expect(err.error.message).toMatch(/agents/);
  });

  it("rejects a prototype-key --agent with the same friendly error (no proto bypass)", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "install",
      SKILL_NAME,
      "--agent",
      "__proto__",
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/Unknown agent "__proto__"/);
  });

  it("supports --agent agents, writing under .agents/skills of the cwd", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    // No --dir: resolveInstallRoot uses process.cwd(), so run from the tmp dir.
    const prevCwd = process.cwd();
    process.chdir(tmpDir);
    // process.cwd() resolves symlinks (e.g. macOS /var -> /private/var).
    const effectiveCwd = process.cwd();
    try {
      const { stdout, exitCode, stderr } = await runCli([
        "skill",
        "install",
        SKILL_NAME,
        "--agent",
        "agents",
        "--output",
        "json",
      ]);
      expect(exitCode, `stderr: ${stderr}`).toBe(0);
      const data = JSON.parse(stdout);
      expect(data.root).toBe(path.join(effectiveCwd, ".agents", "skills"));
      const skillMd = path.join(data.root, SKILL_NAME, "SKILL.md");
      expect(await exists(skillMd)).toBe(true);
    } finally {
      process.chdir(prevCwd);
    }
  });

  it("records the canonical name in the provenance sidecar", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const res = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);

    const sidecar = JSON.parse(
      await readFile(path.join(tmpDir, SKILL_NAME, SIDECAR_FILENAME), "utf8"),
    );
    expect(sidecar.name).toBe(SKILL_NAME);
  });

  it("installs the standalone skill content, not the monorepo source", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const res = await runCli(["skill", "install", SKILL_NAME, "--dir", tmpDir]);
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);

    const skillMd = await readFile(path.join(tmpDir, SKILL_NAME, "SKILL.md"), "utf8");
    expect(skillMd).toContain(`name: ${SKILL_NAME}`);
    expect(skillMd).not.toContain("pnpm --silent wallet-cli start");
    expect(skillMd).toContain(
      "Install globally with a user-preferred package manager — `npm i -g @ledgerhq/wallet-cli`",
    );
  });
});

describe("skill install — legacy skill name", () => {
  it("accepts the legacy name and installs under the canonical directory", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "install",
      LEGACY_SKILL_NAME,
      "--dir",
      tmpDir,
      "--output",
      "json",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    // A legacy lookup must resolve to the canonical skill, never create a second
    // copy on disk under the old name.
    const data = JSON.parse(stdout);
    expect(data.skills).toContain(SKILL_NAME);
    expect(data.skills).not.toContain(LEGACY_SKILL_NAME);
    expect(await exists(path.join(tmpDir, SKILL_NAME, "SKILL.md"))).toBe(true);
    expect(await exists(path.join(tmpDir, LEGACY_SKILL_NAME))).toBe(false);
  });

  it("writes the canonical name into the sidecar for a legacy install", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const res = await runCli(["skill", "install", LEGACY_SKILL_NAME, "--dir", tmpDir]);
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);

    const sidecar = JSON.parse(
      await readFile(path.join(tmpDir, SKILL_NAME, SIDECAR_FILENAME), "utf8"),
    );
    expect(sidecar.name).toBe(SKILL_NAME);
  });
});

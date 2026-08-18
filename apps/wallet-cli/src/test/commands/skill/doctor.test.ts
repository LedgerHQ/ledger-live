import { describe, it, expect, afterEach } from "bun:test";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../helpers/cli-runner";
import { getSkill, SIDECAR_FILENAME } from "../../../skills/registry";
import { hashOne, hashSkillFiles } from "../../../skills/hash";

const SKILL_NAME = "ledger-wallet-cli";

let tmpDir: string | undefined;
afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

async function makeTmpDir(): Promise<string> {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-doctortest-"));
  return tmpDir;
}

async function install(dir: string): Promise<void> {
  const res = await runCli(["skill", "install", SKILL_NAME, "--dir", dir]);
  expect(res.exitCode, `install stderr: ${res.stderr}`).toBe(0);
}

/** Read the manifest-tracked files as they currently exist on disk. */
async function readTrackedFromDisk(
  skillRoot: string,
): Promise<{ path: string; content: string }[]> {
  const skill = getSkill(SKILL_NAME)!;
  const files: { path: string; content: string }[] = [];
  for (const f of skill.files) {
    files.push({ path: f.path, content: await readFile(path.join(skillRoot, f.path), "utf8") });
  }
  return files;
}

/** Rewrite the sidecar so its hashes match the current on-disk files (with a chosen version). */
async function stampSidecar(skillRoot: string, cliVersion: string): Promise<void> {
  const files = await readTrackedFromDisk(skillRoot);
  const sidecar = {
    name: SKILL_NAME,
    cliVersion,
    contentHash: hashSkillFiles(files),
    files: Object.fromEntries(files.map(f => [f.path, hashOne(f.content)])),
    installedAt: new Date().toISOString(),
  };
  await writeFile(
    path.join(skillRoot, SIDECAR_FILENAME),
    `${JSON.stringify(sidecar, null, 2)}\n`,
    "utf8",
  );
}

describe("skill doctor", () => {
  it("reports up-to-date and exits 0 for a fresh install", async () => {
    const dir = await makeTmpDir();
    await install(dir);

    const { stdout, exitCode, stderr } = await runCli(["skill", "doctor", "--dir", dir]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("up-to-date");
    expect(stdout).toContain("All skills up-to-date.");
  });

  it("detects outdated (older sidecar consistent with disk) and heals with --fix", async () => {
    const dir = await makeTmpDir();
    await install(dir);
    const skillRoot = path.join(dir, SKILL_NAME);

    // Simulate an install by an older binary: change the on-disk content and make
    // the sidecar consistent with it, but different from the shipped content.
    await appendFile(path.join(skillRoot, "SKILL.md"), "\n<!-- shipped by older wallet-cli -->\n");
    await stampSidecar(skillRoot, "0.0.1");

    const outdated = await runCli(["skill", "doctor", "--dir", dir]);
    expect(outdated.exitCode).toBe(1);
    expect(outdated.stdout).toContain("outdated");

    const fixed = await runCli(["skill", "doctor", "--dir", dir, "--fix"]);
    expect(fixed.exitCode, `stderr: ${fixed.stderr}`).toBe(0);
    expect(fixed.stdout).toContain("up-to-date");
  });

  it("emits `fixed` as diagnosis objects carrying name and root, not bare names", async () => {
    const dir = await makeTmpDir();
    await install(dir);
    const skillRoot = path.join(dir, SKILL_NAME);

    // Make the single installed skill outdated so `--fix` heals exactly it.
    await appendFile(path.join(skillRoot, "SKILL.md"), "\n<!-- shipped by older wallet-cli -->\n");
    await stampSidecar(skillRoot, "0.0.1");

    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "doctor",
      "--dir",
      dir,
      "--fix",
      "--output",
      "json",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    // `fixed` must be objects (name + root), so the same skill healed in multiple
    // scan roots stays distinct instead of collapsing to duplicate bare names.
    expect(Array.isArray(data.fixed)).toBe(true);
    const fixedEntry = (data.fixed as { name: string; root: string }[]).find(
      f => f.name === SKILL_NAME,
    );
    expect(fixedEntry).toBeDefined();
    expect(fixedEntry!.root).toBe(dir);
  });

  it("detects modified-locally, leaves it under --fix, restores under --fix --force", async () => {
    const dir = await makeTmpDir();
    await install(dir);
    const skillRoot = path.join(dir, SKILL_NAME);

    await appendFile(path.join(skillRoot, "SKILL.md"), "\nlocal hand edit\n");

    const modified = await runCli(["skill", "doctor", "--dir", dir]);
    expect(modified.exitCode).toBe(1);
    expect(modified.stdout).toContain("modified-locally");

    const fixNoForce = await runCli(["skill", "doctor", "--dir", dir, "--fix"]);
    expect(fixNoForce.exitCode).toBe(1);
    expect(fixNoForce.stdout).toContain("modified-locally");

    // `--force` without `--fix` overwrites nothing, so the remediation hint must
    // still show (regression guard: it was previously suppressed by `--force`).
    const forceNoFix = await runCli(["skill", "doctor", "--dir", dir, "--force"]);
    expect(forceNoFix.exitCode).toBe(1);
    expect(forceNoFix.stdout).toContain("Re-run with --fix --force");
    // The hint carries each entry's root so the same skill modified in multiple
    // scan roots (e.g. under --global) stays distinguishable, not `name, name`.
    expect(forceNoFix.stdout).toContain(`${SKILL_NAME} (${dir})`);

    const fixForce = await runCli(["skill", "doctor", "--dir", dir, "--fix", "--force"]);
    expect(fixForce.exitCode, `stderr: ${fixForce.stderr}`).toBe(0);
    expect(fixForce.stdout).toContain("up-to-date");
    const restored = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
    expect(restored).not.toContain("local hand edit");
  });

  it("reports up-to-date for a sidecar-less install whose files match the shipped content", async () => {
    const dir = await makeTmpDir();
    // Install every shipped skill so the scan finds no "missing" ones regardless
    // of how many skills this binary ships.
    const res = await runCli(["skill", "install", "--all", "--dir", dir]);
    expect(res.exitCode, `install --all stderr: ${res.stderr}`).toBe(0);
    const skillRoot = path.join(dir, SKILL_NAME);

    // Legacy/manual install: files match what we ship, but there's no provenance.
    await rm(path.join(skillRoot, SIDECAR_FILENAME));

    const { stdout, exitCode, stderr } = await runCli(["skill", "doctor", "--dir", dir]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("up-to-date");
    expect(stdout).toContain("All skills up-to-date.");
  });

  it("treats a sidecar-less install whose files differ from shipped as modified-locally", async () => {
    const dir = await makeTmpDir();
    const res = await runCli(["skill", "install", "--all", "--dir", dir]);
    expect(res.exitCode, `install --all stderr: ${res.stderr}`).toBe(0);
    const skillRoot = path.join(dir, SKILL_NAME);

    await rm(path.join(skillRoot, SIDECAR_FILENAME));
    await appendFile(path.join(skillRoot, "SKILL.md"), "\nlocal hand edit\n");

    const modified = await runCli(["skill", "doctor", "--dir", dir]);
    expect(modified.exitCode).toBe(1);
    expect(modified.stdout).toContain("modified-locally");

    // Without provenance we don't overwrite without --force.
    const fixNoForce = await runCli(["skill", "doctor", "--dir", dir, "--fix"]);
    expect(fixNoForce.exitCode).toBe(1);
    expect(fixNoForce.stdout).toContain("modified-locally");
  });

  it("reports missing when the skill is absent from the scanned dir", async () => {
    const dir = await makeTmpDir();

    const { stdout, exitCode } = await runCli(["skill", "doctor", "--dir", dir]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("missing");
  });

  it("heals a missing skill with --fix", async () => {
    const dir = await makeTmpDir();

    const fixed = await runCli(["skill", "doctor", "--dir", dir, "--fix"]);
    expect(fixed.exitCode, `stderr: ${fixed.stderr}`).toBe(0);
    expect(fixed.stdout).toContain("up-to-date");
  });

  it("returns a json envelope with status, command and results", async () => {
    const dir = await makeTmpDir();
    await install(dir);

    const { stdout, exitCode } = await runCli([
      "skill",
      "doctor",
      "--dir",
      dir,
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill doctor");
    expect(Array.isArray(data.results)).toBe(true);
    expect(Array.isArray(data.remainingDrift)).toBe(true);
    expect(data.results[0].name).toBe(SKILL_NAME);
    expect(data.results[0].status).toBe("up-to-date");
  });
});

import { describe, it, expect, afterEach } from "bun:test";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../helpers/cli-runner";

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

describe("skill install", () => {
  it("writes SKILL.md and reference files under --dir", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "install",
      "ledger-wallet-cli",
      "--dir",
      tmpDir,
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const skillMd = path.join(tmpDir, "ledger-wallet-cli", "SKILL.md");
    const reference = path.join(tmpDir, "ledger-wallet-cli", "references", "business-logic.md");
    expect(await exists(skillMd)).toBe(true);
    expect(await exists(reference)).toBe(true);
    expect(await readFile(skillMd, "utf8")).toContain("# wallet-cli");
    expect(stdout).toContain(skillMd);
  });

  it("refuses to overwrite existing files without --force, then succeeds with --force", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));

    const first = await runCli(["skill", "install", "ledger-wallet-cli", "--dir", tmpDir]);
    expect(first.exitCode).toBe(0);

    const second = await runCli([
      "skill",
      "install",
      "ledger-wallet-cli",
      "--dir",
      tmpDir,
      "--output",
      "json",
    ]);
    expect(second.exitCode).toBe(1);
    const err = JSON.parse(second.stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/overwrite/i);

    const forced = await runCli([
      "skill",
      "install",
      "ledger-wallet-cli",
      "--dir",
      tmpDir,
      "--force",
    ]);
    expect(forced.exitCode).toBe(0);
  });

  it("returns a json envelope listing installed paths and root", async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-skilltest-"));
    const { stdout, exitCode } = await runCli([
      "skill",
      "install",
      "ledger-wallet-cli",
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
    expect(data.skills).toContain("ledger-wallet-cli");
    expect(Array.isArray(data.installed)).toBe(true);
    expect(data.installed.length).toBeGreaterThanOrEqual(2);
  });

  it("exits non-zero for an unknown --agent, listing supported values", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "install",
      "ledger-wallet-cli",
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
      "ledger-wallet-cli",
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
        "ledger-wallet-cli",
        "--agent",
        "agents",
        "--output",
        "json",
      ]);
      expect(exitCode, `stderr: ${stderr}`).toBe(0);
      const data = JSON.parse(stdout);
      expect(data.root).toBe(path.join(effectiveCwd, ".agents", "skills"));
      const skillMd = path.join(data.root, "ledger-wallet-cli", "SKILL.md");
      expect(await exists(skillMd)).toBe(true);
    } finally {
      process.chdir(prevCwd);
    }
  });
});

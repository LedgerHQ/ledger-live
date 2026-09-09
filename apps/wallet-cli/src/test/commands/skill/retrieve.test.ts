import { describe, it, expect } from "bun:test";
import { runCli } from "../../helpers/cli-runner";

const SKILL_NAME = "wallet-cli-usage";
const LEGACY_SKILL_NAME = "ledger-wallet-cli";

describe("skill retrieve — human", () => {
  it("prints the SKILL.md frontmatter and heading for a named skill", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "retrieve", SKILL_NAME]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain(`name: ${SKILL_NAME}`);
    expect(stdout).toContain("# wallet-cli");
  });

  it("embeds the standalone skill name, not the monorepo source name", async () => {
    const { stdout, exitCode } = await runCli(["skill", "retrieve", SKILL_NAME]);
    expect(exitCode).toBe(0);
    // The frontmatter must agree with the manifest, the install directory and the
    // copy published to agent-skills — a partial rename is worse than none.
    expect(stdout).not.toContain(`name: ${LEGACY_SKILL_NAME}`);
  });

  it("rewrites monorepo-only run instructions to the standalone form", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "retrieve", SKILL_NAME]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).not.toContain("pnpm --silent wallet-cli start");
    expect(stdout).toContain(
      "Install globally with a user-preferred package manager — `npm i -g @ledgerhq/wallet-cli`",
    );
  });

  it("leaves no monorepo-only run instruction anywhere in the embedded skill", async () => {
    const { stdout, exitCode } = await runCli(["skill", "retrieve", SKILL_NAME]);
    expect(exitCode).toBe(0);
    expect(stdout).not.toMatch(/repo root/i);
  });

  it("resolves the legacy skill name for backward compatibility", async () => {
    // `wallet-cli skill retrieve ledger-wallet-cli` was the documented command
    // before the rename and is baked into agents' context — it must keep working.
    const { stdout, exitCode, stderr } = await runCli(["skill", "retrieve", LEGACY_SKILL_NAME]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("# wallet-cli");
  });

  it("returns the canonical skill for a legacy lookup, byte-for-byte", async () => {
    const legacy = await runCli(["skill", "retrieve", LEGACY_SKILL_NAME]);
    const canonical = await runCli(["skill", "retrieve", SKILL_NAME]);
    expect(legacy.exitCode).toBe(0);
    expect(legacy.stdout).toBe(canonical.stdout);
    // Identity, not just content: the alias must not resurrect the old name.
    expect(legacy.stdout).toContain(`name: ${SKILL_NAME}`);
  });

  it("defaults to the sole embedded skill when no name is given", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "retrieve"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain(`name: ${SKILL_NAME}`);
  });

  it("prints a reference file with --file", async () => {
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "retrieve",
      SKILL_NAME,
      "--file",
      "references/business-logic.md",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/business logic/i);
  });

  it("serves reference files free of monorepo-only commands too", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "retrieve",
      SKILL_NAME,
      "--file",
      "references/business-logic.md",
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).not.toContain("pnpm --silent wallet-cli start");
  });

  it("exits non-zero for an unknown skill name", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "retrieve",
      "does-not-exist",
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/not found/i);
    // The suggestion list must offer the canonical name, not the legacy alias.
    expect(err.error.message).toContain(SKILL_NAME);
    expect(err.error.message).not.toContain(LEGACY_SKILL_NAME);
  });

  it("exits non-zero for an unknown --file", async () => {
    const { exitCode } = await runCli([
      "skill",
      "retrieve",
      SKILL_NAME,
      "--file",
      "references/nope.md",
    ]);
    expect(exitCode).toBe(1);
  });
});

describe("skill retrieve — json", () => {
  it("returns an envelope with name and the requested file content", async () => {
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "retrieve",
      SKILL_NAME,
      "--output",
      "json",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill retrieve");
    expect(data.name).toBe(SKILL_NAME);
    expect(data.files).toHaveLength(1);
    expect(data.files[0].path).toBe("SKILL.md");
    expect(data.files[0].content).toContain("# wallet-cli");
  });

  it("reports the canonical name in the envelope for a legacy lookup", async () => {
    const { stdout, exitCode } = await runCli([
      "skill",
      "retrieve",
      LEGACY_SKILL_NAME,
      "--output",
      "json",
    ]);
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout).name).toBe(SKILL_NAME);
  });
});

import { describe, it, expect } from "bun:test";
import { runCli } from "../../helpers/cli-runner";

describe("skill list — human", () => {
  it("lists the wallet-cli-usage skill with its description", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("wallet-cli-usage");
    expect(stdout).toMatch(/USB-based CLI/i);
  });
});

describe("skill list — json", () => {
  it("returns an envelope whose skills array contains wallet-cli-usage", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list", "--output", "json"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill list");
    expect(Array.isArray(data.skills)).toBe(true);
    const names = data.skills.map((s: { name: string }) => s.name);
    expect(names).toContain("wallet-cli-usage");
  });

  it("does not surface the legacy alias as a second skill", async () => {
    // `ledger-wallet-cli` still resolves on lookup (see LEGACY_SKILL_NAMES), but
    // listing it too would show one skill twice and lead agents to install both.
    const { stdout, exitCode } = await runCli(["skill", "list", "--output", "json"]);
    expect(exitCode).toBe(0);
    const names = JSON.parse(stdout).skills.map((s: { name: string }) => s.name);
    expect(names).not.toContain("ledger-wallet-cli");
    expect(names).toHaveLength(new Set(names).size);
  });
});

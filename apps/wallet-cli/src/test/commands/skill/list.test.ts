import { describe, it, expect } from "bun:test";
import { runCli } from "../../helpers/cli-runner";

const TASK_SKILLS = [
  "ledger-wallet-cli-account-discover",
  "ledger-wallet-cli-receive",
  "ledger-wallet-cli-send",
  "ledger-wallet-cli-swap",
  "ledger-wallet-cli-genuine-check",
];

describe("skill list — human", () => {
  it("lists the umbrella skill with its description", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("ledger-wallet-cli");
    expect(stdout).toMatch(/USB-based CLI/i);
  });

  it("lists every task skill", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    for (const name of TASK_SKILLS) {
      expect(stdout).toContain(name);
    }
  });
});

describe("skill list — json", () => {
  it("returns an envelope whose skills array contains the umbrella and all task skills", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list", "--output", "json"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill list");
    expect(Array.isArray(data.skills)).toBe(true);
    const names = data.skills.map((s: { name: string }) => s.name);
    expect(names).toContain("ledger-wallet-cli");
    for (const name of TASK_SKILLS) {
      expect(names).toContain(name);
    }
  });
});

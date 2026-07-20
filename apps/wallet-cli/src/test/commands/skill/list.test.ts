import { describe, it, expect } from "bun:test";
import { runCli } from "../../helpers/cli-runner";

describe("skill list — human", () => {
  it("lists the ledger-wallet-cli skill with its description", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("ledger-wallet-cli");
    expect(stdout).toMatch(/USB-based CLI/i);
  });
});

describe("skill list — json", () => {
  it("returns an envelope whose skills array contains ledger-wallet-cli", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "list", "--output", "json"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill list");
    expect(Array.isArray(data.skills)).toBe(true);
    const names = data.skills.map((s: { name: string }) => s.name);
    expect(names).toContain("ledger-wallet-cli");
  });
});

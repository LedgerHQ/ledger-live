import { describe, it, expect } from "bun:test";
import { runCli } from "../../helpers/cli-runner";

describe("skill retrieve — human", () => {
  it("prints the SKILL.md frontmatter and heading for a named skill", async () => {
    const { stdout, exitCode, stderr } = await runCli(["skill", "retrieve", "ledger-wallet-cli"]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("name: ledger-wallet-cli");
    expect(stdout).toContain("# wallet-cli");
  });

  it("retrieves a task skill by name", async () => {
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "retrieve",
      "ledger-wallet-cli-send",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("name: ledger-wallet-cli-send");
    expect(stdout).toMatch(/send/i);
  });

  it("errors and lists available skills when no name is given", async () => {
    const { stdout, exitCode } = await runCli(["skill", "retrieve", "--output", "json"]);
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/missing skill name/i);
    expect(err.error.message).toContain("ledger-wallet-cli");
    expect(err.error.message).toContain("ledger-wallet-cli-send");
  });

  it("prints the business-logic reference file with --file", async () => {
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "retrieve",
      "ledger-wallet-cli",
      "--file",
      "references/business-logic.md",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/business logic/i);
  });

  it("prints the shared safety reference with --file references/safety.md", async () => {
    const { stdout, exitCode, stderr } = await runCli([
      "skill",
      "retrieve",
      "ledger-wallet-cli-send",
      "--file",
      "references/safety.md",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/safety rails/i);
    expect(stdout).toMatch(/dangerouslyDisableSandbox/);
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
  });

  it("exits non-zero for an unknown --file", async () => {
    const { exitCode } = await runCli([
      "skill",
      "retrieve",
      "ledger-wallet-cli",
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
      "ledger-wallet-cli",
      "--output",
      "json",
    ]);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("skill retrieve");
    expect(data.name).toBe("ledger-wallet-cli");
    expect(data.files).toHaveLength(1);
    expect(data.files[0].path).toBe("SKILL.md");
    expect(data.files[0].content).toContain("# wallet-cli");
  });
});

import { describe, it, expect, afterEach } from "bun:test";
import { runCli } from "../helpers/cli-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_DESCRIPTOR, ETH_ADDRESS } from "../helpers/constants";

const ETH_DESCRIPTOR_2 = `account:1:address:ethereum:main:${ETH_ADDRESS}:m/44h/60h/1h/0/0`;

let cleanup: (() => void) | undefined;
afterEach(() => { cleanup?.(); cleanup = undefined; });

describe("session view", () => {
  it("empty session: prints empty message", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(["session", "view"], fixture.env);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/No accounts/i);
  });

  it("shows label and descriptor for each account", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(["session", "view"], fixture.env);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("ethereum-1");
    expect(stdout).toContain(ETH_DESCRIPTOR);
  });

  it("json output: returns accounts array", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["session", "view", "--output", "json"],
      fixture.env,
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session view");
    expect(data.accounts).toHaveLength(1);
    expect(data.accounts[0].label).toBe("ethereum-1");
    expect(data.accounts[0].descriptor).toBe(ETH_DESCRIPTOR);
  });
});

describe("session reset", () => {
  it("empty session: reports already empty", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/already empty/i);
  });

  it("non-empty session: reports removed count", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(["session", "reset"], fixture.env);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/Removed.*1.*account/i);
  });

  it("json output: returns removed count", async () => {
    const fixture = makeSessionDir([
      { label: "ethereum-1", descriptor: ETH_DESCRIPTOR },
      { label: "ethereum-2", descriptor: ETH_DESCRIPTOR_2 },
    ]);
    cleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["session", "reset", "--output", "json"],
      fixture.env,
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("session reset");
    expect(data.removed).toBe(2);
  });
});

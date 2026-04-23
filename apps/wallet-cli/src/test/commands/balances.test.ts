import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_DESCRIPTOR, ETH_ADDRESS } from "../helpers/constants";

// 1.5 ETH in wei
const ETH_BALANCE_WEI = "1500000000000000000";

describe("balances command", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/address\/[^/]+\/balance$/,
      response: { address: ETH_ADDRESS, balance: ETH_BALANCE_WEI },
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/txs/,
      response: { data: [], token: null },
    },
    {
      method: "POST",
      match: /erc20\/balances/,
      response: [],
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human output: prints ETH balance line", async () => {
    const { stdout, exitCode, stderr } = await runCli(["balances", "--account", ETH_DESCRIPTOR], {
      WALLET_CLI_MOCK_PORT: String(server.port),
    });
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/ETH/i);
    expect(stdout).toMatch(/1\.5/);
  });

  it("json output: returns a valid balances envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["balances", "--account", ETH_DESCRIPTOR, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("balances");
    expect(data.network).toBe("ethereum:main");
    expect(Array.isArray(data.balances)).toBe(true);
    expect(data.balances.length).toBeGreaterThanOrEqual(1);

    const native = data.balances.find((b: { asset: string }) => b.asset === "ethereum");
    expect(native).toBeDefined();
    expect(native.amount).toMatch(/1\.5/);
  });

  it("json output: invalid descriptor exits with code 1", async () => {
    const { stdout, exitCode } = await runCli(
      ["balances", "--account", "not-a-valid-descriptor", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode).toBe(1);
    // JSON mode routes all output to stdout; errors have { ok: false, ... }.
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.command).toBe("balances");
    expect(err.error.message).toMatch(/invalid/i);
  });
});

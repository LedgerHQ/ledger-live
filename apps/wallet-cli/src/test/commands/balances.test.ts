import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { makeSessionDir } from "../helpers/session-fixture";
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

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("human output: prints ETH balance line", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["balances", "--account", "ethereum-1"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/ETH/i);
    expect(stdout).toMatch(/1\.5/);
  });

  it("json output: returns a valid balances envelope", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["balances", "--account", "ethereum-1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
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

  it("json output: raw descriptor passed as --account is rejected with code 1", async () => {
    const fixture = makeSessionDir([]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      ["balances", "--account", ETH_DESCRIPTOR, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.command).toBe("balances");
    expect(err.error.message).toStartWith("Raw descriptors are not accepted");
  });

  it("json output: unknown session label exits with code 1", async () => {
    const fixture = makeSessionDir([]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      ["balances", "--account", "not-a-valid-label", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.command).toBe("balances");
    expect(err.error.message).toStartWith("No account labeled");
  });
});

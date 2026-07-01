import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { withMcpHarness } from "../helpers/mcp-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import {
  ETH_DESCRIPTOR,
  ETH_ADDRESS,
  MOCK_ETH_DESCRIPTOR,
  MOCK_ETH_ADDRESS,
} from "../helpers/constants";

const ETH_BALANCE_WEI = "1500000000000000000";

// makeEnvelope stamps a wall-clock timestamp; strip it before comparing CLI vs MCP envelopes.
function stripTimestamp(env: Record<string, unknown> | undefined): Record<string, unknown> {
  expect(env).toBeDefined();
  const { timestamp, ...rest } = env as Record<string, unknown>;
  expect(typeof timestamp).toBe("string");
  return rest;
}

describe("mcp read tools — envelope parity with `--output json`", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/block\/current$/,
      response: {
        hash: "0x0000000000000000000000000000000000000000000000000000000000000001",
        height: 20_000_000,
        time: "2024-01-01T00:00:00.000Z",
        txs: [],
      },
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/balance$/,
      response: { address: ETH_ADDRESS, balance: ETH_BALANCE_WEI },
    },
    { method: "GET", match: /\/address\/[^/]+\/txs/, response: { data: [], token: null } },
    { method: "POST", match: /erc20\/balances/, response: [] },
    {
      method: "GET",
      match: /\/v1\/currencies/,
      response: [{ id: "ethereum" }],
      headers: { "X-Ledger-Commit": "mock-sync-hash-0000000000000000" },
    },
  ]);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("balances: MCP structuredContent equals the CLI json envelope", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const env = { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env };

    const cli = await runCli(["balances", "--account", "ethereum-1", "--output", "json"], env);
    expect(cli.exitCode, `stderr: ${cli.stderr}`).toBe(0);
    const cliEnvelope = JSON.parse(cli.stdout) as Record<string, unknown>;

    const result = await withMcpHarness(env, ({ callTool }) =>
      callTool("balances", { account: "ethereum-1" }),
    );

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toBeDefined();
    // The MCP text content and structuredContent must agree.
    expect(result.data).toEqual(result.structuredContent);
    // And both must match the CLI envelope (modulo timestamp).
    expect(stripTimestamp(result.structuredContent)).toEqual(stripTimestamp(cliEnvelope));
    expect((result.structuredContent as Record<string, unknown>).command).toBe("balances");
    expect((result.structuredContent as Record<string, unknown>).network).toBe("ethereum:main");
  });

  it("operations: MCP structuredContent equals the CLI json envelope", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const env = { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env };

    const cli = await runCli(["operations", "--account", "ethereum-1", "--output", "json"], env);
    expect(cli.exitCode, `stderr: ${cli.stderr}`).toBe(0);
    const cliEnvelope = JSON.parse(cli.stdout) as Record<string, unknown>;

    const result = await withMcpHarness(env, ({ callTool }) =>
      callTool("operations", { account: "ethereum-1" }),
    );

    expect(result.isError).toBe(false);
    expect(stripTimestamp(result.structuredContent)).toEqual(stripTimestamp(cliEnvelope));
    expect((result.structuredContent as Record<string, unknown>).command).toBe("operations");
  });

  it("receive (verify=false): MCP structuredContent equals the CLI json envelope", async () => {
    const receiveServer = new MockServer(ETH_SYNC_ROUTES);
    receiveServer.start();
    try {
      const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
      const env = { WALLET_CLI_MOCK_PORT: String(receiveServer.port), ...fixture.env };
      try {
        const cli = await runCli(
          ["receive", "--account", "ethereum-1", "--verify=false", "--output", "json"],
          env,
        );
        expect(cli.exitCode, `stderr: ${cli.stderr}`).toBe(0);
        const cliEnvelope = JSON.parse(cli.stdout) as Record<string, unknown>;

        const result = await withMcpHarness(env, ({ callTool }) =>
          callTool("receive", { account: "ethereum-1", verify: false }),
        );

        expect(result.isError).toBe(false);
        expect(stripTimestamp(result.structuredContent)).toEqual(stripTimestamp(cliEnvelope));
        const sc = result.structuredContent as Record<string, unknown>;
        expect(sc.verified).toBe(false);
        expect(sc.source).toBe("software-derivation");
        expect(String(sc.address).toLowerCase()).toBe(MOCK_ETH_ADDRESS.toLowerCase());
        // A read-only tool call emits no progress notifications.
        expect(result.progress).toHaveLength(0);
      } finally {
        fixture.cleanup();
      }
    } finally {
      receiveServer.stop();
    }
  });
});

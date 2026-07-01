import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { withMcpHarness } from "../helpers/mcp-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

describe("mcp device tool — receive --verify (mock DMK)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("returns a verified-address envelope and emits progress notifications", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const env = {
      WALLET_CLI_MOCK_PORT: String(server.port),
      WALLET_CLI_MOCK_DMK: "1",
      WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
        Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
      }),
      ...fixture.env,
    };

    const result = await withMcpHarness(env, ({ callTool }) =>
      callTool("receive", { account: "ethereum-1", verify: true }),
    );

    expect(result.isError).toBe(false);
    const sc = result.structuredContent as Record<string, unknown>;
    expect(sc.command).toBe("receive");
    expect(sc.network).toBe("ethereum:main");
    expect(sc.verified).toBe(true);
    expect(sc.source).toBe("device");
    expect(String(sc.address).toLowerCase()).toBe(MOCK_ETH_ADDRESS.toLowerCase());

    // The on-device flow maps intermediate events (pre-verify + device-state) to
    // notifications/progress. There must be at least the address confirmation prompt and
    // the awaiting-approval transition, in monotonically increasing progress order.
    expect(result.progress.length).toBeGreaterThanOrEqual(2);
    const messages = result.progress.map(p => String(p.message ?? ""));
    expect(messages.some(m => m.includes(MOCK_ETH_ADDRESS))).toBe(true);
    expect(messages.some(m => m.includes("Review address on device"))).toBe(true);

    const progressValues = result.progress.map(p => p.progress);
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThan(progressValues[i - 1]);
    }
  });
});

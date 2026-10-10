import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { YAML } from "bun";
import { MockServer } from "../../testing/mock-server";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";
import { ETH_SYNC_ROUTES } from "../../testing/eth-sync-routes";
import { MOCK_ETH_ADDRESS } from "../../testing/constants";

// Smoke test against a live Speculos running the Ethereum app on localhost (`pnpm test:speculos`).
// The device is real; only the explorer and CAL HTTP calls are served by the mock server.
describe.skipIf(!process.env.SPECULOS_API_PORT)("account discover on Speculos", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("discovers an Ethereum account without USB hardware or user input", async () => {
    const fixture = makeSessionDir([]);
    try {
      const { stdout, stderr, exitCode } = await runCli(
        ["account", "discover", "--network", "ethereum", "--output", "json"],
        { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
      );

      expect(exitCode, `stderr: ${stderr}`).toBe(0);
      const data = JSON.parse(stdout);
      expect(data.command).toBe("account discover");
      expect(data.network).toBe("ethereum:main");
      expect(data.accounts.length).toBeGreaterThan(0);
      // Derived by the emulated Ethereum app, not handed back by the in-process mock.
      expect(data.accounts[0].freshAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(data.accounts[0].freshAddress.toLowerCase()).not.toBe(MOCK_ETH_ADDRESS.toLowerCase());

      const sessionPath = join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml");
      const session = YAML.parse(await Bun.file(sessionPath).text()) as {
        accounts: Array<{ descriptor: string }>;
      };
      expect(session.accounts[0]?.descriptor).toContain(":ethereum:");
    } finally {
      fixture.cleanup();
    }
  });
});

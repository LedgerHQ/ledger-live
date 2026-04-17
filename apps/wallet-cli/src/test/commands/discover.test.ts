import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

describe("account discover command (mock DMK)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: exits 0 and returns a discover envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
          Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
        }),
      },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("account discover");
    expect(data.network).toBe("ethereum:main");
    expect(Array.isArray(data.accounts)).toBe(true);
  });
});

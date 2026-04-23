import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

describe("receive --verify command (mock DMK)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: returns the verified address from mock device", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["receive", "--account", MOCK_ETH_DESCRIPTOR, "--verify", "--output", "json"],
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
    expect(data.command).toBe("receive");
    expect(data.network).toBe("ethereum:main");
    expect(typeof data.address).toBe("string");
    // The mock device returns our known address
    expect(data.address.toLowerCase()).toBe(MOCK_ETH_ADDRESS.toLowerCase());
  });
});

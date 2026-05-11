import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

describe("receive --verify command (mock DMK)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("json output: returns the verified address from mock device", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["receive", "--account", "ethereum-1", "--verify", "--output", "json"],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
          Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
        }),
        ...fixture.env,
      },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const lines = stdout.split("\n").map(line => JSON.parse(line));
    expect(lines[0]).toMatchObject({
      type: "device-state",
      command: "receive",
      network: "ethereum:main",
      state: { code: "awaiting_approval", reason: "verify_address" },
      message: "Review address on device. Approve or reject.",
    });

    const data = lines.at(-1);
    expect(data.command).toBe("receive");
    expect(data.network).toBe("ethereum:main");
    expect(lines[0].account).toBe(data.account);
    expect(typeof data.address).toBe("string");
    // The mock device returns our known address
    expect(data.address.toLowerCase()).toBe(MOCK_ETH_ADDRESS.toLowerCase());
  });
});

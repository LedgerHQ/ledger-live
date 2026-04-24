import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

// Routes needed by prepareTransaction (gas estimation, nonce, fee data) in addition to sync.
// The balance route is placed first (before ETH_SYNC_ROUTES) so it overrides the default
// zero-balance route — the send command requires sufficient balance to avoid NotEnoughBalance.
const SEND_ROUTES = [
  {
    method: "GET",
    match: /\/address\/[^/]+\/balance$/,
    response: { balance: "1000000000000000000" }, // 1 ETH
  },
  ...ETH_SYNC_ROUTES,
  {
    method: "GET",
    match: /\/address\/[^/]+\/nonce$/,
    response: { address: MOCK_ETH_ADDRESS, nonce: 0 },
  },
  {
    method: "POST",
    match: /\/tx\/estimate-gas-limit/,
    response: { estimated_gas_limit: "21000" },
  },
  {
    method: "GET",
    match: /\/gastracker\/barometer/,
    response: { low: "1", medium: "2", high: "3", next_base: "1" },
  },
];

describe("send --dry-run command", () => {
  const server = new MockServer(SEND_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: exits 0 and returns a dry-run send envelope for ETH", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "send",
        "--account",
        MOCK_ETH_DESCRIPTOR,
        "--to",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "--amount",
        "0.001 ETH",
        "--dry-run",
        "--output",
        "json",
      ],
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
    expect(data.command).toBe("send");
    expect(data.network).toBe("ethereum:main");
    expect(data.dry_run).toBe(true);
    expect(typeof data.recipient).toBe("string");
    expect(typeof data.amount).toBe("string");
    expect(typeof data.fee).toBe("string");
  });
});

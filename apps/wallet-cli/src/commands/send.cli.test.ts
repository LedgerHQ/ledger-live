import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../testing/mock-server";
import { runCli } from "../testing/cli-runner";
import { makeSessionDir } from "../testing/session-fixture";
import { ETH_SYNC_ROUTES } from "../testing/eth-sync-routes";
import {
  MOCK_ETH_DESCRIPTOR,
  MOCK_ETH_ADDRESS,
  MOCK_ETH_PUBKEY,
  MOCK_XRP_DESCRIPTOR,
} from "../testing/constants";

// Routes needed by prepareTransaction (gas estimation, nonce, fee data) in addition to sync.
// The balance route is placed first (before ETH_SYNC_ROUTES) so it overrides the default
// zero-balance route — the send command requires sufficient balance to avoid NotEnoughBalance.
// The root POST route serves the XRPL JSON-RPC calls used by the XRP sync and preparation flow.
const SEND_ROUTES = [
  {
    method: "POST",
    match: /^\/$/,
    response: {},
    onRequest: async (request: Request) => {
      const { method } = (await request.json()) as { method?: string };
      if (method === "account_info") {
        return Response.json({
          result: {
            status: "success",
            account_data: { Balance: "1000000000", OwnerCount: 0, Sequence: 1 },
          },
        });
      }
      if (method === "server_info") {
        return Response.json({
          result: {
            info: {
              complete_ledgers: "1-20000000",
              validated_ledger: {
                base_fee_xrp: 0.00001,
                reserve_base_xrp: 10,
                reserve_inc_xrp: 2,
              },
            },
          },
        });
      }
      if (method === "ledger") {
        return Response.json({
          result: {
            ledger_index: 20_000_000,
            ledger: {
              ledger_hash: "0xmock-ledger-hash",
              close_time_iso: "2024-01-01T00:00:00.000Z",
            },
          },
        });
      }
      if (method === "account_tx") {
        return Response.json({ result: { transactions: [], marker: undefined } });
      }
      return Response.json({ result: {} });
    },
  },
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

describe("send (non-dry-run): device model resolution", () => {
  const server = new MockServer([]);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("exits with a clear error when deviceModelId cannot be resolved from the DMK session", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      [
        "send",
        "--account",
        "ethereum-1",
        "--to",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "--amount",
        "0.001 ETH",
        "--output",
        "json",
      ],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_DMK_STATE: "no-device-model",
        WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
          Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
        }),
        ...fixture.env,
      },
    );
    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Could not determine device model");
  });
});

describe("send --dry-run command", () => {
  const server = new MockServer(SEND_ROUTES);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("json output: exits 0 and returns a dry-run send envelope for ETH", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      [
        "send",
        "--account",
        "ethereum-1",
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
        ...fixture.env,
      },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("send");
    expect(data.network).toBe("ethereum");
    expect(data.dry_run).toBe(true);
    expect(typeof data.recipient).toBe("string");
    expect(typeof data.amount).toBe("string");
    expect(typeof data.fee).toBe("string");
  });

  it("json output: preserves an XRP destination tag in a dry-run send", async () => {
    const fixture = makeSessionDir([{ label: "ripple-1", descriptor: MOCK_XRP_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      [
        "send",
        "--account",
        "ripple-1",
        "--to",
        "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3",
        "--amount",
        "1 XRP",
        "--destination-tag",
        "123",
        "--dry-run",
        "--output",
        "json",
      ],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        ...fixture.env,
      },
    );
    expect(exitCode, `stdout: ${stdout}\nstderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("send");
    expect(data.network).toBe("ripple");
    expect(data.dry_run).toBe(true);
    expect(data.destination_tag).toBe(123);
  });
});

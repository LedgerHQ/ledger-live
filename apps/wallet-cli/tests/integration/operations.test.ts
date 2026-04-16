import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_DESCRIPTOR, ETH_ADDRESS } from "../helpers/constants";

const CURRENT_BLOCK = {
  hash: "0xblock1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  height: 20_000_000,
  time: "2024-06-15T12:00:00.000Z",
  txs: [],
};

const ONE_ETH_OUT_TX = {
  hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  transaction_type: 2,
  nonce: "0x5",
  nonce_value: 5,
  value: "100000000000000000", // 0.1 ETH
  gas: "21000",
  gas_price: "20000000000", // 20 Gwei
  max_fee_per_gas: "30000000000",
  max_priority_fee_per_gas: "1000000000",
  from: ETH_ADDRESS,
  to: "0xc79c7a29c40Ce8F5746af2c956F93F27e2820307",
  transfer_events: [],
  erc721_transfer_events: [],
  erc1155_transfer_events: [],
  approval_events: [],
  actions: [],
  confirmations: 500,
  input: null,
  gas_used: "21000",
  cumulative_gas_used: "21000",
  status: 1,
  received_at: "2024-06-15T12:00:00.000Z",
  block: {
    hash: "0xblock1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    height: 20_000_000,
    time: "2024-06-15T12:00:00.000Z",
  },
};

// Common routes needed by the bridge sync (getAccountShape):
//   lastBlock → /block/current
//   getBalance → /balance + /txs (token detection)
//   listOperations → /txs
//   getSyncHash → /v1/currencies (CAL client, getTokensSyncHash via getSyncHash())
function baseRoutes(txsFixture: object) {
  return [
    {
      method: "GET",
      match: /\/block\/current$/,
      response: CURRENT_BLOCK,
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/balance$/,
      response: { address: ETH_ADDRESS, balance: "0" },
    },
    {
      method: "GET",
      match: /\/address\/[^/]+\/txs/,
      response: txsFixture,
    },
    {
      method: "POST",
      match: /erc20\/balances/,
      response: [],
    },
    // getSyncHash (via getTokensSyncHash): must return non-empty array + X-Ledger-Commit header
    // otherwise the store throws LedgerAPI4xx (empty array → status 404 → remapRtkQueryError)
    {
      method: "GET",
      match: /\/v1\/currencies/,
      response: [{ id: "ethereum" }],
      headers: { "X-Ledger-Commit": "mock-sync-hash-0000000000000000" },
    },
  ];
}

describe("operations command — empty history", () => {
  const server = new MockServer(baseRoutes({ data: [], token: null }));

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: returns empty operations array", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["operations", "--account", ETH_DESCRIPTOR, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("operations");
    expect(data.network).toBe("ethereum:main");
    expect(Array.isArray(data.operations)).toBe(true);
    expect(data.operations.length).toBe(0);
  });
});

describe("operations command — one OUT transaction", () => {
  const server = new MockServer(baseRoutes({ data: [ONE_ETH_OUT_TX], token: null }));

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: returns one OUT operation", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["operations", "--account", ETH_DESCRIPTOR, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("operations");
    expect(Array.isArray(data.operations)).toBe(true);
    expect(data.operations.length).toBeGreaterThanOrEqual(1);

    const op = data.operations[0];
    expect(op.type).toBe("OUT");
    expect(op.hash).toBe(ONE_ETH_OUT_TX.hash);
    expect(op.senders).toContain(ETH_ADDRESS);
  });
});

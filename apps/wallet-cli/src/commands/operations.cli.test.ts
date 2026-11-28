import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../testing/mock-server";
import { runCli } from "../testing/cli-runner";
import { makeSessionDir } from "../testing/session-fixture";
import { ETH_DESCRIPTOR, ETH_ADDRESS } from "../testing/constants";

const CURRENT_BLOCK = {
  hash: "0xblock1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  height: 20_000_000,
  time: "2024-06-15T12:00:00.000Z",
  txs: [],
};

const POINT_ONE_ETH_OUT_TX = {
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
//   getSyncHash → /v1/networks + /v1/currencies (CAL client, getTokensSyncHash via getSyncHash())
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
    // getSyncHash (via getTokensSyncHash): the token list hash route must return a non-empty
    // array, otherwise the store throws LedgerAPI4xx (empty array → status 404 → remapRtkQueryError).
    // The commit route feeds the token cache validation.
    {
      method: "GET",
      match: /\/v1\/networks/,
      response: [{ id: "ethereum", token_list_hash: "mock-sync-hash-0000000000000000" }],
    },
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

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("json output: returns empty operations array", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["operations", "--account", "ethereum-1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("operations");
    expect(data.network).toBe("ethereum");
    expect(Array.isArray(data.operations)).toBe(true);
    expect(data.operations.length).toBe(0);
    expect(data.nextCursor).toBeNull();
  });
});

describe("operations command — one OUT transaction", () => {
  const server = new MockServer(baseRoutes({ data: [POINT_ONE_ETH_OUT_TX], token: null }));

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("json output: returns one OUT operation", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      ["operations", "--account", "ethereum-1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("operations");
    expect(Array.isArray(data.operations)).toBe(true);
    expect(data.operations.length).toBeGreaterThanOrEqual(1);

    const op = data.operations[0];
    expect(op.type).toBe("OUT");
    expect(op.hash).toBe(POINT_ONE_ETH_OUT_TX.hash);
    expect(op.senders).toContain(ETH_ADDRESS);
  });
});

function outTx(nonce: number, time: string) {
  const hash = `0x${String(nonce).padStart(64, "0")}`;
  return {
    ...POINT_ONE_ETH_OUT_TX,
    hash,
    nonce: `0x${nonce.toString(16)}`,
    nonce_value: nonce,
    received_at: time,
    block: { hash: `0xblock${hash.slice(2)}`, height: 19_000_000 + nonce, time },
  };
}

describe("operations command — history longer than --limit", () => {
  const txs = [
    outTx(3, "2024-06-03T12:00:00.000Z"),
    outTx(2, "2024-06-02T12:00:00.000Z"),
    outTx(1, "2024-06-01T12:00:00.000Z"),
  ];
  const server = new MockServer(baseRoutes({ data: txs, token: null }));

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  async function operationsJson(extraArgs: string[]) {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const result = await runCli(
      ["operations", "--account", "ethereum-1", "--output", "json", ...extraArgs],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    sessionCleanup();
    sessionCleanup = undefined;
    return { ...result, data: JSON.parse(result.stdout) };
  }

  it("json output: pages through the history with nextCursor, ending on null", async () => {
    const first = await operationsJson(["--limit", "2"]);
    expect(first.exitCode, `stderr: ${first.stderr}`).toBe(0);
    expect(first.data.operations.map((op: { hash: string }) => op.hash)).toEqual([
      txs[0].hash,
      txs[1].hash,
    ]);
    expect(first.data.nextCursor).toEqual(expect.any(String));

    const second = await operationsJson(["--limit", "2", "--cursor", first.data.nextCursor]);
    expect(second.exitCode, `stderr: ${second.stderr}`).toBe(0);
    expect(second.data.operations.map((op: { hash: string }) => op.hash)).toEqual([txs[2].hash]);
    expect(second.data.nextCursor).toBeNull();
  });

  it("human output: prints nextCursor on stderr only while more operations exist", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const env = { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env };

    const first = await runCli(["operations", "--account", "ethereum-1", "--limit", "2"], env);
    expect(first.exitCode, `stderr: ${first.stderr}`).toBe(0);
    expect(first.stderr).toContain("nextCursor: ");

    const last = await runCli(["operations", "--account", "ethereum-1", "--limit", "3"], env);
    expect(last.exitCode, `stderr: ${last.stderr}`).toBe(0);
    expect(last.stderr).not.toContain("nextCursor");
  });

  it("json output: an unknown cursor exits with code 1", async () => {
    const { exitCode, data } = await operationsJson(["--limit", "2", "--cursor", "not-a-cursor"]);
    expect(exitCode).toBe(1);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("InvalidOperationsCursorError");
  });
});

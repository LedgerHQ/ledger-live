/**
 * Tests for the GraphQL transport branch of `sdk.ts`.
 *
 * These cover the routing introduced as part of the JSON-RPC → GraphQL
 * migration (see PR1 of the 2026-07-31 sunset plan):
 *   - `isGraphQLEndpoint` URL detection
 *   - `getAllBalancesCached` taking the GraphQL path when `node.url` is a
 *     GraphQL endpoint, including pagination and SIP-58 field remapping
 *     (`addressBalance` → `fundsInAddressBalance`)
 *   - `getLastBlock` issuing the typed CHECKPOINT queries and producing the
 *     same shape the JSON-RPC path produces
 *   - `getCheckpoint(seqNumber)` happy path
 *   - `getCheckpoint(digest)` rejecting with a clear error
 *
 * The existing `sdk.test.ts` exercises the JSON-RPC branch and is kept
 * separate so the two clients' mocks don't collide.
 */
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import coinConfig from "../config";

const GRAPHQL_URL = "https://graphql.mainnet.sui.io/graphql";

type MockGraphQLClient = {
  query: jest.Mock;
  listBalances: jest.Mock;
};

// JSON-RPC stays mocked too so any leak (caller hitting JSON-RPC when it
// should hit GraphQL) fails loudly via `unexpectedJsonRpc`.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC client invoked on GraphQL test path");
});

jest.mock("@mysten/sui/graphql", () => ({
  SuiGraphQLClient: jest.fn(),
}));

jest.mock("@mysten/sui/jsonRpc", () => ({
  ...jest.requireActual("@mysten/sui/jsonRpc"),
  SuiJsonRpcClient: jest.fn().mockImplementation(() => ({
    getAllBalances: unexpectedJsonRpc,
    getCheckpoint: unexpectedJsonRpc,
    getLatestCheckpointSequenceNumber: unexpectedJsonRpc,
  })),
  getJsonRpcFullnodeUrl: jest.fn().mockReturnValue("https://mockapi.sui.io"),
}));

// Imports of the module under test must come AFTER `jest.mock` calls so the
// module sees the mocked clients.
// eslint-disable-next-line import/first
import {
  isGraphQLEndpoint,
  getAllBalancesCached,
  getLastBlock,
  getCheckpoint,
} from "./sdk";

const SuiGraphQLClientMock = SuiGraphQLClient as unknown as jest.Mock;

/**
 * Set up the next `new SuiGraphQLClient(...)` call to return a stub with the
 * given method implementations. Returns the stub so assertions can read its
 * call history. Each test should call this exactly once before it triggers
 * the SDK code path.
 */
function mockNextGraphQLClient(impl: Partial<MockGraphQLClient> = {}): MockGraphQLClient {
  const client: MockGraphQLClient = {
    query: impl.query ?? jest.fn(),
    listBalances: impl.listBalances ?? jest.fn(),
  };
  SuiGraphQLClientMock.mockImplementationOnce(() => client);
  return client;
}

beforeEach(() => {
  SuiGraphQLClientMock.mockReset();
  unexpectedJsonRpc.mockClear();
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_URL },
    status: { type: "active" },
  }));
});

describe("isGraphQLEndpoint", () => {
  test.each([
    ["https://graphql.mainnet.sui.io/graphql", true],
    ["https://graphql.testnet.sui.io/graphql", true],
    ["https://graphql.example.com/graphql/", true],
    ["https://example.com/api/graphql?token=x", true],
    ["https://fullnode.mainnet.sui.io:443/", false],
    ["https://example.com/jsonrpc", false],
    ["", false],
  ])("isGraphQLEndpoint(%p) === %p", (url, expected) => {
    expect(isGraphQLEndpoint(url)).toBe(expected);
  });
});

describe("getAllBalancesCached on GraphQL transport", () => {
  test("calls listBalances and remaps addressBalance to fundsInAddressBalance", async () => {
    const client = mockNextGraphQLClient({
      listBalances: jest.fn().mockResolvedValueOnce({
        balances: [
          {
            coinType: "0x2::sui::SUI",
            balance: "1000000000",
            coinBalance: "600000000",
            addressBalance: "400000000",
          },
          {
            coinType: "0x9::usdc::USDC",
            balance: "500000",
            coinBalance: "500000",
            addressBalance: "0",
          },
        ],
        hasNextPage: false,
        cursor: null,
      }),
    });

    const owner = "0x" + "11".repeat(32);
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-1");

    expect(result).toEqual([
      {
        coinType: "0x2::sui::SUI",
        coinObjectCount: 0,
        totalBalance: "1000000000",
        lockedBalance: {},
        fundsInAddressBalance: "400000000",
      },
      {
        coinType: "0x9::usdc::USDC",
        coinObjectCount: 0,
        totalBalance: "500000",
        lockedBalance: {},
        fundsInAddressBalance: "0",
      },
    ]);
    expect(client.listBalances).toHaveBeenCalledTimes(1);
    expect(client.listBalances).toHaveBeenCalledWith({ owner, cursor: null });
    expect(unexpectedJsonRpc).not.toHaveBeenCalled();
  });

  test("paginates through BalanceConnection until hasNextPage is false", async () => {
    const listBalances = jest
      .fn()
      .mockResolvedValueOnce({
        balances: [
          { coinType: "0xA::a::A", balance: "1", coinBalance: "1", addressBalance: "0" },
        ],
        hasNextPage: true,
        cursor: "cursor1",
      })
      .mockResolvedValueOnce({
        balances: [
          { coinType: "0xB::b::B", balance: "2", coinBalance: "2", addressBalance: "0" },
        ],
        hasNextPage: false,
        cursor: null,
      });
    mockNextGraphQLClient({ listBalances });

    const owner = "0x" + "22".repeat(32);
    const result = await getAllBalancesCached(owner, "sui-graphql-balance-pagination");

    expect(result).toHaveLength(2);
    expect(result.map(b => b.coinType)).toEqual(["0xA::a::A", "0xB::b::B"]);
    expect(listBalances).toHaveBeenCalledTimes(2);
    expect(listBalances).toHaveBeenNthCalledWith(1, { owner, cursor: null });
    expect(listBalances).toHaveBeenNthCalledWith(2, { owner, cursor: "cursor1" });
  });
});

describe("getLastBlock on GraphQL transport", () => {
  test("queries latest checkpoint then resolves digest+timestamp via sequence", async () => {
    const isoTimestamp = "2026-04-01T12:34:56.789Z";
    const query = jest
      .fn()
      // 1. LATEST_CHECKPOINT_SEQUENCE
      .mockResolvedValueOnce({
        data: { checkpoint: { sequenceNumber: "12345" } },
      })
      // 2. CHECKPOINT_BY_SEQUENCE
      .mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "AbCdEfDigestZ",
            sequenceNumber: "12345",
            timestamp: isoTimestamp,
            networkTotalTransactions: "1000",
            previousCheckpointDigest: null,
            epoch: { epochId: "42" },
          },
        },
      });
    mockNextGraphQLClient({ query });

    const result = await getLastBlock("sui-graphql-last-block");

    expect(result).toEqual({
      digest: "AbCdEfDigestZ",
      sequenceNumber: "12345",
      timestampMs: String(new Date(isoTimestamp).getTime()),
    });
    expect(query).toHaveBeenCalledTimes(2);
    // First call has no variables, second carries the sequenceNumber
    expect(query.mock.calls[1][0].variables).toEqual({ sequenceNumber: "12345" });
  });
});

describe("getCheckpoint on GraphQL transport", () => {
  test("sequence-number lookup happy path", async () => {
    const isoTimestamp = "2026-05-01T00:00:00.000Z";
    const query = jest.fn().mockResolvedValueOnce({
      data: {
        checkpoint: {
          digest: "DigestForSeq99",
          sequenceNumber: "99",
          timestamp: isoTimestamp,
          networkTotalTransactions: "1",
          previousCheckpointDigest: null,
          epoch: { epochId: "1" },
        },
      },
    });
    mockNextGraphQLClient({ query });

    const result = await getCheckpoint("99", "sui-graphql-checkpoint-1");

    expect(result.digest).toBe("DigestForSeq99");
    expect(result.sequenceNumber).toBe("99");
    expect(result.timestampMs).toBe(String(new Date(isoTimestamp).getTime()));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0].variables).toEqual({ sequenceNumber: "99" });
  });

  test("digest lookup throws a clear error on GraphQL endpoint", async () => {
    // 32-byte digest, base58-ish — anything non-numeric.
    const digest = "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt";
    await expect(getCheckpoint(digest, "sui-graphql-checkpoint-2")).rejects.toThrow(
      /digest-based lookups are not supported on the GraphQL transport/i,
    );
    // No GraphQL client should have been instantiated since the guard
    // throws before withGraphQLApi runs.
    expect(SuiGraphQLClientMock).not.toHaveBeenCalled();
  });

  test("propagates GraphQL errors with a descriptive message", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "Checkpoint out of available range" }],
    });
    mockNextGraphQLClient({ query });

    await expect(getCheckpoint("9999999", "sui-graphql-checkpoint-3")).rejects.toThrow(
      /Checkpoint out of available range/,
    );
  });
});

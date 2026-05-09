import { JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";
import { createSuiGraphQLClient } from "./graphql/client";
import coinConfig from "../config";
import { fetcher } from "./fetcher";
import { GRAPHQL_MAINNET_URL } from "./graphql/constants";
import {
  getAllBalancesCached,
  getBlock,
  getBlockInfo,
  getCheckpoint,
  isGraphQLEnabled,
  withApi,
} from "./sdk";
import { withGraphQLApi } from "./sdk.graphql";
import { bindMockNextGraphQLClient, fakeBalancesPage } from "./sdk.graphql.fixtures";

// JSON-RPC stays mocked — any caller leaking onto it fails loudly via this proxy.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC client invoked on GraphQL test path");
});

jest.mock("./graphql/client", () => ({
  createSuiGraphQLClient: jest.fn(),
}));

jest.mock("@mysten/sui/jsonRpc", () => ({
  ...jest.requireActual("@mysten/sui/jsonRpc"),
  // Captures the `{ url }` arg so the dual-URL routing test can assert it.
  JsonRpcHTTPTransport: jest.fn(),
  SuiJsonRpcClient: jest.fn().mockImplementation(
    () =>
      new Proxy(
        {},
        {
          get: (_t, prop) => {
            if (typeof prop === "symbol" || prop === "then") return undefined;
            return unexpectedJsonRpc;
          },
        },
      ),
  ),
  getJsonRpcFullnodeUrl: jest.fn().mockReturnValue("https://mockapi.sui.io"),
}));

const factoryMock = createSuiGraphQLClient as unknown as jest.Mock;
const JsonRpcHTTPTransportMock = JsonRpcHTTPTransport as unknown as jest.Mock;
const mockNext = bindMockNextGraphQLClient(factoryMock);

beforeEach(() => {
  factoryMock.mockReset();
  JsonRpcHTTPTransportMock.mockReset();
  unexpectedJsonRpc.mockClear();
  coinConfig.setCoinConfig(() => ({
    node: { url: "https://mockapi.sui.io", graphqlUrl: GRAPHQL_MAINNET_URL },
    status: { type: "active" },
    features: { graphql: true },
  }));
});

// ---- isGraphQLEnabled: feature-flag plumbing ----

describe("isGraphQLEnabled", () => {
  it("should return true when features.graphql === true", () => {
    coinConfig.setCoinConfig(() => ({
      node: { url: "https://mockapi.sui.io", graphqlUrl: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: true },
    }));
    expect(isGraphQLEnabled()).toBe(true);
  });

  it("should return false when features.graphql === false", () => {
    coinConfig.setCoinConfig(() => ({
      node: { url: "https://mockapi.sui.io", graphqlUrl: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: false },
    }));
    expect(isGraphQLEnabled()).toBe(false);
  });

  it("should treat the feature flag as the single source of truth, not node.url", () => {
    // Even with a GraphQL-shaped URL, the flag-off path should report false.
    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL, graphqlUrl: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: false },
    }));
    expect(isGraphQLEnabled()).toBe(false);
  });
});

// ---- unwrapGraphQL: response-envelope error handling ----

describe("unwrapGraphQL: error envelope handling", () => {
  it("should join every errors[i].message into the thrown message", async () => {
    // GIVEN
    const query = jest.fn().mockResolvedValueOnce({
      errors: [
        { message: "first thing went wrong" },
        { message: "second thing went wrong" },
        { message: "third thing went wrong" },
      ],
    });
    mockNext({ query });

    // WHEN / THEN
    await expect(getCheckpoint("99", "sui-graphql-errors-aggregate")).rejects.toThrow(
      /first thing went wrong; second thing went wrong; third thing went wrong/,
    );
  });

  it("should throw 'no data' when the response has neither data nor errors", async () => {
    // GIVEN
    const query = jest.fn().mockResolvedValueOnce({});
    mockNext({ query });

    // WHEN / THEN
    await expect(getCheckpoint("99", "sui-graphql-errors-no-data")).rejects.toThrow(
      /CheckpointBySequence failed: no data/,
    );
  });
});

// ---- SuiAddress normalisation ----

describe("SuiAddress normalisation at GraphQL entry points", () => {
  // The GraphQL `SuiAddress!` scalar requires full 32-byte canonical form.
  test.each([
    {
      name: "pad short addresses to canonical 32-byte form",
      input: "0x1",
      expected: "0x" + "0".repeat(63) + "1",
      key: "sui-graphql-norm-1",
    },
    {
      name: "lowercase mixed-case addresses",
      input: "0xABCDEF" + "0".repeat(58),
      expected: ("0xABCDEF" + "0".repeat(58)).toLowerCase(),
      key: "sui-graphql-norm-2",
    },
  ])("should $name before querying", async ({ input, expected, key }) => {
    const query = jest.fn().mockResolvedValueOnce(fakeBalancesPage([]));
    mockNext({ query });
    await getAllBalancesCached(input, key);
    expect(query.mock.calls[0][0].variables).toEqual({ owner: expected, cursor: null });
  });
});

// ---- fetcher: retry + per-attempt timeout cleanup ----

describe("fetcher: retry behaviour", () => {
  let originalFetch: typeof fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should retry up to the budget when the fetch keeps failing", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("network error 1"))
      .mockRejectedValueOnce(new TypeError("network error 2"))
      .mockRejectedValueOnce(new TypeError("network error 3"));

    await expect(fetcher("https://endpoint/graphql", { method: "POST" })).rejects.toThrow(
      /network error/,
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("should not leak per-attempt timeouts across the retry chain", async () => {
    // GIVEN — fail twice, succeed on the third attempt.
    jest.useFakeTimers();
    try {
      mockFetch
        .mockRejectedValueOnce(new TypeError("network 1"))
        .mockRejectedValueOnce(new TypeError("network 2"))
        .mockResolvedValueOnce(new Response("ok"));

      // WHEN — drive the full chain (initial + 2 backoffs + 2 retries).
      const pending = fetcher("https://endpoint/graphql", { method: "POST" });
      await jest.runAllTimersAsync();
      await pending;

      // THEN — every attempt's per-fetch timeout must have been cleared.
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

// ---- dual-URL routing invariant ----
//
// Locks in the round-1 architectural fix: `withApi` (build path) MUST read `node.url`
// (JSON-RPC fullnode) and `withGraphQLApi` MUST read `node.graphqlUrl`, regardless of
// `features.graphql`. A future config refactor that conflated the two would silently
// reintroduce the original `paymentInfo` failure documented in `sdk.migration.integ.test.ts`.

describe("dispatcher dual-URL routing", () => {
  const JSON_RPC_URL = "https://json-rpc.example.test";
  const GRAPHQL_URL = "https://graphql.example.test/graphql";

  beforeEach(() => {
    coinConfig.setCoinConfig(() => ({
      node: { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_URL },
      status: { type: "active" },
      features: { graphql: true },
    }));
  });

  it("withApi reads node.url even when features.graphql is true", async () => {
    // GIVEN
    const captured = jest.fn();

    // WHEN
    await withApi(async () => {
      captured();
      return null;
    });

    // THEN
    expect(captured).toHaveBeenCalledTimes(1);
    expect(JsonRpcHTTPTransportMock).toHaveBeenCalledTimes(1);
    expect(JsonRpcHTTPTransportMock.mock.calls[0][0]).toMatchObject({ url: JSON_RPC_URL });
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("withGraphQLApi reads node.graphqlUrl, not node.url", async () => {
    // GIVEN
    const captured = jest.fn();
    mockNext();

    // WHEN
    await withGraphQLApi(async () => {
      captured();
      return null;
    });

    // THEN
    expect(captured).toHaveBeenCalledTimes(1);
    expect(factoryMock).toHaveBeenCalledTimes(1);
    expect(factoryMock.mock.calls[0][0]).toMatchObject({ url: GRAPHQL_URL });
    expect(JsonRpcHTTPTransportMock).not.toHaveBeenCalled();
  });
});

// ---- getBlock / getBlockInfo: digest input routes to JSON-RPC even with GraphQL on ----
//
// GraphQL's `checkpoint(sequenceNumber:)` field doesn't accept digests. To preserve the
// public contract of accepting either form, digest inputs must fall back to JSON-RPC
// instead of throwing. These tests pin that routing so a regression flips loudly.

describe("getBlock/getBlockInfo digest routing", () => {
  beforeEach(() => {
    coinConfig.setCoinConfig(() => ({
      node: { url: "https://mockapi.sui.io", graphqlUrl: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: true },
    }));
  });

  it("getBlockInfo with a digest input never constructs a GraphQL client (routes to JSON-RPC)", async () => {
    // 44-char base58-ish digest; not numeric, so isSequenceNumber returns false.
    const digest = "5f7c9b3a2e1d0c4b6f8a9e2d1c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b";
    await expect(getBlockInfo(digest)).rejects.toThrow();
    // GraphQL client must NOT have been created — JSON-RPC arm took over.
    expect(factoryMock).not.toHaveBeenCalled();
    // JSON-RPC transport WAS constructed (then the mocked SuiJsonRpcClient throws on any call).
    expect(JsonRpcHTTPTransportMock).toHaveBeenCalled();
  });

  it("getBlock with a digest input never constructs a GraphQL client (routes to JSON-RPC)", async () => {
    const digest = "5f7c9b3a2e1d0c4b6f8a9e2d1c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b";
    await expect(getBlock(digest)).rejects.toThrow();
    expect(factoryMock).not.toHaveBeenCalled();
    expect(JsonRpcHTTPTransportMock).toHaveBeenCalled();
  });

  it("getBlockInfo with a sequence number constructs a GraphQL client (flag on)", async () => {
    mockNext({
      query: jest.fn().mockResolvedValueOnce({
        data: {
          checkpoint: {
            digest: "0xdgst",
            sequenceNumber: 42,
            timestamp: "2026-01-01T00:00:00Z",
            previousCheckpointDigest: null,
          },
        },
      }),
    });
    const out = await getBlockInfo("42");
    expect(factoryMock).toHaveBeenCalled();
    expect(out.hash).toBe("0xdgst");
  });

  it("isSequenceNumber rejects 16+ digit numerics above 2^53-1", async () => {
    // 17-digit number — Number(id) would silently lose precision; must route to JSON-RPC.
    const bigNumeric = "99999999999999999";
    await expect(getBlockInfo(bigNumeric)).rejects.toThrow();
    expect(factoryMock).not.toHaveBeenCalled();
    expect(JsonRpcHTTPTransportMock).toHaveBeenCalled();
  });
});

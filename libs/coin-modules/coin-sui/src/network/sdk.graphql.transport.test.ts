import { createSuiGraphQLClient } from "./graphql/client";
import { createSuiGrpcClient } from "./grpc/client";
import type { SuiCoinConfig } from "../config";

const config = {
  node: {
    graphqlUrl: "https://mockapi.sui.io/graphql",
    grpcUrl: "https://mockapi.sui.io",
  },
  status: { type: "active" },
  features: { transport: "graphql" },
} as unknown as SuiCoinConfig;
import { fetcher } from "./fetcher";
import { GRAPHQL_MAINNET_URL } from "./graphql/constants";
import {
  getAllBalancesCached,
  getBlock,
  getBlockInfo,
  getCheckpoint,
  isGraphQLEnabled,
} from "./sdk";

/** Selects a transport through injected config; nothing reads module-level config any more. */
const configWith = (transport: "graphql" | "grpc"): SuiCoinConfig =>
  ({
    node: {
      graphqlUrl: GRAPHQL_MAINNET_URL,
      grpcUrl: "https://mockapi.sui.io",
    },
    status: { type: "active" },
    features: { transport },
  }) as unknown as SuiCoinConfig;
import { withGraphQLApi } from "./sdk.graphql";
import { withGrpcApi } from "./sdk.grpc";
import { bindMockNextGraphQLClient, fakeBalancesPage } from "./sdk.graphql.fixtures";

jest.mock("./graphql/client", () => ({
  createSuiGraphQLClient: jest.fn(),
}));

jest.mock("./grpc/client", () => ({
  createSuiGrpcClient: jest.fn(),
}));

const factoryMock = createSuiGraphQLClient as unknown as jest.Mock;
const grpcFactoryMock = createSuiGrpcClient as unknown as jest.Mock;
const mockNext = bindMockNextGraphQLClient(factoryMock);

beforeEach(() => {
  factoryMock.mockReset();
  grpcFactoryMock.mockReset();
});

// ---- isGraphQLEnabled: feature-flag plumbing ----

describe("isGraphQLEnabled", () => {
  it('should return true when features.transport === "graphql"', () => {
    expect(isGraphQLEnabled(configWith("graphql"))).toBe(true);
  });

  it('should return false when features.transport === "grpc"', () => {
    expect(isGraphQLEnabled(configWith("grpc"))).toBe(false);
  });

  it("should return false when features.transport is unset", () => {
    expect(isGraphQLEnabled({ ...configWith("grpc"), features: undefined } as never)).toBe(false);
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
    await expect(getCheckpoint(config, "99")).rejects.toThrow(
      /first thing went wrong; second thing went wrong; third thing went wrong/,
    );
  });

  it("should throw 'no data' when the response has neither data nor errors", async () => {
    // GIVEN
    const query = jest.fn().mockResolvedValueOnce({});
    mockNext({ query });

    // WHEN / THEN
    await expect(getCheckpoint(config, "99")).rejects.toThrow(
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
  ])("should $name before querying", async ({ input, expected }) => {
    const query = jest.fn().mockResolvedValueOnce(fakeBalancesPage([]));
    mockNext({ query });
    await getAllBalancesCached(config, input);
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

describe("fetcher: header forwarding", () => {
  let originalFetch: typeof fetch;
  let mockFetch: jest.Mock;

  const sentHeaders = () => new Headers(mockFetch.mock.calls[0][1].headers as HeadersInit);

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn().mockResolvedValue(new Response("ok"));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should stamp the client-version header", async () => {
    await fetcher("https://endpoint/graphql", { method: "POST" });

    expect(sentHeaders().get("X-Ledger-Client-Version")).toEqual(expect.any(String));
  });

  it("should forward plain-object headers", async () => {
    await fetcher("https://endpoint/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    expect(sentHeaders().get("content-type")).toBe("application/json");
  });

  // A spread of a `Headers` instance yields `{}`. The gRPC-web transport passes one, so
  // spreading silently stripped content-type and x-grpc-web and the node answered 400.
  it("should forward a Headers instance", async () => {
    await fetcher("https://endpoint/grpc", {
      method: "POST",
      headers: new Headers({
        "content-type": "application/grpc-web-text+proto",
        "x-grpc-web": "1",
      }),
    });

    expect(sentHeaders().get("content-type")).toBe("application/grpc-web-text+proto");
    expect(sentHeaders().get("x-grpc-web")).toBe("1");
  });
});

// ---- dual-URL routing invariant ----
//
// `withGrpcApi` MUST read `node.grpcUrl` and `withGraphQLApi` MUST read `node.graphqlUrl`,
// regardless of `features.transport`: the GraphQL arm's digest lookups reach gRPC through the former.

describe("dispatcher dual-URL routing", () => {
  const GRPC_URL = "https://grpc.example.test";
  const GRAPHQL_URL = "https://graphql.example.test/graphql";
  const dualConfig = {
    node: { grpcUrl: GRPC_URL, graphqlUrl: GRAPHQL_URL },
    status: { type: "active" },
    features: { transport: "graphql" },
  } as unknown as SuiCoinConfig;

  it('withGrpcApi reads node.grpcUrl even when features.transport is "graphql"', async () => {
    // GIVEN
    const captured = jest.fn();
    grpcFactoryMock.mockReturnValue({});

    // WHEN
    await withGrpcApi(dualConfig, async () => {
      captured();
      return null;
    });

    // THEN
    expect(captured).toHaveBeenCalledTimes(1);
    expect(grpcFactoryMock).toHaveBeenCalledTimes(1);
    expect(grpcFactoryMock.mock.calls[0][0]).toMatchObject({ url: GRPC_URL });
    expect(factoryMock).not.toHaveBeenCalled();
  });

  it("withGraphQLApi reads node.graphqlUrl, not node.grpcUrl", async () => {
    // GIVEN
    const captured = jest.fn();
    mockNext();

    // WHEN
    await withGraphQLApi(dualConfig, async () => {
      captured();
      return null;
    });

    // THEN
    expect(captured).toHaveBeenCalledTimes(1);
    expect(factoryMock).toHaveBeenCalledTimes(1);
    expect(factoryMock.mock.calls[0][0]).toMatchObject({ url: GRAPHQL_URL });
    expect(grpcFactoryMock).not.toHaveBeenCalled();
  });
});

// ---- getBlock / getBlockInfo: digest input routes to gRPC even with GraphQL on ----
//
// GraphQL's `checkpoint(sequenceNumber:)` field doesn't accept digests. To preserve the
// public contract of accepting either form, digest inputs fall back to gRPC instead of
// throwing. These tests pin that routing so a regression flips loudly.

describe("getBlock/getBlockInfo digest routing", () => {
  const digest = "5f7c9b3a2e1d0c4b6f8a9e2d1c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b";

  const stubGrpcCheckpoint = () => {
    const getCheckpoint = jest.fn().mockReturnValue({
      response: Promise.resolve({
        checkpoint: {
          digest: "cpDigest",
          sequenceNumber: 42n,
          summary: { timestamp: { seconds: 1_700_000_000n, nanos: 0 }, previousDigest: "cpParent" },
          transactions: [],
        },
      }),
    });
    grpcFactoryMock.mockReturnValue({ ledgerService: { getCheckpoint } });
    return getCheckpoint;
  };

  it("getBlockInfo with a digest input fetches the checkpoint over gRPC", async () => {
    // GIVEN
    const getCheckpoint = stubGrpcCheckpoint();

    // WHEN
    const info = await getBlockInfo(config, digest);

    // THEN
    expect(factoryMock).not.toHaveBeenCalled();
    expect(getCheckpoint.mock.calls[0][0].checkpointId).toEqual({ oneofKind: "digest", digest });
    expect(info).toEqual({
      height: 42,
      hash: "cpDigest",
      time: new Date(1_700_000_000_000),
      parent: { height: 41, hash: "cpParent" },
    });
  });

  it("getBlock with a digest input fetches the checkpoint over gRPC", async () => {
    // GIVEN
    const getCheckpoint = stubGrpcCheckpoint();

    // WHEN
    const block = await getBlock(config, digest);

    // THEN
    expect(factoryMock).not.toHaveBeenCalled();
    expect(getCheckpoint.mock.calls[0][0].checkpointId).toEqual({ oneofKind: "digest", digest });
    expect(block.info.hash).toBe("cpDigest");
    expect(block.transactions).toEqual([]);
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
    const out = await getBlockInfo(config, "42");
    expect(factoryMock).toHaveBeenCalled();
    expect(grpcFactoryMock).not.toHaveBeenCalled();
    expect(out.hash).toBe("0xdgst");
  });

  it("routes numerics above 2^53-1 to gRPC, which keeps their precision", async () => {
    // GIVEN — `Number(id)` would silently lose precision on GraphQL's UInt53.
    const getCheckpoint = stubGrpcCheckpoint();
    const bigNumeric = "99999999999999999";

    // WHEN
    await getBlockInfo(config, bigNumeric);

    // THEN
    expect(factoryMock).not.toHaveBeenCalled();
    expect(getCheckpoint.mock.calls[0][0].checkpointId).toEqual({
      oneofKind: "sequenceNumber",
      sequenceNumber: 99999999999999999n,
    });
  });
});

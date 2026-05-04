import { createSuiGraphQLClient } from "./graphql/client";
import coinConfig from "../config";
import { fetcher } from "./fetcher";
import { GRAPHQL_MAINNET_URL } from "./graphql/constants";
import { getAllBalancesCached, getCheckpoint, isGraphQLEnabled } from "./sdk";
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
const mockNext = bindMockNextGraphQLClient(factoryMock);

beforeEach(() => {
  factoryMock.mockReset();
  unexpectedJsonRpc.mockClear();
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_MAINNET_URL },
    status: { type: "active" },
    features: { graphql: true },
  }));
});

// ---- isGraphQLEnabled: feature-flag plumbing ----

describe("isGraphQLEnabled", () => {
  it("should return true when features.graphql === true", () => {
    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: true },
    }));
    expect(isGraphQLEnabled()).toBe(true);
  });

  it("should return false when features.graphql is missing or false", () => {
    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
    }));
    expect(isGraphQLEnabled()).toBe(false);

    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: false },
    }));
    expect(isGraphQLEnabled()).toBe(false);
  });

  it("should treat the feature flag as the single source of truth, not node.url", () => {
    // Even with a GraphQL-shaped URL, the flag-off path should report false.
    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
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

// ---- fetcher: caller-signal abort propagation ----

describe("fetcher: caller-signal abort propagation", () => {
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

  it("should not retry when the caller signal is aborted before the call lands", async () => {
    // GIVEN
    // Pre-aborted signal — `AbortSignal.any` makes fetch reject immediately,
    // and the catch handler must propagate rather than re-issue the request.
    mockFetch.mockRejectedValue(new DOMException("aborted by caller", "AbortError"));
    const controller = new AbortController();
    controller.abort(new DOMException("teardown", "AbortError"));

    // WHEN / THEN
    await expect(
      fetcher("https://endpoint/graphql", { signal: controller.signal }),
    ).rejects.toThrow(/aborted/i);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should retry up to the budget when the failure is not caller-driven", async () => {
    // GIVEN
    // Three rejections in a row — caller never aborts, so all retries fire.
    mockFetch
      .mockRejectedValueOnce(new TypeError("network error 1"))
      .mockRejectedValueOnce(new TypeError("network error 2"))
      .mockRejectedValueOnce(new TypeError("network error 3"));

    // WHEN / THEN
    await expect(fetcher("https://endpoint/graphql", { method: "POST" })).rejects.toThrow(
      /network error/,
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

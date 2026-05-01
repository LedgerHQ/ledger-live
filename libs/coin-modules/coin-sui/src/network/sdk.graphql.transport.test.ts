import { log } from "@ledgerhq/logs";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import coinConfig from "../config";
import { GRAPHQL_MAINNET_URL } from "./graphql/constants";
import { getAllBalancesCached, getValidators, isGraphQLEnabled } from "./sdk";
import { graphqlFetcher } from "./sdk.graphql";
import { bindMockNextGraphQLClient } from "./sdk.graphql.fixtures";

// JSON-RPC stays mocked — any caller leaking onto it fails loudly via this proxy.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC client invoked on GraphQL test path");
});

jest.mock("@mysten/sui/graphql", () => ({
  SuiGraphQLClient: jest.fn(),
}));

// Stubbed so `graphqlFetcher` log assertions can introspect call args.
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
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

const SuiGraphQLClientMock = SuiGraphQLClient as unknown as jest.Mock;
const mockNext = bindMockNextGraphQLClient(SuiGraphQLClientMock);

beforeEach(() => {
  SuiGraphQLClientMock.mockReset();
  unexpectedJsonRpc.mockClear();
  coinConfig.setCoinConfig(() => ({
    node: { url: GRAPHQL_MAINNET_URL },
    status: { type: "active" },
    features: { graphql: true },
  }));
});

// ---- isGraphQLEnabled: feature-flag plumbing ----

describe("isGraphQLEnabled", () => {
  test("returns true when features.graphql === true", () => {
    coinConfig.setCoinConfig(() => ({
      node: { url: GRAPHQL_MAINNET_URL },
      status: { type: "active" },
      features: { graphql: true },
    }));
    expect(isGraphQLEnabled()).toBe(true);
  });

  test("returns false when features.graphql is missing or false", () => {
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

  test("ignores the node.url heuristic — flag is the single source of truth", () => {
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
  test("aggregates ALL errors[i].message in the thrown message, not just errors[0]", async () => {
    const query = jest.fn().mockResolvedValueOnce({
      errors: [
        { message: "first thing went wrong" },
        { message: "second thing went wrong" },
        { message: "third thing went wrong" },
      ],
    });
    mockNext({ query });

    await expect(getValidators("sui-graphql-errors-aggregate")).rejects.toThrow(
      /first thing went wrong; second thing went wrong; third thing went wrong/,
    );
  });

  test("throws a clear 'no data' error when the response has neither data nor errors", async () => {
    const query = jest.fn().mockResolvedValueOnce({});
    mockNext({ query });

    await expect(getValidators("sui-graphql-errors-no-data")).rejects.toThrow(
      /SystemState failed: no data/,
    );
  });

  test("includes [reqId=...] in error message when graphqlFetcher stamps __requestId", async () => {
    // SuiGraphQLClient is mocked, so graphqlFetcher never runs here.
    // Simulate the stamp directly via `__requestId` in the response.
    const query = jest.fn().mockResolvedValueOnce({
      errors: [{ message: "boom" }],
      __requestId: "req-trace-abc",
    });
    mockNext({ query });

    await expect(getValidators("sui-graphql-errors-with-reqid")).rejects.toThrow(
      /\[reqId=req-trace-abc\].*boom/,
    );
  });

  test("includes [reqId=...] in 'no data' error too", async () => {
    const query = jest.fn().mockResolvedValueOnce({ __requestId: "req-trace-xyz" });
    mockNext({ query });

    await expect(getValidators("sui-graphql-errors-no-data-with-reqid")).rejects.toThrow(
      /SystemState failed \[reqId=req-trace-xyz\]: no data/,
    );
  });
});

// ---- SuiAddress normalisation ----

describe("SuiAddress normalisation at GraphQL entry points", () => {
  test("getAllBalancesCached pads short addresses to canonical 32-byte form before querying", async () => {
    const listBalances = jest.fn().mockResolvedValueOnce({
      balances: [],
      hasNextPage: false,
      cursor: null,
    });
    mockNext({ listBalances });

    // `0x1` is a short, valid Sui address; the GraphQL `SuiAddress!`
    // scalar requires full 32-byte canonical form.
    await getAllBalancesCached("0x1", "sui-graphql-norm-1");

    const expected = "0x" + "0".repeat(63) + "1";
    expect(listBalances).toHaveBeenCalledWith({ owner: expected, cursor: null });
  });

  test("getAllBalancesCached lowercases mixed-case addresses", async () => {
    const listBalances = jest.fn().mockResolvedValueOnce({
      balances: [],
      hasNextPage: false,
      cursor: null,
    });
    mockNext({ listBalances });

    const mixed = "0xABCDEF" + "0".repeat(58); // 64 hex chars after `0x`
    await getAllBalancesCached(mixed, "sui-graphql-norm-2");

    expect(listBalances).toHaveBeenCalledWith({
      owner: mixed.toLowerCase(),
      cursor: null,
    });
  });
});

// ---- graphqlFetcher: x-sui-rpc-request-id correlation ----

describe("graphqlFetcher: request-ID logging", () => {
  const logMock = log as unknown as jest.Mock;

  // SuiGraphQLClient is mocked elsewhere; only this block swaps the
  // real `global.fetch` for a stub to drive `graphqlFetcher` directly.
  let originalFetch: typeof fetch;
  let mockFetch: jest.Mock;

  // Body-peek is fire-and-forget — flush microtasks before asserting.
  const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    logMock.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("emits enriched log with first error message on 200 OK + errors[]", async () => {
    const headers = new Headers({ "x-sui-rpc-request-id": "req-200-with-errors" });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "Query out of available range" }] }), {
        status: 200,
        headers,
      }),
    );

    await graphqlFetcher("https://endpoint/graphql", { method: "POST", body: "{}" });
    await flushMicrotasks();

    const errorLog = logMock.mock.calls.find(
      c => c[1] === "(network/sdk): GraphQL response with errors",
    );
    expect(errorLog).toBeDefined();
    expect(errorLog?.[2]).toMatchObject({
      requestId: "req-200-with-errors",
      status: 200,
      errorCount: 1,
      firstError: "Query out of available range",
    });
  });

  test("counts every entry in errors[] (not just errors[0])", async () => {
    const headers = new Headers({ "x-sui-rpc-request-id": "req-multi-errors" });
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: "first" }, { message: "second" }, { message: "third" }],
        }),
        { status: 200, headers },
      ),
    );

    await graphqlFetcher("https://endpoint/graphql", { method: "POST", body: "{}" });
    await flushMicrotasks();

    const errorLog = logMock.mock.calls.find(
      c => c[1] === "(network/sdk): GraphQL response with errors",
    );
    expect(errorLog?.[2]).toMatchObject({ errorCount: 3, firstError: "first" });
  });

  test("does not emit the error variant on a clean 200 OK", async () => {
    const headers = new Headers({ "x-sui-rpc-request-id": "req-200-clean" });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { foo: "bar" } }), { status: 200, headers }),
    );

    await graphqlFetcher("https://endpoint/graphql", { method: "POST", body: "{}" });
    await flushMicrotasks();

    const errorLog = logMock.mock.calls.find(
      c => c[1] === "(network/sdk): GraphQL response with errors",
    );
    expect(errorLog).toBeUndefined();
  });

  test("logs request-ID synchronously on HTTP-level failure (no body peek)", async () => {
    const headers = new Headers({ "x-sui-rpc-request-id": "req-500" });
    mockFetch.mockResolvedValue(new Response("Internal Server Error", { status: 500, headers }));

    await graphqlFetcher("https://endpoint/graphql", { method: "POST", body: "{}" });
    // No microtask flush needed — HTTP-error path logs before returning.

    const httpLog = logMock.mock.calls.find(
      c =>
        c[1] === "(network/sdk): GraphQL response" && (c[2] as { status?: number })?.status === 500,
    );
    expect(httpLog).toBeDefined();
    expect((httpLog?.[2] as { requestId?: string }).requestId).toBe("req-500");
  });

  test("emits no log when the response has no x-sui-rpc-request-id header", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { foo: "bar" } }), { status: 200 }),
    );

    await graphqlFetcher("https://endpoint/graphql", { method: "POST", body: "{}" });
    await flushMicrotasks();

    const sdkLogs = logMock.mock.calls.filter(c => String(c[1] ?? "").startsWith("(network/sdk):"));
    expect(sdkLogs).toHaveLength(0);
  });
});

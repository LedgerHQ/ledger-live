import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

jest.mock("./converter", () => ({
  convertApiToken: jest.fn(),
}));

import { calApiExtra, calApi, CAL_REQUEST_TIMEOUT_MS } from "@shared/api-services";
import { convertApiToken } from "./converter";
import {
  cryptoAssetsApi,
  useGetTokensDataInfiniteQuery,
  useFindTokenByIdQuery,
  useFindTokenByAddressInCurrencyQuery,
  useGetTokensSyncHashQuery,
  useGetTokenListHashQuery,
} from "./api";
import { ApiResponseSchema } from "./schema";
import type { TokenByIdParams, TokenByAddressInCurrencyParams } from "./types";
import { mockApiTokenResponse, mockTokenCurrency } from "./fixtures";

const mockConvert = convertApiToken as jest.MockedFunction<typeof convertApiToken>;

beforeEach(() => {
  jest.clearAllMocks();
  mockConvert.mockReturnValue(mockTokenCurrency);
});

describe("ApiResponseSchema", () => {
  it("should validate an array of tokens", () => {
    const result = ApiResponseSchema.parse([mockApiTokenResponse]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockApiTokenResponse);
  });

  it("should validate an empty array", () => {
    expect(ApiResponseSchema.parse([])).toHaveLength(0);
  });

  it("should throw on a non-array payload", () => {
    expect(() => ApiResponseSchema.parse("not an array")).toThrow();
  });

  it("should throw on an invalid token structure", () => {
    expect(() => ApiResponseSchema.parse([{ invalid: "data" }])).toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidToken = { ...mockApiTokenResponse };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (invalidToken as any).id;
    expect(() => ApiResponseSchema.parse([invalidToken])).toThrow();
  });

  it("should validate a token with optional fields", () => {
    const result = ApiResponseSchema.parse([
      { ...mockApiTokenResponse, token_identifier: "some-identifier" },
    ]);
    expect(result[0].token_identifier).toBe("some-identifier");
  });

  it("should validate a token without optional fields", () => {
    const tokenWithoutOptionals = { ...mockApiTokenResponse };
    delete tokenWithoutOptionals.token_identifier;
    delete tokenWithoutOptionals.live_signature;
    const result = ApiResponseSchema.parse([tokenWithoutOptionals]);
    expect(result[0].token_identifier).toBeUndefined();
    expect(result[0].live_signature).toBeUndefined();
  });

  it("should throw when units is empty", () => {
    expect(() => ApiResponseSchema.parse([{ ...mockApiTokenResponse, units: [] }])).toThrow();
  });
});

describe("cryptoAssetsApi configuration", () => {
  it("should have the correct reducer path", () => {
    expect(cryptoAssetsApi.reducerPath).toBe("calApi");
  });

  it("is the CAL service api, mutated in place by injectEndpoints", () => {
    expect(cryptoAssetsApi).toBe(calApi);
  });

  it("should expose all five endpoints", () => {
    expect(cryptoAssetsApi.endpoints.findTokenById).toBeDefined();
    expect(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency).toBeDefined();
    expect(cryptoAssetsApi.endpoints.getTokensSyncHash).toBeDefined();
    expect(cryptoAssetsApi.endpoints.getTokenListHash).toBeDefined();
    expect(cryptoAssetsApi.endpoints.getTokensData).toBeDefined();
  });

  it("should export the generated hooks", () => {
    expect(useGetTokensDataInfiniteQuery).toBeDefined();
    expect(useFindTokenByIdQuery).toBeDefined();
    expect(useFindTokenByAddressInCurrencyQuery).toBeDefined();
    expect(useGetTokensSyncHashQuery).toBeDefined();
    expect(useGetTokenListHashQuery).toBeDefined();
  });
});

describe("param interfaces", () => {
  it("accepts TokenByIdParams", () => {
    const params: TokenByIdParams = { id: "ethereum/erc20/usdc" };
    expect(params.id).toBe("ethereum/erc20/usdc");
  });

  it("accepts TokenByAddressInCurrencyParams with and without token_identifier", () => {
    const a: TokenByAddressInCurrencyParams = {
      contract_address: "EGLD-123",
      network: "elrond",
      token_identifier: "MYTOKEN-abc123",
    };
    const b: TokenByAddressInCurrencyParams = {
      contract_address: "0xabc",
      network: "ethereum",
    };
    expect(a.token_identifier).toBe("MYTOKEN-abc123");
    expect(b.token_identifier).toBeUndefined();
  });
});

// Wired the way the apps wire it: the store registers the *service api*, and the endpoints only
// exist because importing this package injected them.
const makeStore = () =>
  configureStore({
    reducer: { [calApi.reducerPath]: calApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: calApiExtra({
            calServiceUrl: "https://cal.test",
            ledgerClientVersion: "1.2.3",
          }),
        },
      }).concat(calApi.middleware),
  });

const calEndpoints = {
  tokens: jest.fn(),
  currencies: jest.fn(),
  networks: jest.fn(),
  prefixedCurrencies: jest.fn(),
};
const server = setupServer(
  http.get("https://cal.test/v1/tokens", calEndpoints.tokens),
  http.get("https://cal.test/v1/currencies", calEndpoints.currencies),
  http.get("https://cal.test/v1/networks", calEndpoints.networks),
  http.get("https://global.api.prd.ledger.com/cal/v1/currencies", calEndpoints.prefixedCurrencies),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  calEndpoints.tokens.mockReset().mockImplementation(() => HttpResponse.json([]));
  calEndpoints.currencies.mockReset().mockImplementation(() => HttpResponse.json([]));
  calEndpoints.networks.mockReset().mockImplementation(() => HttpResponse.json([]));
  calEndpoints.prefixedCurrencies.mockReset().mockImplementation(() => HttpResponse.json([]));
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function received(handler: jest.Mock, call = 0): Request {
  return handler.mock.calls[call][0].request;
}

function expectUrl(request: Request, pathname: string, params: Record<string, string>) {
  const url = new URL(request.url);
  expect(url.origin + url.pathname).toBe(`https://cal.test${pathname}`);
  for (const [name, value] of Object.entries(params)) {
    expect(url.searchParams.get(name)).toBe(value);
  }
}

describe("cryptoAssetsApi requests", () => {
  it("findTokenById sends its parameters and client headers to CAL", async () => {
    mockConvert.mockReturnValue(undefined);
    const store = makeStore();
    await store.dispatch(
      cryptoAssetsApi.endpoints.findTokenById.initiate({
        id: "ethereum/erc20/usdc",
      }),
    );

    const request = received(calEndpoints.tokens);
    expectUrl(request, "/v1/tokens", { id: "ethereum/erc20/usdc", limit: "1" });
    expect(new URL(request.url).searchParams.get("output")).toBeTruthy();
    expect(request.headers.get("Content-Type")).toBe("application/json");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("findTokenByAddressInCurrency sends its parameters and headers to CAL", async () => {
    mockConvert.mockReturnValue(undefined);
    const store = makeStore();
    await store.dispatch(
      cryptoAssetsApi.endpoints.findTokenByAddressInCurrency.initiate({
        contract_address: "0xabc",
        network: "ethereum",
      }),
    );

    const request = received(calEndpoints.tokens);
    expectUrl(request, "/v1/tokens", {
      contract_address: "0xabc",
      network: "ethereum",
      limit: "1",
    });
    expect(new URL(request.url).searchParams.get("output")).toBeTruthy();
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("getTokensData uses the injected CAL service base URL", async () => {
    const store = makeStore();
    await store.dispatch(cryptoAssetsApi.endpoints.getTokensData.initiate({}));

    const request = received(calEndpoints.tokens);
    expectUrl(request, "/v1/tokens", { pageSize: "1000" });
    expect(new URL(request.url).searchParams.get("output")).toBeTruthy();
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("getTokensSyncHash returns the commit header and sends parameters to CAL", async () => {
    calEndpoints.currencies.mockImplementation(() =>
      HttpResponse.json([{ id: "ethereum" }], {
        headers: { "X-Ledger-Commit": "commit-hash" },
      }),
    );
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"),
    );

    expect(result.data).toBe("commit-hash");
    const request = received(calEndpoints.currencies);
    expectUrl(request, "/v1/currencies", {
      id: "ethereum",
      limit: "1",
      output: "id",
    });
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("getTokensSyncHash preserves a path prefix in the base URL", async () => {
    calEndpoints.prefixedCurrencies.mockImplementation(() =>
      HttpResponse.json([{ id: "ethereum" }], {
        headers: { "X-Ledger-Commit": "abc123" },
      }),
    );
    const store = configureStore({
      reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: calApiExtra({
              calServiceUrl: "https://global.api.prd.ledger.com/cal",
              ledgerClientVersion: "1.2.3",
            }),
          },
        }).concat(cryptoAssetsApi.middleware),
    });
    await store.dispatch(cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"));

    const request = received(calEndpoints.prefixedCurrencies);
    const url = new URL(request.url);
    expect(url.origin + url.pathname).toBe("https://global.api.prd.ledger.com/cal/v1/currencies");
    expect(url.searchParams.get("id")).toBe("ethereum");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("getTokensSyncHash errors with 404 on an empty currency array", async () => {
    calEndpoints.currencies.mockImplementation(() =>
      HttpResponse.json([], { headers: { "X-Ledger-Commit": "commit-hash" } }),
    );
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("unknown"),
    );
    expect(result.error).toMatchObject({ status: 404 });
    expectUrl(received(calEndpoints.currencies), "/v1/currencies", {
      id: "unknown",
    });
  });

  it("getTokensSyncHash errors when the commit header is missing", async () => {
    calEndpoints.currencies.mockImplementation(() => HttpResponse.json([{ id: "ethereum" }]));
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"),
    );
    expect(result.isError).toBe(true);
    expectUrl(received(calEndpoints.currencies), "/v1/currencies", {
      id: "ethereum",
    });
  });

  it("getTokenListHash returns the network token list hash", async () => {
    calEndpoints.networks.mockImplementation(() =>
      HttpResponse.json([{ id: "solana", token_list_hash: "f61ca8f4b4123c59" }]),
    );
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokenListHash.initiate("solana"),
    );
    expect(result.data).toBe("f61ca8f4b4123c59");
    const request = received(calEndpoints.networks);
    expectUrl(request, "/v1/networks", {
      id: "solana",
      limit: "1",
      output: "id,token_list_hash",
    });
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("getTokenListHash returns a fixed hash for a network without tokens", async () => {
    calEndpoints.networks.mockImplementation(() => HttpResponse.json([{ id: "bitcoin" }]));
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokenListHash.initiate("bitcoin"),
    );
    expect(result.data).toBe("no-tokens");
    expectUrl(received(calEndpoints.networks), "/v1/networks", {
      id: "bitcoin",
    });
  });

  it("getTokenListHash errors with 404 on an empty network array", async () => {
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokenListHash.initiate("unknown"),
    );
    expect(result.error).toMatchObject({ status: 404 });
    expectUrl(received(calEndpoints.networks), "/v1/networks", {
      id: "unknown",
    });
  });

  it("getTokenListHash errors on a malformed response", async () => {
    calEndpoints.networks.mockImplementation(() =>
      HttpResponse.json({ id: "ethereum", token_list_hash: "abc123" }),
    );
    const store = makeStore();
    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokenListHash.initiate("ethereum"),
    );
    expect(result.error).toMatchObject({ status: "PARSING_ERROR" });
    expectUrl(received(calEndpoints.networks), "/v1/networks", {
      id: "ethereum",
    });
  });

  it("a metadata-only CAL update moves the commit but not the token list hash", async () => {
    const readBoth = async () => {
      const store = makeStore();
      const commit = await store.dispatch(
        cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("solana"),
      );
      const list = await store.dispatch(
        cryptoAssetsApi.endpoints.getTokenListHash.initiate("solana"),
      );
      return { commit: commit.data, list: list.data };
    };
    calEndpoints.currencies.mockImplementation(() =>
      HttpResponse.json([{ id: "solana" }], {
        headers: { "X-Ledger-Commit": "commit-before" },
      }),
    );
    calEndpoints.networks.mockImplementation(() =>
      HttpResponse.json([{ id: "solana", token_list_hash: "same-list" }]),
    );
    const before = await readBoth();
    calEndpoints.currencies.mockImplementation(() =>
      HttpResponse.json([{ id: "solana" }], {
        headers: { "X-Ledger-Commit": "commit-after" },
      }),
    );
    const after = await readBoth();

    expect(after.commit).not.toBe(before.commit);
    expect(after.list).toBe(before.list);
    expectUrl(received(calEndpoints.currencies, 1), "/v1/currencies", {
      id: "solana",
    });
    expectUrl(received(calEndpoints.networks, 1), "/v1/networks", {
      id: "solana",
    });
  });
});

describe("cryptoAssetsApi hash requests when CAL does not answer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(["getTokensSyncHash", "getTokenListHash"] as const)(
    "%s ends with a timeout error after CAL_REQUEST_TIMEOUT_MS",
    async endpoint => {
      calEndpoints.currencies.mockImplementation(() => new Promise(() => {}));
      calEndpoints.networks.mockImplementation(() => new Promise(() => {}));
      const store = makeStore();

      const pending = store.dispatch(cryptoAssetsApi.endpoints[endpoint].initiate("ethereum"));
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      const result = await pending;

      expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
      expect(
        calEndpoints[endpoint === "getTokensSyncHash" ? "currencies" : "networks"],
      ).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["getTokensSyncHash", "getTokenListHash"] as const)(
    "%s keeps the HTTP status of a non-JSON error page",
    async endpoint => {
      calEndpoints.currencies.mockImplementation(
        () =>
          new HttpResponse("<html>Bad Gateway</html>", {
            status: 502,
            headers: { "Content-Type": "text/html" },
          }),
      );
      calEndpoints.networks.mockImplementation(
        () =>
          new HttpResponse("<html>Bad Gateway</html>", {
            status: 502,
            headers: { "Content-Type": "text/html" },
          }),
      );
      const store = makeStore();

      const pending = store.dispatch(cryptoAssetsApi.endpoints[endpoint].initiate("ethereum"));
      await jest.advanceTimersByTimeAsync(CAL_REQUEST_TIMEOUT_MS);
      const result = await pending;

      expect(result.error).toMatchObject({ status: 502 });
    },
  );
});

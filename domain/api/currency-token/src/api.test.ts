import { configureStore } from "@reduxjs/toolkit";

jest.mock("./converter", () => ({
  convertApiToken: jest.fn(),
}));

import { convertApiToken } from "./converter";
import {
  cryptoAssetsApi,
  calApiExtra,
  useGetTokensDataInfiniteQuery,
  useFindTokenByIdQuery,
  useFindTokenByAddressInCurrencyQuery,
  useGetTokensSyncHashQuery,
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
    expect(cryptoAssetsApi.reducerPath).toBe("cryptoAssetsApi");
  });

  it("should expose all four endpoints", () => {
    expect(cryptoAssetsApi.endpoints.findTokenById).toBeDefined();
    expect(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency).toBeDefined();
    expect(cryptoAssetsApi.endpoints.getTokensSyncHash).toBeDefined();
    expect(cryptoAssetsApi.endpoints.getTokensData).toBeDefined();
  });

  it("should export the generated hooks", () => {
    expect(useGetTokensDataInfiniteQuery).toBeDefined();
    expect(useFindTokenByIdQuery).toBeDefined();
    expect(useFindTokenByAddressInCurrencyQuery).toBeDefined();
    expect(useGetTokensSyncHashQuery).toBeDefined();
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

describe("calApiExtra", () => {
  it("returns the validated config", () => {
    expect(
      calApiExtra({ calServiceUrl: "https://cal.test", ledgerClientVersion: "1.2.3" }),
    ).toEqual({ calServiceUrl: "https://cal.test", ledgerClientVersion: "1.2.3" });
  });

  it("throws when a required field is missing or empty", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => calApiExtra({ calServiceUrl: "https://cal.test" })).toThrow();
    expect(() => calApiExtra({ calServiceUrl: "", ledgerClientVersion: "1.2.3" })).toThrow();
  });
});

describe("cryptoAssetsApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = () =>
    configureStore({
      reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: calApiExtra({
              calServiceUrl: "https://cal.test",
              ledgerClientVersion: "1.2.3",
            }),
          },
        }).concat(cryptoAssetsApi.middleware),
    });

  function mockFetch(body: unknown, headers: Record<string, string> = {}) {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json", ...headers },
      }),
    );
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("findTokenById hits the prod base URL with the client-version header", async () => {
    mockConvert.mockReturnValue(undefined);
    mockFetch([]);
    const store = makeStore();

    await store.dispatch(
      cryptoAssetsApi.endpoints.findTokenById.initiate({
        id: "ethereum/erc20/usdc",
      }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cal.test/v1/tokens");
    expect(request.url).toContain("id=ethereum%2Ferc20%2Fusdc");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });

  it("findTokenByAddressInCurrency forwards the contract address and network", async () => {
    mockConvert.mockReturnValue(undefined);
    mockFetch([]);
    const store = makeStore();

    await store.dispatch(
      cryptoAssetsApi.endpoints.findTokenByAddressInCurrency.initiate({
        contract_address: "0xabc",
        network: "ethereum",
      }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cal.test/v1/tokens");
    expect(request.url).toContain("contract_address=0xabc");
    expect(request.url).toContain("network=ethereum");
  });

  it("getTokensData uses the injected CAL service base URL", async () => {
    mockFetch([]);
    const store = makeStore();

    await store.dispatch(cryptoAssetsApi.endpoints.getTokensData.initiate({}));

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cal.test/v1/tokens");
  });

  it("getTokensSyncHash returns the X-Ledger-Commit header from /v1/currencies", async () => {
    mockFetch([{ id: "ethereum" }], { "X-Ledger-Commit": "commit-hash" });
    const store = makeStore();

    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"),
    );

    expect(result.data).toBe("commit-hash");
    // getTokensSyncHash calls fetch with a URL object; stringify before asserting.
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain("https://cal.test/v1/currencies");
    expect(url).toContain("id=ethereum");
  });

  it("getTokensSyncHash errors with 404 on an empty currency array", async () => {
    mockFetch([], { "X-Ledger-Commit": "commit-hash" });
    const store = makeStore();

    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("unknown"),
    );

    expect(result.isError).toBe(true);
  });

  it("getTokensSyncHash errors when the X-Ledger-Commit header is missing", async () => {
    mockFetch([{ id: "ethereum" }]);
    const store = makeStore();

    const result = await store.dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate("ethereum"),
    );

    expect(result.isError).toBe(true);
  });
});

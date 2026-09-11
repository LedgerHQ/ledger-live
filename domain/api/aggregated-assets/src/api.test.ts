/*
 * The Domain Test CI job installs only ./domain/** and ./shared/**, so @shared/env's transitive
 * @ledgerhq/live-env (a libs/ package) is absent. Mock it with a factory so the real module is
 * never resolved — this test only reads a static property.
 */
jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue("https://dada.api.ledger.com/v1"),
}));

import { configureStore } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import { assetsDataApi, buildAssetsQueryParams } from "./index";
import {
  fetchAllAssetCurrencyIdsByCategory,
  fetchAllAssetsByCategory,
} from "./internals/accessors";
import { getApiErrorStatus, isApiError, isNetworkError } from "./errors";
import { AssetCategory } from "./types";
import type { RawApiResponse } from "./schema";

describe("assetsDataApi", () => {
  /*
   * createCurrencyDataSelector hand-scans state.assetsDataApi.queries by string. A rename produces
   * no type error and silently returns undefined for every market and interest-rate lookup, so pin
   * the literal.
   */
  it("keeps the frozen reducerPath", () => {
    expect(assetsDataApi.reducerPath).toBe("assetsDataApi");
  });
});

const getEnvMock = jest.mocked(getEnv);

function makePage(tickers: string[]): RawApiResponse {
  const cryptoAssets: RawApiResponse["cryptoAssets"] = {};
  for (const ticker of tickers) {
    cryptoAssets[ticker.toLowerCase()] = {
      id: ticker.toLowerCase(),
      ticker,
      name: ticker,
      assetsIds: {},
    };
  }
  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
  };
}

/** A page as the base query returns it: parsed body plus the response for header access. */
function okResponse(body: RawApiResponse, nextCursor?: string) {
  const headers = new Headers();
  if (nextCursor) headers.set("x-ledger-next", nextCursor);
  return { data: body, meta: { response: { headers } } };
}

let baseQuery: jest.Mock;

function mockFetchPages(pages: { tickers: string[]; nextCursor?: string }[]): jest.Mock {
  for (const page of pages) {
    baseQuery.mockResolvedValueOnce(okResponse(makePage(page.tickers), page.nextCursor));
  }
  return baseQuery;
}

beforeEach(() => {
  baseQuery = jest.fn();
});

/** The request descriptors handed to the base query, one per page walked. */
const cursorOf = (call: number) =>
  (baseQuery.mock.calls[call][0] as { params: Record<string, unknown> }).params.cursor;

const defaultArgs = {
  category: AssetCategory.Stablecoins,
  product: "lld" as const,
  version: "1.0.0",
};

const baseQueryArg = { product: "lld" as const, version: "1.0.0" };

describe("buildAssetsQueryParams", () => {
  it("should pass currencyIds through unchanged", () => {
    const input = [
      "ethereum/erc20/usdc",
      "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      "multiversx/esdt/USDC-c76f1f",
      "ton/jetton/some_address",
      "bitcoin",
    ];
    const params = buildAssetsQueryParams({ ...baseQueryArg, currencyIds: input });
    expect(params.currencyIds).toEqual(input);
  });

  it("should omit currencyIds when empty or not provided", () => {
    expect(
      buildAssetsQueryParams({ ...baseQueryArg, currencyIds: [] }).currencyIds,
    ).toBeUndefined();
    expect(buildAssetsQueryParams(baseQueryArg).currencyIds).toBeUndefined();
  });

  it("should serialize networkIds as a comma-separated string", () => {
    const input = ["ethereum", "tron"];

    expect(buildAssetsQueryParams({ ...baseQueryArg, networkIds: input }).networkIds).toBe(
      "ethereum,tron",
    );
  });

  it("should omit networkIds when empty or not provided", () => {
    expect(buildAssetsQueryParams({ ...baseQueryArg, networkIds: [] }).networkIds).toBeUndefined();
    expect(buildAssetsQueryParams(baseQueryArg).networkIds).toBeUndefined();
  });

  it("should serialize categories as a comma-separated string", () => {
    expect(
      buildAssetsQueryParams({ ...baseQueryArg, categories: [AssetCategory.Stocks] }).categories,
    ).toBe("stocks");
    expect(
      buildAssetsQueryParams({
        ...baseQueryArg,
        categories: [AssetCategory.Stocks, AssetCategory.Stablecoins],
      }).categories,
    ).toBe("stocks,stablecoins");
  });

  it("should omit categories when empty or not provided", () => {
    expect(buildAssetsQueryParams({ ...baseQueryArg, categories: [] }).categories).toBeUndefined();
    expect(buildAssetsQueryParams(baseQueryArg).categories).toBeUndefined();
  });
});

describe("fetchAllAssetsByCategory", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should aggregate tickers from 3 pages using x-ledger-next cursor", async () => {
    const spy = mockFetchPages([
      { tickers: ["USDT", "USDC"], nextCursor: "cursor-2" },
      { tickers: ["DAI", "BUSD"], nextCursor: "cursor-3" },
      { tickers: ["TUSD", "FRAX"] },
    ]);

    const result = await fetchAllAssetsByCategory(defaultArgs, baseQuery);

    expect(result).toEqual({ data: ["USDT", "USDC", "DAI", "BUSD", "TUSD", "FRAX"] });
    expect(spy).toHaveBeenCalledTimes(3);

    expect(cursorOf(0)).toBeUndefined();
    expect(cursorOf(1)).toBe("cursor-2");
    expect(cursorOf(2)).toBe("cursor-3");
  });

  it("should return error and stop when a page fails", async () => {
    baseQuery.mockResolvedValueOnce(okResponse(makePage(["USDT"]), "cursor-2"));
    baseQuery.mockResolvedValueOnce({ error: { status: 502, data: "Bad Gateway" } });

    const result = await fetchAllAssetsByCategory(defaultArgs, baseQuery);

    expect(result).toEqual({ error: { status: 502, data: "Bad Gateway" } });
    expect(baseQuery).toHaveBeenCalledTimes(2);
  });

  it("should return FETCH_ERROR on network failure", async () => {
    baseQuery.mockResolvedValueOnce({ error: { status: "FETCH_ERROR", error: "Network failure" } });

    const result = await fetchAllAssetsByCategory(defaultArgs, baseQuery);

    expect(result).toEqual({ error: { status: "FETCH_ERROR", error: "Network failure" } });
  });

  it("should block requests to untrusted hosts", async () => {
    getEnvMock.mockImplementation(() => "https://evil.example.com/v1");

    const result = await fetchAllAssetsByCategory(defaultArgs, baseQuery);

    expect(result).toEqual({
      error: {
        status: "CUSTOM_ERROR",
        error: "Blocked request to untrusted host: evil.example.com",
      },
    });
    expect(baseQuery).not.toHaveBeenCalled();
  });
});

function makePageWithIds(
  assets: { key: string; assetsIds: Record<string, string> }[],
): RawApiResponse {
  const cryptoAssets: RawApiResponse["cryptoAssets"] = {};
  for (const { key, assetsIds } of assets) {
    cryptoAssets[key] = { id: key, ticker: key.toUpperCase(), name: key, assetsIds };
  }
  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
  };
}

const stocksArgs = { ...defaultArgs, category: AssetCategory.Stocks };

describe("fetchAllAssetCurrencyIdsByCategory", () => {
  beforeEach(() => {
    getEnvMock.mockReturnValue("https://dada.api.ledger.com/v1");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should aggregate and flatten currency ids across pages", async () => {
    baseQuery.mockResolvedValueOnce(
      okResponse(
        makePageWithIds([{ key: "aapl", assetsIds: { ethereum: "eth/aapl", solana: "sol/aapl" } }]),
        "cursor-2",
      ),
    );
    baseQuery.mockResolvedValueOnce(
      okResponse(makePageWithIds([{ key: "tsla", assetsIds: { ethereum: "eth/tsla" } }])),
    );

    const result = await fetchAllAssetCurrencyIdsByCategory(stocksArgs, baseQuery);

    expect(result).toEqual({ data: ["eth/aapl", "sol/aapl", "eth/tsla"] });
    expect(baseQuery).toHaveBeenCalledTimes(2);
  });

  it("should skip assets that have no assetsIds", async () => {
    baseQuery.mockResolvedValueOnce(
      okResponse(
        makePageWithIds([
          { key: "aapl", assetsIds: {} },
          { key: "tsla", assetsIds: { ethereum: "eth/tsla" } },
        ]),
      ),
    );

    const result = await fetchAllAssetCurrencyIdsByCategory(stocksArgs, baseQuery);

    expect(result).toEqual({ data: ["eth/tsla"] });
  });

  it("should return error and stop when a page fails", async () => {
    baseQuery.mockResolvedValueOnce(
      okResponse(
        makePageWithIds([{ key: "aapl", assetsIds: { ethereum: "eth/aapl" } }]),
        "cursor-2",
      ),
    );
    baseQuery.mockResolvedValueOnce({ error: { status: 502, data: "Bad Gateway" } });

    const result = await fetchAllAssetCurrencyIdsByCategory(stocksArgs, baseQuery);

    expect(result).toEqual({
      error: { status: 502, data: "Bad Gateway" },
    });
    expect(baseQuery).toHaveBeenCalledTimes(2);
  });
});

describe("requests issued through the store", () => {
  const emptyPage = () =>
    new Response(JSON.stringify(makePage([])), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  function makeStore() {
    return configureStore({
      reducer: { [assetsDataApi.reducerPath]: assetsDataApi.reducer },
      middleware: getDefault => getDefault().concat(assetsDataApi.middleware),
    });
  }

  const { endpoints } = assetsDataApi;
  const storeArgs = { product: "llm" as const, version: "1.0.0" };
  const storeCategoryArgs = { ...storeArgs, category: AssetCategory.Stocks };

  /* Only that the signal reaches the request. Breaking out of the walk itself is LIVE-35503. */
  it("should attach an abort signal to the category walk's requests", async () => {
    let signal: AbortSignal | undefined;
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation((request: RequestInfo | URL) => {
        if (request instanceof Request) signal = request.signal;
        return Promise.resolve(emptyPage());
      });

    await makeStore().dispatch(
      assetsDataApi.endpoints.getAssetsByCategory.initiate({
        category: AssetCategory.Stocks,
        product: "llm",
        version: "1.0.0",
      }),
    );

    expect(signal).toBeInstanceOf(AbortSignal);
    fetchSpy.mockRestore();
  });

  it("should issue no request at all when the resolved host is untrusted", async () => {
    getEnvMock.mockReturnValue("https://evil.example.com/v1");
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(emptyPage()));

    const result = await makeStore().dispatch(
      assetsDataApi.endpoints.getAssetData.initiate({ product: "llm", version: "1.0.0" }),
    );

    expect(result.status).toBe("rejected");
    expect(result.error).toMatchObject({
      message: expect.stringContaining("evil.example.com"),
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    getEnvMock.mockReturnValue("https://dada.api.ledger.com/v1");
  });

  /*
   * Before the base query was adopted, the queryFn endpoints flattened an HTTP failure into
   * FETCH_ERROR with the status only inside a message string, so isNetworkError answered true for a
   * server error on some endpoints and false on others. These assert the shapes agree.
   */
  type RunEndpoint = () => Promise<{ error?: unknown }>;

  const endpointCases: [string, RunEndpoint][] = [
    ["getAssetData", () => makeStore().dispatch(endpoints.getAssetData.initiate(storeArgs))],
    [
      "getChunkedAssetsData",
      () =>
        makeStore().dispatch(
          endpoints.getChunkedAssetsData.initiate({ ...storeArgs, currencyIds: ["bitcoin"] }),
        ),
    ],
    [
      "getAssetsByCategory",
      () => makeStore().dispatch(endpoints.getAssetsByCategory.initiate(storeCategoryArgs)),
    ],
    [
      "getAssetCurrencyIdsByCategory",
      () =>
        makeStore().dispatch(endpoints.getAssetCurrencyIdsByCategory.initiate(storeCategoryArgs)),
    ],
  ];

  describe.each(endpointCases)("%s", (_name, runEndpoint) => {
    it("should classify an HTTP 500 as an api error carrying the numeric status", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "server exploded" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          }),
        ),
      );

      const { error } = await runEndpoint();

      expect(isApiError(error)).toBe(true);
      expect(getApiErrorStatus(error)).toBe(500);
      expect(isNetworkError(error)).toBe(false);

      fetchSpy.mockRestore();
    });

    it("should classify a transport failure as a network error", async () => {
      const fetchSpy = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));

      const { error } = await runEndpoint();

      expect(isNetworkError(error)).toBe(true);
      expect(isApiError(error)).toBe(false);

      fetchSpy.mockRestore();
    });
  });
});

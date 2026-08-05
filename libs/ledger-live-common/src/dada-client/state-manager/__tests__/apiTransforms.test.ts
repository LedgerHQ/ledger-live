import { configureStore } from "@reduxjs/toolkit";
import { assetsDataApi } from "../api";
import type { RawApiResponse } from "../../entities";

jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue("https://dada.api.ledger.com/v1"),
}));

/*
 * `convertApiAssets`, `transformAssetsResponse` and `getChunkedAssetsData`'s queryFn are
 * module-private, so they are characterized through the public endpoints. That also pins
 * the observable contract rather than the internals, which is what the migration must
 * preserve.
 */

function makeStore() {
  return configureStore({
    reducer: { [assetsDataApi.reducerPath]: assetsDataApi.reducer },
    middleware: getDefault => getDefault().concat(assetsDataApi.middleware),
  });
}

const emptyRaw: RawApiResponse = {
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
};

const raw = (overrides: Partial<RawApiResponse> = {}): RawApiResponse => ({
  ...emptyRaw,
  ...overrides,
});

function okResponse(body: RawApiResponse, nextCursor?: string): Response {
  const headers = new Headers();
  if (nextCursor) headers.set("x-ledger-next", nextCursor);
  return new Response(JSON.stringify(body), { status: 200, headers });
}

const knownCrypto = {
  type: "crypto_currency" as const,
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [{ name: "bitcoin", code: "BTC", magnitude: 8 }],
};

const unknownCrypto = {
  type: "crypto_currency" as const,
  id: "totallyunknownchain",
  name: "Unknown Chain",
  ticker: "UNK",
  units: [{ name: "unknown", code: "UNK", magnitude: 6 }],
  symbol: "U",
  coinType: 42,
  family: "unknownfamily",
  hasSegwit: true,
  disableCountervalue: true,
};

const knownToken = {
  type: "token_currency" as const,
  id: "ethereum/erc20/some_token",
  contractAddress: "0xabc",
  name: "Some Token",
  ticker: "SOME",
  units: [{ name: "Some Token", code: "SOME", magnitude: 18 }],
  standard: "erc20",
};

const orphanToken = {
  ...knownToken,
  id: "notachain/erc20/orphan",
  name: "Orphan Token",
  ticker: "ORPH",
};

const queryArgs = { product: "lld" as const, version: "1.0.0" };

/**
 * `getAssetData` goes through `fetchBaseQuery`, which calls fetch with a `Request`, while the
 * chunked endpoint calls it with a URL string. Normalise both to the requested URL.
 */
function requestedUrl(call: unknown[]): string {
  const [input] = call;
  return input instanceof Request ? input.url : String(input);
}

let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, "fetch");
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function getAssetData(body: RawApiResponse, nextCursor?: string) {
  fetchSpy.mockResolvedValueOnce(okResponse(body, nextCursor));
  const store = makeStore();
  return store.dispatch(assetsDataApi.endpoints.getAssetData.initiate(queryArgs));
}

describe("transformAssetsResponse, via getAssetData", () => {
  it("passes non-currency collections through untouched", async () => {
    const body = raw({
      cryptoAssets: { btc: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} } },
      networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } },
      interestRates: {
        bitcoin: { currencyId: "bitcoin", rate: 4.2, type: "APY", fetchAt: "2026-07-31" },
      },
      markets: { bitcoin: { price: 65000 } },
    });

    const result = await getAssetData(body);

    expect(result.data?.cryptoAssets).toEqual(body.cryptoAssets);
    expect(result.data?.networks).toEqual(body.networks);
    expect(result.data?.interestRates).toEqual(body.interestRates);
    expect(result.data?.markets).toEqual(body.markets);
    expect(result.data?.currenciesOrder).toEqual(body.currenciesOrder);
  });

  describe("pagination comes from the x-ledger-next header", () => {
    it("exposes the header value as nextCursor", async () => {
      const result = await getAssetData(raw(), "cursor-2");

      expect(result.data?.pagination).toEqual({ nextCursor: "cursor-2" });
    });

    it("leaves nextCursor undefined when the header is absent", async () => {
      const result = await getAssetData(raw());

      expect(result.data?.pagination).toEqual({ nextCursor: undefined });
    });
  });

  it("requests a single item", async () => {
    await getAssetData(raw());

    expect(requestedUrl(fetchSpy.mock.calls[0])).toContain("pageSize=1");
  });

  it("targets the /assets path on the resolved base url", async () => {
    await getAssetData(raw());

    expect(requestedUrl(fetchSpy.mock.calls[0])).toContain("https://dada.api.ledger.com/v1/assets");
  });
});

describe("convertApiAssets, via getAssetData", () => {
  it("resolves a known crypto from the local registry", async () => {
    const result = await getAssetData(raw({ cryptoOrTokenCurrencies: { bitcoin: knownCrypto } }));

    expect(result.data?.cryptoOrTokenCurrencies.bitcoin).toEqual(
      expect.objectContaining({ type: "CryptoCurrency", id: "bitcoin" }),
    );
    // the registry entry wins over the wire payload
    expect(result.data?.cryptoOrTokenCurrencies.bitcoin).not.toMatchObject({ color: "#999999" });
  });

  describe("synthesises a currency for a crypto missing from the registry", () => {
    it("builds it from the wire payload with placeholder presentation fields", async () => {
      const result = await getAssetData(raw({ cryptoOrTokenCurrencies: { unk: unknownCrypto } }));

      expect(result.data?.cryptoOrTokenCurrencies.unk).toEqual({
        type: "CryptoCurrency",
        id: "totallyunknownchain",
        name: "Unknown Chain",
        ticker: "UNK",
        units: unknownCrypto.units,
        managerAppName: "Unknown Chain",
        coinType: 42,
        scheme: "totallyunknownchain",
        color: "#999999",
        family: "unknownfamily",
        explorerViews: [],
        symbol: "U",
        disableCountervalue: true,
        supportsSegwit: true,
      });
    });

    it("falls back to the id for family and to 0 for coinType", async () => {
      const bare = {
        type: "crypto_currency" as const,
        id: "barechain",
        name: "Bare",
        ticker: "BARE",
        units: [{ name: "bare", code: "BARE", magnitude: 0 }],
      };

      const result = await getAssetData(raw({ cryptoOrTokenCurrencies: { bare } }));

      expect(result.data?.cryptoOrTokenCurrencies.bare).toMatchObject({
        family: "barechain",
        coinType: 0,
      });
    });

    it("lower-cases the id to build the scheme", async () => {
      const upper = { ...unknownCrypto, id: "MixedCaseChain" };

      const result = await getAssetData(raw({ cryptoOrTokenCurrencies: { upper } }));

      expect(result.data?.cryptoOrTokenCurrencies.upper).toMatchObject({
        id: "MixedCaseChain",
        scheme: "mixedcasechain",
      });
    });

    it("adds ethereumLikeInfo only when a chainId is present", async () => {
      const withChain = { ...unknownCrypto, chainId: "137" };

      const withResult = await getAssetData(raw({ cryptoOrTokenCurrencies: { withChain } }));
      const withoutResult = await getAssetData(
        raw({ cryptoOrTokenCurrencies: { unk: unknownCrypto } }),
      );

      expect(withResult.data?.cryptoOrTokenCurrencies.withChain).toMatchObject({
        ethereumLikeInfo: { chainId: 137 },
      });
      expect(withoutResult.data?.cryptoOrTokenCurrencies.unk).not.toHaveProperty(
        "ethereumLikeInfo",
      );
    });
  });

  describe("tokens", () => {
    it("converts a token whose parent chain is known", async () => {
      const result = await getAssetData(raw({ cryptoOrTokenCurrencies: { some: knownToken } }));

      expect(result.data?.cryptoOrTokenCurrencies.some).toEqual(
        expect.objectContaining({
          type: "TokenCurrency",
          id: "ethereum/erc20/some_token",
          parentCurrencyId: "ethereum",
        }),
      );
    });

    it("silently drops a token whose parent chain is unknown", async () => {
      const result = await getAssetData(
        raw({ cryptoOrTokenCurrencies: { orphan: orphanToken, bitcoin: knownCrypto } }),
      );

      expect(result.data?.cryptoOrTokenCurrencies).not.toHaveProperty("orphan");
      expect(result.data?.cryptoOrTokenCurrencies).toHaveProperty("bitcoin");
    });
  });

  it("keys the output by the wire key, not by the asset id", async () => {
    const result = await getAssetData(
      raw({ cryptoOrTokenCurrencies: { "some-wire-key": knownCrypto } }),
    );

    expect(Object.keys(result.data!.cryptoOrTokenCurrencies)).toEqual(["some-wire-key"]);
    expect(result.data?.cryptoOrTokenCurrencies["some-wire-key"]).toMatchObject({
      id: "bitcoin",
    });
  });

  it("returns an empty map when there are no currencies", async () => {
    const result = await getAssetData(raw());

    expect(result.data?.cryptoOrTokenCurrencies).toEqual({});
  });

  it("surfaces an error rather than dropping the asset when the id is empty", async () => {
    const result = await getAssetData(
      raw({ cryptoOrTokenCurrencies: { bad: { ...unknownCrypto, id: "" } } }),
    );

    // CryptoCurrencyIdSchema rejects "" and the throw propagates as a query error
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe("getChunkedAssetsData", () => {
  async function getChunked(currencyIds: string[], responses: Response[]) {
    for (const response of responses) {
      fetchSpy.mockResolvedValueOnce(response);
    }
    const store = makeStore();
    return store.dispatch(
      assetsDataApi.endpoints.getChunkedAssetsData.initiate({ ...queryArgs, currencyIds }),
    );
  }

  const ids = (count: number, prefix = "id") =>
    Array.from({ length: count }, (_, index) => `${prefix}-${index}`);

  describe("no work to do", () => {
    it("returns an empty shape for an empty id list without fetching", async () => {
      const result = await getChunked([], []);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.data).toEqual({
        cryptoAssets: {},
        networks: {},
        cryptoOrTokenCurrencies: {},
        interestRates: {},
        markets: {},
        currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
      });
    });

    it("returns an empty shape when currencyIds is omitted", async () => {
      const store = makeStore();
      const result = await store.dispatch(
        assetsDataApi.endpoints.getChunkedAssetsData.initiate(queryArgs),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.data?.cryptoOrTokenCurrencies).toEqual({});
    });
  });

  describe("chunking", () => {
    it("issues a single request for 25 ids or fewer", async () => {
      await getChunked(ids(25), [okResponse(raw())]);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("splits 26 ids into two requests", async () => {
      await getChunked(ids(26), [okResponse(raw()), okResponse(raw())]);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("sends each chunk's ids as a comma-separated currencyIds param", async () => {
      await getChunked(["bitcoin", "ethereum"], [okResponse(raw())]);

      expect(requestedUrl(fetchSpy.mock.calls[0])).toContain("currencyIds=bitcoin%2Cethereum");
    });

    it("forwards networkIds unchunked alongside each chunk of currencyIds", async () => {
      fetchSpy.mockResolvedValueOnce(okResponse(raw()));
      fetchSpy.mockResolvedValueOnce(okResponse(raw()));
      const store = makeStore();

      await store.dispatch(
        assetsDataApi.endpoints.getChunkedAssetsData.initiate({
          ...queryArgs,
          currencyIds: ids(26),
          networkIds: ["ethereum", "polygon"],
        }),
      );

      // currencyIds are split across chunks; networkIds are repeated in full on every request
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      for (const call of fetchSpy.mock.calls) {
        expect(requestedUrl(call)).toContain("networkIds=ethereum%2Cpolygon");
      }
    });

    it("does not send a cursor, because it collects one page per chunk", async () => {
      await getChunked(["bitcoin"], [okResponse(raw(), "cursor-2")]);

      expect(requestedUrl(fetchSpy.mock.calls[0])).not.toContain("cursor=");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("merging chunk responses", () => {
    it("combines collections from every chunk", async () => {
      const first = raw({
        networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } },
        markets: { bitcoin: { price: 65000 } },
        currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: ["btc"] },
      });
      const second = raw({
        networks: { ethereum: { id: "ethereum", name: "Ethereum" } },
        markets: { ethereum: { price: 3200 } },
        currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: ["eth"] },
      });

      const result = await getChunked(ids(26), [okResponse(first), okResponse(second)]);

      expect(Object.keys(result.data!.networks).sort()).toEqual(["bitcoin", "ethereum"]);
      expect(Object.keys(result.data!.markets).sort()).toEqual(["bitcoin", "ethereum"]);
      expect(result.data?.currenciesOrder.metaCurrencyIds).toEqual(["btc", "eth"]);
    });

    it("deep-merges assetsIds for a meta-currency split across chunks", async () => {
      const first = raw({
        cryptoAssets: {
          eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: { ethereum: "ethereum" } },
        },
      });
      const second = raw({
        cryptoAssets: {
          eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: { arbitrum: "arbitrum" } },
        },
      });

      const result = await getChunked(ids(26), [okResponse(first), okResponse(second)]);

      expect(result.data?.cryptoAssets.eth.assetsIds).toEqual({
        ethereum: "ethereum",
        arbitrum: "arbitrum",
      });
    });

    it("leaves the merged result without a pagination field", async () => {
      const result = await getChunked(["bitcoin"], [okResponse(raw(), "cursor-2")]);

      expect(result.data).not.toHaveProperty("pagination");
    });
  });

  describe("partial failure is tolerated", () => {
    it("returns the surviving chunk when another chunk fails", async () => {
      const good = raw({ networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } } });

      const result = await getChunked(ids(26), [
        okResponse(good),
        new Response(null, { status: 500, statusText: "Server Error" }),
      ]);

      expect(result.data?.networks).toEqual({ bitcoin: { id: "bitcoin", name: "Bitcoin" } });
      expect(result.error).toBeUndefined();
    });

    it("returns the surviving chunk when another chunk rejects outright", async () => {
      const good = raw({ networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } } });
      fetchSpy.mockResolvedValueOnce(okResponse(good));
      fetchSpy.mockRejectedValueOnce(new Error("socket hang up"));

      const store = makeStore();
      const result = await store.dispatch(
        assetsDataApi.endpoints.getChunkedAssetsData.initiate({
          ...queryArgs,
          currencyIds: ids(26),
        }),
      );

      expect(result.data?.networks).toEqual({ bitcoin: { id: "bitcoin", name: "Bitcoin" } });
    });

    it("errors only when every chunk fails", async () => {
      const result = await getChunked(ids(26), [
        new Response(null, { status: 500, statusText: "Server Error" }),
        new Response(null, { status: 503, statusText: "Unavailable" }),
      ]);

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ status: "FETCH_ERROR" });
    });

    it("reports the first failure's message when everything fails", async () => {
      const result = await getChunked(
        ["bitcoin"],
        [new Response(null, { status: 500, statusText: "Server Error" })],
      );

      expect(result.error).toMatchObject({
        status: "FETCH_ERROR",
        error: expect.stringContaining("500"),
      });
    });
  });

  it("blocks a request to an untrusted host", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getEnv } = require("@shared/env");
    getEnv.mockReturnValueOnce("https://evil.example.com/v1");

    const result = await getChunked(["bitcoin"], []);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.error).toMatchObject({
      status: "FETCH_ERROR",
      error: expect.stringContaining("evil.example.com"),
    });
  });
});

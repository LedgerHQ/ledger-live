import { configureStore } from "@reduxjs/toolkit";
import { coinMarketCapApiExtra, coinMarketCapApi } from "@domain/api-services";
import { altcoinsSentimentApi, useGetAltcoinSeasonIndexLatestQuery } from "./api";

const rawResponse = {
  data: { altcoin_index: 42, altcoin_marketcap: 1234567890 },
  status: {
    timestamp: "2026-01-07T15:08:19.975Z",
    error_code: "0",
    error_message: null,
    elapsed: 10,
    credit_count: 0,
    notice: null,
  },
};

describe("altcoinsSentimentApi configuration", () => {
  it("is the CoinMarketCap service api, mutated in place by injectEndpoints", () => {
    expect(altcoinsSentimentApi).toBe(coinMarketCapApi);
    expect(altcoinsSentimentApi.reducerPath).toBe("coinMarketCapApi");
  });

  it("exposes the getAltcoinSeasonIndexLatest endpoint and its hook", () => {
    expect(altcoinsSentimentApi.endpoints.getAltcoinSeasonIndexLatest).toBeDefined();
    expect(useGetAltcoinSeasonIndexLatestQuery).toBeDefined();
  });
});

describe("altcoinsSentimentApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  // Wired the way the apps wire it: the store registers the *service api*, and the endpoint only
  // exists because importing this package injected it.
  const makeStore = () =>
    configureStore({
      reducer: {
        [coinMarketCapApi.reducerPath]: coinMarketCapApi.reducer,
      },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: coinMarketCapApiExtra({ coinMarketCapApiUrl: "https://cmc.test" }),
          },
        }).concat(coinMarketCapApi.middleware),
    });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("hits the injected base URL and returns the transformed index", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(rawResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const store = makeStore();

    const result = await store.dispatch(
      altcoinsSentimentApi.endpoints.getAltcoinSeasonIndexLatest.initiate(),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cmc.test/altcoin-season-index/latest");
    expect(result.data).toEqual({ value: 42, altcoinMarketcap: 1234567890 });
  });
});

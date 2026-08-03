import { configureStore } from "@reduxjs/toolkit";
import { coinMarketCapApiExtra, coinMarketCapApi } from "@domain/api-services";
import { marketSentimentApi, useGetFearAndGreedLatestQuery } from "./api";
import { mockFearAndGreedLatest } from "./fearAndGreed.mock";

describe("marketSentimentApi configuration", () => {
  it("is the CoinMarketCap service api, mutated in place by injectEndpoints", () => {
    expect(marketSentimentApi).toBe(coinMarketCapApi);
    expect(marketSentimentApi.reducerPath).toBe("coinMarketCapApi");
  });

  it("exposes the getFearAndGreedLatest endpoint and its hook", () => {
    expect(marketSentimentApi.endpoints.getFearAndGreedLatest).toBeDefined();
    expect(useGetFearAndGreedLatestQuery).toBeDefined();
  });
});

describe("marketSentimentApi requests", () => {
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
      new Response(JSON.stringify(mockFearAndGreedLatest), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const store = makeStore();

    const result = await store.dispatch(
      marketSentimentApi.endpoints.getFearAndGreedLatest.initiate(),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cmc.test/fear-and-greed/latest");
    expect(result.data).toEqual({ value: 49, classification: "Neutral" });
  });
});

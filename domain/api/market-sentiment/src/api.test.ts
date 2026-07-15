import { configureStore } from "@reduxjs/toolkit";
import { marketSentimentApi, marketSentimentApiExtra, useGetFearAndGreedLatestQuery } from "./api";
import { mockFearAndGreedLatest } from "./fearAndGreed.mock";

describe("marketSentimentApi configuration", () => {
  it("has the correct reducer path", () => {
    expect(marketSentimentApi.reducerPath).toBe("marketSentimentApi");
  });

  it("exposes the getFearAndGreedLatest endpoint and its hook", () => {
    expect(marketSentimentApi.endpoints.getFearAndGreedLatest).toBeDefined();
    expect(useGetFearAndGreedLatestQuery).toBeDefined();
  });
});

describe("marketSentimentApiExtra", () => {
  it("returns the validated config", () => {
    expect(marketSentimentApiExtra({ coinMarketCapApiUrl: "https://cmc.test" })).toEqual({
      coinMarketCapApiUrl: "https://cmc.test",
    });
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — coinMarketCapApiUrl is required
    expect(() => marketSentimentApiExtra({})).toThrow();
    expect(() => marketSentimentApiExtra({ coinMarketCapApiUrl: "" })).toThrow();
  });
});

describe("marketSentimentApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = () =>
    configureStore({
      reducer: { [marketSentimentApi.reducerPath]: marketSentimentApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: marketSentimentApiExtra({ coinMarketCapApiUrl: "https://cmc.test" }),
          },
        }).concat(marketSentimentApi.middleware),
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

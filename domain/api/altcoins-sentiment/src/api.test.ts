import { configureStore } from "@reduxjs/toolkit";
import {
  altcoinsSentimentApi,
  altcoinsSentimentApiExtra,
  useGetAltcoinSeasonIndexLatestQuery,
} from "./api";

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
  it("has the correct reducer path", () => {
    expect(altcoinsSentimentApi.reducerPath).toBe("altcoinsSentimentApi");
  });

  it("exposes the getAltcoinSeasonIndexLatest endpoint and its hook", () => {
    expect(altcoinsSentimentApi.endpoints.getAltcoinSeasonIndexLatest).toBeDefined();
    expect(useGetAltcoinSeasonIndexLatestQuery).toBeDefined();
  });
});

describe("altcoinsSentimentApiExtra", () => {
  it("returns the validated config", () => {
    expect(altcoinsSentimentApiExtra({ coinMarketCapApiUrl: "https://cmc.test" })).toEqual({
      coinMarketCapApiUrl: "https://cmc.test",
    });
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — coinMarketCapApiUrl is required
    expect(() => altcoinsSentimentApiExtra({})).toThrow();
    expect(() => altcoinsSentimentApiExtra({ coinMarketCapApiUrl: "" })).toThrow();
  });
});

describe("altcoinsSentimentApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = () =>
    configureStore({
      reducer: { [altcoinsSentimentApi.reducerPath]: altcoinsSentimentApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: altcoinsSentimentApiExtra({ coinMarketCapApiUrl: "https://cmc.test" }),
          },
        }).concat(altcoinsSentimentApi.middleware),
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

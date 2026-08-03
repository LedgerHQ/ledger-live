import { configureStore } from "@reduxjs/toolkit";
import { coinMarketCapApi, coinMarketCapApiExtra, getCoinMarketCapExtra } from "./api";
import type { CoinMarketCapApiExtra } from "./types";

const valid = { coinMarketCapApiUrl: "https://cmc.test" };

// Captured at import time: the base query tests below inject into this same api object.
const OWN_ENDPOINT_NAMES = Object.keys(coinMarketCapApi.endpoints);

describe("coinMarketCapApi", () => {
  it("has the correct reducer path", () => {
    expect(coinMarketCapApi.reducerPath).toBe("coinMarketCapApi");
  });

  it("declares no endpoints of its own", () => {
    expect(OWN_ENDPOINT_NAMES).toHaveLength(0);
  });
});

describe("coinMarketCapApiExtra", () => {
  it("returns the validated config", () => {
    expect(coinMarketCapApiExtra(valid)).toEqual(valid);
  });

  it("throws when the url is missing or empty", () => {
    // @ts-expect-error — coinMarketCapApiUrl is required
    expect(() => coinMarketCapApiExtra({})).toThrow();
    expect(() => coinMarketCapApiExtra({ coinMarketCapApiUrl: "" })).toThrow();
  });
});

describe("getCoinMarketCapExtra", () => {
  it("reads the config off the thunk extraArgument", () => {
    expect(getCoinMarketCapExtra({ extra: valid })).toBe(valid);
  });
});

describe("coinMarketCapBaseQuery", () => {
  let fetchSpy: jest.SpyInstance;

  // The base query is private, so drive it the way a use case does: through an injected endpoint.
  function probeStore(extra: CoinMarketCapApiExtra) {
    const api = coinMarketCapApi.injectEndpoints({
      endpoints: build => ({ probe: build.query<unknown, void>({ query: () => "/probe" }) }),
      overrideExisting: true,
    });
    const store = configureStore({
      reducer: { [coinMarketCapApi.reducerPath]: coinMarketCapApi.reducer },
      middleware: gdm =>
        gdm({ thunk: { extraArgument: extra } }).concat(coinMarketCapApi.middleware),
    });
    return { api, store };
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("resolves requests against the configured api url", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { api, store } = probeStore(coinMarketCapApiExtra(valid));
    const result = await store.dispatch(api.endpoints.probe.initiate());

    expect(result.data).toEqual({ ok: true });
    expect((fetchSpy.mock.calls[0][0] as Request).url).toBe("https://cmc.test/probe");
  });
});

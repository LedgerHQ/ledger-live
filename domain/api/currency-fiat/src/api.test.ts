import { configureStore } from "@reduxjs/toolkit";

jest.mock("./converter", () => ({
  resolveSupportedFiats: jest.fn(),
}));

import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { resolveSupportedFiats } from "./converter";
import { currencyFiatApi, useGetSupportedFiatsQuery } from "./api";
import { SupportedFiatsResponseSchema } from "./schema";
import { fiatByTicker, mockSupportedFiatsResponse } from "./fixtures";
import { supportedFiatsSlice, selectSupportedFiats } from "@domain/entity-currency-fiat";

const mockResolve = resolveSupportedFiats as jest.MockedFunction<typeof resolveSupportedFiats>;

beforeEach(() => {
  jest.clearAllMocks();
  mockResolve.mockReturnValue([]);
});

describe("SupportedFiatsResponseSchema", () => {
  it("validates an array of tickers", () => {
    expect(SupportedFiatsResponseSchema.parse(mockSupportedFiatsResponse)).toEqual([
      "USD",
      "EUR",
      "GBP",
    ]);
  });

  it("validates an empty array", () => {
    expect(SupportedFiatsResponseSchema.parse([])).toHaveLength(0);
  });

  it("throws on a non-array payload", () => {
    expect(() => SupportedFiatsResponseSchema.parse("not an array")).toThrow();
  });

  it("drops non-string entries instead of rejecting the whole list", () => {
    expect(SupportedFiatsResponseSchema.parse(["USD", 1, null, "EUR"])).toEqual(["USD", "EUR"]);
  });
});

describe("currencyFiatApi configuration", () => {
  it("has the correct reducer path", () => {
    expect(currencyFiatApi.reducerPath).toBe("countervaluesApi");
  });

  it("is the Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(currencyFiatApi).toBe(countervaluesApi);
  });

  it("exposes the getSupportedFiats endpoint and its hook", () => {
    expect(currencyFiatApi.endpoints.getSupportedFiats).toBeDefined();
    expect(useGetSupportedFiatsQuery).toBeDefined();
  });
});

describe("currencyFiatApi requests", () => {
  let fetchSpy: jest.SpyInstance;

  // Wired the way the apps wire it: the store registers the *service api*, and the endpoint only
  // exists because importing this package injected it.
  const makeStore = () =>
    configureStore({
      reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: cvsApiExtra({
              countervaluesServiceUrl: "https://cvs.test",
            }),
          },
        }).concat(countervaluesApi.middleware),
    });

  function mockFetch(body: unknown) {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("getSupportedFiats hits the injected base URL with the Accept header", async () => {
    mockFetch(["USD", "EUR"]);
    const store = makeStore();

    await store.dispatch(currencyFiatApi.endpoints.getSupportedFiats.initiate());

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cvs.test/v3/supported/fiat");
    expect(request.headers.get("Accept")).toBe("application/json");
  });

  it("passes the validated tickers to resolveSupportedFiats", async () => {
    mockFetch(["USD", "EUR"]);
    const store = makeStore();

    await store.dispatch(currencyFiatApi.endpoints.getSupportedFiats.initiate());

    expect(mockResolve).toHaveBeenCalledWith(["USD", "EUR"]);
  });
});

describe("onQueryStarted", () => {
  let fetchSpy: jest.SpyInstance;

  const makeFullStore = () =>
    configureStore({
      reducer: {
        [countervaluesApi.reducerPath]: countervaluesApi.reducer,
        supportedFiats: supportedFiatsSlice.reducer,
      },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: cvsApiExtra({ countervaluesServiceUrl: "https://cvs.test" }),
          },
        }).concat(countervaluesApi.middleware),
    });

  afterEach(() => {
    jest.useRealTimers();
    fetchSpy?.mockRestore();
  });

  it("dispatches setFiats with resolved currencies on success", async () => {
    const usd = fiatByTicker("USD");
    const eur = fiatByTicker("EUR");
    mockResolve.mockReturnValue([usd, eur]);
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(["USD", "EUR"]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const store = makeFullStore();

    await store.dispatch(currencyFiatApi.endpoints.getSupportedFiats.initiate());

    expect(selectSupportedFiats(store.getState())).toEqual([usd, eur]);
  });

  it("preserves the fallback on fetch failure", async () => {
    jest.useFakeTimers();
    fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));
    const store = makeFullStore();
    const fallbackBefore = selectSupportedFiats(store.getState());

    const pending = store.dispatch(currencyFiatApi.endpoints.getSupportedFiats.initiate());
    await jest.runAllTimersAsync();
    await pending;

    expect(selectSupportedFiats(store.getState())).toBe(fallbackBefore);
  });
});

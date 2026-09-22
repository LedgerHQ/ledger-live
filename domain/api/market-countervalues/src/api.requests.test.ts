// Request-level coverage: what actually goes on the wire, and how many times.
//
// The retry assertions here are the measurement behind the policy in internals/retry.ts. They are
// counts of real dispatches through the shared base query, not a reading of the options object.

import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { createRateSource } from "./rateSource";
import { marketCountervaluesApi } from "./api";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";

jest.setTimeout(20000);

// Wired the way the apps wire it: the store registers the service api, and these endpoints only
// exist because importing this package injected them.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        serializableCheck: false,
        thunk: { extraArgument: cvsApiExtra({ countervaluesServiceUrl: "https://cvs.test" }) },
      }).concat(countervaluesApi.middleware),
  });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchSpy: jest.SpyInstance;

afterEach(() => {
  fetchSpy?.mockRestore();
});

describe("request shape", () => {
  test("getHistoricalRates hits the granularity path with URLSearchParams", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({ "2018-03-01": 9000 }));
    const store = makeStore();

    await store.dispatch(
      marketCountervaluesApi.endpoints.getHistoricalRates.initiate({
        granularity: "daily",
        from: "bitcoin",
        to: "USD",
        start: "2018-01-01",
        end: "2018-03-14",
      }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cvs.test/v3/historical/daily/simple");
    expect(request.url).toContain("from=bitcoin");
    expect(request.url).toContain("to=USD");
    expect(request.url).toContain("start=2018-01-01");
    expect(request.url).toContain("end=2018-03-14");
    expect(request.headers.get("Accept")).toBe("application/json");
  });

  test("getSpotRates sends the froms as one comma-joined parameter", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({ bitcoin: 9000 }));
    const store = makeStore();

    await store.dispatch(
      marketCountervaluesApi.endpoints.getSpotRates.initiate({
        to: "USD",
        froms: ["bitcoin", "ethereum"],
      }),
    );

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.url).toContain("https://cvs.test/v3/spot/simple");
    expect(decodeURIComponent(request.url)).toContain("froms=bitcoin,ethereum");
  });

  test("a bad entry is dropped and the rest of the batch survives", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(json({ bitcoin: 9000, ethereum: null, litecoin: 50 }));
    const store = makeStore();

    const result = await store.dispatch(
      marketCountervaluesApi.endpoints.getSpotRates.initiate({
        to: "USD",
        froms: ["bitcoin", "ethereum", "litecoin"],
      }),
    );

    expect(result.data).toEqual({ bitcoin: 9000, litecoin: 50 });
  });
});

describe("retry policy, measured", () => {
  async function attemptsFor(status: number): Promise<number> {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({ error: "no" }, status));
    const store = makeStore();

    await store.dispatch(
      marketCountervaluesApi.endpoints.getSpotRates.initiate(
        { to: "USD", froms: [`from-${status}`] },
        { forceRefetch: true },
      ),
    );

    return fetchSpy.mock.calls.length;
  }

  test("422 is requested once: an unsupported pair will not become supported", async () => {
    expect(await attemptsFor(422)).toBe(1);
  });

  test("503 is requested three times, as live-network's GET path did", async () => {
    expect(await attemptsFor(503)).toBe(3);
  });

  test("a dead connection is retried three times", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const store = makeStore();

    await store.dispatch(
      marketCountervaluesApi.endpoints.getSpotRates.initiate(
        { to: "USD", froms: ["offline"] },
        { forceRefetch: true },
      ),
    );

    expect(fetchSpy.mock.calls.length).toBe(3);
  });

  test("a 404 is not retried", async () => {
    expect(await attemptsFor(404)).toBe(1);
  });
});

describe("the error envelope reaches loadCountervalues intact", () => {
  test("a 422 surfaces as a numeric status, a dead connection does not", async () => {
    const store = makeStore();
    const rates = createRateSource({
      fetchHistoricalWindow: args =>
        store.dispatch(
          marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, {
            forceRefetch: true,
          }),
        ),
      fetchSpotBatch: args =>
        store.dispatch(
          marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true }),
        ),
    });
    const pair = {
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(json({ error: "no" }, 422));
    await expect(rates.fetchHistorical("daily", pair)).rejects.toMatchObject({ status: 422 });
    fetchSpy.mockRestore();

    fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(rates.fetchHistorical("daily", pair)).rejects.toMatchObject({
      status: "FETCH_ERROR",
    });
  });
});

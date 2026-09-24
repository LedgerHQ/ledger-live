// Degradation paths through the real endpoints: hung connections, malformed payloads, partial
// batch failures, and the endpoints that must not retry.

import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { initialState, pairId, type CounterValuesState } from "@domain/entity-market-countervalues";
import { marketCountervaluesApi } from "./api";
import { RATE_REQUEST_TIMEOUT_MS } from "./internals/retry";
import { loadCountervalues } from "./loadCountervalues";
import { createRateSource } from "./rateSource";

const DAY = 24 * 60 * 60 * 1000;
const btc = getCryptoCurrencyById("bitcoin");
const eth = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const eur = getFiatCurrencyByTicker("EUR");
const key = pairId({ from: btc, to: usd });

const settings = {
  trackingPairs: [{ from: btc, to: usd, startDate: new Date(Date.now() - 30 * DAY) }],
  autofillGaps: false,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 20,
};

function makeStore() {
  return configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        serializableCheck: false,
        thunk: { extraArgument: cvsApiExtra({ countervaluesServiceUrl: "https://cvs.test" }) },
      }).concat(countervaluesApi.middleware),
  });
}

function makeRates(store: ReturnType<typeof makeStore>) {
  return createRateSource({
    fetchHistoricalWindow: args =>
      store.dispatch(
        marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, { forceRefetch: true }),
      ),
    fetchSpotBatch: args =>
      store.dispatch(
        marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true }),
      ),
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A fetch that never answers, and only settles when its request is aborted. */
function hangingFetch() {
  return jest.spyOn(globalThis, "fetch").mockImplementation(
    input =>
      new Promise((_resolve, reject) => {
        const { signal } = input as Request;
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
  );
}

/** Drives fake timers until `promise` settles, so a 60s timeout costs no wall-clock time. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  let done = false;
  promise.then(
    () => (done = true),
    () => (done = true),
  );
  for (let i = 0; i < 20 && !done; i++) {
    await jest.advanceTimersByTimeAsync(RATE_REQUEST_TIMEOUT_MS + 5000);
  }
  if (!done) throw new Error("promise did not settle: a request is hanging without a timeout");
  return promise;
}

let fetchSpy: jest.SpyInstance;

afterEach(() => {
  fetchSpy?.mockRestore();
  jest.useRealTimers();
});

describe("a hung connection", () => {
  beforeEach(() => jest.useFakeTimers());

  test("times out after live-network's 60s, and is retried like one", async () => {
    fetchSpy = hangingFetch();
    const store = makeStore();

    const result = await settle(
      store.dispatch(
        marketCountervaluesApi.endpoints.getSpotRates.initiate(
          { to: "USD", froms: ["bitcoin"] },
          { forceRefetch: true },
        ),
      ),
    );

    expect(result.error).toMatchObject({ status: "TIMEOUT_ERROR" });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  test("still lets loadCountervalues settle, so the next poll can run", async () => {
    const seeded: CounterValuesState = await loadCountervalues(initialState, settings, {
      rates: {
        fetchHistorical: () => Promise.resolve({ "2018-03-01": 9000 }),
        fetchLatest: pairs => Promise.resolve(pairs.map(() => 9200)),
      },
    });
    fetchSpy = hangingFetch();

    const after = await settle(
      loadCountervalues(seeded, settings, { rates: makeRates(makeStore()) }),
    );

    // A timeout carries no HTTP status, so it is not counted against the pair, as before.
    expect(after.status[key]?.failures).toBeUndefined();
    expect(after.data[key]?.get("2018-03-01")).toBe(9000);
  });
});

describe("a malformed response", () => {
  test("a 200 that is not JSON is requested once and does not count as a failure", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response("<html>proxy error</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );
    const seeded: CounterValuesState = await loadCountervalues(initialState, settings, {
      rates: {
        fetchHistorical: () => Promise.resolve({ "2018-03-01": 9000 }),
        fetchLatest: pairs => Promise.resolve(pairs.map(() => 9200)),
      },
    });
    const callsBefore = fetchSpy.mock.calls.length;

    const after = await loadCountervalues(seeded, settings, { rates: makeRates(makeStore()) });

    // two historical windows and one spot batch, each asked once
    expect(fetchSpy.mock.calls.length - callsBefore).toBe(3);
    expect(after.status[key]?.failures).toBeUndefined();
    expect(after.data[key]?.get("2018-03-01")).toBe(9000);
  });
});

describe("a partial batch failure", () => {
  test("one failed spot batch loses that run's latest rates, but not the history", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(input => {
      const url = (input as Request).url;
      if (url.includes("/v3/historical/")) return Promise.resolve(json({ "2018-03-01": 9000 }));
      if (url.includes("to=EUR")) return Promise.resolve(json({ error: "no" }, 404));
      return Promise.resolve(json({ bitcoin: 9200, ethereum: 600 }));
    });
    const twoTargets = {
      ...settings,
      trackingPairs: [
        { from: btc, to: usd, startDate: new Date(Date.now() - 30 * DAY) },
        { from: eth, to: eur, startDate: new Date(Date.now() - 30 * DAY) },
      ],
    };

    const state = await loadCountervalues(initialState, twoTargets, {
      rates: makeRates(makeStore()),
    });

    expect(state.data[key]?.get("2018-03-01")).toBe(9000);
    expect(state.data[key]?.has("latest")).toBe(false);
    // a latest failure is logged and dropped; only historical failures feed the backoff
    expect(state.status[key]?.failures).toBeUndefined();
  });
});

describe("endpoints moved from live-common's client", () => {
  test("getUsdToFiatRate does not retry", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(json({ error: "no" }, 503)));

    await makeStore().dispatch(
      marketCountervaluesApi.endpoints.getUsdToFiatRate.initiate({ to: "eur" }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("getCounterValueIdsSortedByMarketCap does not retry", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(json({ error: "no" }, 503)));

    await makeStore().dispatch(
      marketCountervaluesApi.endpoints.getCounterValueIdsSortedByMarketCap.initiate(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

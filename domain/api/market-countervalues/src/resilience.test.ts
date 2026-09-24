// Degradation paths through the real endpoints: hung connections, malformed payloads, partial
// batch failures, the endpoints that must not retry, and a currency the service stopped supporting.

import { configureStore } from "@reduxjs/toolkit";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import {
  exportCountervalues,
  importCountervalues,
  initialState,
  pairId,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";
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
        thunk: {
          extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => "https://cvs.test" }),
        },
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

  test("a supported-crypto list that is not a list of ids is rejected with the schema detail", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.resolve(json({ error: "maintenance" })));

    const result = await makeStore().dispatch(
      marketCountervaluesApi.endpoints.getCounterValueIdsSortedByMarketCap.initiate(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({
      status: "CUSTOM_ERROR",
      error: expect.stringContaining("responseSchema rejected the response"),
    });
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

describe("a currency the service no longer supports", () => {
  // Measured against the live service: the history of an id it dropped answers
  // 422 {"type":"UNSUPPORTED_CURRENCY"}, and a spot batch answers 0 for it and real rates for the rest.
  const DROPPED_ID = "ethereum/erc20/not_a_real_token_zz";
  const HISTORY_DAY = "2026-05-20";
  const T0 = Date.parse("2026-06-01T12:00:00.000Z");
  const dropped = mockTokenCurrency({ id: TokenCurrencyIdSchema.parse(DROPPED_ID), ticker: "ZZ" });
  const droppedKey = pairId({ from: dropped, to: usd });

  function tracking(...froms: Currency[]) {
    return {
      ...settings,
      trackingPairs: froms.map(from => ({ from, to: usd, startDate: new Date(T0 - 30 * DAY) })),
    };
  }

  /** The live service, with `droppedIds` removed from its catalogue. */
  function service(
    droppedIds: readonly string[],
    history: Record<string, number> = { [HISTORY_DAY]: 9000 },
  ) {
    return jest.spyOn(globalThis, "fetch").mockImplementation(input => {
      const url = new URL((input as Request).url);
      if (url.pathname.startsWith("/v3/historical/")) {
        return Promise.resolve(
          droppedIds.includes(url.searchParams.get("from") ?? "")
            ? json({ type: "UNSUPPORTED_CURRENCY" }, 422)
            : json(history),
        );
      }
      const froms = url.searchParams.get("froms")?.split(",") ?? [];
      return Promise.resolve(
        json(Object.fromEntries(froms.map(id => [id, droppedIds.includes(id) ? 0 : 83065]))),
      );
    });
  }

  function historyRequestsFor(id: string): number {
    return fetchSpy.mock.calls.filter(([input]) => {
      const url = new URL((input as Request).url);
      return url.pathname.startsWith("/v3/historical/") && url.searchParams.get("from") === id;
    }).length;
  }

  /** When the backoff lets a pair be asked again: e^(failures / 2) seconds after its last try. */
  function retryAt(lastTry: number, failures: number): number {
    return lastTry + 1000 * Math.exp(failures / 2);
  }

  // Only the clock and the timers are simulated; response bodies still read through real microtasks.
  beforeEach(() =>
    jest.useFakeTimers({ now: T0, doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] }),
  );

  test("a 422 counts twice against the pair, and the next load does not ask for its history", async () => {
    fetchSpy = service([DROPPED_ID]);
    const rates = makeRates(makeStore());
    const only = tracking(dropped);

    const failed = await loadCountervalues(initialState, only, { rates });

    // daily and hourly, each asked once: a 422 is not retried
    expect(historyRequestsFor(DROPPED_ID)).toBe(2);
    expect(failed.status[droppedKey]).toMatchObject({ failures: 2, timestamp: T0 });

    await loadCountervalues(failed, only, { rates });
    expect(historyRequestsFor(DROPPED_ID)).toBe(2);
  });

  test("the backoff holds the pair until e^(failures / 2) seconds after its last try", async () => {
    fetchSpy = service([DROPPED_ID]);
    const rates = makeRates(makeStore());
    const only = tracking(dropped);
    let state = await loadCountervalues(initialState, only, { rates });
    let lastTry = T0;

    for (const failures of [2, 4, 6]) {
      expect(state.status[droppedKey]).toMatchObject({ failures, timestamp: lastTry });
      const next = retryAt(lastTry, failures);
      const asked = historyRequestsFor(DROPPED_ID);

      jest.setSystemTime(Math.floor(next));
      state = await loadCountervalues(state, only, { rates });
      expect(historyRequestsFor(DROPPED_ID)).toBe(asked);

      lastTry = Math.ceil(next);
      jest.setSystemTime(lastTry);
      state = await loadCountervalues(state, only, { rates });
      expect(historyRequestsFor(DROPPED_ID)).toBe(asked + 2);
    }
  });

  test("the backoff survives an export and an import, so a restart does not ask again", async () => {
    fetchSpy = service([DROPPED_ID]);
    const rates = makeRates(makeStore());
    const only = tracking(dropped);
    const failed = await loadCountervalues(initialState, only, { rates });

    const persisted = JSON.parse(JSON.stringify(exportCountervalues(failed, only.trackingPairs)));
    const restored = importCountervalues(persisted, only);
    expect(restored.status[droppedKey]).toEqual(failed.status[droppedKey]);

    await loadCountervalues(restored, only, { rates });
    expect(historyRequestsFor(DROPPED_ID)).toBe(2);
  });

  test("a spot batch in the service's real shape reads 0 for the dropped id and keeps the rest", async () => {
    // history answers for both pairs here, so only the spot batch is under test
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(input => {
      if ((input as Request).url.includes("/v3/historical/")) {
        return Promise.resolve(json({ [HISTORY_DAY]: 9000 }));
      }
      return Promise.resolve(json({ bitcoin: 83065, [DROPPED_ID]: 0 }));
    });

    const state = await loadCountervalues(initialState, tracking(btc, dropped), {
      rates: makeRates(makeStore()),
    });

    const spotRequests = fetchSpy.mock.calls.filter(([input]) =>
      (input as Request).url.includes("/v3/spot/"),
    );
    expect(spotRequests).toHaveLength(1);
    expect(state.data[key]?.get("latest")).toBe(83065);
    expect(state.data[droppedKey]?.get("latest")).toBe(0);
    expect(state.status[key]?.failures).toBeUndefined();
    expect(state.status[droppedKey]?.failures).toBeUndefined();
  });

  test("two pairs, one dropped: the other pair keeps its data and counts no failure", async () => {
    const rates = makeRates(makeStore());
    const both = tracking(btc, dropped);
    fetchSpy = service([]);
    const seeded = await loadCountervalues(initialState, both, { rates });
    expect(seeded.data[droppedKey]?.get(HISTORY_DAY)).toBe(9000);
    fetchSpy.mockRestore();

    // the next day, the service only sends the new day, and has dropped the token
    jest.setSystemTime(T0 + DAY);
    fetchSpy = service([DROPPED_ID], { "2026-05-21": 9100 });
    const after = await loadCountervalues(seeded, both, { rates });

    expect(after.data[key]?.get(HISTORY_DAY)).toBe(9000);
    expect(after.data[key]?.get("2026-05-21")).toBe(9100);
    expect(after.data[key]?.get("latest")).toBe(83065);
    expect(after.status[key]?.failures).toBeUndefined();
    // only the dropped pair loses its history and counts the failures
    expect(after.data[droppedKey]?.get(HISTORY_DAY)).toBeUndefined();
    expect(after.status[droppedKey]?.failures).toBe(2);
  });
});

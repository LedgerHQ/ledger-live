// The three network behaviours that must survive the move off @ledgerhq/live-network.
//
// They are all decided by ONE line in loadCountervalues: `typeof e.status === "number"`. A 422 and
// a 503 carry a numeric status; a dead connection carries "FETCH_ERROR". Anything that flattens
// those into a shared error type loses the distinction silently, which is why RateFetchError
// carries RTK Query's status verbatim rather than mapping it.

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { initialState, pairId } from "@domain/entity-market-countervalues";
import type { CounterValuesState } from "@domain/entity-market-countervalues";
import { RateFetchError } from "./errors";
import { loadCountervalues } from "./loadCountervalues";
import type { RateSource } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const from = getCryptoCurrencyById("bitcoin");
const to = getFiatCurrencyByTicker("USD");
const key = pairId({ from, to });

const settings = {
  trackingPairs: [{ from, to, startDate: new Date(Date.now() - 30 * DAY) }],
  autofillGaps: false,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 20,
};

function rejection(status: number | string) {
  return Promise.reject(
    new RateFetchError(
      typeof status === "number"
        ? { status, data: undefined }
        : { status: status as "FETCH_ERROR", error: "connect ECONNREFUSED" },
    ),
  );
}

/**
 * A rate source where both fetches fail the given way.
 *
 * Both, deliberately: a 422 deletes the pair from `data`, but a *successful* latest fetch in the
 * same run re-creates it with a `latest` entry, so a source that only failed the historical call
 * would not show the wipe at all.
 */
function failingWith(status: number | string): RateSource {
  return {
    fetchHistorical: () => rejection(status),
    fetchLatest: () => rejection(status),
  };
}

/** A state that already holds data and a cache entry for the tracked pair. */
async function seeded(): Promise<CounterValuesState> {
  const state = await loadCountervalues(initialState, settings, {
    rates: {
      fetchHistorical: () => Promise.resolve({ "2018-03-01": 9000, "2018-03-02": 9100 }),
      fetchLatest: pairs => Promise.resolve(pairs.map(() => 9200)),
    },
  });
  expect(state.data[key]).toBeDefined();
  expect(state.cache[key]).toBeDefined();
  return state;
}

test("a 422 on an unsupported pair wipes that pair's cache", async () => {
  const before = await seeded();

  const after = await loadCountervalues(before, settings, { rates: failingWith(422) });

  expect(after.data[key]).toBeUndefined();
  expect(after.cache[key]).toBeUndefined();
});

test("an HTTP failure increments the per-pair backoff", async () => {
  const before = await seeded();
  expect(before.status[key]?.failures).toBeUndefined();

  // One load fetches the pair at both granularities, so each failed load counts twice.
  const once = await loadCountervalues(before, settings, { rates: failingWith(503) });
  expect(once.status[key]?.failures).toBe(2);

  // The backoff discards the pair while it is cooling down, so step past the retry window.
  const cooled = {
    ...once,
    status: { ...once.status, [key]: { ...once.status[key], timestamp: 0 } },
  };
  const twice = await loadCountervalues(cooled, settings, { rates: failingWith(503) });
  expect(twice.status[key]?.failures).toBe(4);
});

test("the backoff discards a cooling-down pair instead of refetching it", async () => {
  const before = await seeded();
  const failed = await loadCountervalues(before, settings, { rates: failingWith(503) });

  const fetchHistorical = jest.fn();
  await loadCountervalues(failed, settings, {
    rates: { fetchHistorical, fetchLatest: pairs => Promise.resolve(pairs.map(() => 1)) },
  });

  expect(fetchHistorical).not.toHaveBeenCalled();
});

test("network down does NOT count as a failure", async () => {
  const before = await seeded();

  const after = await loadCountervalues(before, settings, { rates: failingWith("FETCH_ERROR") });

  expect(after.status[key]?.failures).toBeUndefined();
  // and the pair's data survives, unlike the 422 case
  expect(after.data[key]).toBeDefined();
  expect(after.cache[key]).toBeDefined();
});

test("a 503 leaves the pair's data alone, unlike a 422", async () => {
  const before = await seeded();

  const after = await loadCountervalues(before, settings, { rates: failingWith(503) });

  expect(after.data[key]).toBeDefined();
  expect(after.cache[key]).toBeDefined();
});

test("a non-numeric historical value is dropped, exactly as a stored null was", async () => {
  // loadCountervalues has always filtered with `typeof v === "number"` when applying a patch, so
  // dropping the entry in the schema instead changes nothing that reaches the rate map.
  const state = await loadCountervalues(initialState, settings, {
    rates: {
      fetchHistorical: () =>
        Promise.resolve({ "2018-03-01": 9000, "2018-03-02": null } as unknown as Record<
          string,
          number
        >),
      fetchLatest: pairs => Promise.resolve(pairs.map(() => 9200)),
    },
  });

  expect(state.data[key]?.get("2018-03-01")).toBe(9000);
  expect(state.data[key]?.has("2018-03-02")).toBe(false);
});

test("disableAutoRecoverErrors rethrows instead of counting a failure", async () => {
  await expect(
    loadCountervalues(
      initialState,
      { ...settings, disableAutoRecoverErrors: true },
      { rates: failingWith(500) },
    ),
  ).rejects.toBeInstanceOf(RateFetchError);
});

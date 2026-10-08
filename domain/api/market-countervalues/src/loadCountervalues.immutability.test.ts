// loadCountervalues must leave the state it loads from untouched, so its result can live in a
// store that freezes what it holds (immer, behind createSlice) and be fed back on the next poll.

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  initialState,
  pairId,
  type CounterValuesState,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { loadCountervalues } from "./loadCountervalues";
import type { RateSource } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const HISTORY_DAY = "2018-03-01";
const btc = getCryptoCurrencyById("bitcoin");
const eth = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const keys = [pairId({ from: btc, to: usd }), pairId({ from: eth, to: usd })];

const settings: CountervaluesSettings = {
  trackingPairs: [
    { from: btc, to: usd, startDate: new Date(Date.now() - 30 * DAY) },
    { from: eth, to: usd, startDate: new Date(Date.now() - 30 * DAY) },
  ],
  autofillGaps: true,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 20,
};

/** Every poll returns a new latest rate, so every load patches every pair it already holds. */
function tickingRates(): RateSource {
  let tick = 0;
  return {
    fetchHistorical: () => Promise.resolve({ [HISTORY_DAY]: 9000 }),
    fetchLatest: pairs => {
      tick++;
      return Promise.resolve(pairs.map((_, i) => 1000 * (i + 1) + tick));
    },
  };
}

function snapshot({ data, cache, status }: CounterValuesState) {
  return {
    data: Object.entries(data).map(([key, map]) => [key, [...map]]),
    cache: Object.entries(cache).map(([key, { map, stats, fallback }]) => [
      key,
      [...map],
      { ...stats },
      fallback,
    ]),
    status: structuredClone(status),
  };
}

/** What immer's deep freeze does: throwing `set`/`delete`/`clear` on a Map, `Object.freeze` on all. */
function freezeLikeImmer<T>(value: T): T {
  if (value instanceof Map) {
    for (const method of ["set", "delete", "clear"]) {
      Object.defineProperty(value, method, {
        value: () => {
          throw new Error("[Immer] This object has been frozen and should not be mutated");
        },
      });
    }
    value.forEach(freezeLikeImmer);
    Object.freeze(value);
  } else if (
    value !== null &&
    typeof value === "object" &&
    (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)
  ) {
    Object.values(value).forEach(freezeLikeImmer);
    Object.freeze(value);
  }
  return value;
}

describe("loadCountervalues copy-on-write", () => {
  test("leaves every Map of the state it loads from unchanged", async () => {
    const rates = tickingRates();
    const before = await loadCountervalues(initialState, settings, { rates });
    const expected = snapshot(before);

    const after = await loadCountervalues(before, settings, { rates });

    expect(snapshot(before)).toEqual(expected);
    for (const key of keys) {
      expect(after.data[key]).not.toBe(before.data[key]);
      expect(after.data[key]?.get("latest")).not.toBe(before.data[key]?.get("latest"));
    }
  });

  test("loads twice in a row from a stored state frozen the way immer freezes it", async () => {
    const rates = tickingRates();
    const seeded = freezeLikeImmer(await loadCountervalues(initialState, settings, { rates }));
    expect(() => seeded.data[keys[0]]?.set("latest", 0)).toThrow(/frozen/);

    const once = freezeLikeImmer(await loadCountervalues(seeded, settings, { rates }));
    const twice = await loadCountervalues(once, settings, { rates });

    expect(twice.data[keys[0]]?.get("latest")).toBe(1003);
    expect(twice.data[keys[1]]?.get("latest")).toBe(2003);
  });

  test("keeps polling through a createSlice reducer", async () => {
    const slice = createSlice({
      name: "rates",
      initialState,
      reducers: {
        set: (_state, action: PayloadAction<CounterValuesState>) => action.payload,
      },
    });
    const rates = tickingRates();
    let stored = slice.reducer(undefined, { type: "init" });

    for (let poll = 0; poll < 3; poll++) {
      stored = slice.reducer(
        stored,
        slice.actions.set(await loadCountervalues(stored, settings, { rates })),
      );
      expect(Object.isFrozen(stored.data[keys[0]])).toBe(true);
    }

    expect(stored.data[keys[0]]?.get("latest")).toBe(1003);
  });
});

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  BTCtoUSD,
  buildCV,
  buildMultiCV,
  dailyHistory,
  getBTCValues,
  referenceSnapshotDate,
  TICKER_TO_ID_AND_VALUE,
} from "./mock";
import { pairId } from "./helpers";
import { calculate } from "./logic";

describe("getBTCValues", () => {
  test("reduces the table to ticker -> value in BTC", () => {
    const values = getBTCValues();

    expect(values.BTC).toBe(1);
    expect(Object.keys(values)).toEqual(Object.keys(TICKER_TO_ID_AND_VALUE));
  });

  test("computes the table once", () => {
    expect(getBTCValues()).toBe(getBTCValues());
  });
});

describe("TICKER_TO_ID_AND_VALUE", () => {
  test("gives every ticker a non-empty id and a positive value", () => {
    for (const [ticker, [id, value]] of Object.entries(TICKER_TO_ID_AND_VALUE)) {
      expect(id).not.toBe("");
      expect(value).toBeGreaterThan(0);
      expect(ticker).toBe(ticker.toUpperCase());
    }
  });
});

test("the snapshot the mock rates are anchored on", () => {
  expect(referenceSnapshotDate.getTime()).toBe(1588421046099);
  expect(BTCtoUSD).toBe(9000);
});

describe("dailyHistory", () => {
  test("keys each rate by the UTC day of its date", () => {
    expect(
      dailyHistory([
        [new Date("2025-01-15T09:30:00.000Z"), 2000],
        [new Date("2025-02-20T23:59:59.000Z"), 2400],
      ]),
    ).toEqual({ "2025-01-15": 2000, "2025-02-20": 2400 });
  });

  test("keeps the last rate when two entries fall on the same day", () => {
    expect(
      dailyHistory([
        [new Date("2025-01-15T01:00:00.000Z"), 1],
        [new Date("2025-01-15T22:00:00.000Z"), 2],
      ]),
    ).toEqual({ "2025-01-15": 2 });
  });
});

describe("buildCV", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const pair = { from: bitcoin, to: usd };
  const id = pairId(pair);

  test("registers the pair under its id in data, status and cache", () => {
    const state = buildCV({ pair, history: { "2025-01-15": 50000 }, latest: 90000 });

    expect(Object.keys(state.data)).toEqual([id]);
    expect(Object.keys(state.cache)).toEqual([id]);
    expect(state.status[id]).toHaveProperty("timestamp");
  });

  test("stores the history and the latest rate on the rate map", () => {
    const state = buildCV({ pair, history: { "2025-01-15": 50000 }, latest: 90000 });

    expect(state.cache[id]!.map.get("2025-01-15")).toBe(50000);
    expect(state.cache[id]!.map.get("latest")).toBe(90000);
  });

  test("derives stats from the history, ignoring the latest key", () => {
    const state = buildCV({
      pair,
      history: { "2025-01-15": 50000, "2025-03-01": 60000 },
      latest: 90000,
    });
    const { stats } = state.cache[id]!;

    expect(stats.oldest).toBe("2025-01-15");
    expect(stats.oldestDate).toEqual(new Date("2025-01-15T00:00:00.000Z"));
    // A sentinel day past the end keeps the pair readable at "now".
    expect(stats.earliest).toBe("2099-01-01");
    expect(stats.earliestStableDate).toEqual(new Date("2099-01-01T00:00:00.000Z"));
  });

  test("moves earliestStableDate back to the first declared hole", () => {
    const state = buildCV({
      pair,
      history: { "2025-01-15": 50000 },
      holes: ["2025-06-01", "2025-04-01"],
    });

    expect(state.cache[id]!.stats.earliestStableDate).toEqual(new Date("2025-04-01T00:00:00.000Z"));
  });

  test("builds an empty-history pair without throwing", () => {
    const state = buildCV({ pair });

    expect(state.cache[id]!.stats.oldest).toBe("2099-01-01");
  });

  test("produces state that calculate can read back", () => {
    const state = buildCV({ pair, latest: 50000 });

    // 1 BTC in satoshis, at 50000 USD, in cents
    expect(calculate(state, { value: 1e8, from: bitcoin, to: usd })).toBe(5e6);
  });

  test("buildMultiCV keeps each pair independent", () => {
    const ethUsd = { from: ethereum, to: usd };
    const state = buildMultiCV([
      { pair, latest: 50000 },
      { pair: ethUsd, latest: 2000 },
    ]);

    expect(Object.keys(state.cache).sort()).toEqual([id, pairId(ethUsd)].sort());
    expect(calculate(state, { value: 1e8, from: bitcoin, to: usd })).toBe(5e6);
    expect(calculate(state, { value: 1e18, from: ethereum, to: usd })).toBe(2e5);
  });
});

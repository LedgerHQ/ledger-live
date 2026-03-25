import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import type { CounterValuesState, TrackingPair } from "@ledgerhq/live-countervalues/types";
import { shouldPersistCountervaluesExport } from "./countervaluesDbSaveStats";

function cvState(): CounterValuesState {
  return {
    data: { "USD bitcoin": new Map([["2024-01-01", 1]]) },
    status: { "USD bitcoin": {} },
    cache: {
      "USD bitcoin": {
        map: new Map(),
        stats: {
          oldest: "2024-01-01",
          earliest: "2024-01-01",
          oldestDate: new Date("2024-01-01"),
          earliestDate: new Date("2024-01-01"),
          earliestStableDate: new Date("2024-01-01"),
        },
      },
    },
  } as CounterValuesState;
}

function pair(fromId: string): TrackingPair {
  return {
    from: getCryptoCurrencyById(fromId),
    to: getFiatCurrencyByTicker("USD"),
    startDate: new Date("2024-01-01"),
  };
}

describe("shouldPersistCountervaluesExport", () => {
  test("returns false when CV unchanged, pairs unchanged, and baseline exists", () => {
    const s = cvState();
    const p = [pair("bitcoin")];
    expect(
      shouldPersistCountervaluesExport({
        oldCvState: s,
        newCvState: s,
        currentTrackingPairs: p,
        lastPersistedTrackingPairs: p,
      }),
    ).toBe(false);
  });

  test("returns false when CV unchanged and no pair baseline yet (caller primes baseline)", () => {
    const s = cvState();
    expect(
      shouldPersistCountervaluesExport({
        oldCvState: s,
        newCvState: s,
        currentTrackingPairs: [pair("bitcoin")],
        lastPersistedTrackingPairs: undefined,
      }),
    ).toBe(false);
  });

  test("returns true when CV slice has new export per hasNewCountervaluesToExport", () => {
    const oldS = cvState();
    const newS = {
      ...oldS,
      status: { "USD bitcoin": {}, "USD ethereum": {} },
      cache: {
        ...oldS.cache,
        "USD ethereum": {
          map: new Map(),
          stats: {
            oldest: "2024-01-01",
            earliest: "2024-01-01",
            oldestDate: new Date("2024-01-01"),
            earliestDate: new Date("2024-01-01"),
            earliestStableDate: new Date("2024-01-01"),
          },
        },
      },
    } as CounterValuesState;
    expect(
      shouldPersistCountervaluesExport({
        oldCvState: oldS,
        newCvState: newS,
        currentTrackingPairs: [pair("bitcoin")],
        lastPersistedTrackingPairs: [pair("bitcoin")],
      }),
    ).toBe(true);
  });

  test("returns true when CV unchanged but tracking pairs changed vs last persisted", () => {
    const s = cvState();
    expect(
      shouldPersistCountervaluesExport({
        oldCvState: s,
        newCvState: s,
        currentTrackingPairs: [pair("bitcoin"), pair("ethereum")],
        lastPersistedTrackingPairs: [pair("bitcoin")],
      }),
    ).toBe(true);
  });
});

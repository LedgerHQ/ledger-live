import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  CounterValuesStateRawSchema,
  CounterValuesStateSchema,
  CountervaluesSettingsSchema,
  PairRateMapCacheSchema,
  RateGranularitySchema,
  RateMapSchema,
  TrackingPairSchema,
} from "./schema";

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");

describe("RateGranularitySchema", () => {
  test("accepts the two granularities and nothing else", () => {
    expect(RateGranularitySchema.parse("daily")).toBe("daily");
    expect(RateGranularitySchema.parse("hourly")).toBe("hourly");
    expect(RateGranularitySchema.safeParse("weekly").success).toBe(false);
  });
});

describe("RateMapSchema", () => {
  test("accepts a Map of date key to rate", () => {
    const map = new Map([
      ["latest", 50000],
      ["2024-01-01", 42000],
    ]);

    expect(RateMapSchema.parse(map)).toEqual(map);
  });

  test("rejects a plain object and non-numeric rates", () => {
    expect(RateMapSchema.safeParse({ latest: 50000 }).success).toBe(false);
    expect(RateMapSchema.safeParse(new Map([["latest", "50000"]])).success).toBe(false);
  });
});

describe("TrackingPairSchema", () => {
  test("accepts a pair of currencies with a start date", () => {
    const pair = { from: bitcoin, to: usd, startDate: new Date("2024-01-01T00:00:00.000Z") };

    expect(TrackingPairSchema.parse(pair)).toEqual(pair);
  });

  test("rejects a start date passed as an ISO string", () => {
    const result = TrackingPairSchema.safeParse({
      from: bitcoin,
      to: usd,
      startDate: "2024-01-01",
    });

    expect(result.success).toBe(false);
  });

  test("rejects a currency that is not one of the three kinds", () => {
    const result = TrackingPairSchema.safeParse({
      from: { type: "PointsCurrency", ticker: "PTS", units: [] },
      to: usd,
      startDate: new Date(),
    });

    expect(result.success).toBe(false);
  });
});

describe("PairRateMapCacheSchema", () => {
  test("accepts a cache entry whose stats bounds are unknown", () => {
    const cache = {
      map: new Map([["latest", 50000]]),
      stats: {
        oldest: null,
        earliest: null,
        oldestDate: null,
        earliestDate: null,
        earliestStableDate: null,
      },
    };

    expect(PairRateMapCacheSchema.parse(cache)).toEqual(cache);
  });
});

describe("CounterValuesStateSchema", () => {
  test("accepts the initial, empty state", () => {
    expect(CounterValuesStateSchema.parse({ data: {}, status: {}, cache: {} })).toEqual({
      data: {},
      status: {},
      cache: {},
    });
  });

  test("rejects a data entry that is a plain object rather than a Map", () => {
    const result = CounterValuesStateSchema.safeParse({
      data: { "USD bitcoin": { latest: 50000 } },
      status: {},
      cache: {},
    });

    expect(result.success).toBe(false);
  });
});

describe("CounterValuesStateRawSchema", () => {
  test("keeps status typed while every other key holds a serialized rate map", () => {
    const raw = {
      status: { "USD bitcoin": { timestamp: 1, failures: 0, oldestDateRequested: "2024-01-01" } },
      "USD bitcoin": { "2024-01-01": 50000 },
    };

    expect(CounterValuesStateRawSchema.parse(raw)).toEqual(raw);
  });

  test("rejects a pair entry that is not a map of numbers", () => {
    const result = CounterValuesStateRawSchema.safeParse({
      status: {},
      "USD bitcoin": { "2024-01-01": "50000" },
    });

    expect(result.success).toBe(false);
  });
});

describe("CountervaluesSettingsSchema", () => {
  test("accepts the settings the apps build", () => {
    const settings = {
      trackingPairs: [{ from: bitcoin, to: usd, startDate: new Date("2024-01-01T00:00:00.000Z") }],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
      granularitiesRates: { daily: 1, hourly: 2 },
    };

    expect(CountervaluesSettingsSchema.parse(settings)).toEqual(settings);
  });

  test("rejects a granularity the rates map does not know", () => {
    const result = CountervaluesSettingsSchema.safeParse({
      trackingPairs: [],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
      granularitiesRates: { weekly: 1 },
    });

    expect(result.success).toBe(false);
  });
});

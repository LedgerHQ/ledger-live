import {
  CryptoCurrencyIdSchema,
  getCryptoCurrencyById,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { Currency } from "@domain/entity-currency";
import {
  applyRatePatches,
  calculate,
  calculateMany,
  exportCountervalues,
  filterSupportedTrackingPairs,
  hasNewCountervaluesToExport,
  importCountervalues,
  initialState,
  resolveTrackingPairs,
  trackingPairIds,
} from "./logic";
import type { CounterValuesState, CountervaluesSettings, TrackingPair } from "./types";
import {
  datapointRetention,
  formatCounterValueDay,
  formatCounterValueHour,
  pairId,
} from "./helpers";

describe("filterSupportedTrackingPairs", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const unsupportedToken: TokenCurrency = {
    type: "TokenCurrency",
    id: TokenCurrencyIdSchema.parse(
      "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    ),
    contractAddress: "0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
    tokenType: "erc20",
    name: "Ledger Staked Shared ETH",
    ticker: "osETH",
    delisted: false,
    disableCountervalue: false,
    units: [{ name: "osETH", code: "osETH", magnitude: 18 }],
  };
  const assetHubPolkadot: CryptoCurrency = {
    ...ethereum,
    id: CryptoCurrencyIdSchema.parse("assethub_polkadot"),
    name: "Asset Hub Polkadot",
    ticker: "DOT",
  };

  function trackingPair(from: Currency): TrackingPair {
    return { from, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") };
  }

  test("should remove unsupported token pairs when supported ids are loaded", () => {
    const supportedPair = trackingPair(bitcoin);
    const unsupportedPair = trackingPair(unsupportedToken);

    expect(filterSupportedTrackingPairs([supportedPair, unsupportedPair], ["bitcoin"])).toEqual([
      supportedPair,
    ]);
  });

  test("should keep supported crypto pairs", () => {
    const pairs = [trackingPair(bitcoin), trackingPair(ethereum)];

    expect(filterSupportedTrackingPairs(pairs, ["bitcoin", "ethereum"])).toBe(pairs);
  });

  test("should keep pairs unchanged when supported ids are unavailable", () => {
    const pairs = [trackingPair(bitcoin), trackingPair(unsupportedToken)];

    expect(filterSupportedTrackingPairs(pairs)).toBe(pairs);
    expect(filterSupportedTrackingPairs(pairs, [])).toBe(pairs);
  });

  test("should keep fiat source pairs", () => {
    const pairs = [{ from: usd, to: bitcoin, startDate: new Date("2026-06-19T00:00:00.000Z") }];

    expect(filterSupportedTrackingPairs(pairs, ["bitcoin"])).toBe(pairs);
  });

  test("should match supported ids through countervalues API id inference", () => {
    const pairs = [trackingPair(assetHubPolkadot)];

    expect(filterSupportedTrackingPairs(pairs, ["polkadot"])).toBe(pairs);
  });
});

describe("exportCountervalues", () => {
  const DAY = 24 * 60 * 60 * 1000;

  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const defaultTrackingPairs: TrackingPair[] = [
    { from: bitcoin, to: usd, startDate: new Date() },
    { from: ethereum, to: usd, startDate: new Date() },
  ];

  describe("hourlyLimit filtering", () => {
    test("keeps recent daily data within retention period", () => {
      const recentDailyDate = new Date(Date.now() - 15 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);

      const state = createState({
        "USD bitcoin": new Map([[recentDailyKey, 50000]]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs);

      expect(exported["USD bitcoin"]).toEqual({
        [recentDailyKey]: 50000,
      });
    });

    test("keeps recent hourly data within retention period", () => {
      const recentHourlyDate = new Date(Date.now() - 5 * DAY);
      const recentHourlyKey = formatCounterValueHour(recentHourlyDate);

      const state = createState({
        "USD bitcoin": new Map([[recentHourlyKey, 51000]]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs);

      expect(exported["USD bitcoin"]).toEqual({
        [recentHourlyKey]: 51000,
      });
    });

    test("filters out old hourly data beyond retention period", () => {
      const oldHourlyDate = new Date(Date.now() - datapointRetention.hourly - DAY);
      const oldHourlyKey = formatCounterValueHour(oldHourlyDate);
      const recentDailyDate = new Date(Date.now() - 5 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);

      const state = createState({
        "USD bitcoin": new Map([
          [oldHourlyKey, 48000],
          [recentDailyKey, 52000],
        ]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs);

      expect(exported["USD bitcoin"]).toEqual({
        [recentDailyKey]: 52000,
      });
    });

    test("does not export latest (history only); pair with only latest is omitted", () => {
      const state = createState({
        "USD bitcoin": new Map([["latest", 48000]]),
      });
      const exported = exportCountervalues(state, defaultTrackingPairs);
      expect(exported["USD bitcoin"]).toBeUndefined();
    });

    test("handles mixed data with multiple pairs", () => {
      const oldHourlyDate = new Date(Date.now() - datapointRetention.hourly - DAY);
      const oldHourlyKey = formatCounterValueHour(oldHourlyDate);
      const recentHourlyDate = new Date(Date.now() - 2 * DAY);
      const recentHourlyKey = formatCounterValueHour(recentHourlyDate);
      const recentDailyDate = new Date(Date.now() - 15 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);
      const oldDailyDate = new Date(Date.now() - 30 * DAY - DAY);
      const oldDailyKey = formatCounterValueDay(oldDailyDate);
      const borderlineHourlyDate = new Date(Date.now() - datapointRetention.hourly + 1000);
      const borderlineHourlyKey = `${formatCounterValueDay(borderlineHourlyDate)}T00`;

      const state = createState({
        "USD bitcoin": new Map([
          [oldHourlyKey, 48000],
          [recentHourlyKey, 52000],
          ["latest", 53000],
          [recentDailyKey, 50000],
          [oldDailyKey, 45000],
        ]),
        "USD ethereum": new Map([
          [oldHourlyKey, 3000],
          ["latest", 3100],
          [recentHourlyKey, 3200],
          [borderlineHourlyKey, 3300],
        ]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs);

      expect(exported["USD bitcoin"]).toEqual({
        [recentHourlyKey]: 52000,
        [recentDailyKey]: 50000,
        [oldDailyKey]: 45000,
      });

      expect(exported["USD ethereum"]).toEqual({
        [recentHourlyKey]: 3200,
        [borderlineHourlyKey]: 3300,
      });
    });
  });

  test("skips pairs that are not in trackingPairs", () => {
    const recentDailyKey = formatCounterValueDay(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
    const state = createState({
      "USD bitcoin": new Map([[recentDailyKey, 50000]]),
      "EUR bitcoin": new Map([[recentDailyKey, 3000]]),
    });

    const trackingPairs: TrackingPair[] = [{ from: bitcoin, to: usd, startDate: new Date() }];

    const exported = exportCountervalues(state, trackingPairs);

    expect(exported["USD bitcoin"]).toEqual({ [recentDailyKey]: 50000 });
    expect(exported["EUR bitcoin"]).toBeUndefined();
  });

  test("skips invalid data", () => {
    const recentDailyKey = formatCounterValueDay(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
    const state = createState({
      "USD bitcoin": new Map([[recentDailyKey, 50000]]),
      ...["ethereum/erc20/wrapped_bitcoin", "neon_evm/erc20/wrapped_bitcoin"],
    });

    const exported = exportCountervalues(state, defaultTrackingPairs);

    expect(exported["USD bitcoin"]).toEqual({ [recentDailyKey]: 50000 });
    expect(exported["USD ethereum"]).toBeUndefined();
  });

  test("skips empty data maps and does not export pairs with only latest", () => {
    const recentDailyKey = formatCounterValueDay(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
    const state = createState({
      "USD bitcoin": new Map([[recentDailyKey, 50000]]),
      "USD ethereum": new Map([["latest", 3000]]),
    });

    const exported = exportCountervalues(state, defaultTrackingPairs);

    expect(exported["USD bitcoin"]).toEqual({ [recentDailyKey]: 50000 });
    expect(exported["USD ethereum"]).toBeUndefined();
  });

  test("exports status when present (to track unknown pairs and avoid redoing failed HTTP)", () => {
    const state: CounterValuesState = {
      data: {
        "USD bitcoin": new Map([["2024-01-01", 55000]]),
      },
      status: {
        "USD bitcoin": {
          timestamp: 1234567890,
          failures: 0,
          oldestDateRequested: "2024-01-01",
        },
      },
      cache: {},
    };

    const exported = exportCountervalues(state, defaultTrackingPairs);

    expect(exported.status).toEqual(state.status);
    expect(exported["USD bitcoin"]).toEqual({ "2024-01-01": 55000 });
  });

  function createState(data: Record<string, unknown>) {
    return { data, status: {}, cache: {} } as CounterValuesState;
  }
});

describe("hasNewCountervaluesToExport", () => {
  function createState(data: Record<string, unknown>) {
    return { data, status: {}, cache: {} } as CounterValuesState;
  }

  test("returns true when set of status keys changes (new or removed pair)", () => {
    const oldState = {
      ...createState({ "USD bitcoin": new Map([["2024-01-01", 1]]) }),
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
    const newState = {
      ...oldState,
      status: { "USD bitcoin": {}, "USD ethereum": {} },
      cache: {
        ...oldState.cache,
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
    expect(hasNewCountervaluesToExport(oldState, newState)).toBe(true);
  });

  test("returns true when cache.stats.oldest or cache.stats.earliest changes", () => {
    const oldState = {
      ...createState({ "USD bitcoin": new Map([["2024-01-01", 1]]) }),
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
    const newState = {
      ...oldState,
      cache: {
        "USD bitcoin": {
          map: new Map(),
          stats: {
            oldest: "2024-01-01",
            earliest: "2024-01-02",
            oldestDate: new Date("2024-01-01"),
            earliestDate: new Date("2024-01-02"),
            earliestStableDate: new Date("2024-01-02"),
          },
        },
      },
    } as CounterValuesState;
    expect(hasNewCountervaluesToExport(oldState, newState)).toBe(true);
  });

  test("returns false when state is unchanged (same status keys and cache stats)", () => {
    const state = {
      ...createState({ "USD bitcoin": new Map([["2024-01-01", 1]]) }),
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
    expect(hasNewCountervaluesToExport(state, state)).toBe(false);
  });
});

describe("checkHolesOnNextLoad", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const usd = getFiatCurrencyByTicker("USD");
  const settings = {
    trackingPairs: [{ from: bitcoin, to: usd, startDate: new Date() }],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  };

  test("importCountervalues sets checkHolesOnNextLoad true so first load after restore checks holes", () => {
    const raw = {
      status: {},
      "USD bitcoin": { "2024-01-01": 50000 },
    };
    const imported = importCountervalues(raw, settings);
    expect(imported.checkHolesOnNextLoad).toBe(true);
  });
});

// The rate maths used to be covered through loadCountervalues against the mock API. That entry
// point stays in the countervalues library, so the pure half is exercised directly here.
describe("calculate", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const usd = getFiatCurrencyByTicker("USD");
  const eur = getFiatCurrencyByTicker("EUR");
  const settings: CountervaluesSettings = {
    trackingPairs: [],
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  };
  const state = importCountervalues(
    { status: {}, "USD bitcoin": { "2024-01-01": 50000 } },
    settings,
  );

  test("returns the value untouched when both currencies are the same", () => {
    expect(calculate(state, { value: 42, from: bitcoin, to: bitcoin })).toBe(42);
  });

  test("applies the rate and the magnitude ratio", () => {
    // 1 BTC, in satoshis, at 50000 USD, in cents
    expect(calculate(state, { value: 1e8, from: bitcoin, to: usd })).toBe(5e6);
  });

  test("inverts the rate and the ratio when reverse is set", () => {
    expect(calculate(state, { value: 5e6, from: bitcoin, to: usd, reverse: true })).toBe(1e8);
  });

  test("rounds unless disableRounding is set", () => {
    expect(calculate(state, { value: 1, from: bitcoin, to: usd })).toBe(0);
    expect(
      calculate(state, { value: 1, from: bitcoin, to: usd, disableRounding: true }),
    ).toBeCloseTo(0.05);
  });

  test("returns undefined for a pair that is not tracked", () => {
    expect(calculate(state, { value: 1e8, from: bitcoin, to: eur })).toBeUndefined();
  });

  test("calculateMany maps every datapoint through the same rate", () => {
    const points = [
      { value: 1e8, date: null },
      { value: 2e8, date: null },
    ];

    expect(calculateMany(state, points, { from: bitcoin, to: usd })).toEqual([5e6, 1e7]);
    expect(calculateMany(state, points, { from: bitcoin, to: eur })).toEqual([
      undefined,
      undefined,
    ]);
  });
});

describe("autofillGaps", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const usd = getFiatCurrencyByTicker("USD");
  const raw = { status: {}, "USD bitcoin": { "2024-01-01": 50000 } };

  function settings(autofillGaps: boolean): CountervaluesSettings {
    return { trackingPairs: [], autofillGaps, refreshRate: 60000, marketCapBatchingAfterRank: 20 };
  }

  test("shifts the last known rate forward, so a hole resolves to it", () => {
    const state = importCountervalues(raw, settings(true));

    expect(state.cache["USD bitcoin"].map.get("2024-01-02")).toBe(50000);
    expect(state.cache["USD bitcoin"].fallback).toBe(50000);
    expect(calculate(state, { value: 1e8, from: bitcoin, to: usd })).toBe(5e6);
  });

  test("leaves the hole open when off, and no latest rate is inferred", () => {
    const state = importCountervalues(raw, settings(false));

    expect(state.cache["USD bitcoin"].map.has("2024-01-02")).toBe(false);
    expect(state.cache["USD bitcoin"].fallback).toBe(0);
    expect(calculate(state, { value: 1e8, from: bitcoin, to: usd })).toBeUndefined();
  });
});

describe("resolveTrackingPairs", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const older = new Date("2024-01-01T00:00:00.000Z");
  const newer = new Date("2024-06-01T00:00:00.000Z");

  test("drops same-currency pairs", () => {
    expect(resolveTrackingPairs([{ from: usd, to: usd, startDate: older }])).toEqual([]);
  });

  test("dedups a pair, keeping the oldest start date", () => {
    const resolved = resolveTrackingPairs([
      { from: bitcoin, to: usd, startDate: newer },
      { from: bitcoin, to: usd, startDate: older },
    ]);

    expect(resolved).toEqual([{ from: bitcoin, to: usd, startDate: older }]);
  });

  test("sorts by pair id, so the API is called in a deterministic order", () => {
    const resolved = resolveTrackingPairs([
      { from: ethereum, to: usd, startDate: older },
      { from: bitcoin, to: usd, startDate: older },
    ]);

    expect(trackingPairIds(resolved)).toEqual(["USD bitcoin", "USD ethereum"]);
  });
});

describe("applyRatePatches", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const btcUsd = pairId({ from: bitcoin, to: usd });
  const ethUsd = pairId({ from: ethereum, to: usd });
  const settings: CountervaluesSettings = {
    trackingPairs: [{ from: bitcoin, to: usd, startDate: new Date("2018-01-01") }],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  };

  function emptyNext() {
    return { data: {}, cache: {}, status: {} } as Pick<
      CounterValuesState,
      "data" | "cache" | "status"
    >;
  }

  it("merges rates into a new pair and builds its cache", () => {
    const state = applyRatePatches(
      initialState,
      emptyNext(),
      [{ [btcUsd]: { "2018-03-01": 9000, "2018-03-02": 9100 } }],
      settings,
    );

    expect([...(state.data[btcUsd]?.entries() ?? [])]).toEqual([
      ["2018-03-01", 9000],
      ["2018-03-02", 9100],
    ]);
    expect(state.cache[btcUsd]?.stats.oldest).toBe("2018-03-01");
  });

  it("skips non-numeric values, such as a missing latest rate", () => {
    const state = applyRatePatches(
      initialState,
      emptyNext(),
      [{ [btcUsd]: { latest: null, "2018-03-01": 9000 } }],
      settings,
    );

    expect(state.data[btcUsd]?.has("latest")).toBe(false);
    expect(state.data[btcUsd]?.get("2018-03-01")).toBe(9000);
  });

  it("leaves the cache of pairs no patch touched alone", () => {
    const next = emptyNext();
    const ethCache = { map: new Map(), stats: {} };
    next.cache[ethUsd] = ethCache;

    const state = applyRatePatches(
      initialState,
      next,
      [{ [btcUsd]: { "2018-03-01": 9000 } }],
      settings,
    );

    expect(state.cache[ethUsd]).toBe(ethCache);
    expect(state.cache[btcUsd]).toBeDefined();
  });

  it("clears checkHolesOnNextLoad once the patches are applied", () => {
    const state = applyRatePatches(
      { ...initialState, checkHolesOnNextLoad: true },
      emptyNext(),
      [{ [btcUsd]: { "2018-03-01": 9000 } }],
      settings,
    );

    expect(state.checkHolesOnNextLoad).toBe(false);
  });

  it("returns the state unchanged in shape when there is nothing to apply", () => {
    const state = applyRatePatches(initialState, emptyNext(), [], settings);

    expect(state).toEqual({ data: {}, cache: {}, status: {}, checkHolesOnNextLoad: false });
  });
});

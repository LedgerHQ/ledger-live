import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { inferTrackingPairForAccounts, exportCountervalues } from "./logic";
import type { CounterValuesState, TrackingPair } from "./types";
import { datapointRetention, formatCounterValueDay, formatCounterValueHour } from "./helpers";

describe("inferTrackingPairForAccounts", () => {
  const accounts = Array(20)
    .fill(null)
    .map((_, i) => genAccount("test" + i));
  const usd = getFiatCurrencyByTicker("USD");

  test("trackingPairs have a deterministic order regardless of accounts order", () => {
    const trackingPairs = inferTrackingPairForAccounts(accounts, usd);
    const accounts2 = accounts.slice(10).concat(accounts.slice(0, 10));
    const trackingPairs2 = inferTrackingPairForAccounts(accounts2, usd);
    expect(trackingPairs).toEqual(trackingPairs2);
  });

  test("trackingPairs with same from and to are filtered out", () => {
    const first = genAccount("test1", { currency: getCryptoCurrencyById("bitcoin") });
    const trackingPairs = inferTrackingPairForAccounts([first], first.currency);
    expect(trackingPairs).toEqual([]);
  });

  test("trackingPairs with 2 accounts of same coin yield one tracking pair", () => {
    const first = genAccount("test1", { currency: getCryptoCurrencyById("bitcoin") });
    const second = genAccount("test2", { currency: getCryptoCurrencyById("bitcoin") });
    const trackingPairs = inferTrackingPairForAccounts([first, second], usd);
    expect(trackingPairs.length).toBe(1);
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

    test("filters out old daily data beyond retention period when selectedTimeRange is provided", () => {
      const selectedTimeRange = "month"; // 30 days
      const oldDailyDate = new Date(Date.now() - 30 * DAY - DAY);
      const oldDailyKey = formatCounterValueDay(oldDailyDate);
      const recentDailyDate = new Date(Date.now() - 15 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);

      const state = createState({
        "USD bitcoin": new Map([
          [oldDailyKey, 45000],
          [recentDailyKey, 50000],
        ]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs, selectedTimeRange);

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

    test("keep the latest datapoint", () => {
      const state = createState({
        "USD bitcoin": new Map([["latest", 48000]]),
      });
      const exported = exportCountervalues(state, defaultTrackingPairs);
      expect(exported["USD bitcoin"]).toEqual({
        latest: 48000,
      });
    });

    test("handles mixed data with multiple pairs", () => {
      const selectedTimeRange = "month"; // 30 days
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

      const exported = exportCountervalues(state, defaultTrackingPairs, selectedTimeRange);

      expect(exported["USD bitcoin"]).toEqual({
        [recentHourlyKey]: 52000,
        [recentDailyKey]: 50000,
        latest: 53000,
      });

      expect(exported["USD ethereum"]).toEqual({
        [recentHourlyKey]: 3200,
        latest: 3100,
        [borderlineHourlyKey]: 3300,
      });
    });

    test("uses selectedTimeRange to filter daily data", () => {
      const selectedTimeRange = "week"; // 7 days
      const oldDailyDate = new Date(Date.now() - 7 * DAY - DAY);
      const oldDailyKey = formatCounterValueDay(oldDailyDate);
      const recentDailyDate = new Date(Date.now() - 3 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);

      const state = createState({
        "USD bitcoin": new Map([
          [oldDailyKey, 45000],
          [recentDailyKey, 50000],
        ]),
      });

      const exported = exportCountervalues(state, defaultTrackingPairs, selectedTimeRange);

      expect(exported["USD bitcoin"]).toEqual({
        [recentDailyKey]: 50000,
      });
    });

    test("keeps all daily data when selectedTimeRange is undefined or 'all'", () => {
      const veryOldDailyDate = new Date(Date.now() - 365 * DAY);
      const veryOldDailyKey = formatCounterValueDay(veryOldDailyDate);
      const recentDailyDate = new Date(Date.now() - 15 * DAY);
      const recentDailyKey = formatCounterValueDay(recentDailyDate);

      const state = createState({
        "USD bitcoin": new Map([
          [veryOldDailyKey, 45000],
          [recentDailyKey, 50000],
        ]),
      });

      // Test with undefined
      const exportedUndefined = exportCountervalues(state, defaultTrackingPairs, undefined);
      expect(exportedUndefined["USD bitcoin"]).toEqual({
        [veryOldDailyKey]: 45000,
        [recentDailyKey]: 50000,
      });

      // Test with "all"
      const exportedAll = exportCountervalues(state, defaultTrackingPairs, "all");
      expect(exportedAll["USD bitcoin"]).toEqual({
        [veryOldDailyKey]: 45000,
        [recentDailyKey]: 50000,
      });
    });
  });

  test("skips pairs that are not in trackingPairs", () => {
    const state = createState({
      "USD bitcoin": new Map([["latest", 50000]]),
      "EUR bitcoin": new Map([["latest", 3000]]),
    });

    const trackingPairs: TrackingPair[] = [{ from: bitcoin, to: usd, startDate: new Date() }];

    const exported = exportCountervalues(state, trackingPairs);

    expect(exported["USD bitcoin"]).toEqual({ latest: 50000 });
    expect(exported["EUR bitcoin"]).toBeUndefined();
  });

  test("skips invalid data", () => {
    const state = createState({
      "USD bitcoin": new Map([["latest", 50000]]),
      ...["ethereum/erc20/wrapped_bitcoin", "neon_evm/erc20/wrapped_bitcoin"],
    });

    const exported = exportCountervalues(state, defaultTrackingPairs);

    expect(exported["USD bitcoin"]).toEqual({ latest: 50000 });
    expect(exported["USD ethereum"]).toBeUndefined();
  });

  test("skips empty data maps", () => {
    const state = createState({
      "USD bitcoin": new Map(),
      "USD ethereum": new Map([["latest", 3000]]),
    });

    const exported = exportCountervalues(state, defaultTrackingPairs);

    expect(exported["USD bitcoin"]).toBeUndefined();
    expect(exported["USD ethereum"]).toEqual({ latest: 3000 });
  });

  test("preserves status in exported state", () => {
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

    expect(exported.status).toEqual({
      "USD bitcoin": {
        timestamp: 1234567890,
        failures: 0,
        oldestDateRequested: "2024-01-01",
      },
    });
  });

  function createState(data: Record<string, unknown>) {
    return { data, status: {}, cache: {} } as CounterValuesState;
  }
});

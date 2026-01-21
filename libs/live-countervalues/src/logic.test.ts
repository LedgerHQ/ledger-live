import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { inferTrackingPairForAccounts, exportCountervalues } from "./logic";
import type { CounterValuesState } from "./types";
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

  describe("hourlyLimit filtering", () => {
    test("keeps daily data regardless of age", () => {
      const oldDailyDate = new Date(Date.now() - 60 * DAY);
      const oldDailyKey = formatCounterValueDay(oldDailyDate);

      const state = createState({
        "USD bitcoin": new Map([[oldDailyKey, 50000]]),
      });

      const exported = exportCountervalues(state);

      expect(exported["USD bitcoin"]).toEqual({
        [oldDailyKey]: 50000,
      });
    });

    test("keeps recent hourly data within retention period", () => {
      const recentHourlyDate = new Date(Date.now() - 5 * DAY);
      const recentHourlyKey = formatCounterValueHour(recentHourlyDate);

      const state = createState({
        "USD bitcoin": new Map([[recentHourlyKey, 51000]]),
      });

      const exported = exportCountervalues(state);

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

      const exported = exportCountervalues(state);

      expect(exported["USD bitcoin"]).toEqual({
        [recentDailyKey]: 52000,
      });
    });

    it("keep the latest datapoint", () => {
      const state = createState({
        "USD bitcoin": new Map([["latest", 48000]]),
      });
      const exported = exportCountervalues(state);
      expect(exported["USD bitcoin"]).toEqual({
        latest: 48000,
      });
    });

    test("handles mixed data with multiple pairs", () => {
      const oldHourlyDate = new Date(Date.now() - datapointRetention.hourly - DAY);
      const oldHourlyKey = formatCounterValueHour(oldHourlyDate);
      const recentHourlyDate = new Date(Date.now() - 2 * DAY);
      const recentHourlyKey = formatCounterValueHour(recentHourlyDate);
      const dailyDate = new Date(Date.now() - 60 * DAY);
      const dailyKey = formatCounterValueDay(dailyDate);
      const borderlineHourlyDate = new Date(Date.now() - datapointRetention.hourly + 1000);
      const borderlineHourlyKey = `${formatCounterValueDay(borderlineHourlyDate)}T00`;

      const state = createState({
        "USD bitcoin": new Map([
          [oldHourlyKey, 48000],
          [recentHourlyKey, 52000],
          ["latest", 53000],
          [dailyKey, 45000],
        ]),
        "USD ethereum": new Map([
          [oldHourlyKey, 3000],
          ["latest", 3100],
          [recentHourlyKey, 3200],
          [borderlineHourlyKey, 3300],
        ]),
      });

      const exported = exportCountervalues(state);

      expect(exported["USD bitcoin"]).toEqual({
        [recentHourlyKey]: 52000,
        [dailyKey]: 45000,
        latest: 53000,
      });

      expect(exported["USD ethereum"]).toEqual({
        [recentHourlyKey]: 3200,
        latest: 3100,
        [borderlineHourlyKey]: 3300,
      });
    });
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

    const exported = exportCountervalues(state);

    expect(exported.status).toEqual({
      "USD bitcoin": {
        timestamp: 1234567890,
        failures: 0,
        oldestDateRequested: "2024-01-01",
      },
    });
  });

  function createState(data: Record<string, Map<string, number>>): CounterValuesState {
    return {
      data,
      status: {},
      cache: {},
    };
  }
});

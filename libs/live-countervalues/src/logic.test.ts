import { log } from "@ledgerhq/logs";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import type {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "./tests/currencies";
import {
  calculate,
  inferTrackingPairForAccounts,
  exportCountervalues,
  filterSupportedTrackingPairs,
  hasNewCountervaluesToExport,
  importCountervalues,
  initialState,
  loadCountervalues,
} from "./logic";
import api from "./api";
import type { CounterValuesState, TrackingPair } from "./types";
import { datapointRetention, formatCounterValueDay, formatCounterValueHour } from "./helpers";

jest.mock("@ledgerhq/logs");

const mockedLog = jest.mocked(log);

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
    const first = genAccount("test1", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const trackingPairs = inferTrackingPairForAccounts([first], first.currency);
    expect(trackingPairs).toEqual([]);
  });

  test("trackingPairs with 2 accounts of same coin yield one tracking pair", () => {
    const first = genAccount("test1", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const second = genAccount("test2", {
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const trackingPairs = inferTrackingPairForAccounts([first, second], usd);
    expect(trackingPairs.length).toBe(1);
  });
});

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
    const pairs = [
      {
        from: usd,
        to: bitcoin,
        startDate: new Date("2026-06-19T00:00:00.000Z"),
      },
    ];

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

  test("loadCountervalues clears checkHolesOnNextLoad after run", async () => {
    const api = require("./api");
    jest.spyOn(api.default, "fetchHistorical").mockResolvedValue({});
    jest.spyOn(api.default, "fetchLatest").mockResolvedValue([50000]);
    const withFlag = { ...initialState, checkHolesOnNextLoad: true };
    const result = await loadCountervalues(withFlag, {
      ...settings,
      disableAutoRecoverErrors: true,
    });
    expect(result.checkHolesOnNextLoad).toBe(false);
  });
});

describe("latest rate integrity", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");
  const eur = getFiatCurrencyByTicker("EUR");
  const historicalDate = "2026-01-01";
  const startDate = new Date();

  const trackingPair = (from: Currency, to: Currency = usd): TrackingPair => ({
    from,
    to,
    startDate,
  });

  const settings = (trackingPairs: TrackingPair[], autofillGaps = true) => ({
    trackingPairs,
    autofillGaps,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  let fetchHistoricalSpy: jest.SpiedFunction<typeof api.fetchHistorical>;
  let fetchLatestSpy: jest.SpiedFunction<typeof api.fetchLatest>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchHistoricalSpy = jest.spyOn(api, "fetchHistorical").mockResolvedValue({});
    fetchLatestSpy = jest.spyOn(api, "fetchLatest").mockResolvedValue([]);
  });

  afterEach(() => {
    fetchHistoricalSpy.mockRestore();
    fetchLatestSpy.mockRestore();
  });

  test("removes an old latest rate after a successful partial response without mutating input", async () => {
    const key = "USD bitcoin";
    const originalMap = new Map([
      ["latest", 50000],
      [historicalDate, 49000],
      ["2026-01-02", 49500],
    ]);
    const state: CounterValuesState = {
      data: { [key]: originalMap },
      cache: {},
      status: {},
    };
    fetchLatestSpy.mockResolvedValue([undefined]);

    const result = await loadCountervalues(state, settings([trackingPair(bitcoin)]));

    expect(result.data[key]).not.toBe(originalMap);
    expect(result.data[key].get("latest")).toBeUndefined();
    expect(result.data[key].get(historicalDate)).toBe(49000);
    expect(result.data[key].get("2026-01-02")).toBe(49500);
    expect(result.cache[key].map.get("latest")).toBeUndefined();
    expect(originalMap.get("latest")).toBe(50000);
    expect(calculate(result, { value: 100000000, from: bitcoin, to: usd })).toBeUndefined();
    expect(
      calculate(result, {
        value: 100000000,
        from: bitcoin,
        to: usd,
        date: new Date(`${historicalDate}T00:00:00.000Z`),
      }),
    ).toBe(4900000);
  });

  test("does not synthesize latest from historical data when autofilling gaps", () => {
    const imported = importCountervalues(
      {
        status: {},
        "USD bitcoin": { [historicalDate]: 49000 },
      },
      settings([trackingPair(bitcoin)]),
    );

    expect(imported.data["USD bitcoin"].get("latest")).toBeUndefined();
    expect(imported.cache["USD bitcoin"].map.get("latest")).toBeUndefined();
    expect(imported.cache["USD bitcoin"].map.get("2026-01-02")).toBe(49000);
    expect(calculate(imported, { value: 100000000, from: bitcoin, to: usd })).toBeUndefined();
  });

  test("removes a latest rate synthesized in an existing cache", async () => {
    const key = "USD bitcoin";
    const history = new Map([[historicalDate, 49000]]);
    const state: CounterValuesState = {
      data: { [key]: history },
      cache: {
        [key]: {
          map: new Map([
            [historicalDate, 49000],
            ["latest", 49000],
          ]),
          fallback: 49000,
          stats: {
            oldest: historicalDate,
            earliest: historicalDate,
            oldestDate: new Date(`${historicalDate}T00:00:00.000Z`),
            earliestDate: new Date(`${historicalDate}T00:00:00.000Z`),
            earliestStableDate: new Date(`${historicalDate}T00:00:00.000Z`),
          },
        },
      },
      status: {},
    };
    fetchLatestSpy.mockResolvedValue([undefined]);

    const result = await loadCountervalues(state, settings([trackingPair(bitcoin)]));

    expect(result.cache[key].map.has("latest")).toBe(false);
    expect(state.cache[key].map.get("latest")).toBe(49000);
  });

  test("ignores a legacy latest value during import", () => {
    const imported = importCountervalues(
      {
        status: {},
        "USD bitcoin": { latest: 50000, [historicalDate]: 49000 },
      },
      settings([trackingPair(bitcoin)]),
    );

    expect(imported.data["USD bitcoin"].has("latest")).toBe(false);
    expect(imported.cache["USD bitcoin"].map.has("latest")).toBe(false);
    expect(imported.data["USD bitcoin"].get(historicalDate)).toBe(49000);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, null, undefined])(
    "removes latest when the API returns %p",
    async latest => {
      const key = "USD bitcoin";
      const state: CounterValuesState = {
        data: { [key]: new Map([["latest", 50000]]) },
        cache: {},
        status: {},
      };
      fetchLatestSpy.mockResolvedValue([latest]);

      const result = await loadCountervalues(state, settings([trackingPair(bitcoin)]));

      expect(result.data[key].has("latest")).toBe(false);
      expect(state.data[key].get("latest")).toBe(50000);
    },
  );

  test("removes an invalid latest rate when the response repeats it", async () => {
    const key = "USD bitcoin";
    const state: CounterValuesState = {
      data: { [key]: new Map([["latest", 0]]) },
      cache: {
        [key]: {
          map: new Map([["latest", 0]]),
          stats: {
            oldest: undefined,
            earliest: undefined,
            oldestDate: null,
            earliestDate: null,
            earliestStableDate: null,
          },
        },
      },
      status: {},
    };
    fetchLatestSpy.mockResolvedValue([0]);

    const result = await loadCountervalues(state, settings([trackingPair(bitcoin)]));

    expect(result.data[key].has("latest")).toBe(false);
    expect(result.cache[key].map.has("latest")).toBe(false);
  });

  test("clears only the selected fiat pair during a currency switch", async () => {
    const usdKey = "USD bitcoin";
    const eurKey = "EUR bitcoin";
    const usdMap = new Map([["latest", 80658]]);
    const eurMap = new Map([["latest", 68250]]);
    const state: CounterValuesState = {
      data: { [usdKey]: usdMap, [eurKey]: eurMap },
      cache: {},
      status: {},
    };
    fetchLatestSpy.mockResolvedValue([undefined]);

    const result = await loadCountervalues(state, settings([trackingPair(bitcoin, eur)]));

    expect(result.data[usdKey]).toBe(usdMap);
    expect(result.data[usdKey].get("latest")).toBe(80658);
    expect(result.data[eurKey].has("latest")).toBe(false);
  });

  test("updates valid pairs while clearing missing pairs from the same response", async () => {
    const bitcoinMap = new Map([["latest", 50000]]);
    const ethereumMap = new Map([["latest", 3000]]);
    const state: CounterValuesState = {
      data: { "USD bitcoin": bitcoinMap, "USD ethereum": ethereumMap },
      cache: {},
      status: {},
    };
    fetchLatestSpy.mockResolvedValue([51000, undefined]);

    const result = await loadCountervalues(
      state,
      settings([trackingPair(bitcoin), trackingPair(ethereum)]),
    );

    expect(result.data["USD bitcoin"].get("latest")).toBe(51000);
    expect(result.data["USD ethereum"].has("latest")).toBe(false);
    expect(bitcoinMap.get("latest")).toBe(50000);
    expect(ethereumMap.get("latest")).toBe(3000);
  });

  test("restores calculation when a later poll returns a valid rate", async () => {
    const pair = trackingPair(bitcoin);
    const fetchLatest = fetchLatestSpy
      .mockResolvedValueOnce([undefined])
      .mockResolvedValueOnce([55000]);
    const state: CounterValuesState = {
      data: { "USD bitcoin": new Map([["latest", 50000]]) },
      cache: {},
      status: {},
    };

    const incomplete = await loadCountervalues(state, settings([pair]));
    const recovered = await loadCountervalues(incomplete, settings([pair]));

    expect(fetchLatest).toHaveBeenCalledTimes(2);
    expect(incomplete.data["USD bitcoin"].has("latest")).toBe(false);
    expect(recovered.data["USD bitcoin"].get("latest")).toBe(55000);
    expect(calculate(recovered, { value: 100000000, from: bitcoin, to: usd })).toBe(5500000);
  });

  test("retains existing latest rates when the complete latest request fails", async () => {
    const bitcoinMap = new Map([["latest", 50000]]);
    const ethereumMap = new Map([["latest", 3000]]);
    const state: CounterValuesState = {
      data: { "USD bitcoin": bitcoinMap, "USD ethereum": ethereumMap },
      cache: {},
      status: {},
    };
    const fetchLatest = fetchLatestSpy
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce([51000, 3100]);
    const pairs = [trackingPair(bitcoin), trackingPair(ethereum)];

    const failed = await loadCountervalues(state, settings(pairs));
    const recovered = await loadCountervalues(failed, settings(pairs));

    expect(fetchLatest).toHaveBeenCalledTimes(2);
    expect(failed.data["USD bitcoin"]).toBe(bitcoinMap);
    expect(failed.data["USD ethereum"]).toBe(ethereumMap);
    expect(failed.data["USD bitcoin"].get("latest")).toBe(50000);
    expect(failed.data["USD ethereum"].get("latest")).toBe(3000);
    expect(recovered.data["USD bitcoin"].get("latest")).toBe(51000);
    expect(recovered.data["USD ethereum"].get("latest")).toBe(3100);
    expect(mockedLog).toHaveBeenCalledWith(
      "countervalues-error",
      expect.stringContaining("Failed to fetch latest for BTC-USD,ETH-USD Error: network down"),
    );
  });
});

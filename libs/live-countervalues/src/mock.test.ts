import "@ledgerhq/coin-framework/test-helpers/staticTime";
import { initialState, loadCountervalues, calculate } from "./logic";
import CountervaluesAPI from "./api";
import { setEnv } from "@ledgerhq/live-env";
import { getFiatCurrencyByTicker, getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { formatCounterValueDay, formatCounterValueHour, parseFormattedDate } from "./helpers";
import api from "./api";
import * as cryptoAssets from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens as addTokensLegacy } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

setEnv("MOCK", "1");
setEnv("MOCK_COUNTERVALUES", "1");

// Initialize tokens for tests that need real token data
beforeAll(() => {
  initializeLegacyTokens(addTokensLegacy);
  cryptoAssets.setCryptoAssetsStore(legacyCryptoAssetsStore);
});

beforeEach(() => {
  // Restore mocks between tests to prevent interference
  jest.restoreAllMocks();
  // Ensure the real store is available for tests that need it
  cryptoAssets.setCryptoAssetsStore(legacyCryptoAssetsStore);
});

const DAY = 24 * 60 * 60 * 1000;

test("helpers", () => {
  expect(formatCounterValueDay(new Date())).toBe("2018-03-14");
  expect(formatCounterValueHour(new Date())).toBe("2018-03-14T17");
  expect(formatCounterValueDay(parseFormattedDate("2018-03-14"))).toBe("2018-03-14");
  expect(formatCounterValueHour(parseFormattedDate("2018-03-14T17"))).toBe("2018-03-14T17");
});
test("mock load with nothing to track", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [],
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
    }),
  ).toBeUndefined();
});
test("mock fetchIdsSortedByMarketcap", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  jest.spyOn(cryptoAssets, "getCryptoAssetsStore").mockReturnValue({
    findTokenById: (_: string) => Promise.resolve(undefined),
    findTokenByAddressInCurrency: (_: string, __: string) => Promise.resolve(undefined),
  } as CryptoAssetsStore);

  expect(await CountervaluesAPI.fetchIdsSortedByMarketcap()).toBeDefined();
});
test("mock load with btc-usd to track", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: getCryptoCurrencyById("bitcoin"),
        to: getFiatCurrencyByTicker("USD"),
        startDate: new Date(Date.now() - 200 * DAY),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      date: new Date(Date.now() - 210 * DAY),
    }),
  ).toBeUndefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
    }),
  ).toBe(261944);
  expect(
    calculate(state, {
      value: 10000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
    }),
  ).toBe(26194);
  expect(
    calculate(state, {
      value: 10000000,
      to: getCryptoCurrencyById("bitcoin"),
      from: getCryptoCurrencyById("bitcoin"),
    }),
  ).toBe(10000000);
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("EUR"),
    }),
  ).toBeUndefined();
});
test("mock load with eth-btc to track", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: getCryptoCurrencyById("ethereum"),
        to: getCryptoCurrencyById("bitcoin"),
        startDate: new Date(Date.now() - 200 * DAY),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 10e18,
      from: getCryptoCurrencyById("ethereum"),
      to: getCryptoCurrencyById("bitcoin"),
    }),
  ).toBe(6715906);
});
test("mock load with btc-eth to track", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: getCryptoCurrencyById("bitcoin"),
        to: getCryptoCurrencyById("ethereum"),
        startDate: new Date(Date.now() - 200 * DAY),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 10e8,
      from: getCryptoCurrencyById("bitcoin"),
      to: getCryptoCurrencyById("ethereum"),
    }),
  ).toBe(1.4890024626718706e21);
});
test("DAI EUR latest price", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: (await cryptoAssets
          .getCryptoAssetsStore()
          .findTokenById("ethereum/erc20/dai_stablecoin_v2_0"))!,
        to: getFiatCurrencyByTicker("EUR"),
        startDate: new Date(),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: (await cryptoAssets
        .getCryptoAssetsStore()
        .findTokenById("ethereum/erc20/dai_stablecoin_v2_0"))!,
      to: getFiatCurrencyByTicker("EUR"),
    }),
  ).toBeUndefined();
});
test("calculate(now()) is calculate(null)", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: (await cryptoAssets
          .getCryptoAssetsStore()
          .findTokenById("ethereum/erc20/dai_stablecoin_v2_0"))!,
        to: getFiatCurrencyByTicker("EUR"),
        startDate: new Date(),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: (await cryptoAssets
        .getCryptoAssetsStore()
        .findTokenById("ethereum/erc20/dai_stablecoin_v2_0"))!,
      to: getFiatCurrencyByTicker("EUR"),
    }),
  ).toEqual(
    calculate(state, {
      value: 100000000,
      from: (await cryptoAssets
        .getCryptoAssetsStore()
        .findTokenById("ethereum/erc20/dai_stablecoin_v2_0"))!,
      to: getFiatCurrencyByTicker("EUR"),
      date: new Date(),
    }),
  );
});
test("missing rate in mock", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: getCryptoCurrencyById("bitcoin"),
        to: getFiatCurrencyByTicker("USD"),
        startDate: new Date(Date.now() - 200 * DAY),
      },
    ],
    autofillGaps: false,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      date: new Date("2018-01-07T19:00"),
    }),
  ).toBeUndefined();
});
test("missing rate in mock is filled by autofillGaps", async () => {
  const state = await loadCountervalues(initialState, {
    trackingPairs: [
      {
        from: getCryptoCurrencyById("bitcoin"),
        to: getFiatCurrencyByTicker("USD"),
        startDate: new Date(Date.now() - 200 * DAY),
      },
    ],
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
  });
  expect(state).toBeDefined();
  // shifting rates to the right. hole in data looks up in older datapoint
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      date: new Date("2018-01-07T19:00"),
    }),
  ).toBe(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      date: new Date("2018-01-06T19:00"),
    }),
  );
});

test("fetchIdsSortedByMarketcap", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  jest.spyOn(cryptoAssets, "getCryptoAssetsStore").mockReturnValue({
    findTokenById: (_: string) => Promise.resolve(undefined),
    findTokenByAddressInCurrency: (_: string, __: string) => Promise.resolve(undefined),
  } as CryptoAssetsStore);

  const ids = await api.fetchIdsSortedByMarketcap();
  expect(ids).toContain("bitcoin");
});

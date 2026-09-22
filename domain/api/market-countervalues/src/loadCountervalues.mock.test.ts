// End-to-end coverage of loadCountervalues against the deterministic mock rate source. Moved from
// @ledgerhq/live-countervalues; the expected rates are unchanged, which is the point of the file.
// The clock is frozen because every expectation below is a function of "now".

import timemachine from "timemachine";

timemachine.config({ dateString: "March 14, 2018 13:34:42" });

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { calculate, initialState } from "@domain/entity-market-countervalues";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { createMockRateSource } from "./mock";
import { loadCountervalues } from "./loadCountervalues";

// The seed the mock API used to read from the MOCK env var.
const rates = createMockRateSource("1");

const DAY = 24 * 60 * 60 * 1000;

const baseSettings = {
  autofillGaps: false,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 20,
};

const dai = {
  type: "TokenCurrency",
  id: "ethereum/erc20/dai_stablecoin_v2_0",
  contractAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
  name: "Dai Stablecoin",
  ticker: "DAI",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "DAI", code: "DAI", magnitude: 18 }],
} as TokenCurrency;

test("the clock is frozen, so the rates below are reproducible", () => {
  expect(new Date().toISOString().slice(0, 10)).toBe("2018-03-14");
});

test("mock load with nothing to track", async () => {
  const state = await loadCountervalues(
    initialState,
    { ...baseSettings, autofillGaps: true, trackingPairs: [] },
    { rates },
  );
  expect(state).toBeDefined();
  expect(
    calculate(state, {
      value: 100000000,
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
    }),
  ).toBeUndefined();
});

test("mock load with btc-usd to track", async () => {
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("bitcoin"),
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(Date.now() - 200 * DAY),
        },
      ],
    },
    { rates },
  );
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
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("ethereum"),
          to: getCryptoCurrencyById("bitcoin"),
          startDate: new Date(Date.now() - 200 * DAY),
        },
      ],
    },
    { rates },
  );
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
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("bitcoin"),
          to: getCryptoCurrencyById("ethereum"),
          startDate: new Date(Date.now() - 200 * DAY),
        },
      ],
    },
    { rates },
  );
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
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [{ from: dai, to: getFiatCurrencyByTicker("EUR"), startDate: new Date() }],
    },
    { rates },
  );
  expect(state).toBeDefined();
  expect(
    calculate(state, { value: 100000000, from: dai, to: getFiatCurrencyByTicker("EUR") }),
  ).toBeUndefined();
});

test("calculate(now()) is calculate(null)", async () => {
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [{ from: dai, to: getFiatCurrencyByTicker("EUR"), startDate: new Date() }],
    },
    { rates },
  );
  expect(state).toBeDefined();
  expect(
    calculate(state, { value: 100000000, from: dai, to: getFiatCurrencyByTicker("EUR") }),
  ).toEqual(
    calculate(state, {
      value: 100000000,
      from: dai,
      to: getFiatCurrencyByTicker("EUR"),
      date: new Date(),
    }),
  );
});

test("missing rate in mock", async () => {
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("bitcoin"),
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(Date.now() - 200 * DAY),
        },
      ],
    },
    { rates },
  );
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
  const state = await loadCountervalues(
    initialState,
    {
      ...baseSettings,
      autofillGaps: true,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("bitcoin"),
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(Date.now() - 200 * DAY),
        },
      ],
    },
    { rates },
  );
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

test("clears checkHolesOnNextLoad after a run", async () => {
  const state = await loadCountervalues(
    { ...initialState, checkHolesOnNextLoad: true },
    {
      ...baseSettings,
      disableAutoRecoverErrors: true,
      trackingPairs: [
        {
          from: getCryptoCurrencyById("bitcoin"),
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(Date.now() - 2 * DAY),
        },
      ],
    },
    { rates },
  );
  expect(state.checkHolesOnNextLoad).toBe(false);
});

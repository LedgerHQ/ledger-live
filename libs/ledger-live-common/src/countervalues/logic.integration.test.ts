import "../__tests__/test-helpers/setup";
import { initialState, loadCountervalues, calculate } from "./logic";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  findCurrencyByTicker,
} from "../currencies";
import { getBTCValues } from "../countervalues/mock";
import { Currency } from "@ledgerhq/cryptoassets";

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const now = Date.now();

jest.setTimeout(60000);

describe("API sanity", () => {
  test("recent days have rate for BTC USD", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: bitcoin,
          to: usd,
          startDate: new Date(now - 200 * 24 * 60 * 60 * 1000),
        },
      ],
      autofillGaps: false,
      disableAutoRecoverErrors: true,
    });

    for (let i = 0; i < 7; i++) {
      const value = calculate(state, {
        date: new Date(now - i * 24 * 60 * 60 * 1000),
        disableRounding: true,
        from: bitcoin,
        to: usd,
        value: 1000000,
      });
      expect(value).toBeDefined();
    }
  });
  test("recent days have different rates for BTC USD", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: bitcoin,
          to: usd,
          startDate: new Date(now - 200 * 24 * 60 * 60 * 1000),
        },
      ],
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });
    const currentValue = calculate(state, {
      disableRounding: true,
      from: bitcoin,
      to: usd,
      value: 1000000,
    });

    for (let i = 1; i < 7; i++) {
      const value = calculate(state, {
        date: new Date(now - i * 24 * 60 * 60 * 1000),
        disableRounding: true,
        from: bitcoin,
        to: usd,
        value: 1000000,
      });
      expect(value).not.toEqual(currentValue);
    }
  });
});

describe("extreme cases", () => {
  test("all tickers against USD", async () => {
    const currencies = Object.keys(getBTCValues())
      .filter((t) => t !== "USD")
      .map(findCurrencyByTicker)
      .filter(Boolean) as Currency[];
    const state = await loadCountervalues(initialState, {
      trackingPairs: currencies.map((from) => ({
        from,
        to: usd,
        startDate: new Date(),
      })),
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });

    const currenciesWithCVs = currencies
      .map((from) =>
        calculate(state, {
          date: new Date(),
          from,
          to: usd,
          value: 1000000,
        })
      )
      .filter((v) => v && v > 0);

    expect(currenciesWithCVs.length).toBeGreaterThan(0);
  });

  test("all tickers against BTC", async () => {
    const currencies = Object.keys(getBTCValues())
      .filter((t) => t !== "BTC")
      .map(findCurrencyByTicker)
      .filter(Boolean) as Currency[];
    const state = await loadCountervalues(initialState, {
      trackingPairs: currencies.map((from) => ({
        from,
        to: bitcoin,
        startDate: new Date(),
      })),
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });

    const currenciesWithCVs = currencies
      .map((from) =>
        calculate(state, {
          date: new Date(),
          from,
          to: bitcoin,
          value: 1000000,
        })
      )
      .filter((v) => v && v > 0);

    expect(currenciesWithCVs.length).toBeGreaterThan(0);
  });
});

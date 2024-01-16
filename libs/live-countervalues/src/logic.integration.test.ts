import {
  initialState,
  loadCountervalues,
  calculate,
  exportCountervalues,
  importCountervalues,
} from "./logic";
import { findCurrencyByTicker } from "@ledgerhq/coin-framework/currencies/index";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  getTokenById,
} from "@ledgerhq/cryptoassets";
import { getBTCValues } from "./mock";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Prando from "prando";
import api from "./api";
import { setEnv } from "@ledgerhq/live-env";

const value = "ll-ci/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);

const ethereum = getCryptoCurrencyById("ethereum");
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
  const universe = Object.keys(getBTCValues())
    .filter(t => t !== "USD")
    .map(findCurrencyByTicker)
    .filter(Boolean) as Currency[];
  universe.sort((a, b) => a.ticker.localeCompare(b.ticker));
  const prando = new Prando("orderingrng");
  const sampleCount = Math.min(120, universe.length);
  const i = prando.nextInt(0, universe.length - sampleCount);
  const currencies = universe.slice(i, i + sampleCount);

  test("all tickers against USD", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: currencies.map(from => ({
        from,
        to: usd,
        startDate: new Date(),
      })),
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });

    const currenciesWithCVs = currencies
      .map(from =>
        calculate(state, {
          date: new Date(),
          from,
          to: usd,
          value: 1000000,
        }),
      )
      .filter(v => v && v > 0);

    expect(currenciesWithCVs.length).toBeGreaterThan(0);
  });

  test("all tickers against BTC", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: currencies.map(from => ({
        from,
        to: bitcoin,
        startDate: new Date(),
      })),
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });

    const currenciesWithCVs = currencies
      .map(from =>
        calculate(state, {
          date: new Date(),
          from,
          to: bitcoin,
          value: 1000000,
        }),
      )
      .filter(v => v && v > 0);

    expect(currenciesWithCVs.length).toBeGreaterThan(0);
  });
});

describe("WETH rules", () => {
  test("ethereum WETH have countervalues", async () => {
    const weth = getTokenById("ethereum/erc20/weth");
    const state = await loadCountervalues(initialState, {
      // NB: inferTrackingPairForAccounts would infer eth->usd with the WETH module
      // we set this explicitly just to confirm that asking weth->usd will make it work
      trackingPairs: [
        {
          from: ethereum,
          to: usd,
          startDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
        },
      ],
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });
    const value = calculate(state, {
      disableRounding: true,
      from: weth,
      to: usd,
      value: 1000000,
    });
    expect(value).toBeGreaterThan(0);
  });

  test("ethereum WETH have reversed countervalues", async () => {
    const weth = getTokenById("ethereum/erc20/weth");
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: bitcoin,
          to: ethereum,
          startDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
        },
      ],
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });
    const value = calculate(state, {
      disableRounding: true,
      from: bitcoin,
      to: weth,
      value: 1000000,
    });
    expect(value).toBeGreaterThan(0);
  });

  test("ethereum goerli WETH doesn't countervalues", async () => {
    const weth = getTokenById("ethereum_goerli/erc20/wrapped_ether");
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: ethereum,
          to: usd,
          startDate: new Date(now - 1 * 24 * 60 * 60 * 1000),
        },
      ],
      autofillGaps: true,
      disableAutoRecoverErrors: true,
    });
    const value = calculate(state, {
      disableRounding: true,
      from: weth,
      to: usd,
      value: 1000000,
    });
    expect(value).toBe(undefined);
  });
});

test("fetchIdsSortedByMarketcap", async () => {
  const ids = await api.fetchIdsSortedByMarketcap();
  expect(ids).toContain("bitcoin");
});

test("export and import it back", async () => {
  const settings = {
    trackingPairs: [
      {
        from: bitcoin,
        to: usd,
        startDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
      },
      {
        from: ethereum,
        to: usd,
        startDate: new Date(now - 100 * 24 * 60 * 60 * 1000),
      },
    ],
    autofillGaps: true,
    disableAutoRecoverErrors: true,
  };
  const state = await loadCountervalues(initialState, settings);
  const exported = exportCountervalues(state);
  const imported = importCountervalues(exported, settings);
  expect(imported).toEqual(state);
});

describe("API specific unit tests", () => {
  test("fetchLatest with empty pairs", async () => {
    const rates = await api.fetchLatest([]);
    expect(rates).toEqual([]);
  });
});

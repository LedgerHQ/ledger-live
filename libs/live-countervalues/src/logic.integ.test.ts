import {
  initialState,
  loadCountervalues,
  calculate,
  exportCountervalues,
  importCountervalues,
} from "./logic";
import {
  getFiatCurrencyByTicker,
  findFiatCurrencyByTicker,
  findCryptoCurrencyByTicker,
  getCryptoCurrencyById,
} from "@ledgerhq/cryptoassets";
import { getBTCValues } from "./mock";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Prando from "prando";
import api from "./api";
import { setEnv } from "@ledgerhq/live-env";
import { pairId } from "./helpers";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

setupCalClientStore();

const value = "ll-ci/0.0.0";
setEnv("LEDGER_CLIENT_VERSION", value);

const ethereum = getCryptoCurrencyById("ethereum");
const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const now = Date.now();

const DAY = 24 * 60 * 60 * 1000;

jest.setTimeout(60000);

describe("API sanity", () => {
  test("recent days have rate for BTC USD", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: bitcoin,
          to: usd,
          startDate: new Date(now - 200 * DAY),
        },
      ],
      autofillGaps: false,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
      disableAutoRecoverErrors: true,
    });

    for (let i = 0; i < 7; i++) {
      const value = calculate(state, {
        date: new Date(now - i * DAY),
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
          startDate: new Date(now - 200 * DAY),
        },
      ],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
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
        date: new Date(now - i * DAY),
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
  let universe: Currency[] = [];
  let currencies: Currency[] = [];
  beforeAll(async () => {
    const tickers = Object.keys(getBTCValues()).filter(t => t !== "USD");
    universe = (
      await Promise.all(
        tickers.map(
          async (ticker: string) =>
            findCryptoCurrencyByTicker(ticker) ||
            findFiatCurrencyByTicker(ticker) ||
            (await getCryptoAssetsStore().findTokenById(ticker)),
        ),
      )
    ).filter((currency): currency is Currency => currency != null);
    universe.sort((a, b) => a.ticker.localeCompare(b.ticker));
    const prando = new Prando("orderingrng");
    const sampleCount = Math.min(120, universe.length);
    const i = prando.nextInt(0, universe.length - sampleCount);
    currencies = universe.slice(i, i + sampleCount);
  });

  test("all tickers against USD", async () => {
    const state = await loadCountervalues(initialState, {
      trackingPairs: currencies.map(from => ({
        from,
        to: usd,
        startDate: new Date(),
      })),
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
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
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
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
  // this test is created to confirm the recent removal of weth/eth specific management is still functional in v3 context
  test("ethereum WETH have countervalues", async () => {
    const weth = await getCryptoAssetsStore().findTokenById("ethereum/erc20/weth");
    const state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: weth!,
          to: usd,
          startDate: new Date(now - 10 * DAY),
        },
      ],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
      disableAutoRecoverErrors: true,
    });
    const value = calculate(state, {
      disableRounding: true,
      from: weth!,
      to: usd,
      value: 1000000,
    });
    expect(value).toBeGreaterThan(0);
  });
});

describe("HTTP 422 management of unsupported rates", () => {
  // context of this test: https://ledgerhq.atlassian.net/browse/LIVE-11339
  test("a cache that was accumulated needs to be cleared when a coin becomes disabled", async () => {
    // for this test, we start with weth
    const weth = await getCryptoAssetsStore().findTokenById("ethereum/erc20/weth");
    let state = await loadCountervalues(initialState, {
      trackingPairs: [
        {
          from: weth!,
          to: usd,
          startDate: new Date(now - 10 * DAY),
        },
      ],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
    });
    let value = calculate(state, {
      disableRounding: true,
      from: weth!,
      to: usd,
      value: 1000000,
    });
    expect(value).toBeGreaterThan(0);
    // we will now alter the state to replace the weth token to sether that we know has been disabled by the api
    const sether = await getCryptoAssetsStore().findTokenById("ethereum/erc20/sai");
    const prevKey = pairId({ from: weth!, to: usd });
    const nextKey = pairId({ from: sether!, to: usd });
    function mutateVisit(o: any) {
      // we traverse all Object and replace keys
      if (typeof o === "object" && o !== null) {
        for (const k in o) {
          if (k === prevKey) {
            const v = o[prevKey];
            delete o[prevKey];
            o[nextKey] = v;
          } else {
            mutateVisit(o[k]);
          }
        }
      }
    }
    mutateVisit(state);
    // at the moment, we still can calculate the value because we didn't refreshed yet
    value = calculate(state, {
      disableRounding: true,
      from: sether!,
      to: usd,
      value: 1000000,
    });
    expect(value).toBeGreaterThan(0);

    state = await loadCountervalues(state, {
      trackingPairs: [
        {
          from: sether!,
          to: usd,
          startDate: new Date(now - 100 * DAY),
        },
      ],
      autofillGaps: true,
      refreshRate: 60000,
      marketCapBatchingAfterRank: 20,
    });
    value = calculate(state, {
      disableRounding: true,
      from: sether!,
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
        startDate: new Date(now - 10 * DAY),
      },
      {
        from: ethereum,
        to: usd,
        startDate: new Date(now - 100 * DAY),
      },
    ],
    autofillGaps: true,
    refreshRate: 60000,
    marketCapBatchingAfterRank: 20,
    disableAutoRecoverErrors: true,
  };
  const state = await loadCountervalues(initialState, settings);
  const exported = exportCountervalues(state, settings.trackingPairs);
  const imported = importCountervalues(exported, settings);
  expect(imported.status).toEqual(state.status);
  expect(imported.data).toBeDefined();
  expect(imported.checkHolesOnNextLoad).toBe(true);
  const exportedDataKeys = Object.keys(exported).filter(k => k !== "status");
  expect(Object.keys(imported.data).sort()).toEqual(exportedDataKeys.sort());
});

describe("API specific unit tests", () => {
  test("fetchLatest with empty pairs", async () => {
    const rates = await api.fetchLatest([]);
    expect(rates).toEqual([]);
  });
});

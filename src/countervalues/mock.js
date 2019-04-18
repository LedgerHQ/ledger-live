// @flow
import type { CounterValuesState, Histodays, PollAPIPair } from "./types";
import type { Currency } from "../types";
import { formatCounterValueDay } from ".";
import { listCryptoCurrencies } from "../currencies";

type Pair = {
  from: Currency,
  to: Currency,
  exchange: string,
  dateFrom: Date,
  dateTo: Date,
  rate: Date => number
};

export const genDateRange = ({ dateFrom, dateTo, rate }: Pair): Histodays => {
  const histodays = {};
  for (let d = dateFrom.getTime(); d < dateTo; d += 24 * 60 * 60 * 1000) {
    const day = new Date(d);
    histodays[formatCounterValueDay(day)] = rate(new Date(d));
  }
  histodays.latest = rate(new Date());
  return histodays;
};

export const genStoreState = (pairs: Pair[]): CounterValuesState => {
  const state = { rates: {} };
  pairs.forEach(pair => {
    const { from, to, exchange } = pair;
    const a = (state.rates[to.ticker] = state.rates[to.ticker] || {});
    const b = (a[from.ticker] = a[from.ticker] || {});
    b[exchange] = genDateRange(pair);
  });
  return state;
};

export const getDailyRatesImplementation = (
  getAPIBaseURL: () => string,
  pairs: PollAPIPair[]
) => {
  const rates = {
    USD: { BTC: { SIMEX: { latest: 0.00521587214628 } } },
    BTC: {}
  };

  const fallbackRate = 0;
  const baseMockBTCRates = {
    BCH: 0.06102,
    BTG: 0.003239,
    DASH: 0.02314614,
    DCR: 0.004706,
    DGB: 0.00000249,
    DOGE: 5.392e-7,
    ETH: 3.1983e-12,
    ETC: 1.203e-13,
    ZEN: 0.00135623,
    KMD: 0.0002006,
    LTC: 0.015603,
    PPC: 0.011236,
    PIVX: 0.0001792,
    QTUM: 0.00055208,
    XSN: 0.0000241,
    XST: 0.0021319999999999998,
    STRAT: 0.0002083,
    VTC: 0.00009569,
    VIA: 0.0001065,
    XRP: 0.006208,
    ZEC: 0.0133534
  };

  const arbitraryRateEpoch = 1555452000000; // 17th April 2019 00:00
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  const hms = date =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

  const buildDays = from => {
    const outputDays = {};
    const baseRate = baseMockBTCRates[from] || fallbackRate;
    const todayDate = new Date(todayTimestamp);
    let date = new Date();

    for (
      date.setTime(todayTimestamp), date.setFullYear(date.getFullYear() - 3);
      date.getTime() <= todayDate.getTime();
      date.setDate(date.getDate() + 1)
    ) {
      const offset = (date.getTime() - arbitraryRateEpoch) / 864000000 / 180;
      outputDays[todayDate - date ? hms(date) : "latest"] = Math.max(
        baseRate * (1 + offset),
        0
      );
    }
    return outputDays;
  };

  return pairs.reduce((rates, pair) => {
    if (pair.from === "BTC") return rates;
    switch (pair.exchange) {
      case "bad":
        break;
      case "ugly":
        rates.BTC[pair.from] = { ugly: { latest: 0 } };
        break;
      default:
        rates.BTC[pair.from] = {
          [pair.exchange || "fallback"]: {
            ...buildDays(pair.from)
          }
        };
        break;
    }
    return rates;
  }, rates);
};

/**
 * [good]: Will return deterministic rates for the past 3 years for the pair
 * [ugly]: Will respond, but return 0 as the latest rate.
 * [bad]: Will not return anything for the pair.
 */
export const fetchExchangesForPairImplementation = async () => [
  { id: "good", name: "good", website: "#" },
  { id: "ugly", name: "ugly", website: "#" },
  { id: "bad", name: "bad", website: "#" }
];
export const fetchTickersByMarketcapImplementation = async (): Promise<
  string[]
> => listCryptoCurrencies().map(c => c.ticker);

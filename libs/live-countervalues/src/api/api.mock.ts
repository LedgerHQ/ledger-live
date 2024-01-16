import type { CounterValuesAPI, RateGranularity } from "../types";
import { getEnv } from "@ledgerhq/live-env";
import { getBTCValues, BTCtoUSD, referenceSnapshotDate } from "../mock";
import { formatPerGranularity } from "../helpers";
import Prando from "prando";
import { findCurrencyByTicker } from "@ledgerhq/coin-framework/currencies/index";

function btcTrend(t: number) {
  const daysSinceGenesis = (t - 1230937200000) / (24 * 60 * 60 * 1000);
  return Math.pow(daysSinceGenesis / 693, 5.526);
}

const randomCache: Record<string, number> = {};

function fromToRandom(id: string) {
  if (randomCache[id]) return randomCache[id];
  return (randomCache[id] = new Prando(getEnv("MOCK") + id).next());
}

function temporalFactor(from: string, to: string, maybeDate: Date | undefined) {
  const t = (maybeDate || new Date()).getTime();
  const r = fromToRandom(from); // make it varies between rates...

  const wave1 = Math.cos(r * 0.5 + t / (200 * 24 * 60 * 60 * 1000 * (0.5 + 0.5 * r)));
  // long term wave
  const wave2 = Math.sin(r + t / (30 * 24 * 60 * 60 * 1000)); // short term wave

  const wave3 = // random market perturbation
    Math.max(0, Math.sin(t / (66 * 24 * 60 * 60 * 1000))) *
    Math.cos(wave2 + Math.cos(r) + t / (3 * 24 * 60 * 60 * 1000 * (1 - 0.1 * r)));

  // This is essentially randomness!
  if (maybeDate && Math.cos(7 * r + t * 0.1) > 0.9 + 0.1 * r) {
    return 0; // intentionally set a GAP into the data
  }

  const res =
    (0.2 - 0.2 * r * r) * wave1 +
    (0.1 + 0.05 * Math.sin(r)) * wave2 +
    0.05 * wave3 +
    btcTrend(t) / btcTrend(referenceSnapshotDate.getTime());
  return Math.max(0, res);
}

function rate(from: string, to: string, date?: Date): number | undefined {
  const asBTC = getBTCValues()[from];
  if (!asBTC) return;

  if (to === "BTC") {
    return asBTC * temporalFactor(from, to, date);
  }

  if (to === "USD") {
    return asBTC * BTCtoUSD * temporalFactor(from, to, date);
  }

  if (from === "BTC") {
    const r = rate(to, from, date);
    if (!r) return;
    return 1 / r;
  }

  const btcTO = rate("BTC", to, date);

  if (btcTO) {
    return asBTC * btcTO * temporalFactor(from, to, date);
  }
}

const increment = {
  daily: 24 * 60 * 60 * 1000,
  hourly: 60 * 60 * 1000,
};

function getIds(): string[] {
  const ids: string[] = [];
  for (const k in getBTCValues()) {
    const c = findCurrencyByTicker(k);
    if (c && (c.type == "CryptoCurrency" || c.type == "TokenCurrency")) {
      ids.push(c.id);
    }
  }
  return ids;
}

function getDates(granularity: RateGranularity, start: Date): Date[] {
  const array: Date[] = [];
  const f = formatPerGranularity[granularity];
  const incr = increment[granularity];
  const initial = new Date(f(start || new Date())).getTime();
  const now = Date.now();

  for (let t = initial; t < now; t += incr) {
    array.push(new Date(t));
  }

  return array;
}

const api: CounterValuesAPI = {
  fetchHistorical: (granularity, { from, to, startDate }) => {
    const r: Record<string, number> = {};
    const f = formatPerGranularity[granularity];
    getDates(granularity, startDate).forEach(date => {
      const v = rate(from.ticker, to.ticker, date);
      if (v) {
        r[f(date)] = v;
      }
    });
    return Promise.resolve(r);
  },
  fetchLatest: pairs => Promise.resolve(pairs.map(({ from, to }) => rate(from.ticker, to.ticker))),
  fetchIdsSortedByMarketcap: () => Promise.resolve(getIds()),
};
export default api;

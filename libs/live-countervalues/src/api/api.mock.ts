import type { CounterValuesAPI, RateGranularity } from "../types";
import { getEnv } from "@ledgerhq/live-env";
import { referenceSnapshotDate, MOCK_COUNTERVALUE_IDS } from "../mock";
import { formatPerGranularity } from "../helpers";
import Prando from "prando";

const DAY = 24 * 60 * 60 * 1000;

function btcTrend(t: number) {
  const daysSinceGenesis = (t - 1230937200000) / DAY;
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

  const wave1 = Math.cos(r * 0.5 + t / (200 * DAY * (0.5 + 0.5 * r)));
  // long term wave
  const wave2 = Math.sin(r + t / (30 * DAY)); // short term wave

  const wave3 = // random market perturbation
    Math.max(0, Math.sin(t / (66 * DAY))) *
    Math.cos(wave2 + Math.cos(r) + t / (3 * DAY * (1 - 0.1 * r)));

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

// Simplified mapping of ticker to BTC value (replaces getBTCValues)
// Only includes common tickers needed for tests
const TICKER_TO_BTC: Record<string, number> = {
  BTC: 1,
  ETH: 0.024148511267564544,
  XRP: 0.000024684982446046028,
  USDT: 0.00011333520351848443,
  BCH: 0.028933931707658213,
  LTC: 0.005380715375819416,
  XLM: 0.000008137469105171634,
  ETC: 0.0007604915493071563,
  DOGE: 2.8120373022624386e-7,
  DAI: 0.00011315522800968864,
};

function rate(from: string, to: string, date?: Date): number | undefined {
  // Get BTC value from mapping or use random fallback
  const asBTC = TICKER_TO_BTC[from] ?? (from === "BTC" ? 1 : fromToRandom(from) * 0.1);

  if (to === "BTC") {
    return asBTC * temporalFactor(from, to, date);
  }

  if (to === "USD") {
    return asBTC * 9000 * temporalFactor(from, to, date);
  }

  if (from === "BTC") {
    const r = rate(to, from, date);
    if (!r) return;
    return 1 / r;
  }

  // Only support BTC and USD as target currencies for other conversions
  if (to !== "BTC" && to !== "USD") {
    return undefined;
  }

  const btcTO = rate("BTC", to, date);

  if (btcTO) {
    return asBTC * btcTO * temporalFactor(from, to, date);
  }
}

const increment = {
  daily: DAY,
  hourly: 60 * 60 * 1000,
};

async function getIds(): Promise<string[]> {
  return [...MOCK_COUNTERVALUE_IDS];
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
  fetchIdsSortedByMarketcap: () => getIds(),
};
export default api;

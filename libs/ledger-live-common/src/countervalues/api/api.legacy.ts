import { findCurrencyByTicker } from "../../currencies";
import { getEnv } from "../../env";
import network from "../../network";
import {
  magFromTo,
  formatPerGranularity,
  formatCounterValueDay,
} from "../helpers";
import type { CounterValuesAPI } from "../types";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const legacyReverseRate = (
  from: string,
  to: string,
  rateMap: Record<string, any>
): Record<string, any> => {
  const r = {};
  const fromC = findCurrencyByTicker(from);
  const toC = findCurrencyByTicker(to);
  if (!fromC || !toC) return {};
  Object.keys(rateMap).forEach((k) => {
    r[k] = rateMap[k] / magFromTo(fromC, toC);
  });
  return r;
};

const api: CounterValuesAPI = {
  fetchHistorical: async (granularity, query) => {
    const { startDate } = query;
    const from = query.from.ticker;
    const to = query.to.ticker;
    const format = formatPerGranularity[granularity];
    const { data } = await network({
      method: "POST",
      url: `${baseURL()}/rates/${granularity}`,
      data: {
        pairs: [
          {
            from,
            to,
            after: startDate ? format(startDate) : undefined,
          },
        ],
      },
    });
    if (!data) return {};
    const toLevel = data[to];
    if (!toLevel) return {};
    const fromLevel = toLevel[from];
    if (!fromLevel || typeof fromLevel !== "object") return {};
    const [key] = Object.keys(fromLevel);
    const res: Record<string, any> = legacyReverseRate(
      from,
      to,
      fromLevel[key]
    );
    delete res.latest;
    return res;
  },
  fetchLatest: async (pairs) => {
    const { data } = await network({
      method: "POST",
      url: `${baseURL()}/rates/daily`,
      data: {
        pairs: pairs.map(({ from, to }) => ({
          from: from.ticker,
          to: to.ticker,
          after: formatCounterValueDay(new Date()),
        })),
      },
    });
    return pairs.map(({ from, to }) => {
      const fromTo = (data[to.ticker] || {})[from.ticker];
      if (!fromTo) return;
      const first: any = Object.values(fromTo)[0];
      if (!first && !first.latest) return;
      return legacyReverseRate(from.ticker, to.ticker, {
        latest: Number(first.latest),
      }).latest;
    });
  },
  fetchMarketcapTickers: async () => {
    const { data } = await network({
      method: "GET",
      url: `${baseURL()}/tickers`,
    });
    return data;
  },
};
export default api;

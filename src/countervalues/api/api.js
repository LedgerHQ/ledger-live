// @flow

import URL from "url";
import { getEnv } from "../../env";
import network from "../../network";
import { formatPerGranularity } from "../helpers";
import type { CounterValuesAPI } from "../types";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const latest = async (pairs, direct) => {
  const { data } = await network({
    method: "POST",
    url: `${baseURL()}/latest${direct ? "?method=direct" : ""}`,
    data: pairs.map((p) => ({
      from: p.from.countervalueTicker ?? p.from.ticker,
      to: p.to.countervalueTicker ?? p.to.ticker,
    })),
  });
  return data;
};

const api: CounterValuesAPI = {
  fetchHistorical: async (granularity, { from, to, startDate }) => {
    const format = formatPerGranularity[granularity];
    const query = {};
    if (startDate) {
      query.start = format(startDate);
    }
    if (to.type !== "FiatCurrency") {
      // for anything else than fiat, we use direct
      query.method = "direct";
    }
    const fromTicker = from.countervalueTicker ?? from.ticker;
    const toTicker = to.countervalueTicker ?? to.ticker;
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${baseURL()}/${granularity}/${fromTicker}/${toTicker}`,
        query,
      }),
    });
    return data;
  },

  fetchLatest: async (pairs) => {
    // spliting the direct and indirect
    const directP = [];
    const indirectP = [];
    pairs.forEach((p) => {
      if (p.to.type !== "FiatCurrency") {
        directP.push(p);
      } else {
        indirectP.push(p);
      }
    });

    const [direct, indirect] = await Promise.all([
      directP.length ? latest(directP, true) : Promise.resolve([]),
      indirectP.length ? latest(indirectP) : Promise.resolve([]),
    ]);

    const data = Array(pairs.length).fill(0);
    directP.forEach((p, i) => {
      data[pairs.indexOf(p)] = direct[i];
    });
    indirectP.forEach((p, i) => {
      data[pairs.indexOf(p)] = indirect[i];
    });

    return data;
  },

  fetchMarketcapTickers: async () => {
    const { data } = await network({
      method: "GET",
      url: `${baseURL()}/v2/tickers`,
    });
    return data;
  },
};

export default api;

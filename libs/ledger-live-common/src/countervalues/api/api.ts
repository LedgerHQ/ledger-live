import URL from "url";
import { getEnv } from "../../env";
import network from "../../network";
import chunk from "lodash/chunk";
import { formatPerGranularity } from "../helpers";
import type { CounterValuesAPI, TrackingPair } from "../types";
import { promiseAllBatched } from "../../promise";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const LATEST_CHUNK = 50;

const latest = async (pairs: TrackingPair[], direct?: boolean) => {
  const all = await promiseAllBatched(
    4,
    chunk(pairs, LATEST_CHUNK),
    async (partial) => {
      const { data } = await network({
        method: "GET",
        url: `${baseURL()}/latest${
          direct ? "/direct" : "/indirect"
        }?pairs=${partial
          .map(
            (p) =>
              `${p.from.countervalueTicker ?? p.from.ticker}:${
                p.to.countervalueTicker ?? p.to.ticker
              }`
          )
          .join(",")}`,
      });
      return data;
    }
  );
  const data = all.reduce((acc, data) => acc.concat(data), []);
  return data;
};

const api: CounterValuesAPI = {
  fetchHistorical: async (granularity, { from, to, startDate }) => {
    const format = formatPerGranularity[granularity];
    const query: { start?: string; method?: string } = {};

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
  fetchLatest: async (pairs: TrackingPair[]) => {
    // spliting the direct and indirect
    const directP: TrackingPair[] = [];
    const indirectP: TrackingPair[] = [];
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

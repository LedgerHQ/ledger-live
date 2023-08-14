import network from "@ledgerhq/live-network/network";
import chunk from "lodash/chunk";
import URL from "url";
import { getEnv } from "../../env";
import { promiseAllBatched } from "../../promise";
import {
  encodeCurrencyAsLedgerId,
  encodePairAsLedgerIdPair,
  formatPerGranularity,
} from "../helpers";
import type { CounterValuesAPI, TrackingPair } from "../types";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const LATEST_CHUNK = 50;

const latest = async (pairs: TrackingPair[], direct?: boolean) => {
  const all = await promiseAllBatched(4, chunk(pairs, LATEST_CHUNK), async partial => {
    const url = `${baseURL()}/v2/latest/${direct ? "direct" : "indirect"}?pairs=${partial
      .map(p => encodePairAsLedgerIdPair(p.from, p.to))
      .join(",")}`;
    const { data } = await network({ method: "GET", url });
    return data;
  });
  const data = all.reduce((acc, data) => acc.concat(data), []);
  return data;
};

// to have more determinism in the order of the pairs requested to the API
const sortTrackingPair = (a: TrackingPair, b: TrackingPair) =>
  encodePairAsLedgerIdPair(a.from, a.to).localeCompare(encodePairAsLedgerIdPair(b.from, b.to));

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
    const url = URL.format({
      pathname: `${baseURL()}/v2/${granularity}/${encodeCurrencyAsLedgerId(from)}/${to.ticker}`,
      query,
    });
    const { data } = await network({ method: "GET", url });
    return data;
  },
  fetchLatest: async (pairs: TrackingPair[]) => {
    // spliting the direct and indirect
    const directP: TrackingPair[] = [];
    const indirectP: TrackingPair[] = [];
    pairs.forEach(p => {
      if (p.to.type !== "FiatCurrency") {
        directP.push(p);
      } else {
        indirectP.push(p);
      }
    });
    directP.sort(sortTrackingPair);
    indirectP.sort(sortTrackingPair);
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

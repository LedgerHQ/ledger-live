import network from "@ledgerhq/live-network/network";
import URL from "url";
import { getEnv } from "@ledgerhq/live-env";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { formatPerGranularity, inferCurrencyAPIID } from "../helpers";
import type { CounterValuesAPI, TrackingPair } from "../types";
import type { Currency } from "@ledgerhq/types-cryptoassets";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const LATEST_CHUNK = 50;

const api: CounterValuesAPI = {
  fetchHistorical: async (granularity, { from, to, startDate }) => {
    const format = formatPerGranularity[granularity];
    const url = URL.format({
      pathname: `${baseURL()}/v3/historical/${granularity}/simple`,
      query: {
        from: inferCurrencyAPIID(from),
        to: inferCurrencyAPIID(to),
        start: format(startDate),
        end: format(new Date()),
      },
    });
    const { data } = await network({ method: "GET", url });
    return data;
  },

  fetchLatest: async (pairs: TrackingPair[]): Promise<number[]> => {
    if (pairs.length === 0) return [];

    // we group the pairs into chunks (of max LATEST_CHUNK) of the same "to" currency
    // the batches preserve the ordering of "pairs" so the output returns the result in same orders
    // we essentially assume that pairs' to's field are not changing / are sorted
    const batches: Array<[Currency[], Currency]> = []; // array of [froms, to]
    const first = pairs[0];
    let batch: [Currency[], Currency] = [[first.from], first.to];
    for (let i = 1; i < pairs.length; i++) {
      const pair = pairs[i];
      if (pair.to !== batch[1] || batch[0].length >= LATEST_CHUNK) {
        batches.push(batch);
        batch = [[pair.from], pair.to];
      } else {
        batch[0].push(pair.from);
      }
    }
    batches.push(batch);

    const all = await promiseAllBatched(4, batches, async ([froms, to]): Promise<number[]> => {
      const fromIds = froms.map(inferCurrencyAPIID);
      const url = URL.format({
        pathname: `${baseURL()}/v3/spot/simple`,
        query: {
          to: inferCurrencyAPIID(to),
          froms: fromIds.join(","),
        },
      });

      const { data } = await network({ method: "GET", url });

      // backend returns an object with keys being the froms
      return fromIds.map(id => data[id] || 0);
    });

    const data = all.flat();

    return data;
  },

  fetchIdsSortedByMarketcap: async () => {
    const { data } = await network({
      method: "GET",
      url: `${baseURL()}/v3/currencies/supported`,
    });
    return data;
  },
};

export default api;

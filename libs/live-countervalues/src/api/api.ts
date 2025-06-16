import network from "@ledgerhq/live-network";
import URL from "url";
import { getEnv } from "@ledgerhq/live-env";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { formatPerGranularity, inferCurrencyAPIID, pairId } from "../helpers";
import type { BatchStrategySolver, CounterValuesAPI, TrackingPair } from "../types";
import type { Currency } from "@ledgerhq/types-cryptoassets";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

const LATEST_CHUNK = 50;

const DAILY_RATE_MS = 14 * 24 * 60 * 60 * 1000;
const HOURLY_RATE_MS = 2 * 24 * 60 * 60 * 1000;

const api: CounterValuesAPI = {
  fetchHistorical: async (granularity, { from, to, startDate }, granularitiesRates) => {
    const format = formatPerGranularity[granularity];
    const now = new Date();
    if (now < startDate) {
      // we can't fetch the future
      return Promise.resolve({});
    }
    const start = format(startDate);
    const end = format(now);
    if (start === end) {
      // if start and end are the same, it's also pointless to fetch
      return Promise.resolve({});
    }

    const granularity_ms = granularitiesRates
      ? granularitiesRates[granularity]
      : granularity === "daily"
        ? DAILY_RATE_MS
        : HOURLY_RATE_MS;

    const start_date_ms_since_epoch = startDate.getTime();
    const end_date_ms_since_epoch = now.getTime();

    const corrected_start_date = format(
      new Date(Math.floor(start_date_ms_since_epoch / granularity_ms) * granularity_ms),
    );
    const corrected_end_date = format(
      new Date(Math.ceil(end_date_ms_since_epoch / granularity_ms) * granularity_ms),
    );

    const url = URL.format({
      pathname: `${baseURL()}/v3/historical/${granularity}/simple`,
      query: {
        from: inferCurrencyAPIID(from),
        to: inferCurrencyAPIID(to),
        start: corrected_start_date,
        end: corrected_end_date,
      },
    });
    const { data } = await network<Record<string, number>>({ method: "GET", url });
    return data;
  },

  fetchLatest: async (
    pairs: TrackingPair[],
    batchStrategySolver?: BatchStrategySolver,
  ): Promise<number[]> => {
    if (pairs.length === 0) return [];

    const shouldBatchCurrencyFrom = batchStrategySolver?.shouldBatchCurrencyFrom || (() => true);

    // we group the pairs into chunks (of max LATEST_CHUNK) of the same "to" currency
    // the batches preserve the ordering of "pairs" so the output returns the result in same orders
    // we essentially assume that pairs' to's field are not changing / are sorted
    const batches: Array<[Currency[], Currency]> = []; // array of [froms, to]
    const first = pairs[0];
    let batch: [Currency[], Currency] = [[first.from], first.to];

    // separately store all the pairs that can't be batched
    const singles: Array<[Currency[], Currency]> = [];

    for (let i = 1; i < pairs.length; i++) {
      const pair = pairs[i];
      const inBatch = shouldBatchCurrencyFrom(pair.from);
      if (!inBatch) {
        singles.push([[pair.from], pair.to]);
      } else {
        if (pair.to !== batch[1] || batch[0].length >= LATEST_CHUNK) {
          batches.push(batch);
          batch = [[pair.from], pair.to];
        } else {
          batch[0].push(pair.from);
        }
      }
    }
    batches.push(batch);
    const allBatches = batches.concat(singles);

    const map = new Map();
    await promiseAllBatched(4, allBatches, async ([froms, to]) => {
      const fromIds = froms.map(inferCurrencyAPIID);
      const url = URL.format({
        pathname: `${baseURL()}/v3/spot/simple`,
        query: {
          to: inferCurrencyAPIID(to),
          froms: fromIds.join(","),
        },
      });

      const { data } = await network<Record<string, number>>({ method: "GET", url });

      // store all countervalues in a global map
      for (let i = 0; i < fromIds.length; i++) {
        const from = froms[i];
        const value = data[fromIds[i]];
        map.set(pairId({ from, to }), value);
      }
    });

    // we return the result in the same order as the input pairs
    const data = pairs.map(pair => map.get(pairId(pair)) || 0);

    return data;
  },

  fetchIdsSortedByMarketcap: async () => {
    const { data } = await network<string[]>({
      method: "GET",
      url: `${baseURL()}/v3/supported/crypto`,
    });
    return data;
  },
};

export default api;

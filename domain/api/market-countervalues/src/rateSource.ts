import type { Currency } from "@domain/entity-currency";
import { inferCurrencyAPIID, pairId } from "@domain/entity-market-countervalues";
import { RateFetchError } from "./errors";
import { defaultGranularityRates, formatPerGranularity } from "./internals/granularity";
import { promiseAllBatched } from "./internals/promiseAllBatched";
import type { BatchStrategySolver, RateFetchers, RateQueryPromise, RateSource } from "./types";

/** How many `from` currencies share one spot request. */
const LATEST_CHUNK = 50;

/** How many spot requests run at once. */
const LATEST_CONCURRENCY = 4;

/**
 * Builds a {@link RateSource} over two raw requests.
 *
 * The windowing, the API-id resolution, the chunking of pairs into spot batches and the bounded
 * concurrency all live here, so an app supplies only the two dispatches. It holds no state, no
 * dispatch and no store reference: `fetchers` is called, never stored.
 */
export function createRateSource(fetchers: RateFetchers): RateSource {
  return {
    async fetchHistorical(granularity, { from, to, startDate }, granularitiesRates) {
      const format = formatPerGranularity[granularity];
      const now = new Date();
      // we can't fetch the future
      if (now < startDate) return {};
      // if start and end are the same, it's also pointless to fetch
      if (format(startDate) === format(now)) return {};

      const window = granularitiesRates
        ? granularitiesRates[granularity]
        : defaultGranularityRates[granularity];

      return run(
        fetchers.fetchHistoricalWindow({
          granularity,
          from: inferCurrencyAPIID(from),
          to: inferCurrencyAPIID(to),
          start: format(new Date(Math.floor(startDate.getTime() / window) * window)),
          end: format(new Date(Math.ceil(now.getTime() / window) * window)),
        }),
      );
    },

    async fetchLatest(pairs, batchStrategySolver) {
      if (pairs.length === 0) return [];

      const rates = new Map<string, number>();
      await promiseAllBatched(
        LATEST_CONCURRENCY,
        batchPairs(pairs, batchStrategySolver),
        async ([froms, to]) => {
          const fromIds = froms.map(inferCurrencyAPIID);
          const data = await run(
            fetchers.fetchSpotBatch({ to: inferCurrencyAPIID(to), froms: fromIds }),
          );
          fromIds.forEach((fromId, i) => {
            rates.set(pairId({ from: froms[i], to }), data[fromId]);
          });
        },
      );

      // we return the result in the same order as the input pairs
      return pairs.map(pair => rates.get(pairId(pair)) || 0);
    },
  };
}

/**
 * Awaits one request, releases its subscription and rethrows a failure as a {@link RateFetchError}.
 *
 * The subscription is released in `finally` rather than by dispatching with `subscribe: false`:
 * with `keepUnusedDataFor: 0` and no subscriber at all, the entry can be evicted before the
 * promise resolves and the result reads back empty.
 */
async function run<T>(promise: RateQueryPromise<T>): Promise<T> {
  try {
    const { data, error } = await promise;
    if (error) throw new RateFetchError(error);
    return data;
  } finally {
    promise.unsubscribe?.();
  }
}

/**
 * Groups pairs into `[froms, to]` spot requests.
 *
 * Batches hold at most {@link LATEST_CHUNK} `from` currencies against one `to`, and preserve input
 * order so the caller can read results back positionally. Pairs the solver excludes are requested
 * on their own, after the batches.
 */
function batchPairs(
  pairs: readonly { from: Currency; to: Currency }[],
  batchStrategySolver?: BatchStrategySolver,
): Array<[Currency[], Currency]> {
  const shouldBatchCurrencyFrom = batchStrategySolver?.shouldBatchCurrencyFrom || (() => true);

  // we essentially assume that pairs' to's field are not changing / are sorted
  const batches: Array<[Currency[], Currency]> = [];
  const singles: Array<[Currency[], Currency]> = [];
  const first = pairs[0];
  let batch: [Currency[], Currency] = [[first.from], first.to];

  for (let i = 1; i < pairs.length; i++) {
    const pair = pairs[i];
    if (!shouldBatchCurrencyFrom(pair.from)) {
      singles.push([[pair.from], pair.to]);
    } else if (pair.to !== batch[1] || batch[0].length >= LATEST_CHUNK) {
      batches.push(batch);
      batch = [[pair.from], pair.to];
    } else {
      batch[0].push(pair.from);
    }
  }
  batches.push(batch);

  return batches.concat(singles);
}

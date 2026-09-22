import type { Currency } from "@domain/entity-currency";
import {
  generateCache,
  incrementPerGranularity,
  pairId,
  type CounterValuesState,
  type CountervaluesSettings,
  type PairRateMapCache,
  type RateGranularity,
} from "@domain/entity-market-countervalues";
import { datapointLimits, formatPerGranularity } from "./internals/granularity";
import { promiseAllBatched } from "./internals/promiseAllBatched";
import type { CountervaluesLogger, LoadCountervaluesOptions } from "./types";

const MAX_RETRY_DELAY = 7 * incrementPerGranularity.daily;

/** How many historical windows are fetched at once. */
const HISTORICAL_CONCURRENCY = 10;

const noopLog: CountervaluesLogger = () => {};

/**
 * Synchronizes all countervalues incrementally, returning the next state.
 *
 * Not an RTK Query endpoint and it cannot become one: its cache key would be the whole prior state
 * and its result holds `Map` instances, which is what `serializableCheck` exists to reject. It
 * stays an orchestrator, and takes its rates through {@link LoadCountervaluesOptions.rates} so
 * nothing here reaches for a store.
 */
export async function loadCountervalues(
  state: CounterValuesState,
  settings: CountervaluesSettings,
  { rates, batchStrategySolver, granularitiesRates, log = noopLog }: LoadCountervaluesOptions,
): Promise<CounterValuesState> {
  const data = { ...state.data };
  const cache = { ...state.cache };
  const status = { ...state.status };
  const nowDate = new Date();
  const latestToFetch = settings.trackingPairs;

  // determines what historical data need to be fetched
  const histoToFetch: [
    RateGranularity,
    { from: Currency; to: Currency; startDate: Date },
    string,
  ][] = [];

  const rateGranularities: RateGranularity[] = ["daily", "hourly"];

  rateGranularities.forEach((granularity: RateGranularity) => {
    const format = formatPerGranularity[granularity];
    const earliestHisto = format(nowDate);
    const limit = datapointLimits[granularity];

    settings.trackingPairs.forEach(({ from, to, startDate }) => {
      const key = pairId({ from, to });

      const c: PairRateMapCache | null | undefined = cache[key];
      const stats = c?.stats;
      const s = status[key];

      // when there are too much http failures, slow down the rate to be actually re-fetched
      if (s?.failures && s.timestamp) {
        const { failures, timestamp } = s;
        const secondsBetweenRetries = Math.min(Math.exp(failures * 0.5), MAX_RETRY_DELAY);
        const nextTarget = timestamp + 1000 * secondsBetweenRetries;

        if (nowDate.valueOf() < nextTarget) {
          log(
            "countervalues",
            `${key}@${granularity} discarded: too much HTTP failures (${failures}) retry in ~${Math.round(
              (nextTarget - nowDate.valueOf()) / 1000,
            )}s`,
          );
          return;
        }
      }

      let start = startDate;
      const limitDate = Date.now() - limit;

      if (limitDate && start.valueOf() < limitDate) {
        start = new Date(limitDate);
      }

      const needOlderReload = s && s.oldestDateRequested && start < new Date(s.oldestDateRequested);

      if (needOlderReload) {
        log(
          "countervalues",
          `${key}@${granularity} need older reload (${start.toISOString()} < ${String(
            s && s.oldestDateRequested,
          )})`,
        );
      }

      if (!needOlderReload) {
        // we do not miss datapoints in the past so we can ask the only remaining part
        if (stats && stats.earliestStableDate && stats.earliestStableDate > start) {
          start = stats.earliestStableDate;
        }
      }

      // nothing to fetch for historical
      if (format(start) === earliestHisto) return;
      histoToFetch.push([
        granularity,
        {
          from,
          to,
          startDate: start,
        },
        key,
      ]);
    });
  });

  log(
    "countervalues",
    `${histoToFetch.length} historical value to fetch (${settings.trackingPairs.length} pairs)`,
  );

  // Fetch it all
  const [histo, latest] = await Promise.all([
    promiseAllBatched(HISTORICAL_CONCURRENCY, histoToFetch, ([granularity, pair, key]) =>
      rates
        .fetchHistorical(granularity, pair, granularitiesRates)
        .then(fetched => {
          // Update status infos
          const id = pairId(pair);
          let oldestDateRequested = status[id]?.oldestDateRequested;

          if (!oldestDateRequested || pair.startDate < new Date(oldestDateRequested)) {
            oldestDateRequested = pair.startDate.toISOString();
          }

          status[id] = {
            timestamp: Date.now(),
            oldestDateRequested,
          };

          return {
            [key]: fetched,
          };
        })
        .catch(e => {
          if (settings.disableAutoRecoverErrors) throw e;
          // TODO work on the semantic of failure.
          // do we want to opt-in for the 404 cases and make other fails it all?
          // do we want to be resilient on individual pulling / keep error somewhere?
          const id = pairId(pair);

          // only on HTTP error, we count the failures (not network down case)
          if (e && typeof e.status === "number" && e.status) {
            const s = status[id];
            status[id] = {
              timestamp: Date.now(),
              failures: (s?.failures || 0) + 1,
              oldestDateRequested: s?.oldestDateRequested,
            };
            if (e.status === 422) {
              // unsupported currency, we force a clear cache in this case
              delete data[key];
              delete cache[key];
            }
          }

          log(
            "countervalues-error",
            `Failed to fetch ${granularity} history for ${pair.from.ticker}-${
              pair.to.ticker
            } ${String(e)}`,
          );
          return null;
        }),
    ),
    rates
      .fetchLatest(latestToFetch, batchStrategySolver)
      .then(fetched => {
        const out: Record<string, { latest: number | null | undefined }> = {};
        let hasData = false;
        latestToFetch.forEach((pair, i) => {
          const key = pairId(pair);
          const latest = fetched[i];
          if (data[key]?.get("latest") === latest) return;
          out[key] = {
            latest: fetched[i],
          };
          hasData = true;
        });
        if (!hasData) return null;
        return out;
      })
      .catch(e => {
        if (settings.disableAutoRecoverErrors) throw e;
        log(
          "countervalues-error",
          "Failed to fetch latest for " +
            latestToFetch.map(p => `${p.from.ticker}-${p.to.ticker}`).join(",") +
            " " +
            String(e),
        );
        return null;
      }),
  ]);

  const updates: Array<Record<string, Record<string, unknown>>> = [];
  for (const patch of histo) {
    if (patch) {
      updates.push(patch);
    }
  }
  if (latest) {
    updates.push(latest);
  }
  log("countervalues", updates.length + " updates to apply");
  const changesKeys: Record<string, unknown> = {};
  updates.forEach(patch => {
    Object.keys(patch).forEach(key => {
      changesKeys[key] = 1;

      if (!data[key]) {
        data[key] = new Map();
      }

      const map = data[key];
      Object.entries(patch[key]).forEach(([k, v]) => {
        if (typeof v === "number") map.set(k, v);
      });
    });
  });

  // Synchronize cache. checkHoles on first run after restore (checkHolesOnNextLoad) or for new pairs (no status).
  const checkHolesOnNextLoad = state.checkHolesOnNextLoad === true;
  Object.keys(changesKeys).forEach(pair => {
    const checkHoles = checkHolesOnNextLoad || !status[pair];
    const previousStats = state.cache[pair]?.stats;
    cache[pair] = generateCache(pair, data[pair], settings, checkHoles, previousStats);
  });

  return {
    data,
    cache,
    status,
    checkHolesOnNextLoad: false,
  };
}

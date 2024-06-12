import { log } from "@ledgerhq/logs";
import {
  flattenAccounts,
  getAccountCurrency,
  isAccountEmpty,
} from "@ledgerhq/coin-framework/account/helpers";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
  TrackingPair,
  RateMap,
  RateGranularity,
  PairRateMapCache,
  RateMapRaw,
  BatchStrategySolver,
} from "./types";
import {
  pairId,
  magFromTo,
  formatPerGranularity,
  formatCounterValueDay,
  formatCounterValueHashes,
  parseFormattedDate,
  incrementPerGranularity,
  datapointLimits,
} from "./helpers";
import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import api from "./api";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

// yield raw version of the countervalues state to be saved in a db
export function exportCountervalues({ data, status }: CounterValuesState): CounterValuesStateRaw {
  const out = { status } as CounterValuesStateRaw;

  for (const path in data) {
    const obj: RateMapRaw = {};

    for (const [k, v] of data[path]) {
      obj[k] = v;
    }

    out[path] = obj;
  }

  return out;
}

// restore a countervalues state from the raw version
export function importCountervalues(
  { status, ...rest }: CounterValuesStateRaw,
  settings: CountervaluesSettings,
): CounterValuesState {
  const data: Record<string, RateMap> = {};

  for (const path in rest) {
    const obj = rest[path];
    const map = new Map();

    for (const k in obj) {
      map.set(k, obj[k]);
    }

    data[path] = map;
  }

  return {
    data,
    status,
    cache: Object.entries(data).reduce(
      (prev, [key, val]) => ({
        ...prev,
        // $FlowFixMe
        [key]: generateCache(key, <RateMap>val, settings),
      }),
      {},
    ),
  };
}

export function trackingPairForTopCoins(
  marketcapIds: string[],
  size: number,
  countervalue: Currency,
  startDate: Date,
) {
  const pairs = [];
  for (let i = 0; i < marketcapIds.length && pairs.length < size; i++) {
    const id = marketcapIds[i];
    const currency = findCryptoCurrencyById(id);
    if (currency) {
      pairs.push({
        from: currency,
        to: countervalue,
        startDate,
      });
    }
  }
  return pairs;
}

// infer the tracking pair from user accounts to know which pairs are concerned
export function inferTrackingPairForAccountsUnresolved(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  yearAgo.setHours(0, 0, 0, 0);
  return flattenAccounts(accounts)
    .filter(a => !isAccountEmpty(a))
    .map(account => {
      const currency = getAccountCurrency(account);
      return {
        from: currency,
        to: countervalue,
        startDate: account.creationDate < yearAgo ? account.creationDate : yearAgo,
      };
    });
}

export function inferTrackingPairForAccounts(
  accounts: Account[],
  countervalue: Currency,
): TrackingPair[] {
  return resolveTrackingPairs(inferTrackingPairForAccountsUnresolved(accounts, countervalue));
}

/**
 * yield the ids of the tracking pairs as stored in the database
 */
export function trackingPairIds(trackingPairs: TrackingPair[]): string[] {
  return trackingPairs.map(pairId);
}

export const initialState: CounterValuesState = {
  data: {},
  status: {},
  cache: {},
};

const MAX_RETRY_DELAY = 7 * incrementPerGranularity.daily;
// synchronize all countervalues incrementally (async update of the countervalues state)
export async function loadCountervalues(
  state: CounterValuesState,
  settings: CountervaluesSettings,
  batchStrategySolver?: BatchStrategySolver,
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
    promiseAllBatched(10, histoToFetch, ([granularity, pair, key]) =>
      api
        .fetchHistorical(granularity, pair)
        .then(rates => {
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
            [key]: rates,
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
    api
      .fetchLatest(latestToFetch, batchStrategySolver)
      .then(rates => {
        const out: Record<string, { latest: number | null | undefined }> = {};
        let hasData = false;
        latestToFetch.forEach((pair, i) => {
          const key = pairId(pair);
          const latest = rates[i];
          if (data[key]?.get("latest") === latest) return;
          out[key] = {
            latest: rates[i],
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

  const updates = [];
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

  // synchronize the cache
  Object.keys(changesKeys).forEach(pair => {
    cache[pair] = generateCache(pair, data[pair], settings);
  });

  return {
    data,
    cache,
    status,
  };
}

export function lenseRateMap(
  state: CounterValuesState,
  pair: {
    from: Currency;
    to: Currency;
  },
): PairRateMapCache | null | undefined {
  const rateId = pairId(pair);
  return state.cache[rateId];
}
export function lenseRate(
  { stats, fallback, map }: PairRateMapCache,
  query: {
    from: Currency;
    to: Currency;
    date?: Date | null | undefined;
  },
): number | null | undefined {
  const { date } = query;
  if (!date) return map.get("latest");
  const { iso, hour, day } = formatCounterValueHashes(date);
  if (stats.earliest && iso > stats.earliest) return map.get("latest");
  return map.get(hour) || map.get(day) || fallback;
}
export function calculate(
  state: CounterValuesState,
  initialQuery: {
    value: number;
    from: Currency;
    to: Currency;
    disableRounding?: boolean;
    date?: Date | null | undefined;
    reverse?: boolean;
  },
): number | null | undefined {
  const { from, to } = initialQuery;
  if (from === to) return initialQuery.value;
  const { date, value, disableRounding, reverse } = initialQuery;
  const query = {
    date,
    from,
    to,
  };
  const map = lenseRateMap(state, query);
  if (!map) return;
  let rate = lenseRate(map, query);
  if (!rate) return;
  const mult = reverse
    ? magFromTo(initialQuery.to, initialQuery.from)
    : magFromTo(initialQuery.from, initialQuery.to);

  if (reverse && rate) {
    rate = 1 / rate;
  }

  const val = rate ? value * rate * mult : 0;
  return disableRounding ? val : Math.round(val);
}

export function calculateMany(
  state: CounterValuesState,
  dataPoints: Array<{
    value: number;
    date: Date | null | undefined;
  }>,
  initialQuery: {
    from: Currency;
    to: Currency;
    disableRounding?: boolean;
    reverse?: boolean;
  },
): Array<number | null | undefined> {
  const { reverse, disableRounding } = initialQuery;
  const { from, to } = initialQuery;
  if (from === to) return dataPoints.map(d => d.value);
  const map = lenseRateMap(state, initialQuery);
  if (!map) return Array(dataPoints.length).fill(undefined); // undefined array

  const mult = reverse
    ? magFromTo(initialQuery.to, initialQuery.from)
    : magFromTo(initialQuery.from, initialQuery.to);
  return dataPoints.map(({ value, date }) => {
    if (from === to) return value;
    let rate = lenseRate(map, {
      from,
      to,
      date,
    });
    if (!rate) return;

    if (reverse && rate) {
      rate = 1 / rate;
    }

    const val = rate ? value * rate * mult : 0;
    return disableRounding ? val : Math.round(val);
  });
}

function generateCache(
  pair: string,
  rateMap: RateMap,
  settings: CountervaluesSettings,
): PairRateMapCache {
  const map = new Map(rateMap);
  const sorted = Array.from(map.keys())
    .sort()
    .filter(k => k !== "latest");
  const oldest = sorted[0];
  const earliest = sorted[sorted.length - 1];
  const oldestDate = oldest ? parseFormattedDate(oldest) : null;
  const earliestDate = earliest ? parseFormattedDate(earliest) : null;
  let earliestStableDate = earliestDate;
  let fallback: number = 0;
  let hasHole = false;

  if (oldestDate && oldest) {
    // we find the most recent stable day and we set it in earliestStableDate
    // if autofillGaps is on, shifting daily gaps (hourly don't need to be shifted as it automatically fallback on a day rate)
    const now = Date.now();
    const oldestTime = oldestDate.getTime();
    let shiftingValue = map.get(oldest) || 0;

    if (settings.autofillGaps) {
      fallback = shiftingValue;
    }

    for (let t = oldestTime; t < now; t += incrementPerGranularity.daily) {
      const d = new Date(t);
      const k = formatCounterValueDay(d);

      if (!map.has(k)) {
        if (!hasHole) {
          hasHole = true;
          earliestStableDate = d;
        }

        if (settings.autofillGaps) {
          map.set(k, shiftingValue);
        }
      } else {
        if (settings.autofillGaps) {
          shiftingValue = map.get(k) || 0;
        }
      }
    }

    if (!map.get("latest") && settings.autofillGaps) {
      map.set("latest", shiftingValue);
    }
  } else {
    if (settings.autofillGaps) {
      fallback = map.get("latest") || 0;
    }
  }

  const stats = {
    oldest,
    earliest,
    oldestDate,
    earliestDate,
    earliestStableDate,
  };

  return {
    map,
    stats,
    fallback,
  };
}

export function resolveTrackingPairs(pairs: TrackingPair[]): TrackingPair[] {
  const trackingPairs: Record<string, TrackingPair> = {};

  for (const pair of pairs) {
    const { from, to } = pair;

    if (from === to) continue;

    // dedup and keep oldest date
    let date = pair.startDate;
    const id = pairId(pair);

    if (trackingPairs[id]) {
      const { startDate } = trackingPairs[id];

      if (date) {
        date = date < startDate ? date : startDate;
      }
    }

    trackingPairs[id] = {
      from,
      to,
      startDate: date,
    };
  }

  // to reach more deterministic order, notably in API calls, we sort by from/to
  return Object.keys(trackingPairs)
    .sort()
    .map(id => trackingPairs[id]);
}

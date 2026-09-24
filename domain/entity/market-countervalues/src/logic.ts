import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
  PairRateMapCache,
  RateMap,
  RateMapRaw,
  RateMapStats,
  TrackingPair,
} from "./types";
import type { Currency } from "@domain/entity-currency";
import {
  datapointRetention,
  formatCounterValueDay,
  formatCounterValueHashes,
  incrementPerGranularity,
  inferCurrencyAPIID,
  magFromTo,
  pairId,
  parseFormattedDate,
} from "./helpers";

/**
 * Heuristic to avoid calling exportCountervalues when the persisted export would be unchanged.
 * Uses status (set of pairs) and cache.stats (oldest/earliest per pair) for history bounds.
 */
export function hasNewCountervaluesToExport(
  oldState: CounterValuesState,
  newState: CounterValuesState,
): boolean {
  const oldKeys = Object.keys(oldState.status);
  const newKeys = Object.keys(newState.status);
  if (oldKeys.length !== newKeys.length) return true;
  const oldSet = new Set(oldKeys);
  for (const id of newKeys) {
    if (!oldSet.has(id)) return true;
  }

  for (const pairId of newKeys) {
    const oldStats = oldState.cache[pairId]?.stats;
    const newStats = newState.cache[pairId]?.stats;
    if (oldStats?.oldest !== newStats?.oldest || oldStats?.earliest !== newStats?.earliest) {
      return true;
    }
  }
  return false;
}

// Raw state for db: history + status; no "latest" (so persistence only changes when history changes).
export function exportCountervalues(
  { data, status }: CounterValuesState,
  trackingPair: TrackingPair[],
): CounterValuesStateRaw {
  const hourlyLimit = formatCounterValueDay(new Date(Date.now() - datapointRetention.hourly));
  const pairIds = new Set(trackingPairIds(trackingPair));

  const out = { status: { ...status } } as CounterValuesStateRaw;

  for (const path in data) {
    if (!(data[path] instanceof Map)) continue; // Skip entries that are not maps
    if (!pairIds.has(path)) continue; // Skip pairs that are not tracked anymore

    let size = 0;
    const obj: RateMapRaw = {};

    for (const [k, v] of data[path]) {
      if (k === "latest") continue; // Don't persist latest; export only changes when history changes
      if (k.length === 13 && k.slice(0, 10) < hourlyLimit) continue; // Skip old hourly data
      size++;
      obj[k] = v;
    }

    if (size > 0) {
      out[path] = obj;
    }
  }

  return out;
}

// Restore from raw; status is passed through as-is.
export function importCountervalues(
  { status, ...rest }: CounterValuesStateRaw,
  settings: CountervaluesSettings,
): CounterValuesState {
  const data: Record<string, RateMap> = {};

  for (const path in rest) {
    const obj = rest[path];
    if (!obj || typeof obj !== "object") continue;
    const map = new Map<string, number>();

    for (const k in obj) {
      map.set(k, obj[k]);
    }

    data[path] = map;
  }

  return {
    data,
    status: status ?? {},
    cache: Object.entries(data).reduce(
      (prev, [key, val]) => ({
        ...prev,
        [key]: generateCache(key, val, settings, true, undefined),
      }),
      {},
    ),
    checkHolesOnNextLoad: true,
  };
}

/** Yields the ids of the tracking pairs as stored in the database. */
export function trackingPairIds(trackingPairs: TrackingPair[]): string[] {
  return trackingPairs.map(pairId);
}

export const initialState: CounterValuesState = {
  data: {},
  status: {},
  cache: {},
};

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

/**
 * Public only for `loadCountervalues` in `@domain/api-market-countervalues`. Treat it as internal to
 * the countervalues packages.
 */
export function generateCache(
  pair: string,
  rateMap: RateMap,
  settings: CountervaluesSettings,
  checkHoles: boolean,
  previousStats?: RateMapStats | null,
): PairRateMapCache {
  const map = new Map(rateMap);
  const sorted = Array.from(map.keys())
    .sort()
    .filter(k => k !== "latest");
  const oldest = sorted[0];
  const earliest = sorted[sorted.length - 1];
  const oldestDate = oldest ? parseFormattedDate(oldest) : null;
  const earliestDate = earliest ? parseFormattedDate(earliest) : null;
  let earliestStableDate: Date | null | undefined =
    previousStats?.earliestStableDate ?? earliestDate;
  let fallback: number = 0;
  let hasHole = false;

  if (oldestDate && oldest) {
    // we find the most recent stable day and we set it in earliestStableDate (only on first run, not incremental)
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
        if (checkHoles && !hasHole) {
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

// supportedCryptoIds holds API IDs from /v3/supported/crypto; an empty list disables the filter.
export function filterSupportedTrackingPairs(
  pairs: TrackingPair[],
  supportedCryptoIds?: string[],
): TrackingPair[] {
  if (!supportedCryptoIds?.length) return pairs;

  const supportedIds = new Set(supportedCryptoIds);
  const filteredPairs = pairs.filter(({ from }) => {
    if (from.type === "FiatCurrency") return true;
    return supportedIds.has(inferCurrencyAPIID(from));
  });

  return filteredPairs.length === pairs.length ? pairs : filteredPairs;
}

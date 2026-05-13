import type { Currency } from "@ledgerhq/types-cryptoassets";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import type {
  CounterValuesState,
  PairRateMapCache,
  RateMap,
  RateMapStats,
} from "@ledgerhq/live-countervalues/types";

export type Pair = { from: Currency; to: Currency };

export type BuildCVInput = {
  pair: Pair;
  /** Map of "YYYY-MM-DD" → rate. Order does not matter. */
  history?: Record<string, number>;
  latest?: number;
  /** Dates (YYYY-MM-DD) that should be treated as holes (i.e. earliestStableDate < them). */
  holes?: string[];
};

function parseDay(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function buildPairCache(input: BuildCVInput): PairRateMapCache {
  const history = input.history ?? {};
  const map: RateMap = new Map();
  for (const [day, rate] of Object.entries(history)) {
    map.set(day, rate);
  }
  if (input.latest !== undefined) {
    map.set("latest", input.latest);
  }

  const sentinelDay = "2099-01-01";
  if (!(sentinelDay in history)) {
    map.set(sentinelDay, input.latest ?? 0);
  }

  const sortedDays = Array.from(map.keys())
    .filter(k => k !== "latest")
    .sort((a, b) => a.localeCompare(b));
  const oldest = sortedDays[0];
  const earliest = sortedDays.at(-1);

  let earliestStableDate: Date | null | undefined =
    earliest === undefined ? null : parseDay(earliest);
  if (input.holes && input.holes.length > 0) {
    const earliestHole = [...input.holes].sort((a, b) => a.localeCompare(b))[0];
    earliestStableDate = parseDay(earliestHole);
  }

  const stats: RateMapStats = {
    oldest,
    earliest,
    oldestDate: oldest === undefined ? null : parseDay(oldest),
    earliestDate: earliest === undefined ? null : parseDay(earliest),
    earliestStableDate,
  };

  return {
    fallback: undefined,
    map,
    stats,
  };
}

/** `CounterValuesState` for multiple (from, to) pairs at once. */
export function buildMultiCV(inputs: BuildCVInput[]): CounterValuesState {
  const data: CounterValuesState["data"] = {};
  const status: CounterValuesState["status"] = {};
  const cache: CounterValuesState["cache"] = {};
  for (const input of inputs) {
    const id = pairId(input.pair);
    const pairCache = buildPairCache(input);
    data[id] = pairCache.map;
    status[id] = { timestamp: Date.now() };
    cache[id] = pairCache;
  }
  return { data, status, cache };
}

/** Minimal `CounterValuesState` for a single (from, to) pair. */
export function buildCV(input: BuildCVInput): CounterValuesState {
  return buildMultiCV([input]);
}

/**
 * Zip an array of (date, rate) tuples into the `{ "YYYY-MM-DD": rate }` shape
 * expected by `BuildCVInput.history`. Convenience helper for scenario builders.
 */
export function dailyHistory(entries: Array<[Date, number]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [d, r] of entries) {
    out[d.toISOString().slice(0, 10)] = r;
  }
  return out;
}

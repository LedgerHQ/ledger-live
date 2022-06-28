import { log } from "@ledgerhq/logs";
import type { Currency } from "../../types";
import type { RateGranularity, TrackingPair } from "../types";
import type { Module } from "./types";
import api from "../api";
import weth from "./weth";
import ethbtc from "./ethbtc";

const modules: Module[] = [weth, ethbtc];

export const installModule = (module: Module): void => {
  modules.push(module);
};

export const fetchHistorical = (
  granularity: RateGranularity,
  pair: TrackingPair
): Promise<Record<string, any>> => {
  let fn = api.fetchHistorical;
  // a module can override the default api. first who handle wins.
  const m = modules.find(
    (m) => m.handleAPI && m.handleAPI(pair) && m.fetchHistorical
  );

  if (m && m.fetchHistorical) {
    fn = m.fetchHistorical;
  }

  return fn(granularity, pair);
};

type CountervaluesJobs = {
  fn: (pairs: TrackingPair[]) => Promise<Array<number | null | undefined>>;
  pairs: TrackingPair[];
  indexes: number[];
};

export const fetchLatest = async (
  pairs: TrackingPair[],
  disableAutoRecoverErrors?: boolean
): Promise<Array<number | null | undefined>> => {
  // a module can override as well. but as latest is a "one api" call,
  // we need to segment the pairs in diff modules
  const jobs: CountervaluesJobs[] = [
    {
      fn: api.fetchLatest,
      pairs: [],
      indexes: [],
    },
    ...(<CountervaluesJobs[]>modules
      .map(
        (m) =>
          m.fetchLatest && {
            fn: m.fetchLatest,
            pairs: [],
            indexes: [],
          }
      )
      .filter(Boolean)),
  ];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const m = modules.find((m) => m.handleAPI && m.handleAPI(pair));

    if (m && m.fetchLatest) {
      const j = jobs.find((j) => m.fetchLatest === j.fn);

      if (j) {
        j.pairs.push(pair);
        j.indexes.push(i);
      }
    } else {
      jobs[0].pairs.push(pair);
      jobs[0].indexes.push(i);
    }
  }

  const result = Array(pairs.length).fill(0);
  await Promise.all(
    jobs
      .filter((j) => j.pairs.length > 0)
      .map((j) =>
        j
          .fn(j.pairs)
          .then((r) => {
            for (let i = 0; i < j.pairs.length; i++) {
              result[j.indexes[i]] = r[i];
            }
          })
          .catch((e) => {
            if (disableAutoRecoverErrors) throw e;
            log("error", "latest fetch issue: " + String(e));
          })
      )
  );
  return result;
};

export const mapRate = (
  pair: {
    from: Currency;
    to: Currency;
  },
  rate: number
): number =>
  modules.reduce((rate, m) => (m.mapRate ? m.mapRate(pair, rate) : rate), rate);

export const aliasPair = (pair: {
  from: Currency;
  to: Currency;
}): {
  from: Currency;
  to: Currency;
} =>
  modules.reduce((pair, m) => (m.aliasPair ? m.aliasPair(pair) : pair), pair);

export const resolveTrackingPair = (pair: {
  from: Currency;
  to: Currency;
}): {
  from: Currency;
  to: Currency;
} =>
  modules.reduce(
    (pair, m) => (m.resolveTrackingPair ? m.resolveTrackingPair(pair) : pair),
    pair
  );

export const isCountervalueEnabled = (c: Currency): boolean =>
  !c.disableCountervalue ||
  modules.some((m) => m.handleCountervalue && m.handleCountervalue(c));

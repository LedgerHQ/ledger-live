// @flow
import type { Currency } from "../../types";
import type { RateGranularity, TrackingPair, RateMap } from "../types";

type Pair = { from: Currency, to: Currency };

export type Module = {
  handleCountervalue?: (Currency) => boolean,

  mapRate?: (Pair, number) => number,

  aliasPair?: (Pair) => Pair,

  resolveTrackingPair?: (Pair) => Pair,

  handleAPI?: (Pair) => boolean,

  fetchHistorical?: (RateGranularity, TrackingPair) => Promise<RateMap>,

  fetchLatest?: (pairs: TrackingPair[]) => Promise<Array<?number>>,
};

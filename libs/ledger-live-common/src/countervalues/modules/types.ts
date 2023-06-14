import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { RateGranularity, TrackingPair, RateMapRaw } from "../types";

export type Pair = {
  from: Currency;
  to: Currency;
};

export type Module = {
  handleCountervalue?: (arg0: Currency) => boolean;
  mapRate?: (arg0: Pair, arg1: number) => number;
  aliasPair?: (arg0: Pair) => Pair;
  resolveTrackingPair?: (arg0: Pair) => Pair;
  handleAPI?: (arg0: Pair) => boolean;
  fetchHistorical?: (arg0: RateGranularity, arg1: TrackingPair) => Promise<RateMapRaw>;
  fetchLatest?: (pairs: TrackingPair[]) => Promise<Array<number | null | undefined>>;
};

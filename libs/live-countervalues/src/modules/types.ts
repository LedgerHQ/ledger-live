import type { Currency } from "@ledgerhq/types-cryptoassets";

export type Pair = {
  from: Currency;
  to: Currency;
};

export type Module = {
  aliasPair: (arg0: Pair) => Pair;
  resolveTrackingPair: (arg0: Pair) => Pair;
};

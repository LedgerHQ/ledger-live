// @flow

import type { TokenCurrency } from "../../types";
import { getCryptoCurrencyById } from "../../data/cryptocurrencies";
import { addTokens } from "../../data/tokens";

const convertTRC10 = ([
  id,
  abbr,
  name,
  contractAddress,
  precision
]): TokenCurrency => ({
  type: "TokenCurrency",
  id: "tron/trc10/" + id,
  contractAddress,
  parentCurrency: getCryptoCurrencyById("tron"),
  tokenType: "trc10",
  name,
  ticker: abbr,
  delisted: true, // not yet supported
  disableCountervalue: true,
  units: [
    {
      name,
      code: abbr,
      magnitude: precision
    }
  ]
});

const converters = {
  trc10: convertTRC10
};

export function add(type: string, list: any[]) {
  const converter = converters[type];
  if (!converter) {
    throw new Error("unknown token type '" + type + "'");
  }
  addTokens(list.map(converter));
}

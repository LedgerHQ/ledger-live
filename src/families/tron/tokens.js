// @flow

import type { TokenCurrency } from "../../types";
import { getCryptoCurrencyById } from "../../data/cryptocurrencies";
import { addTokens } from "../../data/tokens";

type TokenType = "trc10" | "trc20";

const convertTokens = (type: TokenType) => ([
  id,
  abbr,
  name,
  contractAddress,
  precision,
  delisted,
  ledgerSignature
]): TokenCurrency => ({
  type: "TokenCurrency",
  id: `tron/${type}/${id}`,
  contractAddress,
  parentCurrency: getCryptoCurrencyById("tron"),
  tokenType: type,
  name,
  ticker: abbr,
  delisted,
  disableCountervalue: true,
  ledgerSignature,
  units: [
    {
      name,
      code: abbr,
      magnitude: precision
    }
  ]
});

const converters = {
  trc10: convertTokens("trc10"),
  trc20: convertTokens("trc20")
};

export function add(type: TokenType, list: any[]) {
  const converter = converters[type];
  if (!converter) {
    throw new Error("unknown token type '" + type + "'");
  }
  addTokens(list.map(converter));
}

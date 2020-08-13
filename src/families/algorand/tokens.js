// @flow

import type { TokenCurrency } from "../../types";
import { getCryptoCurrencyById } from "../../data/cryptocurrencies";
import { addTokens } from "../../data/tokens";

type TokenType = "asa";

export const extractTokenId = (tokenId: string) => {
  return tokenId.split("/")[2];
};

const convertTokens = (type: TokenType) => ([
  id,
  abbr,
  name,
  contractAddress,
  precision,
]): TokenCurrency => ({
  type: "TokenCurrency",
  id: `algorand/${type}/${id}`,
  contractAddress,
  parentCurrency: getCryptoCurrencyById("algorand"),
  tokenType: type,
  name,
  ticker: abbr,
  disableCountervalue: true,
  units: [
    {
      name,
      code: abbr,
      magnitude: precision,
    },
  ],
});

const converters = {
  asa: convertTokens("asa"),
};

export function add(type: TokenType, list: any[]) {
  const converter = converters[type];
  if (!converter) {
    throw new Error("unknown token type '" + type + "'");
  }
  addTokens(list.map(converter));
}

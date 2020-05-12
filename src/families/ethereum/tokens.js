// @flow

import type { TokenCurrency } from "../../types";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyByTicker,
} from "../../data/cryptocurrencies";
import { addTokens } from "../../data/tokens";

const convertERC20 = ([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
]): TokenCurrency => ({
  type: "TokenCurrency",
  id: "ethereum/erc20/" + token,
  ledgerSignature,
  contractAddress,
  parentCurrency: getCryptoCurrencyById(parentCurrencyId),
  tokenType: "erc20",
  name,
  ticker,
  delisted,
  disableCountervalue:
    !!disableCountervalue || !!findCryptoCurrencyByTicker(ticker), // if it collides, disable
  units: [
    {
      name,
      code: ticker,
      magnitude,
    },
  ],
});

const converters = {
  erc20: convertERC20,
};

export function add(type: string, list: any[]) {
  const converter = converters[type];
  if (!converter) {
    throw new Error("unknown token type '" + type + "'");
  }
  addTokens(list.map(converter));
}

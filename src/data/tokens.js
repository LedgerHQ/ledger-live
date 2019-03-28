// @flow
import type { TokenCurrency, CryptoCurrency } from "../types";

const convertERC20 = ([
  parentCurrency,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress
]) => ({
  id: "ethereum/erc20/" + token,
  ledgerSignature,
  contractAddress,
  parentCurrency,
  tokenType: "erc20",
  name,
  ticker,
  units: [
    {
      name,
      code: ticker,
      magnitude
    }
  ]
});

const converters = {
  erc20: convertERC20
};

const emptyArray = [];
const tokensArray: TokenCurrency[] = [];
const tokensByCryptoCurrency: { [_: string]: TokenCurrency[] } = {};
const tokensById: { [_: string]: TokenCurrency } = {};
const tokensByTicker: { [_: string]: TokenCurrency } = {};
const tokensByAddress: { [_: string]: TokenCurrency } = {};

export function add(type: string, list: any[]) {
  const converter = converters[type];
  if (!converter) {
    throw new Error("unknown token type '" + type + "'");
  }
  list.forEach(data => {
    const token = converter(data);
    tokensArray.push(token);
    tokensById[token.id] = token;
    tokensByTicker[token.ticker] = token;
    tokensByAddress[token.contractAddress.toLowerCase()] = token;
    const { parentCurrency } = token;
    if (!(parentCurrency in tokensByCryptoCurrency)) {
      tokensByCryptoCurrency[parentCurrency] = [];
    }
    tokensByCryptoCurrency[parentCurrency].push(token);
  });
}

export function listTokens(): TokenCurrency[] {
  return tokensArray;
}

export function listTokensForCryptoCurrency(
  currency: CryptoCurrency
): TokenCurrency[] {
  return tokensByCryptoCurrency[currency.id] || emptyArray;
}

export function findTokenByTicker(ticker: string): ?TokenCurrency {
  return tokensByTicker[ticker];
}

export function findTokenById(id: string): ?TokenCurrency {
  return tokensById[id];
}

export function findTokenByAddress(address: string): ?TokenCurrency {
  return tokensByAddress[address.toLowerCase()];
}

export const hasTokenId = (id: string): boolean => id in tokensById;

export function getTokenById(id: string): TokenCurrency {
  const currency = findTokenById(id);
  if (!currency) {
    throw new Error(`token with id "${id}" not found`);
  }
  return currency;
}

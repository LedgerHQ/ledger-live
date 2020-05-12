// @flow
import type { TokenCurrency, CryptoCurrency } from "../types";

const emptyArray = [];
const tokensArray: TokenCurrency[] = [];
const tokensArrayWithDelisted: TokenCurrency[] = [];
const tokensByCryptoCurrency: { [_: string]: TokenCurrency[] } = {};
const tokensByCryptoCurrencyWithDelisted: { [_: string]: TokenCurrency[] } = {};
const tokensById: { [_: string]: TokenCurrency } = {};
const tokensByTicker: { [_: string]: TokenCurrency } = {};
const tokensByAddress: { [_: string]: TokenCurrency } = {};

function comparePriority(a: TokenCurrency, b: TokenCurrency) {
  return Number(!!b.disableCountervalue) - Number(!!a.disableCountervalue);
}

export function addTokens(list: TokenCurrency[]) {
  list.forEach((token) => {
    if (!token.delisted) tokensArray.push(token);
    tokensArrayWithDelisted.push(token);
    tokensById[token.id] = token;

    if (
      !tokensByTicker[token.ticker] ||
      comparePriority(token, tokensByTicker[token.ticker]) > 0
    ) {
      tokensByTicker[token.ticker] = token;
    }

    tokensByAddress[token.contractAddress.toLowerCase()] = token;
    const { parentCurrency } = token;
    if (!(parentCurrency.id in tokensByCryptoCurrency)) {
      tokensByCryptoCurrency[parentCurrency.id] = [];
    }
    if (!(parentCurrency.id in tokensByCryptoCurrencyWithDelisted)) {
      tokensByCryptoCurrencyWithDelisted[parentCurrency.id] = [];
    }
    if (!token.delisted) tokensByCryptoCurrency[parentCurrency.id].push(token);
    tokensByCryptoCurrencyWithDelisted[parentCurrency.id].push(token);
  });
}

type TokensListOptions = {
  withDelisted: boolean,
};

const defaultTokenListOptions: TokensListOptions = {
  withDelisted: false,
};

export function listTokens(
  options?: $Shape<TokensListOptions>
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}

export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: $Shape<TokensListOptions>
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || emptyArray;
  }
  return tokensByCryptoCurrency[currency.id] || emptyArray;
}

export function listTokenTypesForCryptoCurrency(
  currency: CryptoCurrency
): string[] {
  return listTokensForCryptoCurrency(currency).reduce((acc, cur) => {
    const tokenType = cur.tokenType;

    if (acc.indexOf(tokenType) < 0) {
      return [...acc, tokenType];
    }

    return acc;
  }, []);
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

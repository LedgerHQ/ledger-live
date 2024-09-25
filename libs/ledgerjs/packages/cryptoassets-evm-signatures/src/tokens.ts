import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "./currencies";
import { tokens as polygonTokens } from "./data/evm/137";
import { tokens as mainnetTokens } from "./data/evm/1";
import { tokens as bnbTokens } from "./data/evm/56";
import { ERC20Token } from "./types";

const emptyArray = [];
const tokensArray: TokenCurrency[] = [];
const tokensArrayWithDelisted: TokenCurrency[] = [];
const tokensByCryptoCurrency: Record<string, TokenCurrency[]> = {};
const tokensByCryptoCurrencyWithDelisted: Record<string, TokenCurrency[]> = {};
const tokensById: Record<string, TokenCurrency> = {};
const tokensByTicker: Record<string, TokenCurrency> = {};
const tokensByAddress: Record<string, TokenCurrency> = {};
const tokensByCurrencyAddress: Record<string, TokenCurrency> = {};
const tokenListHashes = new Set();

// Ethereum mainnet tokens
addTokens(mainnetTokens.map(convertERC20));
// Polygon tokens
addTokens(polygonTokens.map(convertERC20));
// Binance Smart Chain tokens
addTokens(bnbTokens.map(convertERC20));

type TokensListOptions = {
  withDelisted: boolean;
};

const defaultTokenListOptions: TokensListOptions = {
  withDelisted: false,
};

export function createTokenHash(token: TokenCurrency): string {
  return token
    ? `${token.id}${token.contractAddress}${token.delisted}${token.ticker}${token.ledgerSignature}`
    : "";
}

/**
 * Only for jest purpose, clean object to be empty
 * @param obj
 */
const __clearObject = (obj: Record<string, TokenCurrency | TokenCurrency[]>): void => {
  for (const key in obj) {
    delete obj[key];
  }
};
/**
 * Only for jest purpose, clear all the init list
 */
export function __clearAllLists(): void {
  tokensArray.length = 0;
  tokensArrayWithDelisted.length = 0;
  __clearObject(tokensByCryptoCurrency);
  __clearObject(tokensByCryptoCurrencyWithDelisted);
  __clearObject(tokensById);
  __clearObject(tokensByTicker);
  __clearObject(tokensByAddress);
  __clearObject(tokensByCurrencyAddress);
  tokenListHashes.clear();
}

/**
 *
 */
export function listTokens(options?: Partial<TokensListOptions>): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}

/**
 *
 */
export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: Partial<TokensListOptions>,
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || emptyArray;
  }

  return tokensByCryptoCurrency[currency.id] || emptyArray;
}

/**
 *
 */
export function listTokenTypesForCryptoCurrency(currency: CryptoCurrency): string[] {
  return listTokensForCryptoCurrency(currency).reduce<string[]>((acc, cur) => {
    const tokenType = cur.tokenType;

    if (acc.indexOf(tokenType) < 0) {
      return [...acc, tokenType];
    }

    return acc;
  }, []);
}

/**
 *
 */
export function findTokenByTicker(ticker: string): TokenCurrency | undefined {
  return tokensByTicker[ticker];
}

/**
 *
 */
export function findTokenById(id: string): TokenCurrency | undefined {
  return tokensById[id];
}

let deprecatedDisplayed = false;
export function findTokenByAddress(address: string): TokenCurrency | undefined {
  if (!deprecatedDisplayed) {
    deprecatedDisplayed = true;
    console.warn("findTokenByAddress is deprecated. use findTokenByAddressInCurrency");
  }
  return tokensByAddress[address.toLowerCase()];
}

export function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): TokenCurrency | undefined {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

/**
 *
 */
export const hasTokenId = (id: string): boolean => id in tokensById;

/**
 *
 */
export function getTokenById(id: string): TokenCurrency {
  const currency = findTokenById(id);

  if (!currency) {
    throw new Error(`token with id "${id}" not found`);
  }

  return currency;
}

function removeTokenFromArray(array: TokenCurrency[], tokenId: string) {
  if (array && array.length > 0) {
    const index = array.findIndex(currentToken => currentToken && currentToken.id === tokenId);
    if (index === -1) return array;
    return array.splice(index, 1);
  }
}

function removeTokenFromRecord(record: Record<string, TokenCurrency>, key: string) {
  tokenListHashes.delete(record[key]);
  delete record[key];
}

/**
 * Delete previous token entry to all array
 * @param token
 */
function removeTokenFromAllLists(token: TokenCurrency) {
  const { id, contractAddress, parentCurrency, ticker } = token;
  const lowCaseContract = contractAddress.toLowerCase();

  removeTokenFromRecord(tokensById, id);
  removeTokenFromRecord(tokensByCurrencyAddress, parentCurrency.id + ":" + lowCaseContract);
  removeTokenFromRecord(tokensByAddress, lowCaseContract);
  removeTokenFromRecord(tokensByTicker, ticker);
  removeTokenFromArray(tokensArray, id);
  removeTokenFromArray(tokensArrayWithDelisted, id);
  removeTokenFromArray(tokensByCryptoCurrency[parentCurrency.id], id);
  removeTokenFromArray(tokensByCryptoCurrencyWithDelisted[parentCurrency.id], id);
}

export function addTokens(list: (TokenCurrency | undefined)[]): void {
  list.forEach(token => {
    if (!token) return;
    const tokenHash = createTokenHash(token);
    if (tokenListHashes.has(tokenHash)) return;

    /**
     * We clean all the reference of an existing token, if an hash doesn't  match.
     * Like this we can update any change from a already added token coming from Dynamic CAL
     * and maintain it up to date without having to release a new version of LLD or LLM
     */
    const { id, contractAddress, parentCurrency, delisted, ticker } = token;
    if (tokensById[id]) removeTokenFromAllLists(token);
    const lowCaseContract = contractAddress.toLowerCase();

    if (!delisted) tokensArray.push(token);
    tokensArrayWithDelisted.push(token);
    tokensById[id] = token;

    if (!tokensByTicker[ticker]) {
      tokensByTicker[ticker] = token;
    }

    tokensByAddress[lowCaseContract] = token;
    tokensByCurrencyAddress[parentCurrency.id + ":" + lowCaseContract] = token;

    if (!(parentCurrency.id in tokensByCryptoCurrency)) {
      tokensByCryptoCurrency[parentCurrency.id] = [];
    }

    if (!(parentCurrency.id in tokensByCryptoCurrencyWithDelisted)) {
      tokensByCryptoCurrencyWithDelisted[parentCurrency.id] = [];
    }

    if (!delisted) tokensByCryptoCurrency[parentCurrency.id].push(token);
    tokensByCryptoCurrencyWithDelisted[parentCurrency.id].push(token);

    tokenListHashes.add(tokenHash);
  });
}

export function convertERC20([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
]: ERC20Token): TokenCurrency | undefined {
  const parentCurrency = findCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return;
  }

  const tokenType = parentCurrencyId === "bsc" ? "bep20" : "erc20";

  return {
    type: "TokenCurrency",
    id: `${parentCurrencyId}/${tokenType}/${token}`,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType,
    name,
    ticker,
    delisted,
    disableCountervalue: !!parentCurrency.isTestnetFor || !!disableCountervalue,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "./currencies";
import asatokens, { AlgorandASAToken } from "./data/asa";
import bep20tokens, { BEP20Token } from "./data/bep20";
import cardanoNativeTokens, { CardanoNativeToken } from "./data/cardanoNative";
import erc20tokens, { ERC20Token } from "./data/erc20";
import esdttokens, { ElrondESDTToken } from "./data/esdt";
import polygonTokens, { PolygonERC20Token } from "./data/polygon-erc20";
import stellarTokens, { StellarToken } from "./data/stellar";
import icpTokens, { ICPToken } from "./data/internet_computer";
import trc10tokens, { TRC10Token } from "./data/trc10";
import trc20tokens, { TRC20Token } from "./data/trc20";
//import spltokens from "../data/spl";
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
addTokens(erc20tokens.map(convertERC20));
addTokens(polygonTokens.map(convertERC20));
addTokens(trc10tokens.map(convertTRONTokens("trc10")));
addTokens(trc20tokens.map(convertTRONTokens("trc20")));
addTokens(bep20tokens.map(convertBEP20));
addTokens(asatokens.map(convertAlgorandASATokens));
addTokens(esdttokens.map(convertElrondESDTTokens));
addTokens(cardanoNativeTokens.map(convertCardanoNativeTokens));
addTokens(stellarTokens.map(convertStellarTokens));
addTokens(icpTokens.map(convertICPTokens));
//addTokens(spltokens.map(convertSplTokens));
type TokensListOptions = {
  withDelisted: boolean;
};
const defaultTokenListOptions: TokensListOptions = {
  withDelisted: false,
};
export function createTokenHash(token: TokenCurrency): string {
  return token
    ? `${token.id}${token.contractAddress}${token.delisted}${token.disableCountervalue}${token.ticker}${token.ledgerSignature}`
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
export function findTokenByTicker(ticker: string): TokenCurrency | null | undefined {
  return tokensByTicker[ticker];
}

/**
 *
 */
export function findTokenById(id: string): TokenCurrency | null | undefined {
  return tokensById[id];
}

let deprecatedDisplayed = false;
export function findTokenByAddress(address: string): TokenCurrency | null | undefined {
  if (!deprecatedDisplayed) {
    deprecatedDisplayed = true;
    console.warn("findTokenByAddress is deprecated. use findTokenByAddressInCurrency");
  }
  return tokensByAddress[address.toLowerCase()];
}

export function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): TokenCurrency | null | undefined {
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

function comparePriority(a: TokenCurrency, b: TokenCurrency) {
  return Number(!!b.disableCountervalue) - Number(!!a.disableCountervalue);
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

export function addTokens(list: TokenCurrency[]): void {
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

    if (!tokensByTicker[ticker] || comparePriority(token, tokensByTicker[ticker]) > 0) {
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
]: ERC20Token | PolygonERC20Token): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);
  return {
    type: "TokenCurrency",
    id: parentCurrencyId + "/erc20/" + token,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType: "erc20",
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

function convertBEP20([
  parentCurrencyId,
  token,
  ticker,
  magnitude,
  name,
  ledgerSignature,
  contractAddress,
  disableCountervalue,
  delisted,
]: BEP20Token): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);
  return {
    type: "TokenCurrency",
    id: parentCurrencyId + "/bep20/" + token,
    ledgerSignature,
    contractAddress,
    parentCurrency,
    tokenType: "bep20",
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

function convertAlgorandASATokens([
  id,
  abbr,
  name,
  contractAddress,
  precision,
  enableCountervalues,
]: AlgorandASAToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `algorand/asa/${id}`,
    contractAddress,
    parentCurrency: getCryptoCurrencyById("algorand"),
    tokenType: "asa",
    name,
    ticker: abbr,
    disableCountervalue: !enableCountervalues,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  };
}

function convertTRONTokens(type: "trc10" | "trc20") {
  return ([
    id,
    abbr,
    name,
    contractAddress,
    precision,
    delisted,
    ledgerSignature,
    enableCountervalues,
  ]: TRC10Token | TRC20Token): TokenCurrency => ({
    type: "TokenCurrency",
    id: `tron/${type}/${id}`,
    contractAddress,
    parentCurrency: getCryptoCurrencyById("tron"),
    tokenType: type,
    name,
    ticker: abbr,
    delisted,
    disableCountervalue: !enableCountervalues,
    ledgerSignature,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  });
}

function convertElrondESDTTokens([
  ticker,
  identifier,
  decimals,
  signature,
  name,
  disableCountervalue,
]: ElrondESDTToken): TokenCurrency {
  const ELROND_ESDT_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";

  return {
    type: "TokenCurrency",
    id: `elrond/esdt/${identifier}`,
    contractAddress: ELROND_ESDT_CONTRACT,
    ledgerSignature: signature,
    parentCurrency: getCryptoCurrencyById("elrond"),
    tokenType: "esdt",
    disableCountervalue,
    name,
    ticker,
    units: [
      {
        name,
        code: name,
        magnitude: decimals,
      },
    ],
  };
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function convertSplTokens([
  chainId,
  name,
  symbol,
  address,
  decimals,
  enableCountervalues,
]): TokenCurrency {
  const chainIdToCurrencyId = {
    101: "solana",
    102: "solana_testnet",
    103: "solana_devnet",
  };
  const currencyId = chainIdToCurrencyId[chainId];
  return {
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById(currencyId),
    id: `solana/spl/${address}`,
    name,
    tokenType: "spl",
    ticker: symbol,
    type: "TokenCurrency",
    disableCountervalue: !enableCountervalues,
    units: [
      {
        name,
        code: symbol,
        magnitude: decimals,
      },
    ],
  };
}

function convertCardanoNativeTokens([
  parentCurrencyId,
  policyId,
  assetName,
  name,
  ticker,
  decimals,
  delisted,
  disableCountervalue,
]: CardanoNativeToken): TokenCurrency {
  const assetId = policyId + assetName;
  return {
    type: "TokenCurrency",
    id: `${parentCurrencyId}/native/${assetId}`,
    // Tracking and accounting of native tokens is natively supported by cardano ledger.
    // As there's no contract for native tokens, using unique assetId in place of contractAddress
    contractAddress: assetId,
    parentCurrency: getCryptoCurrencyById(parentCurrencyId),
    tokenType: "native",
    name,
    ticker,
    delisted,
    disableCountervalue,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

function convertStellarTokens([
  assetCode,
  assetIssuer,
  assetType,
  name,
  precision,
  enableCountervalues,
]: StellarToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `stellar/asset/${assetCode}:${assetIssuer}`,
    contractAddress: assetIssuer,
    parentCurrency: getCryptoCurrencyById("stellar"),
    tokenType: assetType,
    name,
    ticker: assetCode,
    disableCountervalue: !enableCountervalues,
    units: [
      {
        name,
        code: assetCode,
        magnitude: precision,
      },
    ],
  };
}

function convertICPTokens([
  assetCode,
  assetIssuer,
  assetType,
  name,
  precision,
  enableCountervalues,
]: ICPToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `icp/asset/${assetCode}:${assetIssuer}`,
    contractAddress: assetIssuer,
    parentCurrency: getCryptoCurrencyById("internet_computer"),
    tokenType: assetType,
    name,
    ticker: assetCode,
    disableCountervalue: !enableCountervalues,
    units: [
      {
        name,
        code: assetCode,
        magnitude: precision,
      },
    ],
  };
}

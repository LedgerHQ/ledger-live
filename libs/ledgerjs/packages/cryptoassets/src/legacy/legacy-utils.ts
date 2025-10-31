import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "../currencies";
import {
  tokensArray,
  tokensArrayWithDelisted,
  tokensByCryptoCurrency,
  tokensByCryptoCurrencyWithDelisted,
  tokensById,
  tokensByCurrencyAddress,
  tokenListHashes,
} from "./legacy-state";
import {
  ERC20Token,
  AlgorandASAToken,
  MultiversXESDTToken,
  TRC10Token,
  TRC20Token,
} from "../types";
import type { CardanoNativeToken } from "../data/cardanoNative";
import type { TonJettonToken } from "../data/ton-jetton";
import type { StellarToken } from "../data/stellar";
import type { HederaToken } from "../data/hedera";
import type { Vip180Token } from "../data/vip180";
import type { SPLToken } from "../data/spl";
import type { AptosToken as AptosCoinToken } from "../data/apt_coin";
import type { AptosToken as AptosFAToken } from "../data/apt_fungible_asset";
import type { SuiToken } from "../data/sui";

// Export types for compatibility
export interface TokensListOptions {
  withDelisted: boolean;
}

// Convert functions moved from legacy.ts

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
export function convertAlgorandASATokens([
  id,
  abbr,
  name,
  contractAddress,
  precision,
]: AlgorandASAToken): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById("algorand");

  return {
    type: "TokenCurrency",
    id: `algorand/asa/${id}`,
    contractAddress,
    parentCurrency,
    tokenType: "asa",
    name,
    ticker: abbr,
    disableCountervalue: false,
    units: [
      {
        name,
        code: abbr,
        magnitude: precision,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertVechainToken([
  tokenIdenfitier,
  ticker,
  name,
  contractAddress,
  precision,
]: Vip180Token): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `vechain/vip180/${tokenIdenfitier}`,
    contractAddress: contractAddress,
    parentCurrency: getCryptoCurrencyById("vechain"),
    tokenType: "vip180",
    name,
    ticker,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: precision,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertTRONTokens(type: "trc10" | "trc20") {
  return ([id, abbr, name, contractAddress, precision, delisted, ledgerSignature]:
    | TRC10Token
    | TRC20Token): TokenCurrency => {
    const parentCurrency = getCryptoCurrencyById("tron");

    // For TRC20 tokens, use contract address as ID to match backend API format
    // API expects lowercase addresses, so normalize here
    // For TRC10 tokens, use numeric ID as before
    const tokenId = type === "trc20" ? contractAddress.toLowerCase() : id;

    return {
      type: "TokenCurrency",
      id: `tron/${type}/${tokenId}`,
      contractAddress,
      parentCurrency,
      tokenType: type,
      name,
      ticker: abbr,
      delisted,
      disableCountervalue: false,
      ledgerSignature,
      units: [
        {
          name,
          code: abbr,
          magnitude: precision,
        },
      ],
    };
  };
}

/**
 * @deprecated
 */
export function convertMultiversXESDTTokens([
  ticker,
  identifier,
  decimals,
  signature,
  name,
]: MultiversXESDTToken): TokenCurrency {
  const MULTIVERSX_ESDT_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u";
  const parentCurrency = getCryptoCurrencyById("elrond");

  return {
    type: "TokenCurrency",
    id: `multiversx/esdt/${identifier}`,
    contractAddress: MULTIVERSX_ESDT_CONTRACT,
    ledgerSignature: signature,
    parentCurrency,
    tokenType: "esdt",
    disableCountervalue: false,
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

/**
 * @deprecated
 */
export function convertSplTokens([
  id,
  network,
  name,
  symbol,
  address,
  decimals,
]: SPLToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById(network),
    name,
    tokenType: "spl",
    ticker: symbol,
    disableCountervalue: false,
    units: [
      {
        name,
        code: symbol,
        magnitude: decimals,
      },
    ],
  };
}

/**
 * @deprecated
 */
function convertAptosTokens(
  tokenType: "coin" | "fungible_asset",
  [id, ticker, name, address, decimals, delisted]: AptosCoinToken | AptosFAToken,
): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById("aptos"),
    name,
    tokenType,
    ticker,
    disableCountervalue: false,
    delisted,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertAptCoinTokens(token: AptosCoinToken): TokenCurrency {
  return convertAptosTokens("coin", token);
}

/**
 * @deprecated
 */
export function convertAptFaTokens(token: AptosFAToken): TokenCurrency {
  return convertAptosTokens("fungible_asset", token);
}

/**
 * @deprecated
 */
export function convertSuiTokens([
  id,
  name,
  ticker,
  address,
  decimals,
  ledgerSignature,
]: SuiToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: address,
    parentCurrency: getCryptoCurrencyById("sui"),
    name,
    ledgerSignature,
    tokenType: "sui",
    ticker,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertHederaTokens([
  id,
  tokenId,
  name,
  ticker,
  network,
  decimals,
  delisted,
]: HederaToken): TokenCurrency {
  return {
    type: "TokenCurrency",
    id,
    contractAddress: tokenId,
    parentCurrency: getCryptoCurrencyById(network),
    tokenType: "hts",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertCardanoNativeTokens([
  parentCurrencyId,
  policyId,
  assetName,
  name,
  ticker,
  decimals,
  delisted,
]: CardanoNativeToken): TokenCurrency | undefined {
  const assetId = policyId + assetName;

  const parentCurrency = getCryptoCurrencyById(parentCurrencyId);

  if (!parentCurrency) {
    return;
  }

  return {
    type: "TokenCurrency",
    id: `${parentCurrencyId}/native/${assetId}`,
    // Tracking and accounting of native tokens is natively supported by cardano ledger.
    // As there's no contract for native tokens, using unique assetId in place of contractAddress
    contractAddress: assetId,
    parentCurrency,
    tokenType: "native",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude: decimals,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertStellarTokens([
  assetCode,
  assetIssuer,
  assetType,
  name,
  precision,
]: StellarToken): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById("stellar");

  return {
    type: "TokenCurrency",
    id: `stellar/asset/${assetCode.toUpperCase()}:${assetIssuer.toUpperCase()}`,
    contractAddress: assetIssuer.toUpperCase(),
    parentCurrency,
    tokenType: assetType,
    name,
    ticker: assetCode,
    disableCountervalue: false,
    units: [
      {
        name,
        code: assetCode,
        magnitude: precision,
      },
    ],
  };
}

/**
 * @deprecated
 */
export function convertJettonToken([address, name, ticker, magnitude, delisted]: TonJettonToken):
  | TokenCurrency
  | undefined {
  const parentCurrency = findCryptoCurrencyById("ton");

  if (!parentCurrency) {
    return;
  }

  return {
    type: "TokenCurrency",
    id: "ton/jetton/" + address.toLocaleLowerCase(),
    contractAddress: address,
    parentCurrency,
    tokenType: "jetton",
    name,
    ticker,
    delisted,
    disableCountervalue: false,
    units: [
      {
        name,
        code: ticker,
        magnitude,
      },
    ],
  };
}

/**
 * @deprecated
 */
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
  __clearObject(tokensByCurrencyAddress);
  tokenListHashes.clear();
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
  const { id, contractAddress, parentCurrency } = token;
  const lowCaseContract = contractAddress.toLowerCase();

  removeTokenFromRecord(tokensById, id);
  removeTokenFromRecord(tokensByCurrencyAddress, parentCurrency.id + ":" + lowCaseContract);
  removeTokenFromArray(tokensArray, id);
  removeTokenFromArray(tokensArrayWithDelisted, id);
  removeTokenFromArray(tokensByCryptoCurrency[parentCurrency.id], id);
  removeTokenFromArray(tokensByCryptoCurrencyWithDelisted[parentCurrency.id], id);
}

/**
 * @deprecated This function is deprecated since tokens will soon be loaded dynamically
 */
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
    const { id, contractAddress, parentCurrency, delisted } = token;
    if (tokensById[id]) removeTokenFromAllLists(token);
    const lowCaseContract = contractAddress.toLowerCase();

    if (!delisted) tokensArray.push(token);
    tokensArrayWithDelisted.push(token);
    tokensById[id] = token;

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

// Legacy list functions - deprecated since moving to DaDa API

const defaultTokenListOptions: TokensListOptions = {
  withDelisted: false,
};

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * List all available tokens
 */
export function listTokensLegacy(options?: Partial<TokensListOptions>): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  return withDelisted ? tokensArrayWithDelisted : tokensArray;
}

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * List tokens for a specific cryptocurrency
 */
export function listTokensForCryptoCurrencyLegacy(
  currency: CryptoCurrency,
  options?: Partial<TokensListOptions>,
): TokenCurrency[] {
  const { withDelisted } = { ...defaultTokenListOptions, ...options };
  if (withDelisted) {
    return tokensByCryptoCurrencyWithDelisted[currency.id] || [];
  }

  return tokensByCryptoCurrency[currency.id] || [];
}

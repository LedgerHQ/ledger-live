import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "./currencies";
import { convertApiToken, type ApiTokenData } from "./api-token-converter";

export interface ApiTokenCurrency {
  type: "token_currency";
  id: string;
  contractAddress: string;
  name: string;
  ticker: string;
  units: Array<{ code: string; name: string; magnitude: number }>;
  standard: string;
  parentCurrency?: string | null;
  tokenIdentifier?: string;
  symbol?: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  descriptor?: unknown;
}

export interface ApiCryptoCurrency {
  type: "crypto_currency";
  id: string;
  name: string;
  ticker: string;
  units: Array<{ code: string; name: string; magnitude: number }>;
  chainId?: string | null;
  confirmationsNeeded?: number;
  symbol?: string;
  coinType?: number;
  family?: string;
  hasSegwit?: boolean;
  hasTokens?: boolean;
  hrp?: string | null;
  disableCountervalue?: boolean;
}

export type ApiAsset = ApiTokenCurrency | ApiCryptoCurrency;

export function convertApiAsset(apiAsset: ApiAsset): CryptoOrTokenCurrency | undefined {
  if (apiAsset.type === "crypto_currency") {
    return convertApiCryptoCurrency(apiAsset);
  } else if (apiAsset.type === "token_currency") {
    return convertApiTokenCurrency(apiAsset);
  }
  return undefined;
}

function convertApiCryptoCurrency(apiCrypto: ApiCryptoCurrency): CryptoOrTokenCurrency | undefined {
  return findCryptoCurrencyById(apiCrypto.id);
}

function convertApiTokenCurrency(apiToken: ApiTokenCurrency): CryptoOrTokenCurrency | undefined {
  const apiTokenData: ApiTokenData = {
    id: apiToken.id,
    contractAddress: apiToken.contractAddress,
    name: apiToken.name,
    ticker: apiToken.ticker,
    units: apiToken.units,
    standard: apiToken.standard,
    delisted: apiToken.delisted,
    disableCountervalue: apiToken.disableCountervalue,
    tokenIdentifier: apiToken.tokenIdentifier,
  };

  return convertApiToken(apiTokenData);
}

export function convertApiAssets(
  apiAssets: Record<string, ApiAsset>,
): Record<string, CryptoOrTokenCurrency> {
  const convertedAssets: Record<string, CryptoOrTokenCurrency> = {};

  Object.entries(apiAssets).forEach(([key, asset]) => {
    const convertedAsset = convertApiAsset(asset);
    if (convertedAsset) {
      convertedAssets[key] = convertedAsset;
    }
  });

  return convertedAssets;
}

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
  const localCrypto = findCryptoCurrencyById(apiCrypto.id);
  if (localCrypto) {
    return localCrypto;
  }

  // Create a dynamic CryptoCurrency object with placeholders for fields we can't infer
  return {
    type: "CryptoCurrency" as const,
    id: apiCrypto.id,
    name: apiCrypto.name,
    ticker: apiCrypto.ticker,
    units: apiCrypto.units.map(unit => ({
      name: unit.name,
      code: unit.code,
      magnitude: unit.magnitude,
    })),
    // Required fields with placeholders when not available in API
    managerAppName: apiCrypto.name, // Placeholder: use name as fallback
    coinType: apiCrypto.coinType ?? 0, // Placeholder: default to 0 if not provided
    scheme: apiCrypto.id.toLowerCase(), // Placeholder: use lowercase ticker
    color: "#999999", // Placeholder: default gray color
    family: apiCrypto.family ?? apiCrypto.id, // Placeholder: default to "unknown" if not provided
    explorerViews: [], // Placeholder: empty array
    // Optional fields from API
    symbol: apiCrypto.symbol,
    disableCountervalue: apiCrypto.disableCountervalue,
    supportsSegwit: apiCrypto.hasSegwit,
    // Add ethereumLikeInfo if chainId is present
    ...(apiCrypto.chainId && {
      ethereumLikeInfo: { chainId: parseInt(apiCrypto.chainId, 10) },
    }),
  };
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

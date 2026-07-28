import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { PartialMarketItemResponse } from "../../market/utils/types";

// Raw DADA API wire-format shapes for currency assets
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

// Types for crypto asset metadata
export interface CryptoAssetMeta {
  /** Asset identifier */
  id: string;
  /** Asset ticker symbol */
  ticker: string;
  /** Asset display name */
  name: string;
  /** Map of network IDs to their corresponding asset IDs */
  assetsIds: Record<string, string>;
}

// Types for network information
export interface NetworkInfo {
  /** Network identifier */
  id: string;
  /** Network display name */
  name: string;
}

// Types for interest rate data
export interface InterestRate {
  /** Currency identifier */
  currencyId: string;
  /** Interest rate value */
  rate: number;
  /** Type of rate (NRR, APR, APY, etc.) */
  type: string;
  /** Timestamp when the rate was fetched */
  fetchAt: string;
}

// Types for currency ordering
export interface CurrenciesOrder {
  /** Sorting key (e.g., "marketCap") */
  key: string;
  /** Sort order (e.g., "desc") */
  order: string;
  /** Ordered list of meta-currency IDs */
  metaCurrencyIds: string[];
}

// Types for raw API response (before transformation)
export interface RawApiResponse {
  /** Grouped crypto assets by meta-currency */
  cryptoAssets: Record<string, CryptoAssetMeta>;
  /** Network information */
  networks: Record<string, NetworkInfo>;
  /** Raw crypto currencies and token currencies from API */
  cryptoOrTokenCurrencies: Record<string, ApiAsset>;
  /** Interest rates for various currencies */
  interestRates: Record<string, InterestRate>;
  /** Market data for currencies */
  markets: Record<string, PartialMarketItemResponse>;
  /** Currency ordering information */
  currenciesOrder: CurrenciesOrder;
}

// Types for transformed API response (after transformation)
export interface AssetsData {
  /** Grouped crypto assets by meta-currency */
  cryptoAssets: Record<string, CryptoAssetMeta>;
  /** Network information */
  networks: Record<string, NetworkInfo>;
  /** Transformed crypto currencies and token currencies compatible with Ledger Live */
  cryptoOrTokenCurrencies: Record<string, CryptoOrTokenCurrency>;
  /** Interest rates for various currencies */
  interestRates: Record<string, InterestRate>;
  /** Market data for currencies */
  markets: Record<string, PartialMarketItemResponse>;
  /** Currency ordering information */
  currenciesOrder: CurrenciesOrder;
}

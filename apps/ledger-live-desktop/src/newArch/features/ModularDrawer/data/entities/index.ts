import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { ApiAsset } from "@ledgerhq/cryptoassets";
import { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";

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
  /** Default ticker for the network */
  ticker: string;
}

// Types for interest rate data
export interface InterestRate {
  /** Currency identifier */
  currencyId: string;
  /** Interest rate value */
  rate: number;
  /** Type of rate (APR, APY, etc.) */
  type: "APR" | "APY";
  /** Timestamp when the rate was fetched */
  fetchAt: string;
}

// Types for currency ordering
export interface CurrenciesOrder {
  /** Sorting key (e.g., "marketCap") */
  key: string;
  /** Sort order (e.g., "desc") */
  order: string;
  /** Ordered list of currency IDs */
  currenciesIds: string[];
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
  markets: Record<string, MarketItemResponse>;
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
  markets: Record<string, MarketItemResponse>;
  /** Currency ordering information */
  currenciesOrder: CurrenciesOrder;
}

import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import type { InterestRate } from "@domain/entity-interest-rate";
import type { CurrenciesOrder, NetworkInfo } from "./schema";
import type { PartialMarketItemResponse } from "./market";

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

export enum AssetsDataTags {
  Assets = "Assets",
}

export enum AssetsAdditionalData {
  Apy = "apy",
  MarketTrend = "marketTrend",
}

export enum AssetCategory {
  Stablecoins = "stablecoins",
  Stocks = "stocks",
}

export interface GetAssetsDataParams {
  search?: string;
  currencyIds?: string[];
  networkIds?: readonly string[];
  categories?: AssetCategory[];
  useCase?: string;
  product: "llm" | "lld";
  version: string;
  isStaging?: boolean;
  additionalData?: AssetsAdditionalData[];
  includeTestNetworks?: boolean;
}

export interface PageParam {
  cursor?: string;
}

export interface AssetsDataWithPagination extends AssetsData {
  pagination: {
    nextCursor?: string;
  };
}

export const ONE_DAY_IN_SECONDS = 86_400;

export interface GetAssetsByCategoryParams {
  category: AssetCategory;
  product: "llm" | "lld";
  version: string;
  isStaging?: boolean;
}

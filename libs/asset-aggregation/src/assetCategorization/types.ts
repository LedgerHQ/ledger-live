import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";

export type MarketDataMap = Record<string, { price?: number; priceChangePercentage24h?: number }>;

export type CategorizedAssetItem = {
  currency: CryptoCurrency | TokenCurrency;
  balance: number;
  value: number;
  distribution: number;
  accounts: AccountLike[];
  price?: number;
  priceChangePercentage24h?: number;
};

export type CategorizedAssets = {
  cryptos: CategorizedAssetItem[];
  stablecoins: CategorizedAssetItem[];
};

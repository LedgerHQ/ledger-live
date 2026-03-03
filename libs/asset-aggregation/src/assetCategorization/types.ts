import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";

export type CategorizedAssetItem = {
  currency: CryptoCurrency | TokenCurrency;
  balance: number;
  value: number;
  distribution: number;
  accounts: AccountLike[];
};

export type CategorizedAssets = {
  cryptos: CategorizedAssetItem[];
  stablecoins: CategorizedAssetItem[];
};

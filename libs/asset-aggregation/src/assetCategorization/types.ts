import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountLike } from "@ledgerhq/types-live";

export type CategorizedAssetItem = {
  currency: CryptoCurrency | TokenCurrency;
  marketId?: string;
  balance: number;
  value: number;
  distribution: number;
  accounts: AccountLike[];
};

export type CategorizedAssets = {
  cryptos: CategorizedAssetItem[];
  stablecoins: CategorizedAssetItem[];
};

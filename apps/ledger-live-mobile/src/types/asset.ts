import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AccountLike } from "@ledgerhq/types-live";

export type Asset = {
  currency: CryptoOrTokenCurrency;
  accounts: AccountLike[];
  distribution?: number;
  amount: number;
  countervalue?: number;
  isPlaceholder?: boolean;
  marketId?: string;
};

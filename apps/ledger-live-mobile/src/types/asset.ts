import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";

export type Asset = {
  currency: CryptoOrTokenCurrency;
  accounts: AccountLike[];
  distribution?: number;
  amount: number;
  countervalue?: number;
};

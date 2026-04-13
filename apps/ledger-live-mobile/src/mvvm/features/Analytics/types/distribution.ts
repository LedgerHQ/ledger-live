import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type DistributionItem = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  amount: number;
  distribution: number;
}>;

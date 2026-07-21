import type { CryptoCurrency, TokenCurrency } from "@domain/entity-currency";

export type DistributionItem = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  amount: number;
  distribution: number;
}>;

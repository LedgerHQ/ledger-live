import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type DistributionItem = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  amount: number;
  distribution: number;
}>;

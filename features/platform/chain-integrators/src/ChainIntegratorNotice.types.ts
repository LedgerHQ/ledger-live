import type { CryptoCurrency } from "@domain/entity-currency-crypto";

export type ChainIntegratorNoticeProps = Readonly<{
  currency: CryptoCurrency;
}>;

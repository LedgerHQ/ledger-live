import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AddAddressCurrencySelection } from "./types";

export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(
    networkIds: readonly CryptoCurrency["id"][],
  ): Promise<AddAddressCurrencySelection | null>;
}>;

import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AddAddressCurrencySelection } from "../Flow/types";
export type {
  ContactsAddressValidationPort,
  ContactsAddressValidationResult,
} from "./addressValidation";

export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(
    networkIds: readonly CryptoCurrency["id"][],
  ): Promise<AddAddressCurrencySelection | null>;
}>;

import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
export type {
  ContactsAddressValidationPort,
  ContactsAddressValidationResult,
} from "./addressValidation";

export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(
    networkIds: readonly CryptoCurrency["id"][],
  ): Promise<ContactAddress["currencyId"] | null>;
}>;

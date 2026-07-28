import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(
    networkIds: readonly CryptoCurrency["id"][],
  ): Promise<ContactAddress["currencyId"] | null>;
}>;

export type ContactsAddressValidationResult =
  | Readonly<{
      status: "valid";
      resolvedAddress: ContactAddress["address"];
      isDomain: boolean;
    }>
  | Readonly<{
      status: "invalid_format" | "domain_not_found" | "unavailable";
    }>;

export type ContactsAddressValidationPort = Readonly<{
  validateAddress(input: {
    currencyId: ContactAddress["currencyId"];
    address: string;
  }): Promise<ContactsAddressValidationResult>;
}>;

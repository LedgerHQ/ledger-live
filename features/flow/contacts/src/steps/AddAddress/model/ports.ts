import type { ContactAddress } from "@domain/entity-contact";

export type ContactsCurrencySelectionPort = Readonly<{
  selectCurrency(currencyIds: readonly string[]): Promise<ContactAddress["currencyId"] | null>;
}>;

import type { ContactAddress } from "@domain/entity-contact";

export type ContactsAddressCurrencyDescriptor = Readonly<{
  id: ContactAddress["currencyId"];
  networkFamily: string;
}>;

export function resolveEligibleAddressCurrencyIds(
  eligibleFamilies: readonly string[],
  currencyCatalog: readonly ContactsAddressCurrencyDescriptor[],
): string[] {
  const families = new Set(eligibleFamilies);
  const currencyIds = new Set<string>();

  for (const currency of currencyCatalog) {
    if (families.has(currency.networkFamily)) {
      currencyIds.add(currency.id);
    }
  }

  return [...currencyIds];
}

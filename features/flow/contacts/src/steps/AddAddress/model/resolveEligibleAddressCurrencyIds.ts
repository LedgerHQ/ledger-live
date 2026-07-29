import { listCryptoCurrencies, type CryptoCurrency } from "@domain/entity-currency-crypto";

export type EligibleAddressNetwork = Readonly<Pick<CryptoCurrency, "id" | "family">>;

export function resolveEligibleAddressCurrencyIds(
  eligibleFamilies: readonly string[],
  networks: readonly EligibleAddressNetwork[] = listCryptoCurrencies(),
): CryptoCurrency["id"][] {
  const families = new Set(eligibleFamilies);
  const networkIds = new Set<CryptoCurrency["id"]>();

  for (const network of networks) {
    if (families.has(network.family)) {
      networkIds.add(network.id);
    }
  }

  return [...networkIds];
}

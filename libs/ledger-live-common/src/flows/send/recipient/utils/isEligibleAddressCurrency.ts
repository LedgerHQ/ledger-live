import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export function isEligibleAddressCurrency(
  eligibleFamilies: readonly string[],
  currency: CryptoCurrency | TokenCurrency | null | undefined,
): boolean {
  if (!currency) {
    return false;
  }

  const network =
    currency.type === "TokenCurrency"
      ? findCryptoCurrencyById(currency.parentCurrencyId)
      : currency;

  return network !== undefined && eligibleFamilies.includes(network.family);
}

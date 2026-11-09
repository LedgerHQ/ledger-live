import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

/**
 * Currency id for family memo i18n keys
 * Tokens must resolve to their parent crypto currency, testnets to their mainnet
 */
export function getMemoFamilyCurrencyId(
  currency: CryptoOrTokenCurrency | null | undefined,
): string | undefined {
  if (!currency) return undefined;
  if (currency.type === "TokenCurrency") return currency.parentCurrencyId;
  return currency.isTestnetFor ?? currency.id;
}

import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * Currency id for family memo i18n keys
 * Tokens must resolve to their parent crypto currency
 */
export function getMemoFamilyCurrencyId(
  currency: CryptoOrTokenCurrency | null | undefined,
): string | undefined {
  if (!currency) return undefined;
  return currency.type === "TokenCurrency" ? currency.parentCurrencyId : currency.id;
}

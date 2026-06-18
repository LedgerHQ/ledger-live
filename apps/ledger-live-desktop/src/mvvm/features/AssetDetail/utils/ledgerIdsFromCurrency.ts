import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function ledgerIdsFromLedgerCurrency(ledgerCurrency: CryptoOrTokenCurrency): string[] {
  const ids = new Set<string>([ledgerCurrency.id]);
  if (ledgerCurrency.type === "TokenCurrency") {
    ids.add(ledgerCurrency.parentCurrencyId);
  }
  return [...ids];
}

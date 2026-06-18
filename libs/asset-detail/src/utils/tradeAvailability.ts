import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

/** Minimal shape for ramp on/off-ramp checks (full `MarketCurrencyData` is assignable). */
export type MarketCurrencyRampLedgerIds = Pick<MarketCurrencyData, "ledgerIds">;

export function isAvailableOnBuy(
  currency: MarketCurrencyRampLedgerIds | null | undefined,
  isCurrencyAvailable: (currencyId: string, mode: "onRamp") => boolean,
): boolean {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => isCurrencyAvailable(lrId, "onRamp"));
}

export function isAvailableOnSwap(
  currency: MarketCurrencyRampLedgerIds | null | undefined,
  currenciesForSwapAllSet: Set<string>,
): boolean {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => currenciesForSwapAllSet.has(lrId));
}

export function ledgerIdsFromLedgerCurrency(ledgerCurrency: CryptoOrTokenCurrency): string[] {
  const ids = new Set<string>([ledgerCurrency.id]);
  if (ledgerCurrency.type === "TokenCurrency") {
    ids.add(ledgerCurrency.parentCurrencyId);
  }
  return [...ids];
}

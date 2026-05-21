import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { listItemHeight } from "../components/Table";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const REFETCH_TIME_ONE_MINUTE = 60 * 1000;

export const BASIC_REFETCH = 3; // nb minutes

export const isDataStale = (lastUpdate: number, refreshRate: number) => {
  const currentTime = new Date();
  const updatedAt = new Date(lastUpdate);
  const elapsedTime = currentTime.getTime() - updatedAt.getTime();

  return elapsedTime > refreshRate;
};

export function getCurrentPage(scrollPosition: number, pageSize: number): number {
  const size = listItemHeight * pageSize;
  return Math.floor(scrollPosition / size) + 1;
}

export function formatPercentage(percentage: number, decimals = 2): number {
  return parseFloat(percentage.toFixed(decimals));
}

/** Minimal shape for ramp on/off-ramp checks (full `MarketCurrencyData` is assignable). */
export type MarketCurrencyRampLedgerIds = Pick<MarketCurrencyData, "ledgerIds">;

export function isAvailableOnBuy(
  currency: MarketCurrencyRampLedgerIds | null | undefined,
  isCurrencyAvailable: (currencyId: CryptoCurrency["id"] | string, mode: "onRamp") => boolean,
) {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => isCurrencyAvailable(lrId, "onRamp"));
}

export function isAvailableOnSell(
  currency: MarketCurrencyRampLedgerIds | null | undefined,
  isCurrencyAvailable: (currencyId: CryptoCurrency["id"] | string, mode: "offRamp") => boolean,
) {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => isCurrencyAvailable(lrId, "offRamp"));
}

export function isAvailableOnSwap(
  currency: MarketCurrencyData | null | undefined,
  currenciesForSwapAllSet: Set<string>,
) {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => currenciesForSwapAllSet.has(lrId));
}

export function isAvailableOnStake(
  currency: MarketCurrencyData | null | undefined,
  getCanStakeCurrency: (currencyId: string) => boolean,
) {
  if (!currency) return false;
  return currency.ledgerIds.some(lrId => getCanStakeCurrency(lrId));
}

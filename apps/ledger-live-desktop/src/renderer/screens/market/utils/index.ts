import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";
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

export function formatPrice(price: number): number {
  return parseFloat(price.toFixed(price >= 1 ? 2 : 6));
}

export function formatPercentage(percentage: number, decimals = 2): number {
  return parseFloat(percentage.toFixed(decimals));
}

export function isAvailableOnBuy(
  currency: CurrencyData | null | undefined,
  isCurrencyAvailable: (
    currencyId: CryptoCurrency["id"] | string,
    mode: "onRamp" | "offRamp",
  ) => boolean,
) {
  if (!currency) return false;
  return (
    (!!currency.internalCurrency &&
      !!currency.internalCurrency?.id &&
      isCurrencyAvailable(currency.internalCurrency.id, "onRamp")) ||
    currency?.ledgerIds.some(lrId => isCurrencyAvailable(lrId, "onRamp")) ||
    false
  );
}

export function isAvailableOnSwap(
  currency: CurrencyData | null | undefined,
  currenciesForSwapAllSet: Set<string>,
) {
  if (!currency) return false;
  return (
    (!!currency.internalCurrency && currenciesForSwapAllSet.has(currency.internalCurrency.id)) ||
    currency?.ledgerIds.some(lrId => currenciesForSwapAllSet.has(lrId)) ||
    false
  );
}

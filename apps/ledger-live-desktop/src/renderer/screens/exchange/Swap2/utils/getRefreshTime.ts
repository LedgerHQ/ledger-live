import { ExchangeRate } from "@ledgerhq/live-common/lib/exchange/swap/types";
const defaultRefreshTime = 60 * 1000;
const getMinimumExpirationTime = (rates: ExchangeRate[]): number => {
  return rates.reduce((acc, rate) => {
    if (!rate.expirationTime) return acc;
    return acc ? Math.min(acc, rate.expirationTime) : rate.expirationTime;
  }, 0);
};
export const getRefreshTime = (rates: ExchangeRate[] | undefined) => {
  const minimumExpirationTime = rates ? getMinimumExpirationTime(rates) : null;
  if (minimumExpirationTime) {
    const timeMs = minimumExpirationTime - Date.now();
    return Math.min(timeMs, defaultRefreshTime);
  } else {
    return defaultRefreshTime;
  }
};

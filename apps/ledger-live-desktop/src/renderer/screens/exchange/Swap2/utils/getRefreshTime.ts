import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "@ledgerhq/live-common/exchange/swap/const/timeout";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";

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
    return Math.min(timeMs, DEFAULT_SWAP_RATES_INTERVAL_MS);
  } else {
    return DEFAULT_SWAP_RATES_INTERVAL_MS;
  }
};

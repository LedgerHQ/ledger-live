// @flow

import type { ExchangeRate } from "@ledgerhq/live-common/lib/exchange/swap/types";

const defaultRefreshTime = 30 * 1000;
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
    return timeMs > 0 ? timeMs : 0;
  } else {
    return defaultRefreshTime;
  }
};

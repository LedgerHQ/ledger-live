// @flow
import type { Currency } from "@ledgerhq/live-common/lib/types";

export const setMarket = (
  index: number,
  patch: {
    from?: Currency,
    to?: Currency,
    exchange?: string
  }
) => ({
  type: "SET_MARKET",
  index,
  patch
});

export const addMarket = () => ({
  type: "ADD_MARKET"
});

export const setExchangePairsAction = (
  pairs: Array<{
    from: Currency,
    to: Currency,
    exchange: ?string
  }>
) => ({
  type: "SET_EXCHANGE_PAIRS",
  pairs
});

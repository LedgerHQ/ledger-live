// @flow
import type { Currency } from "@ledgerhq/live-common/lib/types";

export const setRow = (
  index: number,
  patch: {
    currency?: Currency,
    exchange?: string,
    value?: number
  }
) => ({
  type: "SET_ROW",
  index,
  patch
});

export const addRow = () => ({
  type: "ADD_ROW"
});

export const setCountervalueCurrency = (currency: Currency) => ({
  type: "SET_COUNTERVALUE_CURRENCY",
  currency
});

export const setCountervalueExchange = (exchange: string) => ({
  type: "SET_COUNTERVALUE_EXCHANGE",
  exchange
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

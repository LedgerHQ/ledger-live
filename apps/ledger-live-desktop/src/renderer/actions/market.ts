import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { MarketListCategory, MarketState } from "../reducers/market";

export const setMarketOptions = (payload: MarketListRequestParams) => ({
  type: "MARKET_SET_VALUES",
  payload,
});

export const setMarketCategory = (payload: MarketListCategory) => ({
  type: "MARKET_SET_CATEGORY",
  payload,
});

export const setMarketCurrentPage = (payload: number) => ({
  type: "MARKET_SET_CURRENT_PAGE",
  payload,
});

export const setHideTransactionsOnChart = (payload: boolean) => ({
  type: "MARKET_SET_HIDE_TRANSACTIONS_ON_CHART",
  payload,
});

export const importMarketState = (payload: MarketState) => ({
  type: "MARKET_IMPORT_STATE",
  payload,
});

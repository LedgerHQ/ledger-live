import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";

export const setMarketOptions = (payload: MarketListRequestParams) => ({
  type: "MARKET_SET_VALUES",
  payload,
});

export const setMarketCurrentPage = (payload: number) => ({
  type: "MARKET_SET_CURRENT_PAGE",
  payload,
});

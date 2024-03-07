import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";

export const setMarketOptions = (payload: MarketListRequestParams) => ({
  type: "MARKET_SET_VALUES",
  payload,
});

export const addStarredMarketCoins = (payload: string) => ({
  type: "ADD_STARRED_MARKET_COINS",
  payload,
});
export const removeStarredMarketCoins = (payload: string) => ({
  type: "REMOVE_STARRED_MARKET_COINS",
  payload,
});

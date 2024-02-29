import { MarketState } from "../reducers/market";

export const setMarketOptions = (payload: MarketState) => ({
  type: "MARKET_SET_VALUES",
  payload,
});

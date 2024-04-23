import { createAction } from "redux-actions";
import {
  MarketAddStarredMarketcoinsPayload,
  MarketRemoveStarredMarketcoinsPayload,
  MarketSetMarketRequestParamsPayload,
  MarketSetMarketFilterByStarredAccountsPayload,
  MarketStateActionTypes,
  MarketSetCurrentPagePayload,
  MarketImportPayload,
} from "./types";

export const setMarketRequestParams = createAction<MarketSetMarketRequestParamsPayload>(
  MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS,
);

export const addStarredMarketCoins = createAction<MarketAddStarredMarketcoinsPayload>(
  MarketStateActionTypes.ADD_STARRED_MARKET_COINS,
);
export const removeStarredMarketCoins = createAction<MarketRemoveStarredMarketcoinsPayload>(
  MarketStateActionTypes.REMOVE_STARRED_MARKET_COINS,
);

export const setMarketFilterByStarredAccounts =
  createAction<MarketSetMarketFilterByStarredAccountsPayload>(
    MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS,
  );

export const setMarketCurrentPage = createAction<MarketSetCurrentPagePayload>(
  MarketStateActionTypes.MARKET_SET_CURRENT_PAGE,
);

export const importMarket = createAction<MarketImportPayload>(MarketStateActionTypes.MARKET_IMPORT);

import { Action, ReducerMap, handleActions } from "redux-actions";
import { MarketState, State } from "./types";
import {
  MarketAddStarredMarketcoinsPayload,
  MarketImportPayload,
  MarketRemoveStarredMarketcoinsPayload,
  MarketSetCurrentPagePayload,
  MarketSetMarketFilterByStarredAccountsPayload,
  MarketSetMarketRequestParamsPayload,
  MarketStateActionTypes,
  MarketStatePayload,
} from "~/actions/types";
import { saveMarket } from "~/db";

export const INITIAL_STATE: MarketState = {
  marketParams: {
    range: "24h",
    limit: 25,
    ids: [],
    starred: [],
    orderBy: "market_cap",
    order: "desc",
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "usd",
    sparkline: false,
    top100: false,
  },
  starredMarketCoins: [],
  marketFilterByStarredAccounts: false,
  marketCurrentPage: 1,
};

const handlers: ReducerMap<MarketState, MarketStatePayload> = {
  [MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS]: (state, action) => ({
    ...state,
    marketParams: {
      ...state.marketParams,
      ...(action as Action<MarketSetMarketRequestParamsPayload>).payload,
    },
  }),
  [MarketStateActionTypes.ADD_STARRED_MARKET_COINS]: (state, action) => {
    const newStarred = [
      ...state.starredMarketCoins,
      (action as Action<MarketAddStarredMarketcoinsPayload>).payload,
    ];

    saveMarket({ starredMarketCoins: newStarred });
    return {
      ...state,
      starredMarketCoins: newStarred,
    };
  },
  [MarketStateActionTypes.REMOVE_STARRED_MARKET_COINS]: (state, action) => {
    const newStarred = state.starredMarketCoins.filter(
      id => id !== (action as Action<MarketRemoveStarredMarketcoinsPayload>).payload,
    );

    saveMarket({ starredMarketCoins: newStarred });
    return {
      ...state,
      starredMarketCoins: newStarred,
    };
  },
  [MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS]: (state, action) => ({
    ...state,
    marketFilterByStarredAccounts: (action as Action<MarketSetMarketFilterByStarredAccountsPayload>)
      .payload,
  }),

  [MarketStateActionTypes.MARKET_SET_CURRENT_PAGE]: (state, action) => ({
    ...state,
    marketCurrentPage: (action as Action<MarketSetCurrentPagePayload>).payload,
  }),
  [MarketStateActionTypes.MARKET_IMPORT]: (state, action) => ({
    ...state,
    ...(action as Action<MarketImportPayload>).payload,
  }),
};

// Selectors

export const marketParamsSelector = (state: State) => state.market.marketParams;
export const starredMarketCoinsSelector = (state: State) => state.market.starredMarketCoins;
export const marketFilterByStarredAccountsSelector = (state: State) =>
  state.market.marketFilterByStarredAccounts;
export const marketCurrentPageSelector = (state: State) => state.market.marketCurrentPage;

// Exporting reducer

export default handleActions<MarketState, MarketStatePayload>(handlers, INITIAL_STATE);

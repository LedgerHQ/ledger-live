import { Action, ReducerMap, handleActions } from "redux-actions";
import { MarketState, State } from "./types";
import {
  MarketAddStarredMarketcoinsPayload,
  MarketRemoveStarredMarketcoinsPayload,
  MarketSetMarketFilterByStarredAccountsPayload,
  MarketSetMarketRequestParamsPayload,
  MarketStateActionTypes,
  MarketStatePayload,
} from "~/actions/types";

const INITIAL_STATE: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
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
};

const handlers: ReducerMap<MarketState, MarketStatePayload> = {
  [MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS]: (state, action) => ({
    ...state,
    marketParams: {
      ...state.marketParams,
      ...(action as Action<MarketSetMarketRequestParamsPayload>).payload,
    },
  }),
  [MarketStateActionTypes.ADD_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: [
      ...state.starredMarketCoins,
      (action as Action<MarketAddStarredMarketcoinsPayload>).payload,
    ],
  }),
  [MarketStateActionTypes.REMOVE_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(
      id => id !== (action as Action<MarketRemoveStarredMarketcoinsPayload>).payload,
    ),
  }),
  [MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS]: (state, action) => ({
    ...state,
    marketFilterByStarredAccounts: (action as Action<MarketSetMarketFilterByStarredAccountsPayload>)
      .payload,
  }),
};

// Selectors

export const marketRequestParamsSelector = (state: State) => state.market.marketParams;
export const starredMarketCoinsSelector = (state: State) => state.market.starredMarketCoins;
export const marketFilterByStarredAccountsSelector = (state: State) =>
  state.market.marketFilterByStarredAccounts;

// Exporting reducer

export default handleActions<MarketState, MarketStatePayload>(handlers, INITIAL_STATE);

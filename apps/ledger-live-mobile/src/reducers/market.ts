import { Action, ReducerMap, handleActions } from "redux-actions";
import { MarketState, State } from "./types";
import {
  MarketImportPayload,
  MarketSetCurrentPagePayload,
  MarketSetMarketFilterByStarredCurrenciesPayload,
  MarketSetMarketRequestParamsPayload,
  MarketStateActionTypes,
  MarketStatePayload,
} from "~/actions/types";

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
  marketFilterByStarredCurrencies: false,
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
  [MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_CURRENCIES]: (state, action) => ({
    ...state,
    marketFilterByStarredAccounts: (
      action as Action<MarketSetMarketFilterByStarredCurrenciesPayload>
    ).payload,
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
export const marketFilterByStarredCurrenciesSelector = (state: State) =>
  state.market.marketFilterByStarredCurrencies;
export const marketCurrentPageSelector = (state: State) => state.market.marketCurrentPage;

// Exporting reducer

export default handleActions<MarketState, MarketStatePayload>(handlers, INITIAL_STATE);

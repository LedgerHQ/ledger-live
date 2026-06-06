import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Action, ReducerMap, handleActions } from "redux-actions";
import {
  MarketListCategory,
  MarketListConfigState,
  MarketListFilterTimeframe,
  MarketListSorting,
  MarketState,
  State,
} from "./types";
import {
  MarketSetCurrentPagePayload,
  MarketSetMarketFilterByStarredCurrenciesPayload,
  MarketSetMarketRequestParamsPayload,
  MarketSetHideTransactionsOnChartPayload,
  MarketStateActionTypes,
  MarketPayload,
  MarketImportPayload,
} from "~/actions/types";
import { Order } from "@ledgerhq/live-common/market/utils/types";

export const LIMIT = 20;

/** @legacy MarketList (v3) state — will be removed when MarketList is dropped. Use marketListConfigSlice for v4. */
export const INITIAL_STATE: MarketState = {
  marketParams: {
    range: "24h",
    limit: LIMIT,
    starred: [],
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "USD",
  },
  marketFilterByStarredCurrencies: false,
  marketCurrentPage: 1,
  hideTransactionsOnChart: false,
};

/** @legacy MarketList (v3) handlers — will be removed when MarketList is dropped. Use marketListConfigSlice for v4. */
const handlers: ReducerMap<MarketState, MarketPayload> = {
  [MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS]: (state, action) => ({
    ...state,
    marketParams: {
      ...state.marketParams,
      ...(action as Action<MarketSetMarketRequestParamsPayload>).payload,
    },
  }),
  [MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_CURRENCIES]: (state, action) => ({
    ...state,
    marketFilterByStarredCurrencies: (
      action as Action<MarketSetMarketFilterByStarredCurrenciesPayload>
    ).payload,
  }),

  [MarketStateActionTypes.MARKET_SET_CURRENT_PAGE]: (state, action) => ({
    ...state,
    marketCurrentPage: (action as Action<MarketSetCurrentPagePayload>).payload,
  }),

  [MarketStateActionTypes.MARKET_SET_HIDE_TRANSACTIONS_ON_CHART]: (state, action) => ({
    ...state,
    hideTransactionsOnChart: (action as Action<MarketSetHideTransactionsOnChartPayload>).payload,
  }),

  [MarketStateActionTypes.MARKET_IMPORT]: (state, action) => ({
    ...state,
    marketFilterByStarredCurrencies:
      (action as Action<MarketImportPayload>).payload.marketFilterByStarredCurrencies ??
      state.marketFilterByStarredCurrencies,
    hideTransactionsOnChart:
      (action as Action<MarketImportPayload>).payload.hideTransactionsOnChart ??
      state.hideTransactionsOnChart,

    marketParams: {
      ...state.marketParams,
      range: (action as Action<MarketImportPayload>).payload.marketParams?.range,
      counterCurrency: (action as Action<MarketImportPayload>).payload.marketParams
        ?.counterCurrency,
      order: (action as Action<MarketImportPayload>).payload.marketParams?.order,
    },
  }),
};

// Selectors

export const marketParamsSelector = (state: State) => state.market.marketParams;
export const marketFilterByStarredCurrenciesSelector = (state: State) =>
  state.market.marketFilterByStarredCurrencies;
export const marketCurrentPageSelector = (state: State) => state.market.marketCurrentPage;
export const hideTransactionsOnChartSelector = (state: State) =>
  state.market.hideTransactionsOnChart === true;
export const exportMarketSelector = (s: State) => s.market;
// Exporting reducer

export default handleActions<MarketState, MarketPayload>(handlers, INITIAL_STATE);

/**
 * V4 asset list config — shared between MarketScreen and modularAssetDrawer.
 * Gated by llmAssetDiscoverability. Persisted as a user preference (never reset).
 */
export const MARKET_LIST_CONFIG_INITIAL_STATE: MarketListConfigState = {
  sorting: "marketCap",
  timeframe: "1D",
  network: undefined,
  category: "all",
};

const marketListConfigSlice = createSlice({
  name: "marketListConfig",
  initialState: MARKET_LIST_CONFIG_INITIAL_STATE,
  reducers: {
    setMarketListSorting: (state, action: PayloadAction<MarketListSorting>) => {
      state.sorting = action.payload;
    },
    setMarketListTimeframe: (state, action: PayloadAction<MarketListFilterTimeframe>) => {
      state.timeframe = action.payload;
    },
    setMarketListNetwork: (state, action: PayloadAction<string | undefined>) => {
      state.network = action.payload;
    },
    setMarketListCategory: (state, action: PayloadAction<MarketListCategory>) => {
      state.category = action.payload;
    },
    importMarketListConfig: (_state, action: PayloadAction<MarketListConfigState>) => ({
      ...MARKET_LIST_CONFIG_INITIAL_STATE,
      ...action.payload,
    }),
  },
});

export const {
  setMarketListSorting,
  setMarketListTimeframe,
  setMarketListNetwork,
  setMarketListCategory,
  importMarketListConfig,
} = marketListConfigSlice.actions;

export const selectMarketListSorting = (state: State): MarketListSorting =>
  state.marketListConfig.sorting;
export const selectMarketListTimeframe = (state: State): MarketListFilterTimeframe =>
  state.marketListConfig.timeframe;
export const selectMarketListNetwork = (state: State): string | undefined =>
  state.marketListConfig.network;
export const selectMarketListCategory = (state: State): MarketListCategory =>
  state.marketListConfig.category;

export const exportMarketListConfigSelector = (state: State): MarketListConfigState =>
  state.marketListConfig;

export const marketListConfigReducer = marketListConfigSlice.reducer;

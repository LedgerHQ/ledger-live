import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Action, ReducerMap, handleActions } from "redux-actions";
import {
  MarketListConfigState,
  MarketListFilterTimeframe,
  MarketListSorting,
  MarketState,
  State,
} from "./types";
import {
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
    counterCurrency: "USD",
  },
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
  [MarketStateActionTypes.MARKET_SET_HIDE_TRANSACTIONS_ON_CHART]: (state, action) => ({
    ...state,
    hideTransactionsOnChart: (action as Action<MarketSetHideTransactionsOnChartPayload>).payload,
  }),

  [MarketStateActionTypes.MARKET_IMPORT]: (state, action) => ({
    ...state,
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
export const hideTransactionsOnChartSelector = (state: State) =>
  state.market.hideTransactionsOnChart === true;
export const exportMarketSelector = (s: State) => s.market;
// Exporting reducer

export default handleActions<MarketState, MarketPayload>(handlers, INITIAL_STATE);

/**
 * V4 asset list config — shared between MarketScreen and modularAssetDrawer.
 * Gated by llmAssetDiscoverability. Sorting/timeframe/network persist as user
 * preferences. The selected category is not persisted (kept as local screen state).
 */
export const MARKET_LIST_CONFIG_INITIAL_STATE: MarketListConfigState = {
  sorting: "marketCap",
  timeframe: "1D",
  network: undefined,
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
    importMarketListConfig: (_state, action: PayloadAction<MarketListConfigState>) => ({
      sorting: action.payload.sorting ?? MARKET_LIST_CONFIG_INITIAL_STATE.sorting,
      timeframe: action.payload.timeframe ?? MARKET_LIST_CONFIG_INITIAL_STATE.timeframe,
      network: action.payload.network,
    }),
  },
});

export const {
  setMarketListSorting,
  setMarketListTimeframe,
  setMarketListNetwork,
  importMarketListConfig,
} = marketListConfigSlice.actions;

export const selectMarketListSorting = (state: State): MarketListSorting =>
  state.marketListConfig.sorting;
export const selectMarketListTimeframe = (state: State): MarketListFilterTimeframe =>
  state.marketListConfig.timeframe;
export const selectMarketListNetwork = (state: State): string | undefined =>
  state.marketListConfig.network;

export const exportMarketListConfigSelector = (state: State): MarketListConfigState =>
  state.marketListConfig;

export const marketListConfigReducer = marketListConfigSlice.reducer;

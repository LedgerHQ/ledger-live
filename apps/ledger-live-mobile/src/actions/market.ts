import { createAction } from "redux-actions";
import {
  MarketSetMarketRequestParamsPayload,
  MarketStateActionTypes,
  MarketSetHideTransactionsOnChartPayload,
  MarketImportPayload,
} from "./types";

export const setMarketRequestParams = createAction<MarketSetMarketRequestParamsPayload>(
  MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS,
);

export const setHideTransactionsOnChart = createAction<MarketSetHideTransactionsOnChartPayload>(
  MarketStateActionTypes.MARKET_SET_HIDE_TRANSACTIONS_ON_CHART,
);

export const importMarket = createAction<MarketImportPayload>(MarketStateActionTypes.MARKET_IMPORT);

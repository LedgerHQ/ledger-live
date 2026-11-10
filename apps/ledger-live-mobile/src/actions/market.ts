import { createAction } from "redux-actions";
import {
  MarketStateActionTypes,
  MarketSetHideTransactionsOnChartPayload,
  MarketImportPayload,
} from "./types";

export const setHideTransactionsOnChart = createAction<MarketSetHideTransactionsOnChartPayload>(
  MarketStateActionTypes.MARKET_SET_HIDE_TRANSACTIONS_ON_CHART,
);

export const importMarket = createAction<MarketImportPayload>(MarketStateActionTypes.MARKET_IMPORT);

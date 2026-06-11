import { createAction } from "redux-actions";
import {
  MarketSetMarketRequestParamsPayload,
  MarketStateActionTypes,
  MarketSetCurrentPagePayload,
  MarketSetMarketFilterByStarredCurrenciesPayload,
  MarketSetHideTransactionsOnChartPayload,
  MarketImportPayload,
} from "./types";

export const setMarketRequestParams = createAction<MarketSetMarketRequestParamsPayload>(
  MarketStateActionTypes.SET_MARKET_REQUEST_PARAMS,
);

export const setMarketFilterByStarredCurrencies =
  createAction<MarketSetMarketFilterByStarredCurrenciesPayload>(
    MarketStateActionTypes.SET_MARKET_FILTER_BY_STARRED_CURRENCIES,
  );

export const setMarketCurrentPage = createAction<MarketSetCurrentPagePayload>(
  MarketStateActionTypes.MARKET_SET_CURRENT_PAGE,
);

export const setHideTransactionsOnChart = createAction<MarketSetHideTransactionsOnChartPayload>(
  MarketStateActionTypes.MARKET_SET_HIDE_TRANSACTIONS_ON_CHART,
);

export const importMarket = createAction<MarketImportPayload>(MarketStateActionTypes.MARKET_IMPORT);

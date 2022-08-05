/* eslint-disable @typescript-eslint/no-empty-function */
// @flow
import React, {
  createContext,
  useCallback,
  useContext,
  ReactElement,
  useReducer,
  useEffect,
} from "react";

import { useDebounce } from "../hooks/useDebounce";
import {
  State,
  MarketDataApi,
  MarketListRequestParams,
  MarketCurrencyChartDataRequestParams,
  CurrencyData,
  SingleCoinState,
  SupportedCoins,
} from "./types";
import defaultFetchApi from "./api/api";
import type { Currency } from "@ledgerhq/types-cryptoassets";
type Props = {
  children: React.ReactNode;
  fetchApi?: MarketDataApi;
  countervalue?: Currency;
  initState?: Partial<State>;
};
type API = {
  refresh: (param?: MarketListRequestParams) => void;
  refreshChart: (param?: MarketCurrencyChartDataRequestParams) => void;
  selectCurrency: (id?: string, data?: CurrencyData, range?: string) => void;
  loadNextPage: () => Promise<boolean>;
  setCounterCurrency: (counterCurrency: string) => void;
};

export type MarketDataContextType = State & API;

const initialState: State = {
  ready: false,
  marketData: [],
  selectedCurrency: undefined,
  requestParams: {
    range: "24h",
    limit: 50,
    ids: [],
    starred: [],
    orderBy: "market_cap",
    order: "desc",
    search: "",
    liveCompatible: false,
  },
  page: 1,
  chartRequestParams: {
    range: "24h",
  },
  loading: false,
  loadingChart: false,
  endOfList: false,
  error: undefined,
  totalCoinsAvailable: 0,
  supportedCounterCurrencies: [],
  selectedCoinData: undefined,
  counterCurrency: undefined,
};

const MarketDataContext = createContext<MarketDataContextType>({
  ...initialState,
  refresh: () => {},
  refreshChart: () => {},
  selectCurrency: () => {},
  loadNextPage: () => Promise.resolve(true),
  setCounterCurrency: () => {},
});

const ACTIONS = {
  IS_READY: "IS_READY",

  UPDATE_MARKET_DATA: "UPDATE_MARKET_DATA",
  UPDATE_SINGLE_MARKET_DATA: "UPDATE_SINGLE_MARKET_DATA",
  UPDATE_SINGLE_CHART_DATA: "UPDATE_SINGLE_CHART_DATA",

  REFRESH_MARKET_DATA: "REFRESH_MARKET_DATA",
  REFRESH_CHART_DATA: "REFRESH_CHART_DATA",

  SET_LOADING: "SET_LOADING",
  SET_LOADING_CHART: "SET_LOADING_CHART",
  SET_ERROR: "SET_ERROR",

  SELECT_CURRENCY: "SELECT_CURRENCY",
  UPDATE_COUNTERVALUE: "UPDATE_COUNTERVALUE",
};

function marketDataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.IS_READY:
      return { ...state, ...action.payload, isReady: true };
    case ACTIONS.UPDATE_MARKET_DATA: {
      const newData = action.payload.marketData;
      const page = action.payload.page || state.requestParams.page;
      const marketData = [...state.marketData.map((data) => ({ ...data }))];
      if (!newData.length || marketData.some(({ id }) => id === newData[0].id))
        return { ...state, loading: false };

      return {
        ...state,
        marketData: marketData.concat(newData),
        endOfList: newData.length < state.requestParams.limit,
        loading: false,
        page,
      };
    }
    case ACTIONS.UPDATE_SINGLE_MARKET_DATA: {
      return {
        ...state,
        selectedCoinData: { ...state.selectedCoinData, ...action.payload },
        loading: false,
      };
    }
    case ACTIONS.UPDATE_SINGLE_CHART_DATA: {
      const chartRequestParams = {
        ...state.chartRequestParams,
        loadingChart: false,
      };
      const selectedCoinData = { ...state.selectedCoinData };

      selectedCoinData.chartData = {
        ...selectedCoinData.chartData,
        ...action.payload.chartData,
      };

      return { ...state, selectedCoinData, chartRequestParams };
    }

    case ACTIONS.REFRESH_MARKET_DATA: {
      const requestParams = {
        ...state.requestParams,
        ...action.payload,
        lastRequestTime: Date.now(),
      };
      return {
        ...state,
        marketData: [],
        requestParams,
        loading: true,
        page: 1,
      };
    }
    case ACTIONS.REFRESH_CHART_DATA: {
      const chartRequestParams = {
        ...state.chartRequestParams,
        ...action.payload,
        loadingChart: true,
        lastRequestTime: Date.now(),
      };
      return { ...state, chartRequestParams };
    }

    case ACTIONS.UPDATE_COUNTERVALUE: {
      const requestParams = {
        ...state.requestParams,
        lastRequestTime: Date.now(),
        page: 1,
        counterCurrency: action.payload,
      };
      const chartRequestParams = {
        ...state.chartRequestParams,
        lastRequestTime: Date.now(),
        counterCurrency: action.payload,
      };
      return {
        ...state,
        counterCurrency: action.payload,
        marketData: [],
        requestParams,
        chartRequestParams,
        loading: true,
      };
    }

    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_LOADING_CHART:
      return { ...state, loadingChart: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SELECT_CURRENCY: {
      const chartRequestParams = {
        ...state.chartRequestParams,
        counterCurrency: state.requestParams.counterCurrency,
        range: action.payload.range || state.requestParams.range,
        id: action.payload.id,
        loadingChart: !!action.payload.id,
        lastRequestTime: Date.now(),
      };
      return {
        ...state,
        selectedCurrency: action.payload.id,
        selectedCoinData: action.payload.data,
        loading: !!action.payload.id,
        chartRequestParams,
      };
    }
    default:
      return state;
  }
}

export const MarketDataProvider = ({
  children,
  fetchApi,
  countervalue,
  initState = {},
}: Props): ReactElement => {
  const [state, dispatch] = useReducer(marketDataReducer, {
    ...initialState,
    ...initState,
  });
  const api = fetchApi || defaultFetchApi;
  const {
    requestParams,
    chartRequestParams,
    loading,
    loadingChart,
    page,
    selectedCoinData,
  } = useDebounce(state, 300);

  const handleError = useCallback((payload: Error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload });
  }, []);

  useEffect(() => {
    if (countervalue) {
      const ticker = countervalue.ticker.toLowerCase();
      api.supportedCounterCurrencies().then(
        (supportedCounterCurrencies) =>
          api.setSupportedCoinsList().then((coins: SupportedCoins) => {
            dispatch({
              type: ACTIONS.IS_READY,
              payload: {
                totalCoinsAvailable: coins.length,
                supportedCounterCurrencies,
              },
            });
            dispatch({
              type: ACTIONS.UPDATE_COUNTERVALUE,
              payload: supportedCounterCurrencies.includes(ticker)
                ? ticker
                : "usd",
            });
          }, handleError),
        handleError
      );
    }
  }, [api, countervalue, handleError]);

  useEffect(() => {
    if (
      chartRequestParams?.id &&
      chartRequestParams?.counterCurrency &&
      !loadingChart
    ) {
      const range = chartRequestParams.range;

      if (selectedCoinData && !selectedCoinData?.chartData?.[range]) {
        api.currencyChartData(chartRequestParams).then(
          (chartData) =>
            dispatch({
              type: ACTIONS.UPDATE_SINGLE_CHART_DATA,
              payload: { id: chartRequestParams.id, chartData },
            }),
          handleError
        );
      } else
        dispatch({
          type: ACTIONS.SET_LOADING_CHART,
          payload: false,
        });
    }
  }, [chartRequestParams, selectedCoinData, api, handleError, loadingChart]);

  useEffect(() => {
    if (chartRequestParams?.id && chartRequestParams?.counterCurrency) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      api
        .listPaginated({
          ...chartRequestParams,
          search: "",
          starred: [],
          liveCompatible: false,
          ids: [chartRequestParams.id],
          limit: 1,
          page: 1,
        })
        .then(
          ([{ chartData: _, ...marketData }]) =>
            dispatch({
              type: ACTIONS.UPDATE_SINGLE_MARKET_DATA,
              payload: marketData,
            }),
          handleError
        );
    }
  }, [api, chartRequestParams, handleError, loading]);

  useEffect(() => {
    if (requestParams?.counterCurrency) {
      api.listPaginated(requestParams).then(
        (marketData) =>
          dispatch({
            type: ACTIONS.UPDATE_MARKET_DATA,
            payload: { marketData },
          }),
        handleError
      );
    }
  }, [api, handleError, requestParams]);

  const refresh = useCallback((payload = {}) => {
    dispatch({ type: ACTIONS.REFRESH_MARKET_DATA, payload });
  }, []);

  const refreshChart = useCallback((payload = {}) => {
    dispatch({ type: ACTIONS.REFRESH_CHART_DATA, payload });
  }, []);

  const selectCurrency = useCallback((id, data, range) => {
    dispatch({ type: ACTIONS.SELECT_CURRENCY, payload: { id, data, range } });
  }, []);

  const loadNextPage = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (loading) {
          reject(new Error());
        } else {
          const newPage = page + 1;
          api.listPaginated({ ...requestParams, page: newPage }).then(
            (marketData) => {
              dispatch({
                type: ACTIONS.UPDATE_MARKET_DATA,
                payload: { marketData, page: newPage },
              });
              resolve(true);
            },
            (err) => {
              handleError(err);
              reject(new Error(err));
            }
          );
        }
      }),
    [loading, page, api, requestParams, handleError]
  );

  const setCounterCurrency = useCallback(
    (payload) => dispatch({ type: ACTIONS.UPDATE_COUNTERVALUE, payload }),
    [dispatch]
  );

  const value = {
    ...state,
    refresh,
    refreshChart,
    selectCurrency,
    loadNextPage,
    setCounterCurrency,
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
};

export function useMarketData(): MarketDataContextType {
  return useContext(MarketDataContext);
}

type SingleCoinProviderData = SingleCoinState & {
  selectCurrency: (id?: string, data?: CurrencyData, range?: string) => void;
  refreshChart: (param?: MarketCurrencyChartDataRequestParams) => void;
  setCounterCurrency: (counterCurrency: string) => void;
};

export function useSingleCoinMarketData(): SingleCoinProviderData {
  const {
    selectedCurrency,
    selectedCoinData,
    selectCurrency,
    chartRequestParams,
    loading,
    loadingChart,
    error,
    counterCurrency,
    refreshChart,
    setCounterCurrency,
    supportedCounterCurrencies,
  } = useContext(MarketDataContext);

  return {
    selectedCurrency,
    selectedCoinData,
    selectCurrency,
    chartRequestParams,
    loading,
    loadingChart,
    error,
    counterCurrency,
    refreshChart,
    setCounterCurrency,
    supportedCounterCurrencies,
  };
}

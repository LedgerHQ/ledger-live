import { createAction } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesMarketcapFetchIdsPayload,
  CountervaluesMarketcapSetErrorPayload,
  CountervaluesMarketcapSetIdsPayload,
  CountervaluesMarketcapSetLoadingPayload,
} from "./types";

export const fetchCountervaluesMarketcapIds = createAction<CountervaluesMarketcapFetchIdsPayload>(
  CountervaluesActionTypes.FETCH_COUNTERVALUES_MARKETCAP_IDS,
);

export const setCountervaluesMarketcapIds = createAction<CountervaluesMarketcapSetIdsPayload>(
  CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_IDS,
);

export const setCountervaluesMarketcapLoading =
  createAction<CountervaluesMarketcapSetLoadingPayload>(
    CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_LOADING,
  );

export const setCountervaluesMarketcapError = createAction<CountervaluesMarketcapSetErrorPayload>(
  CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_ERROR,
);

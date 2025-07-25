import { createAction } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesFetchIdsPayload,
  CountervaluesSetErrorPayload,
  CountervaluesSetIdsPayload,
  CountervaluesSetLoadingPayload,
} from "./types";

export const fetchCountervaluesMarketcapIds = createAction<CountervaluesFetchIdsPayload>(
  CountervaluesActionTypes.FETCH_COUNTERVALUES_MARKETCAP_IDS,
);

export const setCountervaluesMarketcapIds = createAction<CountervaluesSetIdsPayload>(
  CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_IDS,
);

export const setCountervaluesMarketcapLoading = createAction<CountervaluesSetLoadingPayload>(
  CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_LOADING,
);

export const setCountervaluesMarketcapError = createAction<CountervaluesSetErrorPayload>(
  CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_ERROR,
);

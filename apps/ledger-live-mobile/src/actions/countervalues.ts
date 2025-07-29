import { createAction } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesMarketcapSetErrorPayload,
  CountervaluesMarketcapSetIdsPayload,
  CountervaluesMarketcapSetLoadingPayload,
} from "./types";
import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";

export const setCountervaluesMarketcapIds = createAction<CountervaluesMarketcapSetIdsPayload>(
  CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_IDS,
);

export const setCountervaluesMarketcapLoading =
  createAction<CountervaluesMarketcapSetLoadingPayload>(
    CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_LOADING,
  );

export const setCountervaluesMarketcapError = createAction<CountervaluesMarketcapSetErrorPayload>(
  CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_ERROR,
);

export const setCountervaluesState = createAction<CounterValuesState>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET,
);

export const setCountervaluesPending = createAction<boolean>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET_PENDING,
);

export const setCountervaluesError = createAction<Error | null>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET_ERROR,
);

export const wipeCountervalues = createAction<void>(CountervaluesActionTypes.COUNTERVALUES_WIPE);

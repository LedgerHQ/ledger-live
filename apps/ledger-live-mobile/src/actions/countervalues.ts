import { CounterValuesState } from "@ledgerhq/live-countervalues/lib/types";
import { createAction } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesMarketcapSetErrorPayload,
  CountervaluesMarketcapSetIdsPayload,
  CountervaluesMarketcapSetLoadingPayload,
} from "./types";

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

export const setCountervaluesPollingIsPolling = createAction<boolean>(
  CountervaluesActionTypes.COUNTERVALUES_POLLING_SET_IS_POLLING,
);

export const setCountervaluesPollingTriggerLoad = createAction<boolean>(
  CountervaluesActionTypes.COUNTERVALUES_POLLING_SET_TRIGGER_LOAD,
);

export const setCountervaluesState = createAction<CounterValuesState>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET,
);

export const setCountervaluesStateError = createAction<Error | null>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET_ERROR,
);

export const setCountervaluesStatePending = createAction<boolean>(
  CountervaluesActionTypes.COUNTERVALUES_STATE_SET_PENDING,
);

export const wipeCountervalues = createAction<void>(CountervaluesActionTypes.COUNTERVALUES_WIPE);

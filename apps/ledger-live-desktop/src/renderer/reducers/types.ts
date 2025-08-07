import { CountervaluesSettings, CounterValuesState } from "@ledgerhq/live-countervalues/types";

export type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type CountervaluesHandlersPayloads = {
  COUNTERVALUES_MARKETCAP_SET_ERROR: string;
  COUNTERVALUES_MARKETCAP_SET_IDS: string[];
  COUNTERVALUES_MARKETCAP_SET_LOADING: boolean;
  COUNTERVALUES_POLLING_SET_IS_POLLING: boolean;
  COUNTERVALUES_POLLING_SET_TRIGGER_LOAD: boolean;
  COUNTERVALUES_STATE_SET_ERROR: Error;
  COUNTERVALUES_STATE_SET_PENDING: boolean;
  COUNTERVALUES_STATE_SET: CounterValuesState;
  COUNTERVALUES_USER_SETTINGS_SET: CountervaluesSettings;
  COUNTERVALUES_WIPE: undefined;
};

export type CountervaluesHandlersKey = keyof CountervaluesHandlersPayloads;

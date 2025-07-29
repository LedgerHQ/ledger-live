import { CounterValuesState } from "@ledgerhq/live-countervalues/lib-es/types";

export const setCountervaluesMarketcapIds = (payload: string[]) => ({
  type: "COUNTERVALUES_MARKETCAP_SET_IDS" as const,
  payload,
});

export const setCountervaluesMarketcapLoading = (payload: boolean) => ({
  type: "COUNTERVALUES_MARKETCAP_SET_LOADING" as const,
  payload,
});

export const setCountervaluesMarketcapError = (payload: string) => ({
  type: "COUNTERVALUES_MARKETCAP_SET_ERROR" as const,
  payload,
});

export const setCountervaluesState = (payload: CounterValuesState) => ({
  type: "COUNTERVALUES_STATE_SET" as const,
  payload,
});

export const setCountervaluesPending = (payload: boolean) => ({
  type: "COUNTERVALUES_STATE_PENDING_SET" as const,
  payload,
});

export const setCountervaluesError = (payload: Error) => ({
  type: "COUNTERVALUES_STATE_ERROR_SET" as const,
  payload,
});

export const wipeCountervalues = () => ({
  type: "COUNTERVALUES_WIPE_STATE" as const,
});

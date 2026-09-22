import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import {
  createRateSource,
  marketCountervaluesApi,
  type RateSource,
} from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import { CountervaluesBridge, CountervaluesProvider } from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { useGetCounterValueIdsPolling } from "@ledgerhq/live-common/counterValues/state-manager/useGetCounterValueIdsPolling";
import { flow } from "lodash/fp";
import React, { useMemo } from "react";
import { useCountervaluesPollingLifecycle } from "LLM/hooks/useCountervaluesPollingLifecycle";
import { useDispatch } from "~/context/hooks";
import { useUserSettings } from "~/actions/general";
import {
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesState,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  wipeCountervalues,
} from "../actions/countervalues";
import {
  useCountervaluesStateError,
  useCountervaluesStatePending,
  useCountervaluesState,
  useCountervaluesPollingIsPolling,
  useCountervaluesPollingTriggerLoad,
} from "../reducers/countervalues";

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect() {
  useCountervaluesPollingLifecycle();
  return null;
}

/**
 * Builds the rate source the countervalues provider fetches through.
 *
 * The choice between real and mocked rates is made here, at composition time, rather than inside
 * the fetch path: `@domain/api-market-countervalues` reads no environment, so what used to be a
 * hidden `MOCK_COUNTERVALUES` dispatcher two layers down is now one visible branch.
 */
function useRateSource(dispatch: ThunkDispatch<unknown, unknown, UnknownAction>): RateSource {
  return useMemo(() => {
    if (getEnv("MOCK_COUNTERVALUES")) return createMockRateSource(getEnv("MOCK"));

    return createRateSource({
      // Dispatch with `forceRefetch` and without `subscribe: false`; see the RateFetchers docs.
      fetchHistoricalWindow: args =>
        dispatch(
          marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, {
            forceRefetch: true,
          }),
        ),
      fetchSpotBatch: args =>
        dispatch(
          marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true }),
        ),
    });
  }, [dispatch]);
}

export function useCountervaluesBridge() {
  const userSettings = useUserSettings();
  const dispatch = useDispatch();
  const rates = useRateSource(dispatch);

  return useMemo(
    (): CountervaluesBridge => ({
      rates,
      setPollingIsPolling: flow(setCountervaluesPollingIsPolling, dispatch),
      setPollingTriggerLoad: flow(setCountervaluesPollingTriggerLoad, dispatch),
      setState: flow(setCountervaluesState, dispatch),
      setStateError: flow(setCountervaluesStateError, dispatch),
      setStatePending: flow(setCountervaluesStatePending, dispatch),
      useSupportedCryptoIds: useGetCounterValueIdsPolling,
      usePollingIsPolling: useCountervaluesPollingIsPolling,
      usePollingTriggerLoad: useCountervaluesPollingTriggerLoad,
      useState: useCountervaluesState,
      useStateError: useCountervaluesStateError,
      useStatePending: useCountervaluesStatePending,
      useUserSettings: () => userSettings,
      wipe: flow(wipeCountervalues, dispatch),
    }),
    [dispatch, rates, userSettings],
  );
}

export function CountervaluesBridgedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: CounterValuesStateRaw;
}) {
  const bridge = useCountervaluesBridge();

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState}>
      <Effect />
      {children}
    </CountervaluesProvider>
  );
}

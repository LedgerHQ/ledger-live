import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import {
  createRateSource,
  marketCountervaluesApi,
  type RateSource,
} from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import {
  exportCountervalues,
  hasNewCountervaluesToExport,
} from "@ledgerhq/live-countervalues/logic";
import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import type { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { useGetCounterValueIdsPolling } from "@ledgerhq/live-common/counterValues/state-manager/useGetCounterValueIdsPolling";
import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { bindActionCreators } from "redux";
import { setKey } from "~/renderer/storage";
import { countervaluesActions } from "../actions/countervalues";
import { useCalculateCountervaluesUserSettings } from "../actions/general";
import {
  useCountervaluesPollingIsPolling,
  useCountervaluesPollingTriggerLoad,
  useCountervaluesState,
  useCountervaluesStateError,
  useCountervaluesStatePending,
  useCountervaluesUserSettings,
} from "../reducers/countervalues";

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
  const dispatch = useDispatch();
  const rates = useRateSource(dispatch);

  return useMemo(
    (): CountervaluesBridge => ({
      rates,
      ...bindActionCreators(
        {
          setPollingIsPolling: countervaluesActions.COUNTERVALUES_POLLING_SET_IS_POLLING,
          setPollingTriggerLoad: countervaluesActions.COUNTERVALUES_POLLING_SET_TRIGGER_LOAD,
          setState: countervaluesActions.COUNTERVALUES_STATE_SET,
          setStateError: countervaluesActions.COUNTERVALUES_STATE_SET_ERROR,
          setStatePending: countervaluesActions.COUNTERVALUES_STATE_SET_PENDING,
          wipe: countervaluesActions.COUNTERVALUES_WIPE,
        },
        dispatch,
      ),
      useSupportedCryptoIds: useGetCounterValueIdsPolling,
      usePollingIsPolling: useCountervaluesPollingIsPolling,
      usePollingTriggerLoad: useCountervaluesPollingTriggerLoad,
      useState: useCountervaluesState,
      useStateError: useCountervaluesStateError,
      useStatePending: useCountervaluesStatePending,
      useUserSettings: useCountervaluesUserSettings,
    }),
    [dispatch, rates],
  );
}

/**
 * Call side effects outside of the primary render tree, avoiding costly child re-renders
 */
function Effect() {
  useCalculateCountervaluesUserSettings();
  useCacheManager();
  usePollingManager();

  return null;
}

export function CountervaluesBridgedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: CounterValuesStateRaw;
}) {
  const bridge = useCountervaluesBridge();

  return (
    <CountervaluesProvider bridge={bridge} savedState={initialState}>
      <Effect />
      {children}
    </CountervaluesProvider>
  );
}

function useCacheManager() {
  const userSettings = useCountervaluesUserSettings();
  const state = useCountervaluesState();
  const lastStateRef = useRef(state);

  useEffect(() => {
    if (!hasNewCountervaluesToExport(lastStateRef.current, state)) return;
    const exported = exportCountervalues(state, userSettings.trackingPairs);
    setKey("app", "countervalues", exported);
    lastStateRef.current = state;
  }, [state, userSettings]);
}

function usePollingManager() {
  const { poll, start, stop } = useCountervaluesPolling();
  useEffect(() => {
    const handleFocus = () => {
      start();
      poll();
    };
    const handleOnline = () => {
      if (document.hasFocus()) {
        poll();
      }
    };

    window.addEventListener("blur", stop);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [poll, start, stop]);
}

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

export function useCountervaluesBridge() {
  const userSettings = useUserSettings();
  const dispatch = useDispatch();

  return useMemo(
    (): CountervaluesBridge => ({
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
    [dispatch, userSettings],
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

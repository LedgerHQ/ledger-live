import {
  CountervaluesBridge,
  CountervaluesProvider,
  useCountervaluesPolling,
} from "@ledgerhq/live-countervalues-react";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import {
  CountervaluesSettings,
  CounterValuesStateRaw,
  RateMapRaw,
} from "@ledgerhq/live-countervalues/types";
import { flow } from "lodash/fp";
import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setKey } from "~/renderer/storage";
import {
  setCountervaluesError,
  setCountervaluesPending,
  setCountervaluesState,
  wipeCountervalues,
} from "../actions/countervalues";
import { useCalculateCountervaluesUserSettings } from "../actions/general";
import {
  useCountervaluesError,
  useCountervaluesExport,
  useCountervaluesState,
} from "../reducers/countervalues";

export function CountervaluesManagedProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState: CounterValuesStateRaw;
}) {
  const userSettings = useCalculateCountervaluesUserSettings();
  const dispatch = useDispatch();

  const bridge = useMemo(
    (): CountervaluesBridge => ({
      setError: flow(setCountervaluesError, dispatch),
      setPending: flow(setCountervaluesPending, dispatch),
      setState: flow(setCountervaluesState, dispatch),
      useState: useCountervaluesState,
      useError: useCountervaluesError,
      wipe: flow(wipeCountervalues, dispatch),
    }),
    [dispatch],
  );

  return (
    <CountervaluesProvider bridge={bridge} userSettings={userSettings} savedState={initialState}>
      <CountervaluesManager userSettings={userSettings}>{children}</CountervaluesManager>
    </CountervaluesProvider>
  );
}

function CountervaluesManager({
  children,
  userSettings,
}: {
  children: React.ReactNode;
  userSettings: CountervaluesSettings;
}) {
  useCacheManager(userSettings);
  usePollingManager();
  return children;
}

function useCacheManager(userSettings: CountervaluesSettings) {
  const { status, ...state } = useCountervaluesExport();

  useEffect(() => {
    if (!Object.keys(status).length) return;
    const ids = userSettings.trackingPairs.map(pairId);
    const newState = Object.entries(state).reduce(
      (prev: Record<string, RateMapRaw>, [key, val]) =>
        ids.includes(key)
          ? {
              ...prev,
              [key]: val,
            }
          : prev,
      {},
    );
    setKey("app", "countervalues", {
      ...newState,
      status: status,
    });
  }, [state, userSettings, status]);
}

function usePollingManager() {
  const { start, stop } = useCountervaluesPolling();
  useEffect(() => {
    window.addEventListener("blur", stop);
    window.addEventListener("focus", start);
    return () => {
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", start);
    };
  }, [start, stop]);
}

import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type { UninstallAllAppsEvent, Input as UninstallAllAppsInput } from "../uninstallAllApps";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  unresponsive: boolean;
  requestQuitApp?: boolean;
  uninstallAppsRequested?: boolean;
  appsUninstalled: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
};
type StateWithRetry = State & { onRetry: () => void };

type RemoveImageAction = Action<unknown, StateWithRetry, boolean>;

const mapResult = ({ appsUninstalled }: State) => appsUninstalled;

type Event =
  | UninstallAllAppsEvent
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "deviceChange";
      device: Device | null | undefined;
    };

const getInitialState = (device?: Device | null | undefined): State => ({
  isLoading: !!device,
  requestQuitApp: false,
  unresponsive: false,
  device,
  deviceInfo: null,
  error: null,
  uninstallAppsRequested: false,
  appsUninstalled: false,
});

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true, isLoading: false };

    case "deviceChange":
      return getInitialState(e.device);

    case "error":
      return {
        ...state,
        error: e.error,
        isLoading: false,
      };
    case "uninstallAppsPermissionRequested":
      return {
        ...state,
        unresponsive: false,
        uninstallAppsRequested: true,
        isLoading: false,
      };
    case "appsUninstalled":
      return {
        ...state,
        unresponsive: false,
        uninstallAppsRequested: false,
        isLoading: false,
        appsUninstalled: true,
      };
  }
};

export const createAction = (
  task: (arg0: UninstallAllAppsInput) => Observable<UninstallAllAppsEvent>,
): RemoveImageAction => {
  const useHook = (device: Device | null | undefined, _: unknown): StateWithRetry => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    const onRetry = useCallback(() => {
      setResetIndex(currIndex => currIndex + 1);
      setState(s => getInitialState(s.device));
    }, []);

    useEffect(() => {
      if (state.appsUninstalled) return;

      const impl = getImplementation(currentMode)<UninstallAllAppsEvent, Record<string, unknown>>({
        deviceSubject,
        task,
        request: {},
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-remove-stax-image-event", e.type, e)),
          scan(reducer, getInitialState()),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, resetIndex, state.appsUninstalled]);

    return {
      ...state,
      onRetry,
    };
  };

  return {
    useHook,
    mapResult,
  };
};

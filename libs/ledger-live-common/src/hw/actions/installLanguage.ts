import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type {
  InstallLanguageEvent,
  InstallLanguageRequest,
  Input as InstallLanguageInput,
} from "../installLanguage";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  languageInstallationRequested?: boolean;
  installingLanguage?: boolean;
  languageInstalled?: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
  progress?: number;
};

type ActionState = State & {
  onRetry: () => void;
};

type InstallLanguageAction = Action<InstallLanguageRequest, ActionState, boolean | undefined>;

const mapResult = ({ languageInstalled }: State) => languageInstalled;

type Event =
  | InstallLanguageEvent
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
});

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true, isLoading: false };

    case "deviceChange":
      return getInitialState(e.device);

    case "error":
      return {
        ...getInitialState(state.device),
        error: e.error,
        isLoading: false,
      };
    case "appDetected":
      return {
        ...state,
        unresponsive: false,
        requestQuitApp: true,
        isLoading: false,
      };
    case "devicePermissionRequested":
      return {
        ...state,
        unresponsive: false,
        languageInstallationRequested: true,
        isLoading: false,
      };
    case "languageInstalled":
      return {
        ...state,
        unresponsive: false,
        languageInstallationRequested: false,
        isLoading: false,
        installingLanguage: false,
        languageInstalled: true,
      };

    case "progress":
      return {
        ...state,
        unresponsive: false,
        languageInstallationRequested: false,
        isLoading: false,
        installingLanguage: true,
        progress: e.progress,
      };
  }
  return state; // Nb Needed until e2e tests are better handled.
};

export const createAction = (
  task: (arg0: InstallLanguageInput) => Observable<InstallLanguageEvent>,
): InstallLanguageAction => {
  const useHook = (
    device: Device | null | undefined,
    request: InstallLanguageRequest,
  ): ActionState => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      if (state.languageInstalled) return;

      const impl = getImplementation(currentMode)<InstallLanguageEvent, InstallLanguageRequest>({
        deviceSubject,
        task,
        request,
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-install-language-event", e.type, e)),
          scan(reducer, getInitialState()),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, request, state.languageInstalled, resetIndex]);

    const onRetry = useCallback(() => {
      setResetIndex(currIndex => currIndex + 1);
      setState(s => getInitialState(s.device));
    }, []);

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

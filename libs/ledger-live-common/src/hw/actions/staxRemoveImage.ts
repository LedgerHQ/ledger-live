import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type {
  RemoveImageEvent,
  Input as RemoveImageInput,
} from "../staxRemoveImage";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  imageRemoveRequested?: boolean;
  imageRemoved: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
};
type StateWithRetry = State & { onRetry: () => void };

type RemoveImageAction = Action<{}, StateWithRetry, boolean>;

const mapResult = ({ imageRemoved }: State) => imageRemoved;

type Event =
  | RemoveImageEvent
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
  imageRemoveRequested: false,
  imageRemoved: false,
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
    case "removeImagePermissionRequested":
      return {
        ...state,
        unresponsive: false,
        imageRemoveRequested: true,
        isLoading: false,
      };
    case "imageRemoved":
      return {
        ...state,
        unresponsive: false,
        imageRemoveRequested: false,
        isLoading: false,
        imageRemoved: true,
      };
  }
};

export const createAction = (
  task: (arg0: RemoveImageInput) => Observable<RemoveImageEvent>
): RemoveImageAction => {
  const useHook = (
    device: Device | null | undefined,
    _: {}
  ): StateWithRetry => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    const onRetry = useCallback(() => {
      setResetIndex((currIndex) => currIndex + 1);
      setState((s) => getInitialState(s.device));
    }, []);

    useEffect(() => {
      if (state.imageRemoved) return;

      const impl = getImplementation(currentMode)<RemoveImageEvent, {}>({
        deviceSubject,
        task,
        request: {},
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-remove-stax-image-event", e.type, e)),
          scan(reducer, getInitialState())
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, resetIndex, state.imageRemoved]);

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

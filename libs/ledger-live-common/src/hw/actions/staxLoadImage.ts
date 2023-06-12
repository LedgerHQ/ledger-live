import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type {
  LoadImageEvent,
  LoadImageRequest,
  LoadimageResult,
  Input as LoadImageInput,
} from "../staxLoadImage";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  imageLoadRequested?: boolean;
  loadingImage?: boolean;
  imageLoaded?: boolean;
  imageCommitRequested?: boolean;
  imageHash: string;
  imageSize: number;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
  progress?: number;
};

type ActionState = State & {
  onRetry: () => void;
};

type LoadImageAction = Action<LoadImageRequest, ActionState, LoadimageResult>;

const mapResult = ({ imageHash, imageSize }: State) => ({
  imageHash,
  imageSize,
});

type Event =
  | LoadImageEvent
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "deviceChange";
      device: Device | null | undefined;
    };

export const getInitialState = (device?: Device | null | undefined): State => ({
  isLoading: !!device,
  requestQuitApp: false,
  unresponsive: false,
  device,
  deviceInfo: null,
  error: null,
  imageSize: 0,
  imageHash: "",
});

export const reducer = (state: State, e: Event): State => {
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
    case "loadImagePermissionRequested":
      return {
        ...state,
        unresponsive: false,
        imageLoadRequested: true,
        isLoading: false,
      };
    case "commitImagePermissionRequested":
      return {
        ...state,
        unresponsive: false,
        imageCommitRequested: true,
        loadingImage: false,
        isLoading: false,
      };
    case "imageLoaded":
      return {
        ...state,
        unresponsive: false,
        imageLoadRequested: false,
        imageCommitRequested: false,
        isLoading: false,
        loadingImage: false,
        imageLoaded: true,
        imageSize: e.imageSize,
        imageHash: e.imageHash,
      };
    case "progress":
      return {
        ...state,
        unresponsive: false,
        imageLoadRequested: false,
        imageCommitRequested: false,
        isLoading: false,
        loadingImage: true,
        progress: e.progress,
      };
  }
  return state; // Nb Needed until e2e tests are better handled.
};

export const createAction = (
  task: (arg0: LoadImageInput) => Observable<LoadImageEvent>,
): LoadImageAction => {
  const useHook = (device: Device | null | undefined, request: LoadImageRequest): ActionState => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      if (state.imageLoaded) return;

      const impl = getImplementation(currentMode)<LoadImageEvent, LoadImageRequest>({
        deviceSubject,
        task,
        request,
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-load-stax-image-event", e.type, e)),
          scan(reducer, getInitialState()),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, request, state.imageLoaded, resetIndex]);

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

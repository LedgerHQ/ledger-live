import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useCallback, useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type {
  FetchImageEvent,
  FetchImageRequest,
  Input as FetchImageInput,
} from "../staxFetchImage";
import type { Action, Device } from "./types";
import { currentMode } from "./app";
import { getImplementation } from "./implementations";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  fetchingImage?: boolean;
  imageFetched?: boolean;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
  hexImage?: string | undefined;
  imgHash?: string | undefined;
  progress?: number;
  completed?: boolean;
  imageAlreadyBackedUp?: boolean;
};

type ActionState = State & {
  onRetry: () => void;
};

type FetchImageAction = Action<FetchImageRequest, ActionState, boolean>;

const mapResult = ({ completed, imageFetched, imageAlreadyBackedUp }: State) =>
  completed || imageFetched || imageAlreadyBackedUp || null;

type Event =
  | FetchImageEvent
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
  fetchingImage: false,
  device,
  deviceInfo: null,
  error: null,
  imageAlreadyBackedUp: false,
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
        error: null,
        unresponsive: false,
        requestQuitApp: true,
        isLoading: false,
      };
    case "imageFetched":
      return {
        ...state,
        error: null,
        unresponsive: false,
        isLoading: false,
        fetchingImage: false,
        imageFetched: true,
        hexImage: e.hexImage,
      };
    case "currentImageHash":
      return {
        ...state,
        error: null,
        unresponsive: false,
        isLoading: false,
        fetchingImage: true,
        imgHash: e.imgHash,
      };
    case "imageAlreadyBackedUp":
      return {
        ...state,
        error: null,
        unresponsive: false,
        isLoading: false,
        fetchingImage: false,
        imageFetched: false,
        imageAlreadyBackedUp: true,
        completed: true,
      };
    case "progress":
      return {
        ...state,
        error: null,
        unresponsive: false,
        isLoading: false,
        fetchingImage: true,
        progress: e.progress,
      };
  }
  return state; // Nb Needed until e2e tests are better handled.
};

export const createAction = (
  task: (arg0: FetchImageInput) => Observable<FetchImageEvent>
): FetchImageAction => {
  const useHook = (
    device: Device | null | undefined,
    request: FetchImageRequest
  ): ActionState => {
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      if (state.imageFetched || state.imageAlreadyBackedUp || state.completed)
        return;
      const impl = getImplementation(currentMode)<
        FetchImageEvent,
        FetchImageRequest
      >({
        deviceSubject,
        task,
        request,
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-fetch-stax-image-event", e.type, e)),
          scan(reducer, getInitialState())
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [
      deviceSubject,
      request,
      state.completed,
      state.imageAlreadyBackedUp,
      state.imageFetched,
      resetIndex,
    ]);

    const onRetry = useCallback(() => {
      setResetIndex((currIndex) => currIndex + 1);
      setState((s) => getInitialState(s.device));
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

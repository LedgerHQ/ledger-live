import {
  concat,
  of,
  EMPTY,
  interval,
  Observable,
  TimeoutError,
  throwError,
} from "rxjs";
import {
  scan,
  debounce,
  debounceTime,
  catchError,
  switchMap,
  tap,
  distinctUntilChanged,
  timeout,
} from "rxjs/operators";
import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import type { DeviceInfo } from "@ledgerhq/types-live";
import { useReplaySubject } from "../../observable";
import type { LoadImageEvent, LoadImageRequest } from "../ftsLoadImage";
import type { Action, Device } from "./types";
import isEqual from "lodash/isEqual";
import { ConnectManagerTimeout } from "../../errors";
import { currentMode } from "./app";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import { getDeviceModel } from "@ledgerhq/devices";

type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  unresponsive: boolean;
  imageLoadRequested?: boolean;
  loadingImage?: boolean;
  imageLoaded?: boolean;
  imageCommitRequested?: boolean;
  imageHash?: string;
  device: Device | null | undefined;
  deviceInfo: DeviceInfo | null | undefined;
  error: Error | null | undefined;
  progress?: number;
};

type LoadImageAction = Action<string, State, { imageHash?: string }>;

const mapResult = ({ imageHash }: State) => ({ imageHash });

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
};

const implementations = {
  // in this paradigm, we know that deviceSubject is reflecting the device events
  // so we just trust deviceSubject to reflect the device context (switch between apps, dashboard,...)
  event: ({ deviceSubject, loadImage, language }) =>
    deviceSubject.pipe(
      debounceTime(1000),
      switchMap((d) => loadImage(d, language))
    ),
  // in this paradigm, we can't observe directly the device, so we have to poll it
  polling: ({ deviceSubject, loadImage, language }) =>
    new Observable((o) => {
      const POLLING = 2000;
      const INIT_DEBOUNCE = 5000;
      const DISCONNECT_DEBOUNCE = 5000;
      const DEVICE_POLLING_TIMEOUT = 60000;
      // this pattern allows to actually support events based (like if deviceSubject emits new device changes) but inside polling paradigm
      let pollingOnDevice;
      const sub = deviceSubject.subscribe((d) => {
        if (d) {
          pollingOnDevice = d;
        }
      });
      let initT: NodeJS.Timeout | null = setTimeout(() => {
        // initial timeout to unset the device if it's still not connected
        o.next({
          type: "deviceChange",
          device: null,
        });
        device = null;
        log("actions-load-fts-image-event/polling", "device init timeout");
      }, INIT_DEBOUNCE);
      let connectSub;
      let loopT;
      let disconnectT;
      let device = null; // used as internal state for polling

      let stopDevicePollingError = null;

      function loop() {
        stopDevicePollingError = null;

        if (!pollingOnDevice) {
          loopT = setTimeout(loop, POLLING);
          return;
        }

        log("actions-load-fts-image-event/polling", "polling loop");
        connectSub = loadImage(pollingOnDevice, language)
          .pipe(
            timeout(DEVICE_POLLING_TIMEOUT),
            catchError((err) => {
              const productName = getDeviceModel(
                pollingOnDevice.modelId
              ).productName;
              return err instanceof TimeoutError
                ? of({
                    type: "error",
                    error: new ConnectManagerTimeout(undefined, {
                      productName,
                    }) as Error,
                  })
                : throwError(err);
            })
          )
          .subscribe({
            next: (event) => {
              if (initT && device) {
                clearTimeout(initT);
                initT = null;
              }

              if (disconnectT) {
                // any connect app event unschedule the disconnect debounced event
                clearTimeout(disconnectT);
                disconnectT = null;
              }

              if (event.type === "error" && event.error) {
                if (
                  event.error instanceof DisconnectedDevice ||
                  event.error instanceof DisconnectedDeviceDuringOperation
                ) {
                  // disconnect on manager actions seems to trigger a type "error" instead of "disconnect"
                  // the disconnect event is delayed to debounce the reconnection that happens when switching apps
                  disconnectT = setTimeout(() => {
                    disconnectT = null;
                    // a disconnect will locally be remembered via locally setting device to null...
                    device = null;
                    o.next(event);
                    log(
                      "actions-load-fts-image-event/polling",
                      "device disconnect timeout"
                    );
                  }, DISCONNECT_DEBOUNCE);
                } else {
                  // These error events should stop polling
                  stopDevicePollingError = event.error;

                  // clear all potential polling loops
                  if (loopT) {
                    clearTimeout(loopT);
                    loopT = null;
                  }

                  // send in the event for the UI immediately
                  o.next(event);
                }
              } else if (event.type === "unresponsiveDevice") {
                return; // ignore unresponsive case which happens for polling
              } else {
                if (device !== pollingOnDevice) {
                  // ...but any time an event comes back, it means our device was responding and need to be set back on in polling context
                  device = pollingOnDevice;
                  o.next({
                    type: "deviceChange",
                    device,
                  });
                }

                o.next(event);
              }
            },
            complete: () => {
              // start a new polling if available
              if (!stopDevicePollingError) loopT = setTimeout(loop, POLLING);
            },
            error: (e) => {
              o.error(e);
            },
          });
      }

      // delay a bit the first loop run in order to be async and wait pollingOnDevice
      loopT = setTimeout(loop, 0);
      return () => {
        if (initT) clearTimeout(initT);
        if (disconnectT) clearTimeout(disconnectT);
        if (connectSub) connectSub.unsubscribe();
        sub.unsubscribe();
        clearTimeout(loopT);
      };
    }).pipe(distinctUntilChanged(isEqual)),
};
export const createAction = (
  loadImageExec: (arg0: LoadImageRequest) => Observable<LoadImageEvent>
): LoadImageAction => {
  const loadImage = (device, hexImage: string) => {
    return concat(
      of({
        type: "deviceChange",
        device,
      }),
      !device
        ? EMPTY
        : loadImageExec({
            deviceId: device.deviceId,
            hexImage,
          }).pipe(
            catchError((error: Error) =>
              of({
                type: "error",
                error,
              })
            )
          )
    );
  };

  const useHook = (
    device: Device | null | undefined,
    hexImage: string
  ): State => {
    const [state, setState] = useState(() => getInitialState(device));
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      if (state.imageLoaded) return;

      const impl = implementations[currentMode]({
        deviceSubject,
        loadImage,
        language: hexImage,
      });

      const sub = impl
        .pipe(
          // debounce a bit the connect/disconnect event that we don't need
          tap((e: Event) => log("actions-load-fts-image-event", e.type, e)),
          // we gather all events with a reducer into the UI state
          scan(reducer, getInitialState()),
          // we debounce the UI state to not blink on the UI
          debounce((s: State) => {
            if (
              s.loadingImage ||
              s.imageLoadRequested ||
              s.imageCommitRequested
            ) {
              return EMPTY;
            }

            // default debounce (to be tweak)
            return interval(1500);
          })
        ) // the state simply goes into a React state
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, hexImage, state.imageLoaded]);

    return {
      ...state,
    };
  };

  return {
    useHook,
    mapResult,
  };
};

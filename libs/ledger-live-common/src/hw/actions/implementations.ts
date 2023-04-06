import {
  EMPTY,
  Observable,
  Observer,
  ReplaySubject,
  Subscription,
  TimeoutError,
  concat,
  of,
  timer,
} from "rxjs";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import {
  catchError,
  debounce,
  filter,
  switchMap,
  tap,
  timeout,
} from "rxjs/operators";
import { Device } from "./types";
import { getDeviceModel } from "@ledgerhq/devices";
import { ConnectManagerTimeout } from "../../errors";

export enum ImplementationType {
  event = "enum",
  polling = "polling",
}

type ImplementationEvent =
  | {
      type: "deviceChange";
      device?: Device | undefined | null;
    }
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "error";
      error: Error;
    };

type PollingImplementationConfig = {
  pollingFrequency: number;
  initialWaitTime: number;
  reconnectWaitTime: number;
  connectionTimeout: number;
};

type PollingImplementationParams<Request, EmittedEvents> = {
  deviceSubject: ReplaySubject<Device | null | undefined>;
  task: (params: {
    deviceId: string;
    request: Request;
  }) => Observable<EmittedEvents>;
  request: Request;
  config?: PollingImplementationConfig;
};

const defaultConfig: PollingImplementationConfig = {
  pollingFrequency: 2000,
  initialWaitTime: 5000,
  reconnectWaitTime: 5000,
  connectionTimeout: 20000,
};
type Implementation = <EmittedEvent, GenericRequestType>(
  params: PollingImplementationParams<GenericRequestType, EmittedEvent>
) => Observable<EmittedEvent | ImplementationEvent>;

export type EmittedEvent<T> = {
  type: string;
} & T;

/**
 * Returns a polling implementation function that repeatedly performs a given task
 * with a given request, with a specified polling frequency and wait times until a
 * KO or OK end state is reached. This emulates the event based connection paradigm
 * from the USB stack in a BLE setting.
 * @template EmittedEvent - Type of the events emitted by the task's observable.
 * @template GenericRequestType - Type of the request to be passed to the task.
 **/
const pollingImplementation: Implementation = <
  SpecificType,
  GenericRequestType
>(
  params: PollingImplementationParams<GenericRequestType, SpecificType>
): Observable<SpecificType | ImplementationEvent> =>
  new Observable(
    (
      subscriber: Observer<EmittedEvent<SpecificType> | ImplementationEvent>
    ) => {
      const { deviceSubject, task, request, config = defaultConfig } = params;
      const {
        pollingFrequency,
        initialWaitTime,
        reconnectWaitTime,
        connectionTimeout,
      } = config;

      let shouldStopPolling = false;
      let connectSub: Subscription;
      let loopTimeout: NodeJS.Timeout | null;
      let firstRound = true;

      let currentDevice: Device;
      const deviceSubjectSub = deviceSubject.subscribe((device) => {
        currentDevice = device || currentDevice;
      });

      // Cover case where our device job never gets a transport instance
      // it will signal back to the consumer that we don't have a device.
      let initialTimeout: NodeJS.Timeout | null = setTimeout(() => {
        return subscriber.next({
          type: "deviceChange",
          device: undefined,
        });
      }, initialWaitTime);

      // Runs every time we get a new device.
      function actionLoop() {
        if (currentDevice) {
          const productName = getDeviceModel(currentDevice.modelId).productName;

          connectSub = concat(
            of({
              type: "deviceChange",
              device: currentDevice,
              replaceable: !firstRound,
            }),
            task({ deviceId: currentDevice.deviceId, request })
          )
            .pipe(
              // Any event should clear the initialTimeout.
              tap((_: any) => {
                if (initialTimeout) {
                  clearTimeout(initialTimeout);
                  initialTimeout = null;
                }
              }),

              // More than `connectionTimeout` time of silence, is considered
              // a failed connection. Depending on the flow this may mean we'd have
              // to emit an `alive` kind of event.
              timeout(connectionTimeout),

              filter(
                (event: EmittedEvent<SpecificType> | ImplementationEvent) => {
                  if ("type" in event) {
                    return event.type !== "unresponsiveDevice";
                  }
                  return false;
                }
              ),

              catchError((error: Error) => {
                const maybeRemappedError =
                  error instanceof TimeoutError
                    ? (new ConnectManagerTimeout(undefined, {
                        // TODO make this configurable
                        productName,
                      }) as Error)
                    : error;

                return of({
                  type: "error",
                  error: maybeRemappedError,
                } as ImplementationEvent);
              }),

              debounce(
                (event: EmittedEvent<SpecificType> | ImplementationEvent) => {
                  if (event.type === "error" && "error" in event) {
                    const error = event.error as unknown;
                    if (
                      // Delay emission of disconnects to allow reconnection.
                      error instanceof DisconnectedDevice ||
                      error instanceof DisconnectedDeviceDuringOperation
                    ) {
                      return timer(reconnectWaitTime);
                    } else {
                      // Other errors should cancel the loop.
                      shouldStopPolling = true;
                    }
                  }
                  // All other events pass through.
                  return EMPTY;
                }
              )
            )
            .subscribe({
              next: (event: any) => {
                subscriber.next(event);
              },
              error: (e: any) => {
                subscriber.error(e);
              },
              complete: () => {
                if (shouldStopPolling) return;
                firstRound = false; // For proper debouncing.
                loopTimeout = setTimeout(actionLoop, pollingFrequency);
              },
            });
        } else {
          // We currently don't have a device, try again.
          loopTimeout = setTimeout(actionLoop, pollingFrequency);
        }
      }

      // Delay the first loop run in order to be async.
      loopTimeout = setTimeout(actionLoop, 0);

      // Get rid of pending timeouts and subscriptions.
      return function cleanup() {
        if (deviceSubjectSub) deviceSubjectSub.unsubscribe();
        if (connectSub) connectSub.unsubscribe();

        if (initialTimeout) clearTimeout(initialTimeout);
        if (loopTimeout) clearTimeout(loopTimeout);
      };
    }
  );

const eventImplementation: Implementation = <SpecificType, GenericRequestType>(
  params: PollingImplementationParams<GenericRequestType, SpecificType>
): Observable<EmittedEvent<SpecificType> | ImplementationEvent> => {
  const { deviceSubject, task, request, config = defaultConfig } = params;
  const { reconnectWaitTime } = config;
  return new Observable(
    (
      subscriber: Observer<EmittedEvent<SpecificType> | ImplementationEvent>
    ) => {
      const connectSub = deviceSubject
        .pipe(
          debounce((device) => timer(!device ? reconnectWaitTime : 0)),
          switchMap((device) => {
            const initialEvent = of({
              type: "deviceChange",
              device,
            });

            return concat(
              initialEvent,
              !device
                ? EMPTY
                : task({ deviceId: device.deviceId, request }).pipe(
                    filter(
                      // unresponsiveDevice are for polling.
                      (event) =>
                        (event as ImplementationEvent).type !==
                        "unresponsiveDevice"
                    )
                  )
            );
          }),
          catchError((error: Error) =>
            of({
              type: "error",
              error,
            })
          )
        )
        .subscribe({
          next: (event: any) => {
            subscriber.next(event);
          },
          error: (e: any) => {
            subscriber.error(e);
          },
          complete: () => {},
        });

      // Get rid of subscriptions.
      return function cleanup() {
        if (connectSub) connectSub.unsubscribe();
      };
    }
  );
};

const getImplementation = (currentMode: string): Implementation =>
  currentMode === "polling" ? pollingImplementation : eventImplementation;

export { pollingImplementation, eventImplementation, getImplementation };

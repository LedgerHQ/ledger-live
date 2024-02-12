import { forkJoin, Observable, of } from "rxjs";
import { scan, switchMap } from "rxjs/operators";
import type { FirmwareUpdateContext, DeviceId, DeviceInfo } from "@ledgerhq/types-live";

import {
  getLatestFirmwareTask,
  GetLatestFirmwareTaskError,
  GetLatestFirmwareTaskEvent,
} from "../tasks/getLatestFirmware";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskError,
  GetDeviceInfoTaskErrorEvent,
} from "../tasks/getDeviceInfo";
import { FullActionState, initialSharedActionState, sharedReducer } from "./core";
import { SharedTaskEvent } from "../tasks/core";

export type GetLatestAvailableFirmwareActionArgs = {
  deviceId: DeviceId;
};

// Union of all the tasks specific errors
export type GetLatestAvailableFirmwareActionErrorName =
  | GetDeviceInfoTaskError
  | GetLatestFirmwareTaskError;

export type GetLatestAvailableFirmwareActionState = FullActionState<{
  error: {
    type: "GetLatestAvailableFirmwareError";
    name: GetLatestAvailableFirmwareActionErrorName;
  } | null;
  firmwareUpdateContext: FirmwareUpdateContext | null;
  deviceInfo: DeviceInfo | null;
  status: "idle" | "ongoing" | "error" | "no-available-firmware" | "available-firmware";
}>;

// Useful to update the action state from an event not coming from a task
type StateUpdateEvent = {
  type: "stateUpdate";
  status?: GetLatestAvailableFirmwareActionState["status"];
  deviceInfo?: DeviceInfo | null;
  lockedDevice?: boolean;
  error?: GetLatestAvailableFirmwareActionState["error"];
};

export const initialState: GetLatestAvailableFirmwareActionState = {
  firmwareUpdateContext: null,
  deviceInfo: null,
  status: "idle",
  ...initialSharedActionState,
};

/**
 * Get the latest available firmware that the device could update to
 *
 * @param `deviceId` A device id, or an empty string if device is usb plugged
 * @returns an Observables that emits the evolution of the state machine until finding (or not)
 * the latest available firmware. The state is as follow (+ shared state with other actions):
 * - `firmwareUpdateContext`: the `FirmwareUpdateContext` when retrieved, null otherwise
 * - `deviceInfo`: the `DeviceInfo` when retrieved, null otherwise
 * - `status`: the current status of the action: "error" | "no-available-firmware" | "available-firmware" meaning the action has finished
 * - `error`: an error coming from the business logic, the device or internal. Some error are retried:
 *   `{ type`: "SharedError", retrying: true, ... }`
 * - `...sharedActionState`
 */
export function getLatestAvailableFirmwareAction({
  deviceId,
}: GetLatestAvailableFirmwareActionArgs): Observable<GetLatestAvailableFirmwareActionState> {
  const observable = new Observable<
    | (GetLatestFirmwareTaskEvent & {
        deviceInfo: DeviceInfo;
      })
    | GetDeviceInfoTaskErrorEvent
    // Because `GetLatestFirmwareTaskEvent` is intersected with a new object ({ `deviceInfo` }),
    // `SharedTaskEvent` alone is not part of the type definition anymore, and needs to be added again.
    | SharedTaskEvent
    | StateUpdateEvent
  >(subscriber => {
    subscriber.next({
      type: "stateUpdate",
      status: "ongoing",
    });

    getDeviceInfoTask({ deviceId })
      .pipe(
        switchMap(event => {
          if (event.type !== "data") {
            return of(event);
          }
          const { deviceInfo } = event;

          // Update the action state before the next task
          subscriber.next({
            type: "stateUpdate",
            status: "ongoing",
            deviceInfo,
            lockedDevice: false,
            error: null,
          });

          // Keeps `deviceInfo` in the next event
          return forkJoin([getLatestFirmwareTask({ deviceId, deviceInfo }), of(deviceInfo)]).pipe(
            // Creating a new "event"-like object, extending it with `deviceInfo`
            switchMap(([event, deviceInfo]) => {
              return of({
                ...event,
                deviceInfo,
              });
            }),
          );
        }),
      )
      .subscribe(subscriber);
  });

  return observable.pipe(
    scan<
      | (GetLatestFirmwareTaskEvent & {
          deviceInfo: DeviceInfo;
        })
      | GetDeviceInfoTaskErrorEvent
      // Because `GetLatestFirmwareTaskEvent` is intersected with a new object ({ `deviceInfo` }),
      // `SharedTaskEvent` alone is not part of the type definition anymore, and needs to be added again.
      | SharedTaskEvent
      | StateUpdateEvent,
      GetLatestAvailableFirmwareActionState
    >((currentState, event) => {
      switch (event.type) {
        case "taskError":
          // Maps firmware already up-to-date task error to `status` "no-available-firmware"
          if (event.error === "FirmwareUpToDate") {
            return {
              ...currentState,
              firmwareUpdateContext: null,
              deviceInfo: "deviceInfo" in event ? event.deviceInfo : null,
              status: "no-available-firmware",
            };
          }

          return {
            ...currentState,
            error: {
              type: "GetLatestAvailableFirmwareError",
              name: event.error,
            },
            firmwareUpdateContext: null,
            deviceInfo: "deviceInfo" in event ? event.deviceInfo : null,
            status: "error",
          };
        case "data":
          return {
            ...currentState,
            error: null,
            firmwareUpdateContext: event.firmwareUpdateContext,
            deviceInfo: event.deviceInfo,
            status: "available-firmware",
          };
        case "error": {
          const sharedState = sharedReducer({
            event,
          });

          return {
            ...currentState,
            ...sharedState,
            firmwareUpdateContext: null,
            deviceInfo: "deviceInfo" in event ? event.deviceInfo : null,
            status: sharedState.error?.retrying ? "ongoing" : "error",
          };
        }
        case "stateUpdate":
          // Updates only the prop that are defined in the event
          return {
            ...currentState,
            ...(event.lockedDevice !== undefined ? { lockedDevice: event.lockedDevice } : {}),
            ...(event.deviceInfo !== undefined ? { deviceInfo: event.deviceInfo } : {}),
            ...(event.status !== undefined ? { status: event.status } : {}),
            ...(event.error !== undefined ? { error: event.error } : {}),
          };
      }
    }, initialState),
  );
}

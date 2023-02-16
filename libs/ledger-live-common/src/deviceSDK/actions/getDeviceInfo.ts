import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import {
  FullActionState,
  initialSharedActionState,
  sharedReducer,
} from "./core";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskError,
} from "../tasks/getDeviceInfo";

export type GetDeviceInfoActionArgs = { deviceId: DeviceId };

// Union of all the tasks specific errors
export type GetDeviceInfoActionErrorType = GetDeviceInfoTaskError;

export type GetDeviceInfoActionState = FullActionState<{
  deviceInfo: DeviceInfo | null;
  error: { type: GetDeviceInfoActionErrorType; message?: string } | null;
}>;

export const initialState: GetDeviceInfoActionState = {
  deviceInfo: null,
  ...initialSharedActionState,
};

export function getDeviceInfoAction({
  deviceId,
}: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
  // TODO: to decide: should we push an event if the state is not changing?
  // For ex: when the device is locked with 0x5515: an event with lockedDevice: true is pushed for each retry
  return getDeviceInfoTask({ deviceId }).pipe(
    scan((currentState, event) => {
      switch (event.type) {
        case "taskError":
          return { ...initialState, error: { type: event.error } };
        case "data":
          return {
            ...currentState,
            error: null,
            deviceInfo: event.deviceInfo,
          };
        case "error":
          return {
            ...currentState,
            ...sharedReducer({
              event,
            }),
          };
      }
    }, initialState)
  );
}

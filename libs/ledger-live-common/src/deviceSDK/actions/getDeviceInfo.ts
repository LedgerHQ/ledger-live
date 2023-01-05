import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import {
  SharedActionState,
  getSharedInitialState,
  sharedReducer,
} from "./core";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskError,
  GetDeviceInfoTaskEvent,
} from "../tasks/getDeviceInfo";

export type GetDeviceInfoActionArgs = { deviceId: DeviceId };

// Union of all the tasks specific errors
export type GetDeviceInfoActionErrorType = GetDeviceInfoTaskError;

export type GetDeviceInfoActionState = {
  deviceInfo: DeviceInfo | null;
} & SharedActionState<GetDeviceInfoActionErrorType>;

export const initialState: GetDeviceInfoActionState = {
  deviceInfo: null,
  ...getSharedInitialState<GetDeviceInfoActionErrorType>(),
};

export function getDeviceInfoAction({
  deviceId,
}: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
  // TODO: what does it looks like with several tasks ?
  return getDeviceInfoTask({ deviceId }).pipe(
    tap((event) => console.log(`🦖 ${JSON.stringify(event)}`)),
    scan(
      (
        currentState: GetDeviceInfoActionState,
        event: GetDeviceInfoTaskEvent
      ) => {
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
              ...sharedReducer<GetDeviceInfoActionErrorType>({
                currentState,
                event,
              }),
            };
        }
      },
      initialState
    )
  );
}

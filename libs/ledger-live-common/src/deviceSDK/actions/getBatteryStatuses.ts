import { BatteryStatusFlags } from "@ledgerhq/types-devices";
import { DeviceId } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import { FullActionState, initialSharedActionState, sharedReducer } from "./core";
import { getBatteryStatusTask, GetBatteryStatusesTaskError } from "../tasks/getBatteryStatuses";
import { BatteryStatusTypes } from "../../hw/getBatteryStatus";

export type GetBatteryStatusesActionArgs = {
  deviceId: DeviceId;
  deviceName: string | null;
  statuses: BatteryStatusTypes[];
};

// Union of all the tasks specific errors
export type GetBatteryStatusesActionErrorType = GetBatteryStatusesTaskError;

export type GetBatteryStatusesActionState = FullActionState<{
  batteryStatuses: (number | BatteryStatusFlags)[];
  error: { type: GetBatteryStatusesActionErrorType; message?: string; name?: string } | null;
}>;

export const initialState: GetBatteryStatusesActionState = {
  batteryStatuses: [],
  ...initialSharedActionState,
};

export function getBatteryStatusesAction({
  deviceId,
  deviceName,
  statuses,
}: GetBatteryStatusesActionArgs): Observable<GetBatteryStatusesActionState> {
  return getBatteryStatusTask({ deviceId, deviceName, statuses }).pipe(
    scan((currentState, event) => {
      switch (event.type) {
        case "taskError":
          return { ...initialState, error: { type: event.error } };
        case "data":
          return {
            ...currentState,
            error: null,
            lockedDevice: false,
            batteryStatuses: [...currentState.batteryStatuses, event.batteryStatus],
          };
        case "error":
          return {
            ...currentState,
            ...sharedReducer({
              event,
            }),
          };
      }
    }, initialState),
  );
}

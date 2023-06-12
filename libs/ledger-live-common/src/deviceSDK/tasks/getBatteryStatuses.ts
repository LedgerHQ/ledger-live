import { DisconnectedDevice, LockedDeviceError } from "@ledgerhq/errors";
import type { DeviceId } from "@ledgerhq/types-live";

import { Observable, concat } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  SharedTaskEvent,
  retryOnErrorsCommandWrapper,
  sharedLogicTaskWrapper,
} from "./core";
import { quitApp } from "../commands/quitApp";
import { withTransport } from "../transports/core";
import { BatteryStatusTypes } from "../../hw/getBatteryStatus";
import { BatteryStatusFlags } from "@ledgerhq/types-devices";
import getBatteryStatus from "../commands/getBatteryStatus";

export type GetBatteryStatusesTaskArgs = {
  deviceId: DeviceId;
  statuses: BatteryStatusTypes[];
};

// No taskError for getDeviceInfoTask. Kept for consistency with other tasks.
export type GetBatteryStatusesTaskError = "None";

export type GetBatteryStatusesTaskErrorEvent = {
  type: "taskError";
  error: GetBatteryStatusesTaskError;
};

export type GetBatteryStatusesTaskEvent =
  | { type: "data"; batteryStatus: number | BatteryStatusFlags }
  | GetBatteryStatusesTaskErrorEvent
  | SharedTaskEvent;

function internalGetBatteryStatusesTask({
  deviceId,
  statuses,
}: GetBatteryStatusesTaskArgs): Observable<GetBatteryStatusesTaskEvent> {
  return new Observable((subscriber) => {
    return withTransport(deviceId)(({ transportRef }) =>
      quitApp(transportRef.current).pipe(
        switchMap(() => {
          const statusesObservable = statuses.map((statusType) =>
            retryOnErrorsCommandWrapper({
              command: ({ transport }) =>
                getBatteryStatus({ transport, statusType }),
              allowedErrors: [
                { maxRetries: 3, errorClass: DisconnectedDevice },
              ],
            })(transportRef, {})
          );
          return concat(...statusesObservable);
        }),
        map((value) => {
          if (value.type === "unresponsive") {
            return { type: "error" as const, error: new LockedDeviceError() };
          }

          const { batteryStatus } = value;

          return { type: "data" as const, batteryStatus };
        })
      )
    ).subscribe(subscriber);
  });
}

export const getBatteryStatusTask = sharedLogicTaskWrapper(
  internalGetBatteryStatusesTask
);

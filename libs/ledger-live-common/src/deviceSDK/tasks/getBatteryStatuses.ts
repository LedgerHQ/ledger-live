import { DisconnectedDevice, StatusCodes, TransportStatusError } from "@ledgerhq/errors";
import type { DeviceId } from "@ledgerhq/types-live";

import { Observable, concat, of, throwError } from "rxjs";
import { catchError, filter, map, switchMap } from "rxjs/operators";
import { SharedTaskEvent, retryOnErrorsCommandWrapper, sharedLogicTaskWrapper } from "./core";
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
export type GetBatteryStatusesTaskError = "UnknownApdu";

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
  return new Observable(subscriber => {
    return withTransport(deviceId)(({ transportRef }) =>
      quitApp(transportRef.current).pipe(
        switchMap(() => {
          const statusesObservable = statuses.map(statusType =>
            retryOnErrorsCommandWrapper({
              command: ({ transport }) =>
                getBatteryStatus({ transport, statusType }).pipe(
                  filter(
                    (
                      e,
                    ): e is {
                      type: "data";
                      batteryStatus: number | BatteryStatusFlags;
                    } => e.type === "data",
                  ),
                ),
              allowedErrors: [{ maxRetries: 3, errorClass: DisconnectedDevice }],
            })(transportRef, {}),
          );

          // Runs sequentially the wanted status queries. Waits that the current observable completes.
          return concat(...statusesObservable);
        }),
        map(value => {
          const { batteryStatus } = value;

          return { type: "data" as const, batteryStatus };
        }),
        catchError((err: Error) => {
          if (err instanceof TransportStatusError && err.statusCode === StatusCodes.UNKNOWN_APDU)
            return of<GetBatteryStatusesTaskEvent>({ type: "taskError", error: "UnknownApdu" });

          return throwError(() => err);
        }),
      ),
    ).subscribe(subscriber);
  });
}

export const getBatteryStatusTask = sharedLogicTaskWrapper(internalGetBatteryStatusesTask);

import type {
  DeviceId,
  DeviceInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";

import { quitApp } from "../commands/quitApp";

import { withDevice } from "../../hw/deviceAccess";
import { from, Observable, of } from "rxjs";
import { switchMap, catchError } from "rxjs/operators";
import { SharedTaskEvent, sharedLogicTaskWrapper } from "./core";
import manager from "../../manager";

export type GetLatestFirmwareTaskArgs = {
  deviceId: DeviceId;
  deviceInfo: DeviceInfo;
};

export type GetLatestFirmwareTaskError =
  | "FailedToRetrieveFirmwareUpdateInfo"
  | "FirmwareUpToDate";

export type GetLatestFirmwareTaskErrorEvent = {
  type: "taskError";
  error: GetLatestFirmwareTaskError;
};

export type GetLatestFirmwareTaskEvent =
  | { type: "data"; firmwareUpdateContext: FirmwareUpdateContext }
  | GetLatestFirmwareTaskErrorEvent
  | SharedTaskEvent;

function internalGetLatestFirmwareTask({
  deviceId,
  deviceInfo,
}: GetLatestFirmwareTaskArgs): Observable<GetLatestFirmwareTaskEvent> {
  return new Observable((subscriber) => {
    return withDevice(deviceId)((transport) =>
      quitApp(transport).pipe(
        switchMap(() => {
          return from(manager.getLatestFirmwareForDevice(deviceInfo));
        }),
        switchMap((firmwareUpdateContext) => {
          if (firmwareUpdateContext) {
            return of<GetLatestFirmwareTaskEvent>({
              type: "data",
              firmwareUpdateContext,
            });
          } else {
            return of<GetLatestFirmwareTaskEvent>({
              type: "taskError",
              error: "FirmwareUpToDate",
            });
          }
        }),
        catchError(() => {
          return of<GetLatestFirmwareTaskEvent>({
            type: "taskError",
            error: "FailedToRetrieveFirmwareUpdateInfo",
          });
        })
      )
    ).subscribe(subscriber);
  });
}

export const getLatestFirmwareTask = sharedLogicTaskWrapper(
  internalGetLatestFirmwareTask
);

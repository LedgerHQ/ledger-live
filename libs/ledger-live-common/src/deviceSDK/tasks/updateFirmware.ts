import { DeviceOnDashboardExpected, LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  DeviceId,
  FirmwareInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import { isDashboardName } from "../../hw/isDashboardName";
import { withDevice } from "../../hw/deviceAccess";
import { Observable, of } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { SharedTaskEvent, sharedLogicTaskWrapper } from "./core";
import { installFirmwareCommand } from "../commands/firmwareUpdate/installFirmware";
import Transport from "@ledgerhq/hw-transport";

export type UpdateFirmwareTaskArgs = {
  deviceId: DeviceId;
  updateContext: FirmwareUpdateContext;
  // TODO: check if we should receive this here or rather retrieve it from the api in the task
};

// TODO: check if there's a way to be more specific than that
// It shoould be: DeviceOnDashboardExpected
export type UpdateFirmwareTaskError = Error;

export type UpdateFirmwareTaskEvent =
  | { type: "installingOsu"; progress: number }
  | { type: "installOsuDevicePermissionRequested" }
  | { type: "allowManagerRequested" }
  | { type: "taskError"; error: UpdateFirmwareTaskError }
  | SharedTaskEvent;

function internalUpdateFirmwareTask({
  deviceId,
  updateContext,
}: UpdateFirmwareTaskArgs): Observable<UpdateFirmwareTaskEvent> {
  return new Observable((subscriber) => {
    withDevice(deviceId)((transport) =>
      getAppAndVersion(transport).pipe(
        filter(({ appAndVersion: { name } }) => {
          if (!isDashboardName(name)) {
            subscriber.next({
              type: "taskError",
              error: new DeviceOnDashboardExpected(),
            });
            return false;
            // use filter here to stop the propagation of the event
            // we can't really use throw here
            // TODO: explain why we can't use throw here
          }
          return true;
        }),
        switchMap(() => getVersion(transport)),
        switchMap((value) => {
          if (value.type === "unresponsive") {
            return of({
              type: "error" as const,
              error: new LockedDeviceError(),
            });
          }
          const { firmwareInfo } = value;
          return installOsuFirmware({ firmwareInfo, updateContext, transport });
        })
      )
    ).subscribe({
      next: (event) => {
        switch (event.type) {
          case "allowManagerRequested":
            subscriber.next(event);
            break;
          case "firmwareUpgradePermissionRequested":
            subscriber.next({ type: "installOsuDevicePermissionRequested" });
            break;
          case "progress":
            subscriber.next({
              type: "installingOsu",
              progress: event.progress,
            });
            break;
        }
      },
      error: (error) => subscriber.error(error), // subscriber.next({ type: "error", error }),
      complete: () => subscriber.complete(),
      // TODO: check if flashing mcu and bootloader are needed
      // do what has to be done to flash them
    });
  });
}

const installOsuFirmware = ({
  transport,
  updateContext,
  firmwareInfo,
}: {
  firmwareInfo: FirmwareInfo;
  updateContext: FirmwareUpdateContext;
  transport: Transport;
}) => {
  const { targetId } = firmwareInfo;
  const { osu } = updateContext;
  log("hw", "initiating osu firmware installation", { targetId, osu });
  // install OSU firmware
  return installFirmwareCommand(transport, {
    targetId,
    firmware: osu,
  });
};

export const updateFirmwareTask = sharedLogicTaskWrapper(
  internalUpdateFirmwareTask
);

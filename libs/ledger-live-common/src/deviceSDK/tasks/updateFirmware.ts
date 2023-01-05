import { DeviceOnDashboardExpected } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type { DeviceId, FirmwareUpdateContext } from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import { isDashboardName } from "../../hw/isDashboardName";
import { withDevice } from "../../hw/deviceAccess";
import { Observable } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import { GeneralTaskEvent, wrappedTask } from "./core";
import { installFirmwareCommand } from "../commands/firmwareUpdate/installFirmware";

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
  | GeneralTaskEvent;

function internalGetDeviceInfoTask({
  deviceId,
  updateContext,
}: UpdateFirmwareTaskArgs): Observable<UpdateFirmwareTaskEvent> {
  return new Observable((subscriber) => {
    withDevice(deviceId)((transport) =>
      getAppAndVersion(transport).pipe(
        filter(({ name }) => {
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
        switchMap((firmwareInfo) => {
          const { targetId } = firmwareInfo;
          const { osu } = updateContext;
          log("hw", "initiating osu firmware installation", { targetId, osu });
          // install OSU firmware
          return installFirmwareCommand(transport, { targetId, firmware: osu });
        })
        // switchMap( // TODO: possible next steps after osu got installed, or maybe that should be in the action?
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
    });
  });
}

export const getDeviceInfoTask = wrappedTask(internalGetDeviceInfoTask);

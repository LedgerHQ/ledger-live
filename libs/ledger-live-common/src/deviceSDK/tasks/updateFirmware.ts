import { LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  DeviceId,
  FinalFirmware,
  FirmwareInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";
import { getAppAndVersion } from "../commands/getAppAndVersion";

import ManagerAPI from "../../api/Manager";
import { isDashboardName } from "../../hw/isDashboardName";
import { withDevice, withDevicePolling } from "../../hw/deviceAccess";
import { EMPTY, from, Observable, of } from "rxjs";
import { concatMap, filter, map, switchMap } from "rxjs/operators";
import { SharedTaskEvent, sharedLogicTaskWrapper } from "./core";
import { installFirmwareCommand } from "../commands/firmwareUpdate/installFirmware";
import Transport from "@ledgerhq/hw-transport";
import getDeviceInfo from "../../hw/getDeviceInfo";
import { getProviderId } from "../../manager";
import {
  flashMcuCommand,
  FlashMcuCommandEvent,
} from "../commands/firmwareUpdate/flashMcu";

export type UpdateFirmwareTaskArgs = {
  deviceId: DeviceId;
  updateContext: FirmwareUpdateContext;
  // TODO: check if we should receive this here or rather retrieve it from the api in the task
};

export type UpdateFirmwareTaskError = "DeviceOnDashboardExpected";

export type UpdateFirmwareTaskEvent =
  | { type: "installingOsu"; progress: number }
  | { type: "flashingMcu"; progress: number }
  | { type: "firmwareUpdateCompleted" }
  | { type: "installOsuDevicePermissionRequested" }
  | { type: "installOsuDevicePermissionGranted" }
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
              error: "DeviceOnDashboardExpected",
            });
            return false;
            // we use filter here to stop the propagation of the event
            // we can't really use throw here cause it would complete the observable and not emit
            // any more events
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

          // TODO: we're repeating the handling of the unresponsive event here... is there a way to make this better
          // the problem that if we want to change multiple commands that may have unresponsive events
          // and only continue with the next command if the event is not unresponsive we might have to handle multiple times
          // the unresponsive event :/
          return installOsuFirmware({
            firmwareInfo,
            updateContext,
            transport,
          }).pipe(
            map((e) => {
              if (e.type === "unresponsive") {
                return {
                  type: "error" as const,
                  error: new LockedDeviceError(),
                };
              }

              return e;
            })
          );
        })
      )
    ).subscribe({
      next: (event) => {
        switch (event.type) {
          case "allowManagerRequested":
            subscriber.next(event);
            break;
          case "firmwareInstallPermissionRequested":
            subscriber.next({ type: "installOsuDevicePermissionRequested" });
            break;
          case "firmwareInstallPermissionGranted":
            subscriber.next({ type: "installOsuDevicePermissionGranted" });
            break;
          case "progress":
            subscriber.next({
              type: "installingOsu",
              progress: event.progress,
            });
            break;
          default:
            subscriber.next(event);
        }
      },
      error: (error) => {
        subscriber.next({ type: "error", error });
        subscriber.complete();
      },
      complete: () => {
        // here the user has accepted the firmware installation
        // so we have to poll the device trying to get it's deviceInfo until we have it
        // this will mean that the osu has been installed
        withDevicePolling(deviceId)(
          (transport) => from(getDeviceInfo(transport)),
          () => true
          // accept all errors. we're waiting forever condition that make getDeviceInfo work
          // since at this time the device is probably rebooting
        )
          .pipe(
            concatMap((deviceInfo) => {
              if (updateContext.shouldFlashMCU) {
                if (!deviceInfo.isBootloader) return EMPTY; // return throw error, it should be in the bootloader

                return from(retrieveMcuVersion(updateContext.final)).pipe(
                  concatMap((mcuVersion) => {
                    if (mcuVersion) {
                      return withDevice(deviceId)((transport) =>
                        flashMcuCommand(transport, {
                          targetId: deviceInfo.targetId,
                          mcuVersion,
                        })
                      );
                    }
                    return EMPTY;
                  }),
                  map<FlashMcuCommandEvent, UpdateFirmwareTaskEvent>(
                    (event) => ({
                      type: "flashingMcu",
                      progress: event.progress,
                    })
                  )
                  // TODO: find out where to put this correctly
                  // concatMap(() => {
                  //   // OSU INSTALL completed
                  //   // TODO: flash mcu and bootloader according to what's needed
                  //   return of<UpdateFirmwareTaskEvent>({
                  //     type: "firmwareUpdateCompleted",
                  //   });
                  //   //return EMPTY;
                  // })
                );
              }

              return EMPTY;
            })
          )
          .subscribe({
            next: (event) => subscriber.next(event),
            complete: () => subscriber.complete(),
            error: (error: Error) => {
              subscriber.next({ type: "error", error: error });
              subscriber.complete();
            },
          });
      },
      // TODO: check if flashing mcu and bootloader are needed
      // do what has to be done to flash them
    });
  });
}

const retrieveMcuVersion = (finalFirmware: FinalFirmware) => {
  return ManagerAPI.getMcus()
    .then((mcus) =>
      mcus.filter((deviceInfo) => {
        const provider = getProviderId(deviceInfo);
        return (mcu) => mcu.providers.includes(provider);
      })
    )
    .then((mcus) =>
      mcus.filter((mcu) => mcu.from_bootloader_version !== "none")
    )
    .then((mcus) =>
      ManagerAPI.findBestMCU(
        finalFirmware.mcu_versions
          .map((id) => mcus.find((mcu) => mcu.id === id))
          .filter(Boolean)
      )
    );
};

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

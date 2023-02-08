import { LockedDeviceError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  DeviceId,
  DeviceInfo,
  FinalFirmware,
  FirmwareInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";

import { getVersion } from "../commands/getVersion";

import ManagerAPI from "../../api/Manager";
import { withDevice, withDevicePolling } from "../../hw/deviceAccess";
import { from, Observable, of, Subscriber } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { SharedTaskEvent, sharedLogicTaskWrapper } from "./core";
import { installFirmwareCommand } from "../commands/firmwareUpdate/installFirmware";
import Transport from "@ledgerhq/hw-transport";
import getDeviceInfo from "../../hw/getDeviceInfo";
import { getProviderId } from "../../manager";
import { flashMcuOrBootloaderCommand } from "../commands/firmwareUpdate/flashMcuOrBootloader";
import { quitApp } from "../commands/quitApp";

export type UpdateFirmwareTaskArgs = {
  deviceId: DeviceId;
  updateContext: FirmwareUpdateContext;
  // TODO: check if we should receive this here or rather retrieve it from the api in the task
};

export type UpdateFirmwareTaskError =
  | "DeviceOnDashboardExpected"
  | "DeviceOnBootloaderExpected"
  | "McuVersionNotFound"
  | "TooManyMcuOrBootloaderFlashes";

export type UpdateFirmwareTaskEvent =
  | { type: "installingOsu"; progress: number }
  | { type: "flashingMcu"; progress: number }
  | { type: "flashingBootloader"; progress: number }
  | { type: "firmwareUpdateCompleted" }
  | { type: "installOsuDevicePermissionRequested" }
  | { type: "installOsuDevicePermissionGranted" }
  | { type: "allowSecureChannelRequested" }
  | { type: "taskError"; error: UpdateFirmwareTaskError }
  | SharedTaskEvent;

function internalUpdateFirmwareTask({
  deviceId,
  updateContext,
}: UpdateFirmwareTaskArgs): Observable<UpdateFirmwareTaskEvent> {
  return new Observable((subscriber) => {
    withDevice(deviceId)((transport) =>
      quitApp(transport).pipe(
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
          case "allowSecureChannelRequested":
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
        waitForDeviceInfo(deviceId).then((deviceInfo) => {
          if (!updateContext.shouldFlashMCU) {
            // if we don't need to flash the MCU then OSU install was all that was needed
            // that means that only the Secure Element firmware has been updated, the update is complete
            subscriber.next({
              type: "firmwareUpdateCompleted",
            });
            subscriber.complete();
          } else {
            // if we need to flash the MCU than we have some extra steps to do and it might mean
            // that we also need to flash the bootloader
            flashMcuOrBootloader(
              updateContext,
              deviceInfo,
              subscriber,
              deviceId
            );
          }
        });
      },
    });
  });
}

/**
 * The final MCU version that is retrieved from the API has the information on which bootloader it
 * can be installed on. Therefore if the device is in bootloader mode, but its bootloader version
 * (deviceInfo.majMin) is NOT the version for on which the MCU should be installed
 * (majMin !== mcuVersion.from_bootloader_version), this means that we should first install a new
 * bootloader version before installing the MCU. We return this information (isMcuUpdate as false)
 * and the majMin formatted version of which bootloader should be installedb (bootloaderVersion).
 * Otherwise, if the current majMin version is indeed the bootloader version on which this MCU can
 * be installed, it means that we can directly install the MCU (isMcuUpdate as true)
 * @param deviceMajMin the current majMin version present in the device
 * @param mcuFromBootloaderVersion  the bootloader on which the MCU is able to be installed
 * @returns the formatted bootloader version to be installed and if it's actually needed
 */
export function getFlashMcuOrBootloaderDetails(
  deviceMajMin: string,
  mcuFromBootloaderVersion: string
): { bootloaderVersion: string; isMcuUpdate: boolean } {
  // converts the version into the majMin format
  const bootloaderVersion = (mcuFromBootloaderVersion || "")
    .split(".")
    .slice(0, 2)
    .join(".");

  const isMcuUpdate = deviceMajMin === bootloaderVersion;

  return { bootloaderVersion, isMcuUpdate };
}

const MAX_FLASH_REPETITIONS = 5;

// recursive loop function that will continue flashing either MCU or the Bootloader, until
// the device is no longer on bootloader mode
const flashMcuOrBootloader = (
  updateContext: FirmwareUpdateContext,
  deviceInfo: DeviceInfo,
  subscriber: Subscriber<UpdateFirmwareTaskEvent>,
  deviceId: string,
  repetitions = 0
) => {
  if (!deviceInfo.isBootloader) {
    subscriber.next({
      type: "taskError",
      error: "DeviceOnBootloaderExpected",
    });
    subscriber.complete();
  }

  retrieveMcuVersion(updateContext.final).then((mcuVersion) => {
    if (mcuVersion) {
      const { bootloaderVersion, isMcuUpdate } = getFlashMcuOrBootloaderDetails(
        deviceInfo.majMin,
        mcuVersion.from_bootloader_version
      );

      withDevice(deviceId)((transport) =>
        flashMcuOrBootloaderCommand(transport, {
          targetId: deviceInfo.targetId,
          version: isMcuUpdate ? mcuVersion.name : bootloaderVersion,
          // whether this is an mcu update or a bootloader one is decided by the isMcuUpdate variable
          // we only need to use the correct version here to flash the right thing
        })
      ).subscribe({
        next: (event) =>
          subscriber.next({
            type: isMcuUpdate ? "flashingMcu" : "flashingBootloader",
            progress: event.progress,
          }),
        complete: () => {
          waitForDeviceInfo(deviceId).then((newDeviceInfo) => {
            if (newDeviceInfo.isBootloader) {
              // if we're still in the bootloader, it means that we still have things to flash

              // if we've already flashed too many times, we're probably stuck in an infinite loop
              // this should never happen, but in case it happens, it's better to warn the user
              // and track the issue rather than keep in an infinite loop
              if (repetitions > MAX_FLASH_REPETITIONS) {
                subscriber.next({
                  type: "taskError",
                  error: "TooManyMcuOrBootloaderFlashes",
                });
                subscriber.complete();
              } else {
                flashMcuOrBootloader(
                  updateContext,
                  newDeviceInfo,
                  subscriber,
                  deviceId,
                  repetitions + 1
                );
              }
            } else {
              // if we're not in the bootloader anymore, it means that the update has been completed
              subscriber.next({ type: "firmwareUpdateCompleted" });
              subscriber.complete();
            }
          });
        },
        error: (error: Error) => {
          subscriber.next({ type: "error", error: error });
          subscriber.complete();
        },
      });
    } else {
      subscriber.next({
        type: "taskError",
        error: "McuVersionNotFound",
      });
      subscriber.complete();
    }
  });
};

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

const waitForDeviceInfo = (deviceId: string) =>
  withDevicePolling(deviceId)(
    (transport) => from(getDeviceInfo(transport)),
    () => true
    // accept all errors. we're waiting forever condition that make getDeviceInfo work
    // since at this time the device is probably rebooting
  )
    // we transform this in a promise because it's only gonne emit one value an then complete
    // so it's easier to handle it with .then() instead of .pipe(concatMap())
    .toPromise();

export const updateFirmwareTask = sharedLogicTaskWrapper(
  internalUpdateFirmwareTask
);

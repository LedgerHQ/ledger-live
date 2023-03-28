import {
  CantOpenDevice,
  DisconnectedDevice,
  LockedDeviceError,
  UserRefusedFirmwareUpdate,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import type {
  DeviceId,
  FirmwareInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";

import { Observable, concat, of } from "rxjs";
import { filter, map, switchMap } from "rxjs/operators";

import { getVersion, GetVersionCmdArgs } from "../commands/getVersion";
import { installFirmwareCommand } from "../commands/firmwareUpdate/installFirmware";
import { flashMcuOrBootloaderCommand } from "../commands/firmwareUpdate/flashMcuOrBootloader";
import { quitApp } from "../commands/quitApp";

import ManagerAPI from "../../api/Manager";

import {
  SharedTaskEvent,
  sharedLogicTaskWrapper,
  retryOnErrorsCommandWrapper,
} from "./core";
import { TransportRef, withTransport } from "../transports/core";

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
  | { type: "installOsuDevicePermissionDenied" }
  | { type: "allowSecureChannelRequested" }
  | { type: "taskError"; error: UpdateFirmwareTaskError }
  | SharedTaskEvent;

// Wrapped get version command retries the command until it works, it will ignore both the disconnected
// device and unresponsive errors (usually meaning locked device), and return the info needed when
// the device is connected again and unlocked
const waitForGetVersion = retryOnErrorsCommandWrapper({
  command: ({ transport }: GetVersionCmdArgs) =>
    getVersion({ transport }).pipe(
      filter(
        (e): e is { type: "data"; firmwareInfo: FirmwareInfo } =>
          e.type === "data"
      )
    ),
  allowedErrors: [
    { maxRetries: "infinite", errorClass: DisconnectedDevice },
    { maxRetries: "infinite", errorClass: CantOpenDevice },
  ],
});

function internalUpdateFirmwareTask({
  deviceId,
  updateContext,
}: UpdateFirmwareTaskArgs): Observable<UpdateFirmwareTaskEvent> {
  return new Observable((subscriber) => {
    withTransport(deviceId)(({ transportRef }) =>
      concat(
        quitApp(transportRef.current).pipe(
          switchMap(() => waitForGetVersion(transportRef, {})),
          switchMap((value) => {
            const { firmwareInfo } = value;

            // TODO: we're repeating the handling of the unresponsive event here... is there a way to make this better
            // the problem that if we want to change multiple commands that may have unresponsive events
            // and only continue with the next command if the event is not unresponsive we might have to handle multiple times
            // the unresponsive event :/
            return installOsuFirmware({
              firmwareInfo,
              updateContext,
              transport: transportRef.current,
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
        ),
        waitForGetVersion(transportRef, {}).pipe(
          switchMap(({ firmwareInfo }) =>
            flashMcuOrBootloader(
              updateContext,
              firmwareInfo,
              transportRef,
              deviceId
            )
          )
        )
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
      complete: () => subscriber.complete(),
      error: (error) => {
        if (error instanceof UserRefusedFirmwareUpdate) {
          subscriber.next({ type: "installOsuDevicePermissionDenied" });
        } else {
          subscriber.next({ type: "error", error });
          subscriber.complete();
        }
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
  firmwareInfo: FirmwareInfo,
  transportRef: TransportRef,
  deviceId: string,
  repetitions = 0
) => {
  return new Observable<UpdateFirmwareTaskEvent>((subscriber) => {
    if (!updateContext.shouldFlashMCU) {
      // if we don't need to flash the MCU then OSU install was all that was needed
      // that means that only the Secure Element firmware has been updated, the update is complete
      subscriber.next({
        type: "firmwareUpdateCompleted",
      });
      subscriber.complete();
      return;
    }

    if (!firmwareInfo.isBootloader) {
      subscriber.next({
        type: "taskError",
        error: "DeviceOnBootloaderExpected",
      });
      subscriber.complete();
    }

    ManagerAPI.retrieveMcuVersion(updateContext.final).then((mcuVersion) => {
      if (mcuVersion) {
        const majMinRegexMatch = firmwareInfo.rawVersion.match(
          /([0-9]+.[0-9]+)(.[0-9]+)?(-(.*))?/
        );
        const [, majMin] = majMinRegexMatch ?? [];

        const { bootloaderVersion, isMcuUpdate } =
          getFlashMcuOrBootloaderDetails(
            majMin,
            mcuVersion.from_bootloader_version
          );

        flashMcuOrBootloaderCommand(transportRef.current, {
          targetId: firmwareInfo.targetId,
          version: isMcuUpdate ? mcuVersion.name : bootloaderVersion,
          // whether this is an mcu update or a bootloader one is decided by the isMcuUpdate variable
          // we only need to use the correct version here to flash the right thing
        }).subscribe({
          next: (event) =>
            subscriber.next({
              type: isMcuUpdate ? "flashingMcu" : "flashingBootloader",
              progress: event.progress,
            }),
          complete: () => {
            waitForGetVersion(transportRef, {})
              .pipe(
                switchMap(({ firmwareInfo }) => {
                  if (firmwareInfo.isBootloader) {
                    // if we're still in the bootloader, it means that we still have things to flash
                    // if we've already flashed too many times, we're probably stuck in an infinite loop
                    // this should never happen, but in case it happens, it's better to warn the user
                    // and track the issue rather than keep in an infinite loop
                    if (repetitions > MAX_FLASH_REPETITIONS) {
                      return of<UpdateFirmwareTaskEvent>({
                        type: "taskError",
                        error: "TooManyMcuOrBootloaderFlashes",
                      });
                    } else {
                      return flashMcuOrBootloader(
                        updateContext,
                        firmwareInfo,
                        transportRef,
                        deviceId,
                        repetitions + 1
                      );
                    }
                  } else {
                    // if we're not in the bootloader anymore, it means that the update has been completed
                    return of<UpdateFirmwareTaskEvent>({
                      type: "firmwareUpdateCompleted",
                    });
                  }
                })
              )
              .subscribe(subscriber);
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
  });
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

import { from, Observable } from "rxjs";
import { mergeMap, retryWhen } from "rxjs/operators";
import type { FirmwareUpdateContext, DeviceId } from "@ledgerhq/types-live";
import manager from "../manager";
import { retryWhileErrors, withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { LockedDeviceError } from "@ledgerhq/errors";

export type GetLatestAvailableFirmwareFromDeviceIdArgs = {
  deviceId: DeviceId;
};

export type GetLatestAvailableFirmwareFromDeviceIdStatus = "started" | "done";

export type GetLatestAvailableFirmwareFromDeviceIdResult = {
  firmwareUpdateContext: FirmwareUpdateContext | null;
  status: GetLatestAvailableFirmwareFromDeviceIdStatus;
  deviceIsLocked: boolean;
};

export type GetLatestAvailableFirmwareFromDeviceIdOutput =
  Observable<GetLatestAvailableFirmwareFromDeviceIdResult>;

/**
 * Get the latest available firmware for a device only from its id
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An Observable pushing objects containing:
 * - firmwareUpdateContext: a FirmwareUpdateContext if found, or null or undefined otherwise
 * - deviceIsLocked: a boolean set to true if the device is currently locked, false otherwise
 * - status: to notify the consumer on the state of the request
 */
export const getLatestAvailableFirmwareFromDeviceId = ({
  deviceId,
}: GetLatestAvailableFirmwareFromDeviceIdArgs): GetLatestAvailableFirmwareFromDeviceIdOutput => {
  return new Observable((subscriber) => {
    withDevice(deviceId)((t) =>
      from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) => {
          subscriber.next({
            firmwareUpdateContext: null,
            deviceIsLocked: false,
            status: "started",
          });
          return from(manager.getLatestFirmwareForDevice(deviceInfo));
        })
      )
    ) // Needs to retry with withDevice
      .pipe(
        retryWhen(
          retryWhileErrors((e: Error) => {
            if (e instanceof LockedDeviceError) {
              subscriber.next({
                firmwareUpdateContext: null,
                deviceIsLocked: true,
                status: "started",
              });
              return true;
            }

            return false;
          })
        )
      )
      .subscribe({
        next: (firmwareUpdateContext: FirmwareUpdateContext | null) =>
          subscriber.next({
            firmwareUpdateContext,
            status: "done",
            deviceIsLocked: false,
          }),
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      });
  });
};

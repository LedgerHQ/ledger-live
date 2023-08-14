import { forkJoin, from, Observable, of } from "rxjs";
import { mergeMap, retryWhen } from "rxjs/operators";
import type { FirmwareUpdateContext, DeviceId, DeviceInfo } from "@ledgerhq/types-live";
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
  deviceInfo: DeviceInfo | null;
  status: GetLatestAvailableFirmwareFromDeviceIdStatus;
  lockedDevice: boolean;
};

export type GetLatestAvailableFirmwareFromDeviceIdOutput =
  Observable<GetLatestAvailableFirmwareFromDeviceIdResult>;

/**
 * Deprecated: use `libs/ledger-live-common/src/deviceSDK/actions/getLatestAvailableFirmware.ts`
 *
 * Get the latest available firmware for a device only from its id
 *
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An Observable pushing objects containing:
 * - firmwareUpdateContext: a FirmwareUpdateContext if found, or null or undefined otherwise
 * - deviceInfo: a DeviceInfo if found, or null otherwise (if device locked for ex)
 * - lockedDevice: a boolean set to true if the device is currently locked, false otherwise
 * - status: to notify the consumer on the state of the request
 */
export const getLatestAvailableFirmwareFromDeviceId = ({
  deviceId,
}: GetLatestAvailableFirmwareFromDeviceIdArgs): GetLatestAvailableFirmwareFromDeviceIdOutput => {
  return new Observable(subscriber => {
    // Returns a Subscription that can be unsubscribed/cleaned
    return withDevice(deviceId)(t =>
      from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo => {
          subscriber.next({
            firmwareUpdateContext: null,
            deviceInfo,
            lockedDevice: false,
            status: "started",
          });

          return forkJoin([of(deviceInfo), from(manager.getLatestFirmwareForDevice(deviceInfo))]);
        }),
      ),
    ) // Needs to retry with withDevice
      .pipe(
        retryWhen(
          retryWhileErrors((e: Error) => {
            if (e instanceof LockedDeviceError) {
              subscriber.next({
                firmwareUpdateContext: null,
                deviceInfo: null,
                lockedDevice: true,
                status: "started",
              });
              return true;
            }

            return false;
          }),
        ),
      )
      .subscribe({
        next: ([deviceInfo, firmwareUpdateContext]: [DeviceInfo, FirmwareUpdateContext | null]) => {
          subscriber.next({
            firmwareUpdateContext,
            deviceInfo,
            status: "done",
            lockedDevice: false,
          });
        },
        error: e => subscriber.error(e),
        complete: () => subscriber.complete(),
      });
  });
};

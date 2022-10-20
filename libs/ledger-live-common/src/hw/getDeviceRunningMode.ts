import {
  TransportStatusError,
  StatusCodes,
  CantOpenDevice,
} from "@ledgerhq/errors";
import { DeviceInfo } from "@ledgerhq/types-live";
import { from, Observable, TimeoutError } from "rxjs";
import { retryWhen, timeout } from "rxjs/operators";
import { retryWhileErrors, withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";

export type CheckDeviceModeArgs = {
  deviceId: string;
  unresponsiveTimeoutMs?: number;
  cantOpenDeviceRetryLimit?: number;
};

export type GetDeviceRunningModeResult =
  | {
      type: "lockedDevice";
    }
  | {
      type: "disconnectedOrlockedDevice";
    }
  | {
      type: "mainMode";
      deviceInfo: DeviceInfo;
    }
  | {
      type: "bootloaderMode";
      deviceInfo: DeviceInfo;
    };

/**
 * Get the mode in which is device is: bootloader, main, locked device, maybe disconnected or locked device
 * It will retry on all errors from getDeviceInfo, except the ones that implies that the device is
 * disconnected (number of retry can be tweaked) or locked.
 *
 * Note: If no device is found, the current Transport implementations throw a CantOpenDevice error
 * And if the device was cold started and not yet unlocked, the current Transport implementations
 * don't see the device yet, and also throw a CantOpenDevice error.
 *
 * Does NOT handle recovery mode for now.
 * @param deviceId A device id
 * @param unresponsiveTimeoutMs Time in ms of the timeout before considering the device unresponsive
 * @param cantOpenDeviceRetryLimit Number of received CantOpenDevice errors while retrying before considering
 *   the device as maybe disconnected or cold-started-locked
 * @returns An object GetDeviceRunningModeEvent
 */
export const getDeviceRunningMode = ({
  deviceId,
  unresponsiveTimeoutMs = 5000,
  cantOpenDeviceRetryLimit = 3,
}: CheckDeviceModeArgs): Observable<GetDeviceRunningModeResult> =>
  new Observable<GetDeviceRunningModeResult>((o) => {
    let cantOpenDeviceRetryCount = 0;

    withDevice(deviceId)((transport) => from(getDeviceInfo(transport)))
      .pipe(
        timeout(unresponsiveTimeoutMs),
        retryWhen(
          retryWhileErrors((e: Error) => {
            // Does not retry on locked-device error
            if (isLockedDeviceError(e)) {
              return false;
            }

            if (e instanceof CantOpenDevice) {
              if (cantOpenDeviceRetryCount < cantOpenDeviceRetryLimit) {
                cantOpenDeviceRetryCount++;
                return true;
              }

              return false;
            }

            // Retries on any other kind of errors
            return true;
          })
        )
      )
      .subscribe({
        next: (deviceInfo: DeviceInfo) => {
          if (deviceInfo.isBootloader) {
            o.next({ type: "bootloaderMode", deviceInfo });
          } else {
            o.next({ type: "mainMode", deviceInfo });
          }
          o.complete();
        },
        error: (e: Error) => {
          if (isLockedDeviceError(e)) {
            o.next({ type: "lockedDevice" });
            o.complete();
          } else if (e instanceof CantOpenDevice) {
            o.next({ type: "disconnectedOrlockedDevice" });
            o.complete();
          } else {
            o.error(e);
          }
        },
        complete: () => o.complete(),
      });
  });

const isLockedDeviceError = (e: Error) => {
  return (
    (e &&
      e instanceof TransportStatusError &&
      // @ts-expect-error typescript not checking agains the instanceof
      e.statusCode === StatusCodes.LOCKED_DEVICE) ||
    e instanceof TimeoutError
  );
};

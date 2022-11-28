import type { SocketEvent } from "@ledgerhq/types-live";
import { from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import getDeviceInfo from "./getDeviceInfo";
import { withDevice } from "./deviceAccess";
import genuineCheck from "./genuineCheck";

export type GetGenuineCheckFromDeviceIdArgs = {
  deviceId: string;
  lockedDeviceTimeoutMs?: number;
};

export type GetGenuineCheckFromDeviceIdResult = {
  socketEvent: SocketEvent | null;
  deviceIsLocked: boolean;
};

export type GetGenuineCheckFromDeviceIdOutput =
  Observable<GetGenuineCheckFromDeviceIdResult>;

/**
 * Get a genuine check for a device only from its id
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @param lockedDeviceTimeoutMs Time of no response from device after which the device is considered locked, in ms. Default 1000ms.
 * @returns An Observable pushing objects containing:
 * - socketEvent: a SocketEvent giving the current status of the genuine check,
 *     null if the genuine check process did not reach any state yet
 * - deviceIsLocked: a boolean set to true if the device is currently locked, false otherwise
 */
export const getGenuineCheckFromDeviceId = ({
  deviceId,
  lockedDeviceTimeoutMs = 1000,
}: GetGenuineCheckFromDeviceIdArgs): GetGenuineCheckFromDeviceIdOutput => {
  return new Observable((o) => {
    // In order to know if a device is locked or not.
    // As we're not timing out inside the genuineCheckObservable flow (with rxjs timeout for ex)
    // once the device is unlock, getDeviceInfo should return the device info and
    // the flow will continue. No need to handle a retry strategy
    const lockedDeviceTimeout = setTimeout(() => {
      o.next({ socketEvent: null, deviceIsLocked: true });
    }, lockedDeviceTimeoutMs);

    // withDevice handles the unsubscribing cleaning when leaving the useEffect
    withDevice(deviceId)((t) =>
      from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) => {
          clearTimeout(lockedDeviceTimeout);
          o.next({ socketEvent: null, deviceIsLocked: false });
          return genuineCheck(t, deviceInfo);
        })
      )
    ).subscribe({
      next: (socketEvent: SocketEvent) => {
        o.next({ socketEvent, deviceIsLocked: false });
      },
      error: (e) => {
        o.error(e);
      },
    });
  });
};

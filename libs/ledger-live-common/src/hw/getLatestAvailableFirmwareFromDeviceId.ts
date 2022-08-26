import { from, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import type { FirmwareUpdateContext, DeviceId } from "@ledgerhq/types-live";
import manager from "../manager";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";

export type GetLatestAvailableFirmwareFromDeviceIdArgs = {
  deviceId: DeviceId;
};

export type GetLatestAvailableFirmwareFromDeviceIdResult = {
  firmwareUpdateContext: FirmwareUpdateContext | null | undefined;
};

export type GetLatestAvailableFirmwareFromDeviceIdOutput =
  Observable<GetLatestAvailableFirmwareFromDeviceIdResult>;

/**
 * Get the latest available firmware for a device only from its id
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An Observable pushing objects containing:
 * - firmwareUpdateContext A FirmwareUpdateContext if found, or null or undefined otherwise
 */
export const getLatestAvailableFirmwareFromDeviceId = ({
  deviceId,
}: GetLatestAvailableFirmwareFromDeviceIdArgs): GetLatestAvailableFirmwareFromDeviceIdOutput => {
  return withDevice(deviceId)((t) =>
    from(getDeviceInfo(t)).pipe(
      mergeMap((deviceInfo) =>
        from(manager.getLatestFirmwareForDevice(deviceInfo)).pipe(
          map((firmwareUpdateContext) => ({ firmwareUpdateContext }))
        )
      )
    )
  );
};

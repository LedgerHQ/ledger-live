import { useEffect, useState } from "react";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DeviceInfo, FirmwareUpdateContext } from "../../types/manager";
import manager from "../../manager";
import { DeviceId } from "../../types";
import { withDevice } from "../deviceAccess";
import getDeviceInfo from "../getDeviceInfo";

export type FirmwareUpdateGettingStatus =
  | "checking"
  | "no-available-firmware"
  | "available-firmware";

export type UseGetLatestFirmwareArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
};

export type UseGetLatestFirmwareResult = {
  latestFirmware: FirmwareUpdateContext | null;
  status: FirmwareUpdateGettingStatus;
  error: Error | null;
};

/**
 * Hook to get the latest available firmware for a device
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An object containing:
 * - latestFirmware A FirmwareUpdateContext if found, or null if still processing or no available firmware update
 * - status A FirmwareUpdateGettingStatus to notify consumer on the hook state
 * - error: any error that occurred during the process, or null
 */
export const useGetLatestFirmware = ({
  isHookEnabled = true,
  deviceId,
}: UseGetLatestFirmwareArgs): UseGetLatestFirmwareResult => {
  const [latestFirmware, setLatestFirmware] =
    useState<FirmwareUpdateContext | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FirmwareUpdateGettingStatus>("checking");

  useEffect(() => {
    if (isHookEnabled) {
      setStatus("checking");

      const latestFirmwareObservable = withDevice(deviceId)((t) =>
        from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo) =>
            from(manager.getLatestFirmwareForDevice(deviceInfo))
          )
        )
      );

      latestFirmwareObservable.subscribe({
        next: (
          firmwareUpdateContext: FirmwareUpdateContext | null | undefined
        ) => {
          if (!firmwareUpdateContext) {
            setLatestFirmware(null);
            setStatus("no-available-firmware");
          } else {
            setLatestFirmware(firmwareUpdateContext);
            setStatus("available-firmware");
          }
        },
        error: (e: any) => {
          if (e instanceof Error) {
            setError(e);
          } else {
            setError(new Error(`Unknown error: ${e}`));
          }
        },
      });
    }
  }, [deviceId, isHookEnabled]);

  return { latestFirmware, error, status };
};

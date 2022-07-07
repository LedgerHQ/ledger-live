import { useEffect, useState } from "react";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DeviceInfo, FirmwareUpdateContext } from "../../types/manager";
import manager from "../../manager";
import { DeviceId } from "../../types";
import { withDevice } from "../deviceAccess";
import getDeviceInfo from "../getDeviceInfo";

export type LatestFirmware = FirmwareUpdateContext | null;

export type UseGetLatestFirmwareArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
};

export type UseGetLatestFirmwareResult = {
  latestFirmware: LatestFirmware;
  error: Error | null;
};

/**
 * Hook to get the latest available firmware for a device
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An object containing:
 * - latestFirmware A FirmwareUpdateContext if found, or null
 * - error: any error that occurred during the process, or null
 */
export const useGetLatestFirmware = ({
  isHookEnabled = true,
  deviceId,
}: UseGetLatestFirmwareArgs): UseGetLatestFirmwareResult => {
  const [latestFirmware, setLatestFirmware] = useState<LatestFirmware>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isHookEnabled) {
      console.log(`📡 firmware update check for ${deviceId}`);
      const latestFirmwareObservable = withDevice(deviceId)((t) =>
        from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo) =>
            from(manager.getLatestFirmwareForDevice(deviceInfo))
          )
        )
      );

      latestFirmwareObservable.subscribe({
        next: (firmwareUpdateContext: LatestFirmware | undefined) => {
          // WAIT: if null, no firmware update ?
          console.log(`📡 firmware update: got a firmware context ${JSON.stringify(firmwareUpdateContext)}`);
          if (typeof firmwareUpdateContext === "undefined") {
            setLatestFirmware(null);
          } else {
            setLatestFirmware(firmwareUpdateContext);
          }
        },
        error: (e: any) => {
          console.log(`📡 firmware update: got a error ❌ ${JSON.stringify(e)}`);
          if (e instanceof Error) {
            setError(e);
          } else {
            setError(new Error(`Unknown error: ${e}`));
          }
        },
      });
    }
  }, [deviceId, isHookEnabled]);

  return { latestFirmware, error };
};

import { useEffect, useState } from "react";
import type { FirmwareUpdateContext, DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import type {
  GetLatestAvailableFirmwareFromDeviceIdArgs,
  GetLatestAvailableFirmwareFromDeviceIdResult,
  GetLatestAvailableFirmwareFromDeviceIdOutput,
} from "../getLatestAvailableFirmwareFromDeviceId";
import { getLatestAvailableFirmwareFromDeviceId as defaultGetLatestAvailableFirmwareFromDeviceId } from "../getLatestAvailableFirmwareFromDeviceId";

export type FirmwareUpdateGettingStatus =
  | "unchecked"
  | "checking"
  | "no-available-firmware"
  | "available-firmware";

export type useGetLatestAvailableFirmwareDependencies = {
  getLatestAvailableFirmwareFromDeviceId?: (
    args: GetLatestAvailableFirmwareFromDeviceIdArgs,
  ) => GetLatestAvailableFirmwareFromDeviceIdOutput;
};

export type useGetLatestAvailableFirmwareArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
};

export type useGetLatestAvailableFirmwareResult = {
  latestFirmware: FirmwareUpdateContext | null;
  deviceInfo: DeviceInfo | null;
  status: FirmwareUpdateGettingStatus;
  lockedDevice: boolean;
  error: Error | null;
};

/**
 * Deprecated: use `libs/ledger-live-common/src/deviceSDK/hooks/useGetLatestAvailableFirmware.ts`
 *
 * Hook to get the latest available firmware for a device
 *
 * @param getLatestAvailableFirmwareFromDeviceId An optional function to get the latest available firmware
 * for a given device id, by default set to live-common/hw/getLatestAvailableFirmwareFromDeviceId.
 * This dependency injection is needed for LLD to have the hook working on the internal thread
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An object containing:
 * - latestFirmware: A FirmwareUpdateContext if found, or null if still processing or no available firmware update
 * - deviceInfo: a DeviceInfo if found, or null otherwise (if device locked for ex)
 * - status: A FirmwareUpdateGettingStatus to notify consumer on the hook state
 * - lockedDevice: a boolean set to true if the device is currently locked, false otherwise
 * - error: any error that occurred during the process, or null
 */
export const useGetLatestAvailableFirmware = ({
  getLatestAvailableFirmwareFromDeviceId = defaultGetLatestAvailableFirmwareFromDeviceId,
  isHookEnabled = true,
  deviceId,
}: useGetLatestAvailableFirmwareArgs &
  useGetLatestAvailableFirmwareDependencies): useGetLatestAvailableFirmwareResult => {
  const [latestFirmware, setLatestFirmware] = useState<FirmwareUpdateContext | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FirmwareUpdateGettingStatus>("unchecked");
  const [lockedDevice, setLockedDevice] = useState<boolean>(false);

  useEffect(() => {
    if (!isHookEnabled) {
      return;
    }
    setStatus("checking");

    const sub = getLatestAvailableFirmwareFromDeviceId({ deviceId }).subscribe({
      next: ({
        firmwareUpdateContext,
        deviceInfo,
        lockedDevice,
        status: getStatus,
      }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
        // A boolean, this will not trigger a rendering if the value is the same
        setLockedDevice(lockedDevice);
        setDeviceInfo(deviceInfo);

        if (getStatus === "done") {
          if (!firmwareUpdateContext) {
            setLatestFirmware(null);
            setStatus("no-available-firmware");
          } else {
            setLatestFirmware(firmwareUpdateContext);
            setStatus("available-firmware");
          }
        }
      },
      error: (e: unknown) => {
        if (e instanceof Error) {
          setError(e);
        } else {
          setError(new Error(`Unknown error: ${e}`));
        }
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [deviceId, getLatestAvailableFirmwareFromDeviceId, isHookEnabled]);

  return { latestFirmware, deviceInfo, error, status, lockedDevice };
};

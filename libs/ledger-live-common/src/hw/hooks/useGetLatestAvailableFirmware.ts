import { useEffect, useState } from "react";
import type { FirmwareUpdateContext, DeviceId } from "@ledgerhq/types-live";
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
    args: GetLatestAvailableFirmwareFromDeviceIdArgs
  ) => GetLatestAvailableFirmwareFromDeviceIdOutput;
};

export type useGetLatestAvailableFirmwareArgs = {
  isHookEnabled?: boolean;
  deviceId: DeviceId;
};

export type useGetLatestAvailableFirmwareResult = {
  latestFirmware: FirmwareUpdateContext | null;
  status: FirmwareUpdateGettingStatus;
  error: Error | null;
};

/**
 * Hook to get the latest available firmware for a device
 * @param getLatestAvailableFirmwareFromDeviceId An optional function to get the latest available firmware
 * for a given device id, by default set to live-common/hw/getLatestAvailableFirmwareFromDeviceId.
 * This dependency injection is needed for LLD to have the hook working on the internal thread
 * @param isHookEnabled A boolean to enable (true, default value) or disable (false) the hook
 * @param deviceId A device id, or an empty string if device is usb plugged
 * @returns An object containing:
 * - latestFirmware A FirmwareUpdateContext if found, or null if still processing or no available firmware update
 * - status A FirmwareUpdateGettingStatus to notify consumer on the hook state
 * - error: any error that occurred during the process, or null
 */
export const useGetLatestAvailableFirmware = ({
  getLatestAvailableFirmwareFromDeviceId = defaultGetLatestAvailableFirmwareFromDeviceId,
  isHookEnabled = true,
  deviceId,
}: useGetLatestAvailableFirmwareArgs &
  useGetLatestAvailableFirmwareDependencies): useGetLatestAvailableFirmwareResult => {
  const [latestFirmware, setLatestFirmware] =
    useState<FirmwareUpdateContext | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] =
    useState<FirmwareUpdateGettingStatus>("unchecked");

  useEffect(() => {
    if (!isHookEnabled) {
      return;
    }
    setStatus("checking");

    const sub = getLatestAvailableFirmwareFromDeviceId({ deviceId }).subscribe({
      next: ({
        firmwareUpdateContext,
      }: GetLatestAvailableFirmwareFromDeviceIdResult) => {
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

    return () => {
      sub.unsubscribe();
    };
  }, [deviceId, getLatestAvailableFirmwareFromDeviceId, isHookEnabled]);

  return { latestFirmware, error, status };
};

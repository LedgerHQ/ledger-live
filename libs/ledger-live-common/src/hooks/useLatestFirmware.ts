import { useEffect, useState } from "react";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import fetchLatestFirmwareUseCase from "../device/use-cases/fetchLatestFirmwareUseCase";

export const useLatestFirmware: (
  _?: DeviceInfo | null,
) => FirmwareUpdateContext | null = deviceInfo => {
  const [latestFirmware, setLatestFirmware] = useState<FirmwareUpdateContext | null>(null);

  useEffect(() => {
    const getLatestFirmwareForDevice = async () => {
      if (deviceInfo) {
        const fw = await fetchLatestFirmwareUseCase(deviceInfo);
        setLatestFirmware(fw);
      }
    };

    getLatestFirmwareForDevice();
    // TODO: no cleanup action in this useEffect
  }, [deviceInfo, setLatestFirmware]);

  return latestFirmware;
};

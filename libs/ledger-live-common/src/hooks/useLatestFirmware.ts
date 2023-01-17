import { useEffect, useState } from "react";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import manager from "../manager/index";

const useLatestFirmware: (
  _?: DeviceInfo | null
) => FirmwareUpdateContext | null = (deviceInfo) => {
  const [latestFirmware, setLatestFirmware] =
    useState<FirmwareUpdateContext | null>(null);

  useEffect(() => {
    const getLatestFirmwareForDevice = async () => {
      if (deviceInfo) {
        const fw = await manager.getLatestFirmwareForDevice(deviceInfo);
        setLatestFirmware(fw);
      }
    };

    getLatestFirmwareForDevice();
  }, [deviceInfo, setLatestFirmware]);

  return latestFirmware;
};

export default useLatestFirmware;

import { useEffect, useState } from "react";
import {
  DeviceInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/live-common/types/manager";
import manager from "@ledgerhq/live-common/manager/index";

const useLatestFirmware: (
  deviceInfo?: DeviceInfo,
) => FirmwareUpdateContext | null | undefined = deviceInfo => {
  const [latestFirmware, setLatestFirmware] = useState<
    FirmwareUpdateContext | null | undefined
  >(null);

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

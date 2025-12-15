import { useEffect, useState } from "react";
import { getLatestFirmwareForDevice, FirmwareUpdateContextEntity } from "@ledgerhq/device-core";

import { UseGetLatestFirmwareForDeviceOptions } from "../types";

export function useGetLatestFirmware({
  deviceInfo,
  providerId,
  firmwareSalt,
  managerApiRepository,
}: UseGetLatestFirmwareForDeviceOptions): FirmwareUpdateContextEntity | null {
  const [firmware, setFirmware] = useState<FirmwareUpdateContextEntity | null>(null);
  useEffect(() => {
    let unmounted = false;
    if (deviceInfo) {
      getLatestFirmwareForDevice({
        deviceInfo,
        providerId,
        firmwareSalt,
        managerApiRepository,
      }).then((latestFirmware: FirmwareUpdateContextEntity | null) => {
        if (unmounted) {
          return;
        }
        setFirmware(latestFirmware);
      });
    }
    return () => {
      unmounted = true;
    };
  }, [deviceInfo, managerApiRepository, providerId, setFirmware, firmwareSalt]);
  return firmware;
}

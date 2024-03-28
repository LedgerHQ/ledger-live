import { useEffect, useState } from "react";
import { getLatestFirmwareForDevice, FirmwareUpdateContextEntity } from "@ledgerhq/device-core";

import { UseGetLatestFirmwareForDeviceOptions } from "../types";

export function useGetLatestFirmware({
  deviceInfo,
  providerId,
  userId,
  managerApiRepository,
}: UseGetLatestFirmwareForDeviceOptions): FirmwareUpdateContextEntity | null {
  const [firmware, setFirmware] = useState<FirmwareUpdateContextEntity | null>(null);
  useEffect(() => {
    let unmounted = false;
    if (deviceInfo) {
      getLatestFirmwareForDevice({
        deviceInfo,
        providerId,
        userId,
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
  }, [deviceInfo, managerApiRepository, providerId, setFirmware, userId]);
  return firmware;
}

import { useEffect, useState } from "react";
import {
  HttpManagerApiRepository,
  getLatestFirmwareForDevice,
  DeviceInfoEntity,
  FirmwareUpdateContextEntity,
} from "@ledgerhq/live-device-core";

type UseGetLatestFirmwareForDeviceParams = {
  deviceInfo?: DeviceInfoEntity | null;
  providerId: number;
  userId: string;
  managerApiRepository: HttpManagerApiRepository;
};

export const useGetLatestFirmware: (
  params: UseGetLatestFirmwareForDeviceParams,
) => FirmwareUpdateContextEntity | null = ({
  deviceInfo,
  providerId,
  userId,
  managerApiRepository,
}) => {
  const [latestFirmware, setLatestFirmware] = useState<FirmwareUpdateContextEntity | null>(null);

  useEffect(() => {
    let unmounted = false;
    if (deviceInfo) {
      getLatestFirmwareForDevice({
        deviceInfo,
        providerId,
        userId,
        managerApiRepository,
      }).then(latestFirmware => {
        if (unmounted) return;
        setLatestFirmware(latestFirmware);
      });
    }
    return () => {
      unmounted = true;
    };
  }, [deviceInfo, managerApiRepository, providerId, setLatestFirmware, userId]);

  return latestFirmware;
};

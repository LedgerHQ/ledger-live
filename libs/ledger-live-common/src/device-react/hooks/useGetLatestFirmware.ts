import { useEffect, useState } from "react";
import { DeviceInfoEntity } from "../../device-core/managerApi/entities/DeviceInfoEntity";
import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { getLatestFirmwareForDevice } from "../../device-core/managerApi/use-cases/getLatestFirmwareForDevice";
import { FirmwareUpdateContextEntity } from "../../device-core/managerApi/entities/FirmwareUpdateContextEntity";

type UseGetLatestFirmwareForDeviceParams = {
  deviceInfo?: DeviceInfoEntity | null;
  providerId: number;
  userId: string;
  managerApiRepository: ManagerApiRepository;
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

import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";
import { ManagerApiHttpRepository } from "../../device-core/repositories/ManagerApiRepository";
import { useGetLatestFirmware } from "../../device-react/useGetLatestFirmware";
import { DeviceInfoEntity } from "../../device-core/entities/DeviceInfoEntity";

export function useLatestFirmware(
  deviceInfo?: DeviceInfoEntity | null,
  managerApiRepository: ManagerApiHttpRepository = new ManagerApiHttpRepository(
    getEnv("MANAGER_API_BASE"),
    version,
  ),
) {
  return useGetLatestFirmware({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    userId: getEnv("USER_ID"),
    managerApiRepository,
  });
}

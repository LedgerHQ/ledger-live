import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";
import { HttpManagerApiRepository } from "../../device-core/managerApi/repositories/HttpManagerApiRepository";
import { useGetLatestFirmware } from "../../device-react/hooks/useGetLatestFirmware";
import { DeviceInfoEntity } from "../../device-core/managerApi/entities/DeviceInfoEntity";

export function useLatestFirmware(
  deviceInfo?: DeviceInfoEntity | null,
  managerApiRepository: HttpManagerApiRepository = new HttpManagerApiRepository(
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

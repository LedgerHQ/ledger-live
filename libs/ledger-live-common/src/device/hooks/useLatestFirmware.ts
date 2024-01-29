import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepository } from "../../device-core/managerApi/repositories/HttpManagerApiRepository";
import { useGetLatestFirmware } from "../../device-react/hooks/useGetLatestFirmware";
import { DeviceInfoEntity } from "../../device-core/managerApi/entities/DeviceInfoEntity";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

export function useLatestFirmware(
  deviceInfo?: DeviceInfoEntity | null,
  managerApiRepository: HttpManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return useGetLatestFirmware({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    userId: getEnv("USER_ID"),
    managerApiRepository,
  });
}

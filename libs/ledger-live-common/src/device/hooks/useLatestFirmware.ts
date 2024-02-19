import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/live-device-core";
import { useGetLatestFirmware } from "@ledgerhq/live-device-react";

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

import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { useGetLatestFirmware } from "@ledgerhq/device-react";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/device-core";

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

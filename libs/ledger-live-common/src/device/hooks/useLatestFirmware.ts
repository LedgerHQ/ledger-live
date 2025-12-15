import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { useGetLatestFirmware } from "@ledgerhq/device-react";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/device-core";

export function useLatestFirmware(
  deviceInfo?: DeviceInfoEntity | null,
  managerApiRepository: HttpManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
  firmwareSalt?: string,
) {
  return useGetLatestFirmware({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    firmwareSalt: firmwareSalt ?? getEnv("FIRMWARE_SALT") ?? "",
    managerApiRepository,
  });
}

import { getProviderId } from "../../manager/index";
import { useGetLatestFirmware } from "@ledgerhq/device-react";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/device-core";
import type { UserId } from "@ledgerhq/identities";

export function useLatestFirmware(
  deviceInfo: DeviceInfoEntity | null | undefined,
  userId: UserId,
  managerApiRepository: HttpManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return useGetLatestFirmware({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    userId: userId.exportUserIdForFirmwareSalt(),
    managerApiRepository,
  });
}

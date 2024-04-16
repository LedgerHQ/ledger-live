// From libs/ledger-live-common/src/manager/api.ts
import { DeviceInfo } from "@ledgerhq/types-live";
import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { type ManagerApiRepository, getLatestFirmwareForDevice } from "@ledgerhq/device-core";

export type { FirmwareInfoEntity, FirmwareUpdateContextEntity } from "@ledgerhq/device-core";
export function getLatestFirmwareForDeviceUseCase(
  deviceInfo: DeviceInfo,
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
) {
  return getLatestFirmwareForDevice({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    userId: getEnv("USER_ID"),
    managerApiRepository,
  });
}

// From libs/ledger-live-common/src/manager/api.ts
import { DeviceInfo } from "@ledgerhq/types-live";
import { getProviderId } from "../../manager/index";
import { getLatestFirmwareForDevice } from "../../device-core/managerApi/use-cases/getLatestFirmwareForDevice";
import { getEnv } from "@ledgerhq/live-env";
import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";

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

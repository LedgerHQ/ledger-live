// From libs/ledger-live-common/src/manager/api.ts
import { getProviderId } from "../../manager/index";
import { getEnv } from "@ledgerhq/live-env";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import {
  DeviceInfo,
  ManagerApiRepository,
  getLatestFirmwareForDevice,
} from "@ledgerhq/live-device-core";

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

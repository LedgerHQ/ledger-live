// From libs/ledger-live-common/src/manager/api.ts
import { DeviceInfo } from "@ledgerhq/types-live";
import { getProviderId } from "../../manager/index";
import getLatestFirmwareForDevice from "../../device-core/use-cases/getLatestFirmwareForDevice";
import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";
import { ManagerApiRepository } from "../../device-core/repositories/ManagerApiRepository";

export default function fetchLatestFirmwareUseCase(deviceInfo: DeviceInfo) {
  const managerApiRepository = new ManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
  return getLatestFirmwareForDevice({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    userId: getEnv("USER_ID"),
    managerApiRepository,
  });
}

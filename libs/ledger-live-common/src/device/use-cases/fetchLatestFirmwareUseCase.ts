// From libs/ledger-live-common/src/manager/api.ts
import { DeviceInfo } from "@ledgerhq/types-live";
import { getProviderId } from "../../manager/index";
import getLatestFirmwareForDevice from "../../device-core/use-cases/getLatestFirmwareForDevice";
import { getEnv } from "@ledgerhq/live-env";
import { version } from "../../../package.json";

export default function fetchLatestFirmwareUseCase(deviceInfo: DeviceInfo) {
  return getLatestFirmwareForDevice({
    deviceInfo,
    providerId: getProviderId(deviceInfo),
    managerApiBase: getEnv("MANAGER_API_BASE"),
    liveCommonVersion: version,
  });
}

import { version } from "../../../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { fetchLatestFirmware } from "../../../device-core/use-cases/managerApi/fetchLatestFirmware";
import { Id } from "@ledgerhq/types-live";

export type FetchLatestFirmwareUseCaseParams = {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
};

/**
 * TODO: not used anywhere in the codebase. Only used in `libs/ledger-live-common/src/device-core/use-cases/getLatestFirmwareForDevice.ts`
 */
export default function fetchLatestFirmwareUseCase({
  current_se_firmware_final_version,
  device_version,
  provider,
}: FetchLatestFirmwareUseCaseParams) {
  return fetchLatestFirmware({
    current_se_firmware_final_version,
    device_version,
    providerId: provider,
    managerApiBase: getEnv("MANAGER_API_BASE"),
    userId: getEnv("USER_ID"),
    liveCommonVersion: version,
  });
}

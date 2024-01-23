import { getEnv } from "@ledgerhq/live-env";
import { Id } from "@ledgerhq/types-live";
import { version } from "../../../../package.json";
import { HttpManagerApiRepository } from "../../../device-core/repositories/HttpManagerApiRepository";

export type FetchLatestFirmwareUseCaseParams = {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
  managerApiRepository: HttpManagerApiRepository
};

export default function fetchLatestFirmwareUseCase(
  { current_se_firmware_final_version, device_version, provider }: FetchLatestFirmwareUseCaseParams,
  managerApiRepository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version),
) {
  return managerApiRepository.fetchLatestFirmware({
    current_se_firmware_final_version,
    device_version,
    providerId: provider,
    userId: getEnv("USER_ID"),
  });
}

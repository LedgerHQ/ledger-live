import { getEnv } from "@ledgerhq/live-env";
import { Id } from "@ledgerhq/types-live";
import { version } from "../../../../package.json";
import { HttpManagerApiRepository } from "../../../device-core/managerApi/repositories/HttpManagerApiRepository";
import { fetchLatestFirmware } from "../../../device-core/managerApi/use-cases/fetchLatestFirmware";

export type FetchLatestFirmwareUseCaseParams = {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
  managerApiRepository: HttpManagerApiRepository;
};

export default function fetchLatestFirmwareUseCase({
  current_se_firmware_final_version,
  device_version,
  provider,
  managerApiRepository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version),
}: FetchLatestFirmwareUseCaseParams) {
  return fetchLatestFirmware({
    current_se_firmware_final_version,
    device_version,
    provider,
    userId: getEnv("USER_ID"),
    managerApiRepository,
  });
}

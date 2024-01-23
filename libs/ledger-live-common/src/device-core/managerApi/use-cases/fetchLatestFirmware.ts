import { Id } from "@ledgerhq/types-live";
import { HttpManagerApiRepository } from "../repositories/HttpManagerApiRepository";

export type FetchLatestFirmwareParams = {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
  userId: string;
  managerApiRepository: HttpManagerApiRepository;
};

export function fetchLatestFirmware({
  current_se_firmware_final_version,
  device_version,
  provider,
  userId,
  managerApiRepository,
}: FetchLatestFirmwareParams) {
  return managerApiRepository.fetchLatestFirmware({
    current_se_firmware_final_version,
    device_version,
    providerId: provider,
    userId,
  });
}

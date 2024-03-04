import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/device-core";

export type UseGetLatestFirmwareForDeviceOptions = {
  deviceInfo?: DeviceInfoEntity | null;
  providerId: number;
  userId: string;
  managerApiRepository: HttpManagerApiRepository;
};

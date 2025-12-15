import { DeviceInfoEntity, HttpManagerApiRepository } from "@ledgerhq/device-core";

export type UseGetLatestFirmwareForDeviceOptions = {
  deviceInfo?: DeviceInfoEntity | null;
  providerId: number;
  firmwareSalt: string;
  managerApiRepository: HttpManagerApiRepository;
};

import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { IdEntity } from "../entities/IdEntity";

export interface ManagerApiRepository {
  fetchLatestFirmware(params: {
    current_se_firmware_final_version: IdEntity;
    device_version: IdEntity;
    providerId: number;
    userId: string;
  }): Promise<OsuFirmware | null | undefined>;

  fetchMcus(): Promise<any>;

  getDeviceVersion({
    targetId,
    providerId,
  }: {
    targetId: string | number;
    providerId: number;
  }): Promise<DeviceVersionEntity>;

  getCurrentOSU(params: {
    deviceId: string | number;
    providerId: string | number;
    version: string;
  }): Promise<OsuFirmware>;

  getCurrentFirmware(params: {
    version: string;
    deviceId: string | number;
    providerId: number;
  }): Promise<FinalFirmware>;

  getFinalFirmwareById(id: number): Promise<FinalFirmware>;
}

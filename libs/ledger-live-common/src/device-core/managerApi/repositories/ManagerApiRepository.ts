import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { Id } from "../entities/Id";

export interface ManagerApiRepository {
  fetchLatestFirmware(params: {
    current_se_firmware_final_version: Id;
    device_version: Id;
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

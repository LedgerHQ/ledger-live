// To refactor: use own entities
import { DeviceVersion, FinalFirmware, Id, OsuFirmware } from "@ledgerhq/types-live";

// Used to name interfaces like this "Port"
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
  }): Promise<DeviceVersion>;

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

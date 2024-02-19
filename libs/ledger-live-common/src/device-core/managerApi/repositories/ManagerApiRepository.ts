import { ApplicationV2Entity } from "../entities/AppEntity";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { Id } from "../entities/Id";
import { LanguagePackageEntity } from "../entities/LanguagePackageEntity";

export interface ManagerApiRepository {
  fetchLatestFirmware(params: {
    current_se_firmware_final_version: Id;
    device_version: Id;
    providerId: number;
    userId: string;
  }): Promise<OsuFirmware | null | undefined>;

  fetchMcus(): Promise<any>; // TODO: type properly

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

  /**
   * Resolve applications details by hashes.
   * Order of outputs matches order of inputs.
   * If an application version is not found, a null is returned instead.
   * If several versions match the same hash, only the latest one is returned.
   *
   * Given an array of hashes that we can obtain by either listInstalledApps in this same
   * API (a websocket connection to a scriptrunner) or via direct apdus using hw/listApps.ts
   * retrieve all the information needed from the backend for those applications.
   */
  getAppsByHash(hashes: string[]): Promise<Array<ApplicationV2Entity | null>>;

  /**
   * Return a list of App that are available for a given firmware version on a provider.
   * Prevents the call to ManagerAPI.listApps which includes all versions of all apps and
   * was causing slower access to the manager.
   */
  catalogForDevice: (params: {
    provider: number;
    targetId: number | string;
    firmwareVersion: string;
  }) => Promise<Array<ApplicationV2Entity>>;

  getLanguagePackagesForDevice: (
    deviceInfo: DeviceInfoEntity,
    forceProvider?: number,
  ) => Promise<LanguagePackageEntity[]>;
}

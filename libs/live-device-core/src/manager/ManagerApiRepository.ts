import {
  ApplicationV2Entity,
  CatalogForDeviceOptions,
  DeviceInfoEntity,
  DeviceVersionEntity,
  FetchLatestFirmwareOptions,
  FinalFirmware,
  GetCurrentFirmwareOptions,
  GetCurrentOsuOptions,
  GetDeviceVersionOptions,
  LanguagePackageEntity,
  McuVersion,
  OsuFirmware,
} from "../types";

export interface ManagerApiRepository {
  /**
   * Return a list of App that are available for a given firmware version on a provider.
   * Prevents the call to ManagerAPI.listApps which includes all versions of all apps and
   * was causing slower access to the manager.
   */
  catalogForDevice(options: CatalogForDeviceOptions): Promise<ApplicationV2Entity[]>;

  fetchLatestFirmware(options: FetchLatestFirmwareOptions): Promise<OsuFirmware | null | undefined>;

  fetchMcus(): Promise<McuVersion[]>;

  getDeviceVersion(options: GetDeviceVersionOptions): Promise<DeviceVersionEntity>;

  getCurrentOsu(options: GetCurrentOsuOptions): Promise<OsuFirmware>;

  getCurrentFirmware(options: GetCurrentFirmwareOptions): Promise<FinalFirmware>;

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
  getAppsByHash(hashes: string[]): Promise<(ApplicationV2Entity | null)[]>;

  getLanguagePackagesForDevice(
    deviceInfo: DeviceInfoEntity,
    forceProvider?: number,
  ): Promise<LanguagePackageEntity[]>;
}

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
  catalogForDevice(options: CatalogForDeviceOptions): Promise<ApplicationV2Entity[]>;
  fetchLatestFirmware(options: FetchLatestFirmwareOptions): Promise<OsuFirmware | null | undefined>;
  fetchMcus(): Promise<McuVersion[]>;
  getDeviceVersion(options: GetDeviceVersionOptions): Promise<DeviceVersionEntity>;
  getCurrentOsu(options: GetCurrentOsuOptions): Promise<OsuFirmware>;
  getCurrentFirmware(options: GetCurrentFirmwareOptions): Promise<FinalFirmware>;
  getFinalFirmwareById(id: number): Promise<FinalFirmware>;
  getAppsByHash(hashes: string[]): Promise<(ApplicationV2Entity | null)[]>;
  getLanguagePackagesForDevice(
    deviceInfo: DeviceInfoEntity,
    forceProvider?: number,
  ): Promise<LanguagePackageEntity[]>;
}

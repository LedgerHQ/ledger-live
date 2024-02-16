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
  OsuFirmware,
} from "../types";

export interface ManagerApiRepository {
  catalogForDevice(args: CatalogForDeviceOptions): Promise<ApplicationV2Entity[]>;
  fetchLatestFirmware(args: FetchLatestFirmwareOptions): Promise<OsuFirmware | null | undefined>;
  fetchMcus(): Promise<{ name: string; id: number }[]>;
  getDeviceVersion(args: GetDeviceVersionOptions): Promise<DeviceVersionEntity>;
  getCurrentOsu(args: GetCurrentOsuOptions): Promise<OsuFirmware>;
  getCurrentFirmware(args: GetCurrentFirmwareOptions): Promise<FinalFirmware>;
  getFinalFirmwareById(id: number): Promise<FinalFirmware>;
  getAppsByHash(hashes: string[]): Promise<(ApplicationV2Entity | null)[]>;
  getLanguagePackagesForDevice(
    deviceInfo: DeviceInfoEntity,
    forceProvider?: number,
  ): Promise<LanguagePackageEntity[]>;
}

// src/managerApi/
export type { DeviceInfoEntity } from "./managerApi/entities/DeviceInfoEntity";
export type {
  FinalFirmware,
  OsuFirmware,
  FirmwareUpdateContextEntity,
} from "./managerApi/entities/FirmwareUpdateContextEntity";
export type { ReinstallConfigArgs } from "./commands/entities/ReinstallConfigEntity";
export type { ManagerApiRepository } from "./managerApi/repositories/ManagerApiRepository";
export { HttpManagerApiRepository } from "./managerApi/repositories/HttpManagerApiRepository";
export { StubManagerApiRepository } from "./managerApi/repositories/StubManagerApiRepository";
export { getLatestFirmwareForDevice } from "./managerApi/use-cases/getLatestFirmwareForDevice";
export { isDeviceLocalizationSupported } from "./commands/use-cases/isDeviceLocalizationSupported";
export { PROVIDERS, getProviderIdUseCase } from "./managerApi/use-cases/getProviderIdUseCase";
export { fetchMcus } from "./managerApi/use-cases/fetchMcus";
export { aDeviceInfoBuilder } from "./managerApi/entities/mocks/aDeviceInfo";
export { getAppsCatalogForDevice } from "./managerApi/use-cases/getAppsCatalogForDevice";
// src/commands/
export type { FirmwareInfoEntity } from "./commands/entities/FirmwareInfoEntity";
export { GET_VERSION_APDU } from "./commands/use-cases/getVersion";
export { parseGetVersionResponse } from "./commands/use-cases/parseGetVersionResponse";
export { getDeviceName } from "./commands/use-cases/getDeviceName";
export { isHardwareVersionSupported } from "./commands/use-cases/isHardwareVersionSupported";
export { isBootloaderVersionSupported } from "./commands/use-cases/isBootloaderVersionSupported";
export { getVersion } from "./commands/use-cases/getVersion";
export { type AppStorageInfo, isAppStorageInfo } from "./commands/entities/AppStorageInfo";
export { backupAppStorage } from "./commands/use-cases/app-backup/backupAppStorage";
export { getAppStorageInfo } from "./commands/use-cases/app-backup/getAppStorageInfo";
export { restoreAppStorage } from "./commands/use-cases/app-backup/restoreAppStorage";
export { restoreAppStorageCommit } from "./commands/use-cases/app-backup/restoreAppStorageCommit";
export { restoreAppStorageInit } from "./commands/use-cases/app-backup/restoreAppStorageInit";
// src/capabilities/
export {
  type CLSSupportedDeviceModelId,
  isCustomLockScreenSupported,
} from "./capabilities/isCustomLockScreenSupported";
export { isEditDeviceNameSupported } from "./capabilities/isEditDeviceNameSupported";
export { isSyncOnboardingSupported } from "./capabilities/isSyncOnboardingSupported";
export { supportedDeviceModelIds } from "./capabilities/isCustomLockScreenSupported";
// src/customLockScreen/
export * from "./customLockScreen/screenSpecs";
// src/firmwareUpdate/
export { shouldForceFirmwareUpdate } from "./firmwareUpdate/shouldForceFirmwareUpdate";
// errors
export * from "./errors";
// src/commands/consent/
export { reinstallConfigurationConsent } from "./commands/use-cases/consent/reinstallConfigurationConsent";

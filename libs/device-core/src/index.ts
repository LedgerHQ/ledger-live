// src/managerApi/
export type { DeviceInfoEntity } from "./managerApi/entities/DeviceInfoEntity";
export type {
  FinalFirmware,
  OsuFirmware,
  FirmwareUpdateContextEntity,
} from "./managerApi/entities/FirmwareUpdateContextEntity";
export type { ManagerApiRepository } from "./managerApi/repositories/ManagerApiRepository";
export { HttpManagerApiRepository } from "./managerApi/repositories/HttpManagerApiRepository";
export { StubManagerApiRepository } from "./managerApi/repositories/StubManagerApiRepository";
export { getLatestFirmwareForDevice } from "./managerApi/use-cases/getLatestFirmwareForDevice";
export { isDeviceLocalizationSupported } from "./commands/use-cases/isDeviceLocalizationSupported";
export { PROVIDERS, getProviderIdUseCase } from "./managerApi/use-cases/getProviderIdUseCase";
export { fetchMcus } from "./managerApi/use-cases/fetchMcus";
export { aDeviceInfoBuilder } from "./managerApi/entities/mocks/aDeviceInfo";
// src/commands/
export type { FirmwareInfoEntity } from "./commands/entities/FirmwareInfoEntity";
export { GET_VERSION_APDU } from "./commands/use-cases/getVersion";
export { parseGetVersionResponse } from "./commands/use-cases/parseGetVersionResponse";
export { getDeviceName } from "./commands/use-cases/getDeviceName";
export { isHardwareVersionSupported } from "./commands/use-cases/isHardwareVersionSupported";
export { isBootloaderVersionSupported } from "./commands/use-cases/isBootloaderVersionSupported";
export { getVersion } from "./commands/use-cases/getVersion";
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

type Language = "french" | "english" | "spanish";

enum AppType {
  app = "app", // NB Legacy from v1, drop after we default to v2.
  currency = "currency",
  plugin = "plugin",
  tool = "tool",
  swap = "swap",
}

export type FetchLatestFirmwareOptions = {
  current_se_firmware_final_version: number;
  device_version: number;
  providerId: number;
  userId: string;
};

export type GetDeviceVersionOptions = { targetId: string | number; providerId: number };

export type GetCurrentOsuOptions = {
  deviceId: string | number;
  providerId: string | number;
  version: string;
};

export type GetCurrentFirmwareOptions = {
  version: string;
  deviceId: string | number;
  providerId: number;
};

export type CatalogForDeviceOptions = {
  provider: number;
  targetId: number | string;
  firmwareVersion: string;
};

export type ResponseErrorType = { status?: number; response?: { status: number } };

export type GetProviderIdUseCaseOptions = {
  deviceInfo: DeviceInfoEntity | undefined | null;
  forceProvider?: number;
};

/** App is higher level on top of Application and ApplicationVersion
with all fields Live needs and in normalized form (but still serializable) */
export type AppEntity = {
  id: number;
  name: string;
  displayName: string;
  version: string;
  currencyId: string | null | undefined;
  description: string | null | undefined;
  dateModified: string;
  icon: string;
  authorName: string | null | undefined;
  supportURL: string | null | undefined;
  contactURL: string | null | undefined;
  sourceURL: string | null | undefined;
  hash: string;
  perso: string;
  firmware: string;
  firmware_key: string;
  delete: string;
  delete_key: string; // we use names to identify an app
  dependencies: string[];
  bytes: number | null | undefined;
  warning: string | null | undefined;
  // -1 if coin not in marketcap, otherwise index in the tickers list of https://countervalues.api.live.ledger.com/tickers
  indexOfMarketCap: number;
  isDevTools: boolean;
  type: AppType;
};

export type ApplicationV2Entity = {
  versionId: number;
  versionName: string;
  versionDisplayName: string;
  version: string;
  currencyId: string;
  description: string;
  applicationType: AppType;
  dateModified: string;
  icon: string;
  authorName: string;
  supportURL: string;
  contactURL: string;
  sourceURL: string;
  hash: string;
  perso: string;
  parentName: string | null;
  firmware: string;
  firmwareKey: string;
  delete: string;
  deleteKey: string;
  bytes: number;
  warning: string | null;
  isDevTools: boolean;
};

export type DeviceInfoEntity = {
  mcuVersion: string; // the raw mcu version
  version: string; // the version part, without the -osu
  majMin: string; // the x.y part of the x.y.z-v version
  targetId: string | number; // a technical id
  isBootloader: boolean;
  isRecoveryMode?: boolean;
  isOSU: boolean;
  providerName: string | null | undefined;
  managerAllowed: boolean;
  pinValidated: boolean; // more precised raw versions
  seVersion?: string;
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  onboarded?: boolean;
  hasDevFirmware?: boolean;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};

export type DeviceVersionEntity = {
  id: number;
  name: string;
  display_name: string;
  target_id: string;
  description: string;
  device: number;
  providers: number[];
  mcu_versions: number[];
  se_firmware_final_versions: number[];
  osu_versions: number[];
  application_versions: number[];
  date_creation: string;
  date_last_modified: string;
};

type BaseFirmware = {
  id: number;
  name: string;
  description: string | null | undefined;
  display_name: string | null | undefined;
  notes: string | null | undefined;
  perso: string;
  firmware: string;
  firmware_key: string;
  hash: string;
  date_creation: string;
  date_last_modified: string;
  device_versions: number[];
  providers: number[];
};

export type OsuFirmware = BaseFirmware & {
  next_se_firmware_final_version: number;
  previous_se_firmware_final_version: number[];
};

export type FinalFirmware = BaseFirmware & {
  version: string;
  se_firmware: number;
  osu_versions: OsuFirmware[];
  mcu_versions: number[];
  application_versions: number[];
  bytes?: number;
  updateAvailable?: FirmwareUpdateContextEntity | null | undefined;
};

export type FirmwareUpdateContextEntity = {
  osu: OsuFirmware;
  final: FinalFirmware;
  shouldFlashMCU: boolean;
};

export type LanguagePackageEntity = {
  language: Language;
  languagePackageVersionId: number;
  version: string; // "0.0.1"
  language_package_id: number;
  apdu_install_url: string;
  apdu_uninstall_url: string; // <= Useless
  device_versions: number[];
  se_firmware_final_versions: number[];
  bytes: number;
  date_creation: string;
  date_last_modified: string;
};

export type LanguagePackageResponseEntity = {
  id: number;
  language: Language;
  language_package_version: LanguagePackageEntity[];
};

export type DeviceVersion = {
  id: number;
  name: string;
  display_name: string;
  target_id: string;
  description: string;
  device: number;
  providers: Array<number>;
  mcu_versions: Array<number>;
  se_firmware_final_versions: Array<number>;
  osu_versions: Array<number>;
  application_versions: Array<number>;
  date_creation: string;
  date_last_modified: string;
};

export type McuVersion = {
  id: number;
  mcu: number;
  name: string;
  description: string | null | undefined;
  providers: Array<number>;
  from_bootloader_version: string;
  device_versions: Array<number>;
  se_firmware_final_versions: Array<number>;
  date_creation: string;
  date_last_modified: string;
};

export type DeviceInfo = {
  mcuVersion: string; // the raw mcu version
  version: string; // the version part, without the -osu
  majMin: string; // the x.y part of the x.y.z-v version
  targetId: string | number; // a technical id
  isBootloader: boolean;
  isRecoveryMode?: boolean;
  isOSU: boolean;
  providerName: string | null | undefined;
  managerAllowed: boolean;
  pinValidated: boolean;
  seVersion?: string; // more precised raw versions
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  onboarded?: boolean;
  hasDevFirmware?: boolean;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};

export type FirmwareUpdateContext = {
  osu: OsuFirmware;
  final: FinalFirmware;
  shouldFlashMCU: boolean;
};

// Commands
export type FirmwareInfoEntity = {
  isBootloader: boolean;
  rawVersion: string; // if SE seVersion, if BL blVersion
  targetId: number; // if SE seTargetId, if BL mcuTargetId
  seVersion?: string;
  mcuVersion: string; // NB historically not undefined. but will be ""
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  flags: Buffer;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};

export type APDU = [
  /** 1 byte unsigned int */
  cla: number,
  /** 1 byte unsigned int */
  ins: number,
  /** 1 byte unsigned int */
  p1: number,
  /** 1 byte unsigned int */
  p2: number,
  /** data (optional) */
  data: Buffer | undefined,
];

export type GetVersionOptions = {
  /** Abort timeout in milliseconds */
  abortTimeoutMs?: number;
};

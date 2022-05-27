import type { CryptoCurrency } from "./currencies";
import type { DeviceModelId } from "@ledgerhq/devices";
// FIXME we need to clearly differentiate what is API types and what is our inner own type
export type Id = number;
export type LedgerScriptParams = {
  firmware: string;
  firmwareKey: string;
  delete?: string;
  deleteKey?: string;
  targetId?: string | number;
  hash: string;
  perso: string;
};
export type DeviceInfo = {
  mcuVersion: string;
  // the raw mcu version
  version: string;
  // the version part, without the -osu
  majMin: string;
  // the x.y part of the x.y.z-v version
  targetId: string | number;
  // a technical id
  isBootloader: boolean;
  isRecoveryMode?: boolean;
  isOSU: boolean;
  providerName: string | null | undefined;
  managerAllowed: boolean;
  pinValidated: boolean;
  // more precised raw versions
  seVersion?: string;
  mcuBlVersion?: string;
  mcuTargetId?: number;
  seTargetId?: number;
  onboarded?: boolean;
  bootloaderVersion?: string;
  hardwareVersion?: number;
  languageId?: number;
};
export type DeviceModelInfo = {
  modelId: DeviceModelId;
  deviceInfo: DeviceInfo;
  apps: Array<{
    name: string;
    version: string;
  }>;
};
export type DeviceVersion = {
  id: Id;
  name: string;
  display_name: string;
  target_id: string;
  description: string;
  device: Id;
  providers: Array<Id>;
  mcu_versions: Array<Id>;
  se_firmware_final_versions: Array<Id>;
  osu_versions: Array<Id>;
  application_versions: Array<Id>;
  date_creation: string;
  date_last_modified: string;
};
export type McuVersion = {
  id: Id;
  mcu: Id;
  name: string;
  description: string | null | undefined;
  providers: Array<Id>;
  from_bootloader_version: string;
  device_versions: Array<Id>;
  se_firmware_final_versions: Array<Id>;
  date_creation: string;
  date_last_modified: string;
};
export enum SeedPhraseType {
  Twelve = "12-words",
  Eighteen = "18-words",
  TwentyFour = "24-words",
}
export type FirmwareInfo = {
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
type BaseFirmware = {
  id: Id;
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
  device_versions: Array<Id>;
  providers: Array<Id>;
};
export type OsuFirmware = BaseFirmware & {
  next_se_firmware_final_version: Id;
  previous_se_firmware_final_version: Array<Id>;
};
export type FinalFirmware = BaseFirmware & {
  version: string;
  se_firmware: Id;
  osu_versions: Array<OsuFirmware>;
  mcu_versions: Array<Id>;
  application_versions: Array<Id>;
  bytes?: number;
  updateAvailable?: FirmwareUpdateContext | null | undefined;
};
export type FirmwareUpdateContext = {
  osu: OsuFirmware;
  final: FinalFirmware;
  shouldFlashMCU: boolean;
};
export type ApplicationVersion = {
  id: Id;
  name: string;
  version: string;
  app: Id;
  description: string | null | undefined;
  display_name: string;
  icon: string;
  notes: string | null | undefined;
  perso: string;
  hash: string;
  firmware: string;
  firmware_key: string;
  delete: string;
  delete_key: string;
  device_versions: Array<Id>;
  se_firmware_final_versions: Array<Id>;
  providers: Array<Id>;
  date_creation: string;
  date_last_modified: string;
  type?: AppType;
  // dependencies: Id[],
  bytes: number | null | undefined;
  warning: string | null | undefined;
  // DEPRECATED because not serializable
  currency?: CryptoCurrency;
};
export type Application = {
  id: Id;
  name: string;
  description: string | null | undefined;
  application_versions: Array<ApplicationVersion>;
  providers: Array<Id>;
  category: Id;
  publisher: Id | null | undefined;
  date_creation: string;
  date_last_modified: string;
  currencyId: string | null | undefined;
  authorName: string | null | undefined;
  supportURL: string | null | undefined;
  contactURL: string | null | undefined;
  sourceURL: string | null | undefined;
  compatibleWalletsJSON: string | null | undefined;
};
export enum AppType {
  app = "app",
  plugin = "plugin",
  tool = "tool",
  swap = "swap",
}
// App is higher level on top of Application and ApplicationVersion
// with all fields Live needs and in normalized form (but still serializable)
export type App = {
  id: Id;
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
  compatibleWallets: Array<{
    name: string;
    url: string | null | undefined;
  }>;
  hash: string;
  perso: string;
  firmware: string;
  firmware_key: string;
  delete: string;
  delete_key: string;
  // we use names to identify an app
  dependencies: string[];
  bytes: number | null | undefined;
  warning: string | null | undefined;
  // -1 if coin not in marketcap, otherwise index in the tickers list of https://countervalues.api.live.ledger.com/tickers
  indexOfMarketCap: number;
  isDevTools: boolean;
  type: AppType;
};
export type Category = {
  id: Id;
  name: string;
  description: string | null | undefined;
  providers: Array<Id>;
  applications: Array<Id>;
  date_creation: string;
  date_last_modified: string;
};
export type SocketEvent =
  | {
      type: "bulk-progress";
      progress: number;
      index: number;
      total: number;
    }
  | {
      type: "result";
      payload: any;
    }
  | {
      type: "warning";
      message: string;
    }
  | {
      type: "device-permission-requested";
      wording: string;
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "exchange-before";
      nonce: number;
      apdu: Buffer;
    }
  | {
      type: "exchange";
      nonce: number;
      apdu: Buffer;
      data: Buffer;
      status: number;
    }
  | {
      type: "opened";
    }
  | {
      type: "closed";
    };

// @flow
import type { CryptoCurrency } from "./currencies";
import type { DeviceModelId } from "@ledgerhq/devices";

// FIXME we need to clearly differentiate what is API types and what is our inner own type

export type Id = number;

export type LedgerScriptParams = {
  firmware: string,
  firmwareKey: string,
  delete?: string,
  deleteKey?: string,
  targetId?: string | number,
  hash: string,
  perso: string,
};

export type DeviceInfo = {|
  mcuVersion: string, // the raw mcu version
  version: string, // the version part, without the -osu
  majMin: string, // the x.y part of the x.y.z-v version
  targetId: string | number, // a technical id
  isBootloader: boolean,
  isOSU: boolean,
  providerName: ?string,
  managerAllowed: boolean,
  pinValidated: boolean,
|};

export type DeviceModelInfo = {
  modelId: DeviceModelId,
  deviceInfo: DeviceInfo,
  apps: Array<{ name: string, version: string }>,
};

export type DeviceVersion = {
  id: Id,
  name: string,
  display_name: string,
  target_id: string,
  description: string,
  device: Id,
  providers: Array<Id>,
  mcu_versions: Array<Id>,
  se_firmware_final_versions: Array<Id>,
  osu_versions: Array<Id>,
  application_versions: Array<Id>,
  date_creation: string,
  date_last_modified: string,
};

export type McuVersion = {
  id: Id,
  mcu: Id,
  name: string,
  description: ?string,
  providers: Array<Id>,
  from_bootloader_version: string,
  device_versions: Array<Id>,
  se_firmware_final_versions: Array<Id>,
  date_creation: string,
  date_last_modified: string,
};

export type FirmwareInfo = {
  targetId: Id,
  seVersion: string,
  flags: string,
  mcuVersion: string,
};

type BaseFirmware = {
  id: Id,
  name: string,
  description: ?string,
  display_name: ?string,
  notes: ?string,
  perso: string,
  firmware: string,
  firmware_key: string,
  hash: string,
  date_creation: string,
  date_last_modified: string,
  device_versions: Array<Id>,
  providers: Array<Id>,
};

export type OsuFirmware = BaseFirmware & {
  next_se_firmware_final_version: Id,
  previous_se_firmware_final_version: Array<Id>,
};

export type FinalFirmware = BaseFirmware & {
  version: string,
  se_firmware: Id,
  osu_versions: Array<OsuFirmware>,
  mcu_versions: Array<Id>,
  application_versions: Array<Id>,
  bytes?: number,
};

export type FirmwareUpdateContext = {
  osu: OsuFirmware,
  final: FinalFirmware,
  shouldFlashMCU: boolean,
};

export type ApplicationVersion = {
  id: Id,
  name: string,
  version: string,
  app: Id,
  description: ?string,
  display_name: string,
  icon: string,
  notes: ?string,
  perso: string,
  hash: string,
  firmware: string,
  firmware_key: string,
  delete: string,
  delete_key: string,
  device_versions: Array<Id>,
  se_firmware_final_versions: Array<Id>,
  providers: Array<Id>,
  date_creation: string,
  date_last_modified: string,
  // dependencies: Id[],
  bytes: ?number,
  warning: ?string,
  // DEPRECATED because not serializable
  currency?: CryptoCurrency,
};

export type Application = {
  id: Id,
  name: string,
  description: ?string,
  application_versions: Array<ApplicationVersion>,
  providers: Array<Id>,
  category: Id,
  publisher: ?Id,
  date_creation: string,
  date_last_modified: string,
  currencyId: ?string,
  authorName: ?string,
  supportURL: ?string,
  contactURL: ?string,
  sourceURL: ?string,
  compatibleWalletsJSON: ?string,
};

// App is higher level on top of Application and ApplicationVersion
// with all fields Live needs and in normalized form (but still serializable)
export type App = {
  id: Id,
  name: string,
  displayName: string,
  version: string,
  currencyId: ?string,
  description: ?string,
  dateModified: string,
  icon: string,
  authorName: ?string,
  supportURL: ?string,
  contactURL: ?string,
  sourceURL: ?string,
  compatibleWallets: Array<{ name: string, url: ?string }>,
  hash: string,
  perso: string,
  firmware: string,
  firmware_key: string,
  delete: string,
  delete_key: string,
  // we use names to identify an app
  dependencies: string[],
  bytes: ?number,
  warning: ?string,
  // -1 if coin not in marketcap, otherwise index in the tickers list of https://countervalues.api.live.ledger.com/tickers
  indexOfMarketCap: number,
  isDevTools: boolean,
};

export type Category = {
  id: Id,
  name: string,
  description: ?string,
  providers: Array<Id>,
  applications: Array<Id>,
  date_creation: string,
  date_last_modified: string,
};

export type SocketEvent =
  | { type: "bulk-progress", progress: number, index: number, total: number }
  | { type: "result", payload: any }
  | { type: "warning", message: string }
  | { type: "device-permission-requested", wording: string }
  | { type: "device-permission-granted" }
  | { type: "exchange-before", nonce: number, apdu: Buffer }
  | {
      type: "exchange",
      nonce: number,
      apdu: Buffer,
      data: Buffer,
      status: number,
    }
  | { type: "opened" }
  | { type: "closed" };

// @flow
import type { DeviceModel, DeviceModelId } from "@ledgerhq/devices";
import type { Observable } from "rxjs";
import type { CryptoCurrency } from "../types/currencies";
import type { App, DeviceInfo, FinalFirmware } from "../types/manager";

export type Exec = (
  appOp: AppOp,
  targetId: string | number,
  app: App
) => Observable<{ progress: number }>;

export type InstalledItem = {
  name: string,
  updated: boolean,
  hash: string,
  blocks: number
};

export type ListAppsEvent =
  | { type: "device-permission-requested", wording: string }
  | { type: "device-permission-granted" }
  | { type: "result", result: ListAppsResult };

export type ListAppsResult = {
  appByName: { [_: string]: App },
  appsListNames: string[],
  installedAvailable: boolean,
  installed: InstalledItem[],
  deviceInfo: DeviceInfo,
  deviceModelId: DeviceModelId,
  firmware: ?FinalFirmware
};

export type State = {
  deviceInfo: DeviceInfo,
  deviceModel: DeviceModel,
  firmware: ?FinalFirmware,
  appByName: { [_: string]: App },
  apps: App[],
  installedAvailable: boolean,
  installed: InstalledItem[],
  installQueue: string[],
  uninstallQueue: string[],
  currentAppOp: ?AppOp,
  currentProgress: ?{
    appOp: AppOp,
    progress: number
  },
  currentError: ?{
    error: Error,
    appOp: AppOp
  }
};

export type AppOp =
  | { type: "install", name: string }
  | { type: "uninstall", name: string };

export type Action =
  // wipe will remove all apps of the device
  | { type: "wipe" }
  // uninstall a specific app by name
  | { type: "uninstall", name: string, force?: boolean }
  // install or update a specific app by name
  | { type: "install", name: string }
  // update all
  | { type: "updateAll" }
  // action to run after an update was done on the device (uninstall/install)
  | { type: "onRunnerEvent", event: RunnerEvent };

export type RunnerEvent =
  | { type: "runStart", appOp: AppOp }
  | { type: "runProgress", appOp: AppOp, progress: number }
  | { type: "runError", appOp: AppOp, error: Error }
  | { type: "runSuccess", appOp: AppOp };

export type AppData = {
  currency: ?CryptoCurrency,
  name: string,
  blocks: number,
  bytes: number
};

export type UnrecognizedAppData = {
  name: string,
  hash: string
};

export type AppsDistribution = {
  totalBlocks: number,
  totalBytes: number,
  osBlocks: number,
  osBytes: number,
  apps: Array<AppData>,
  appsSpaceBlocks: number,
  appsSpaceBytes: number,
  totalAppsBlocks: number,
  totalAppsBytes: number,
  freeSpaceBlocks: number,
  freeSpaceBytes: number,
  shouldWarnMemory: boolean
};

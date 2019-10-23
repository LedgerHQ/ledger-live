// @flow
import type { Observable } from "rxjs";
import type { ApplicationVersion, DeviceInfo } from "../types/manager";

export type Exec = (
  appOp: AppOp,
  targetId: string | number,
  app: ApplicationVersion
) => Observable<{ progress: number }>;

export type InstalledItem = {
  name: string,
  updated: boolean,
  hash: string,
  blocks: number
};

export type ListAppsResult = {
  hashesByKey: { [_: string]: string },
  blocksByKey: { [_: string]: number },
  appByName: { [_: string]: ApplicationVersion },
  apps: ApplicationVersion[],
  installedAvailable: boolean,
  installed: InstalledItem[],
  deviceInfo: DeviceInfo
};

export type State = {
  deviceInfo: DeviceInfo,
  hashesByKey: { [_: string]: string },
  blocksByKey: { [_: string]: number },
  appByName: { [_: string]: ApplicationVersion },
  apps: ApplicationVersion[],
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

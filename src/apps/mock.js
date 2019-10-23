// @flow
import { of, throwError } from "rxjs";
import {
  ManagerAppDepInstallRequired,
  ManagerAppDepUninstallRequired
} from "@ledgerhq/errors";
import { getDirectDep, getDependencies } from "./logic";
import { findCryptoCurrencyById } from "../currencies";
import type { ListAppsResult, AppOp, Exec, InstalledItem } from "./types";
import type { ApplicationVersion, DeviceInfo } from "../types/manager";

export const deviceInfo155 = {
  version: "1.5.5",
  isBootloader: false,
  isOSU: false,
  managerAllowed: false,
  mcuVersion: "1.7",
  pinValidated: false,
  providerId: 1,
  majMin: "1.5",
  targetId: 823132164
};

export const prettyActionPlan = (ops: AppOp[]) =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export const prettyInstalled = (items: InstalledItem[]) =>
  items
    .map(({ name, updated }) => name + (updated ? "" : " (outdated)"))
    .join(", ");

export const parseInstalled = (installedDesc: string): InstalledItem[] =>
  installedDesc
    .split(",")
    .filter(Boolean)
    .map(a => {
      const trimmed = a.trim();
      const m = /(.*)\(outdated\)/.exec(trimmed);
      if (m) {
        return { name: m[1].trim(), updated: false, hash: "", blocks: 0 };
      }
      return { name: trimmed, updated: true, hash: "", blocks: 0 };
    });

export function mockListAppsResult(
  appDesc: string,
  installedDesc: string,
  deviceInfo: DeviceInfo
): ListAppsResult {
  const apps = appDesc
    .split(",")
    .map(a => a.trim())
    .filter(Boolean)
    .map((name, i) => {
      const o: ApplicationVersion = {
        id: i,
        app: i,
        name,
        version: "0.0.0",
        description: null,
        display_name: name,
        icon: "",
        picture: 0,
        notes: null,
        perso: "",
        hash: "",
        firmware: "",
        firmware_key: "",
        delete: "",
        delete_key: "",
        device_versions: [],
        se_firmware_final_versions: [],
        providers: [],
        date_creation: "",
        date_last_modified: ""
      };
      const currency = findCryptoCurrencyById(name);
      if (currency) {
        o.currency = currency;
      }
      return o;
    });
  const appByName = {};
  const blocksByKey = {};
  const hashesByKey = { "": "" };
  apps.forEach(app => {
    appByName[app.name] = app;
    blocksByKey[app.firmware] = 0;
  });

  const installed = parseInstalled(installedDesc);

  return {
    apps,
    appByName,
    hashesByKey,
    blocksByKey,
    deviceInfo,
    installed,
    installedAvailable: true
  };
}

export const mockExecWithInstalledContext = (
  installedInitial: InstalledItem[]
): Exec => {
  let installed = installedInitial.slice(0);
  return (appOp: AppOp, targetId: string | number, app: ApplicationVersion) => {
    if (appOp.name !== app.name) {
      throw new Error("appOp.name must match app.name");
    }

    if (
      getDependencies(app.name).some(dep => installed.some(i => i.name === dep))
    ) {
      return throwError(new ManagerAppDepUninstallRequired(""));
    }

    if (appOp.type === "install") {
      const dep = getDirectDep(app.name);
      if (dep) {
        const depInstalled = installed.find(i => i.name === dep);
        if (!depInstalled || !depInstalled.updated) {
          return throwError(new ManagerAppDepInstallRequired(""));
        }
      }
    }

    switch (appOp.type) {
      case "install":
        if (!installed.some(i => i.name === appOp.name)) {
          installed = installed.concat({
            name: appOp.name,
            updated: true,
            blocks: 0,
            hash: ""
          });
        }
        break;

      case "uninstall":
        installed = installed.filter(a => a.name !== appOp.name);
        break;
    }

    return of({ progress: 0 }, { progress: 0.5 }, { progress: 1 });
  };
};

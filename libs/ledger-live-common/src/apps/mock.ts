import { of, throwError } from "rxjs";
import {
  ManagerAppDepInstallRequired,
  ManagerAppDepUninstallRequired,
} from "@ledgerhq/errors";
import {
  getDependencies,
  getDependents,
  whitelistDependencies,
} from "./polyfill";
import { findCryptoCurrency } from "../currencies";
import type { ListAppsResult, AppOp, Exec, InstalledItem } from "./types";
import { getBTCValues } from "../countervalues/mock";
import { DeviceModelId } from "@ledgerhq/devices";
import { App, DeviceInfo, FinalFirmware } from "@ledgerhq/types-live";

export const deviceInfo155 = {
  version: "1.5.5",
  isBootloader: false,
  isOSU: false,
  managerAllowed: false,
  mcuVersion: "1.7",
  pinValidated: false,
  providerName: null,
  majMin: "1.5",
  targetId: 823132164,
};
const firmware155: FinalFirmware = {
  id: 24,
  name: "1.5.5",
  version: "1.5.5",
  se_firmware: 2,
  description: "",
  display_name: "",
  notes: "",
  perso: "perso_11",
  firmware: "nanos/1.5.5/fw_1.4.2/upgrade_1.5.5",
  firmware_key: "nanos/1.5.5/fw_1.4.2/upgrade_1.5.5_key",
  hash: "",
  // @ts-expect-error mock extra unecessary data maybe
  distribution_ratio: null,
  exclude_by_default: false,
  osu_versions: [],
  date_creation: "2019-01-08T13:29:35.839258Z",
  date_last_modified: "2019-10-18T16:38:29.745993Z",
  device_versions: [10],
  mcu_versions: [6],
  application_versions: [],
  providers: [1, 4, 7, 9, 11, 12, 13],
  bytes: 20 * 4 * 1024,
};

export const parseInstalled = (installedDesc: string): InstalledItem[] =>
  installedDesc
    .split(",")
    .filter(Boolean)
    .map((a) => {
      const trimmed = a.trim();
      const m = /(.*)\(outdated\)/.exec(trimmed);

      if (m) {
        const name = m[1].trim();
        return {
          name,
          updated: false,
          hash: "hash_" + name,
          blocks: 1,
          version: "0.0.0",
          availableVersion: "1.5.0",
        };
      }

      // Check if the name contains the number of blocks too
      const b = /(.*)_(\d*)blocks/.exec(trimmed);

      const _name = b ? b[1] : trimmed;

      return {
        name: _name,
        updated: true,
        hash: "hash_" + _name,
        blocks: Number(b ? b[2] : 1),
        version: "1.5.0",
        availableVersion: "1.6.0",
      };
    });

export function mockListAppsResult(
  appDesc: string,
  installedDesc: string,
  deviceInfo: DeviceInfo
): ListAppsResult {
  const tickersByMarketCap = Object.keys(getBTCValues());
  const apps = appDesc
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((name, i) => {
      const dependencies = whitelistDependencies.includes(name)
        ? []
        : getDependencies(name);
      const currency =
        // try to find the "official" currency when possible (2 currencies can have the same manager app and ticker)
        findCryptoCurrency((c) => c.name === name) ||
        // Else take the first one with that manager app
        findCryptoCurrency((c) => c.managerAppName === name);
      const indexOfMarketCap = currency
        ? tickersByMarketCap.indexOf(currency.ticker)
        : -1;
      return {
        id: i,
        app: i,
        name,
        displayName: name,
        version: "0.0.0",
        description: null,
        icon: "bitcoin",
        // we use bitcoin icon for all for convenience
        perso: "",
        authorName: "",
        supportURL: "",
        contactURL: "",
        sourceURL: "",
        hash: "hash_" + name,
        firmware: "firmware_" + name,
        bytes: (dependencies.length === 0 ? 10 : 1) * 4 * 1024,
        dependencies,
        warning: "",
        firmware_key: "",
        delete: "",
        delete_key: "",
        dateModified: "",
        compatibleWallets: [],
        currencyId: currency ? currency.id : null,
        indexOfMarketCap,
        isDevTools: false,
      };
    });
  const appByName = {};
  apps.forEach((app) => {
    appByName[app.name] = app;
  });
  const installed = parseInstalled(installedDesc);
  return {
    appByName,
    appsListNames: apps.map((a) => a.name),
    deviceInfo,
    deviceModelId: <DeviceModelId>"nanoS",
    firmware: firmware155,
    installed,
    installedAvailable: true,
  };
}

export const mockExecWithInstalledContext = (
  installedInitial: InstalledItem[]
): Exec => {
  let installed = installedInitial.slice(0);
  return (appOp: AppOp, targetId: string | number, app: App) => {
    if (appOp.name !== app.name) {
      throw new Error("appOp.name must match app.name");
    }

    if (
      getDependents(app.name).some((dep) =>
        installed.some((i) => i.name === dep)
      )
    ) {
      return throwError(new ManagerAppDepUninstallRequired(""));
    }

    if (appOp.type === "install") {
      const deps = getDependencies(app.name);
      deps.forEach((dep) => {
        const depInstalled = installed.find((i) => i.name === dep);

        if (!depInstalled || !depInstalled.updated) {
          return throwError(new ManagerAppDepInstallRequired(""));
        }
      });
    }

    switch (appOp.type) {
      case "install":
        if (!installed.some((i) => i.name === appOp.name)) {
          installed = installed.concat({
            name: appOp.name,
            updated: true,
            blocks: 0,
            hash: "",
            version: "1.0.0",
            availableVersion: "1.0.0",
          });
        }

        break;

      case "uninstall":
        installed = installed.filter((a) => a.name !== appOp.name);
        break;
    }

    return of(
      {
        progress: 0,
      },
      {
        progress: 0.5,
      },
      {
        progress: 1,
      }
    );
  };
};

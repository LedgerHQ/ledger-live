// @flow

import Transport from "@ledgerhq/hw-transport";
import { getDeviceModel } from "@ledgerhq/devices";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { Observable, throwError } from "rxjs";
import type { Exec, AppOp, ListAppsEvent } from "./types";
import type { ApplicationVersion, DeviceInfo } from "../types/manager";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";
import { log } from "@ledgerhq/logs";
import { listCryptoCurrencies } from "../currencies";
import ManagerAPI from "../api/Manager";
import { getEnv } from "../env";
import { currenciesByMarketcap } from "../currencies";
import hwListApps from "../hw/listApps";
import { polyfillAppVersion, polyfillFinalFirmware } from "./polyfill";

export const execWithTransport = (transport: Transport<*>): Exec => (
  appOp: AppOp,
  targetId: string | number,
  app: ApplicationVersion
) => {
  const fn = appOp.type === "install" ? installApp : uninstallApp;
  return fn(transport, targetId, app);
};

export const listApps = (
  transport: Transport<*>,
  deviceInfo: DeviceInfo
): Observable<ListAppsEvent> => {
  if (deviceInfo.isOSU || deviceInfo.isBootloader) {
    return throwError(new UnexpectedBootloader(""));
  }

  const deviceModelId =
    // $FlowFixMe
    (transport.deviceModel && transport.deviceModel.id) || "nanoS";

  return Observable.create(o => {
    let sub;

    async function main() {
      const installedP = new Promise((resolve, reject) => {
        sub = ManagerAPI.listInstalledApps(transport, {
          targetId: deviceInfo.targetId,
          perso: "perso_11"
        }).subscribe({
          next: e => {
            if (e.type === "result") {
              resolve(e.payload);
            } else if (e.type === "allow-manager-accepted") {
              o.next({ type: "device-permission-granted" });
            } else if (e.type === "allow-manager-requested") {
              o.next({
                type: "device-permission-requested",
                wording: "Allow Manager"
              });
            }
          },
          error: reject
        });
      })
        .then(apps =>
          apps.map(({ name, hash }) => ({
            name,
            hash,
            blocks: 0
          }))
        )
        .catch(e => {
          log("hw", "failed to HSM list apps " + String(e) + "\n" + e.stack);
          return hwListApps(transport).then(apps =>
            apps.map(({ name, hash, blocks }) => ({ name, hash, blocks }))
          );
        })
        .then(apps => [apps, true])
        .catch(e => {
          log("hw", "failed to device list apps " + String(e) + "\n" + e.stack);
          return [[], false];
        });

      const deviceVersionP = ManagerAPI.getDeviceVersion(
        deviceInfo.targetId,
        deviceInfo.providerId
      );

      const firmwareDataP = deviceVersionP
        .then(deviceVersion =>
          ManagerAPI.getCurrentFirmware({
            deviceId: deviceVersion.id,
            version: deviceInfo.version,
            provider: deviceInfo.providerId
          })
        )
        .then(polyfillFinalFirmware);

      const applicationsByDeviceP = Promise.all([deviceVersionP, firmwareDataP])
        .then(([deviceVersion, firmwareData]) =>
          ManagerAPI.applicationsByDevice({
            provider: deviceInfo.providerId,
            current_se_firmware_final_version: firmwareData.id,
            device_version: deviceVersion.id
          })
        )
        .then(apps => apps.map(polyfillAppVersion));

      const [
        [installedList, installedAvailable],
        applicationsList,
        compatibleAppVersionsList,
        firmware,
        sortedCryptoCurrencies
      ] = await Promise.all([
        installedP,
        ManagerAPI.listApps(),
        applicationsByDeviceP,
        firmwareDataP,
        currenciesByMarketcap(
          listCryptoCurrencies(getEnv("MANAGER_DEV_MODE"), true)
        )
      ]);

      const filtered = getEnv("MANAGER_DEV_MODE")
        ? compatibleAppVersionsList.slice(0)
        : compatibleAppVersionsList.filter(version => {
            const app = applicationsList.find(e => e.id === version.app);
            if (app) {
              return app.category !== 2;
            }
            return false;
          });

      log(
        "list-apps",
        `${installedList.length} apps installed. ${applicationsList.length} apps store total. ${filtered.length} available.`,
        { installedList }
      );

      const sortedCryptoApps = [];
      // sort by crypto first
      sortedCryptoCurrencies.forEach(crypto => {
        const app = filtered.find(
          item =>
            item.name.toLowerCase() === crypto.managerAppName.toLowerCase()
        );
        if (app) {
          filtered.splice(filtered.indexOf(app), 1);
          let defined = false;
          sortedCryptoApps.push({
            ...app,
            currencyId: crypto.id,
            get currency() {
              if (defined) {
                console.warn(
                  "ApplicationVersion: app.currency field is deprecated. use app.currencyId",
                  new Error().stack
                );
              }
              return crypto;
            }
          });
          defined = true;
        }
      });

      const apps = sortedCryptoApps.concat(filtered);

      const deviceModel = getDeviceModel(deviceModelId);

      const installed = installedList.map(({ name, hash, blocks }) => {
        const ins =
          (hash && apps.find(i => hash === i.hash)) ||
          apps.find(i => name === i.name);
        return {
          name,
          updated: ins ? ins.hash === hash : false,
          blocks:
            blocks ||
            Math.ceil(((ins && ins.bytes) || 0) / deviceModel.blockSize),
          hash
        };
      });

      const appByName = {};
      compatibleAppVersionsList.concat(apps).forEach(app => {
        appByName[app.name] = app;
      });

      o.next({
        type: "result",
        result: {
          appByName,
          appsListNames: apps.map(app => app.name),
          installed,
          installedAvailable,
          deviceInfo,
          deviceModelId,
          firmware
        }
      });
    }

    main().then(
      () => {
        o.complete();
      },
      e => {
        o.error(e);
      }
    );

    return () => {
      if (sub) sub.unsubscribe();
    };
  });
};

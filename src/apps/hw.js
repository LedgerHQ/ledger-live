// @flow

import Transport from "@ledgerhq/hw-transport";
import { getDeviceModel } from "@ledgerhq/devices";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { Observable, throwError } from "rxjs";
import type { Exec, AppOp, ListAppsEvent, ListAppsResult } from "./types";
import type { App, DeviceInfo } from "../types/manager";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";
import { log } from "@ledgerhq/logs";
import {
  listCryptoCurrencies,
  currenciesByMarketcap,
  findCryptoCurrencyById
} from "../currencies";
import ManagerAPI from "../api/Manager";
import { getEnv } from "../env";
import hwListApps from "../hw/listApps";
import {
  polyfillApp,
  polyfillAppVersion,
  polyfillApplication,
  polyfillFinalFirmware
} from "./polyfill";

export const execWithTransport = (transport: Transport<*>): Exec => (
  appOp: AppOp,
  targetId: string | number,
  app: App
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
            } else if (
              e.type === "device-permission-granted" ||
              e.type === "device-permission-requested"
            ) {
              o.next(e);
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
          if (getEnv("EXPERIMENTAL_FALLBACK_APDU_LISTAPPS")) {
            return hwListApps(transport)
              .then(apps =>
                apps.map(({ name, hash, blocks }) => ({ name, hash, blocks }))
              )
              .catch(e => {
                log(
                  "hw",
                  "failed to device list apps " + String(e) + "\n" + e.stack
                );
                throw e;
              });
          } else {
            throw e;
          }
        })
        .then(apps => [apps, true]);

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
        [partialInstalledList, installedAvailable],
        applicationsList,
        compatibleAppVersionsList,
        firmware,
        sortedCryptoCurrencies
      ] = await Promise.all([
        installedP,
        ManagerAPI.listApps().then(apps => apps.map(polyfillApplication)),
        applicationsByDeviceP,
        firmwareDataP,
        currenciesByMarketcap(
          listCryptoCurrencies(getEnv("MANAGER_DEV_MODE"), true)
        )
      ]);

      // unfortunately we sometimes (nano s 1.3.1) miss app.name (it's set as "" from list apps)
      // the fallback strategy is to look it up in applications list
      // for performance we might eventually only load applications in case one name is missing
      let installedList = partialInstalledList;
      const shouldCompleteInstalledList = partialInstalledList.some(
        a => !a.name
      );
      if (shouldCompleteInstalledList) {
        installedList = installedList.map(a => {
          if (a.name) return a; // already present
          const application = applicationsList.find(e =>
            e.application_versions.some(v => v.hash === a.hash)
          );
          if (!application) return a; // still no luck with our api
          return { ...a, name: application.name };
        });
      }

      const apps = compatibleAppVersionsList
        .map(version => {
          const application = applicationsList.find(e => e.id === version.app);
          if (!application) return;
          // if user didn't opt-in, remove the dev apps (testnet,..)
          if (!getEnv("MANAGER_DEV_MODE")) {
            if (application.category === 2) return;
          }

          const currencyId = application.currencyId;
          const crypto = currencyId && findCryptoCurrencyById(currencyId);
          const indexOfMarketCap = crypto
            ? sortedCryptoCurrencies.indexOf(crypto)
            : -1;

          const compatibleWallets = [];
          if (application.compatibleWalletsJSON) {
            try {
              const parsed = JSON.parse(application.compatibleWalletsJSON);
              if (parsed && Array.isArray(parsed)) {
                parsed.forEach(w => {
                  if (w && typeof w === "object" && w.name) {
                    compatibleWallets.push({
                      name: w.name,
                      url: w.url
                    });
                  }
                });
              }
            } catch (e) {
              console.error(
                "invalid compatibleWalletsJSON for " + version.name,
                e
              );
            }
          }

          const app: $Exact<App> = polyfillApp({
            id: version.id,
            name: version.name,
            version: version.version,
            currencyId,
            description: version.description,
            dateModified: version.date_last_modified,
            icon: version.icon,
            authorName: application.authorName,
            supportURL: application.supportURL,
            contactURL: application.contactURL,
            sourceURL: application.sourceURL,
            compatibleWallets,
            hash: version.hash,
            perso: version.perso,
            firmware: version.firmware,
            firmware_key: version.firmware_key,
            delete: version.delete,
            delete_key: version.delete_key,
            dependencies: [],
            bytes: version.bytes,
            warning: version.warning,
            indexOfMarketCap
          });

          return app;
        })
        .filter(Boolean);

      log(
        "list-apps",
        `${installedList.length} apps installed. ${applicationsList.length} apps store total. ${apps.length} available.`,
        { installedList }
      );

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
      apps.forEach(app => {
        appByName[app.name] = app;
      });

      const result: ListAppsResult = {
        appByName,
        appsListNames: apps.map(app => app.name),
        installed,
        installedAvailable,
        deviceInfo,
        deviceModelId,
        firmware
      };

      o.next({
        type: "result",
        result
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

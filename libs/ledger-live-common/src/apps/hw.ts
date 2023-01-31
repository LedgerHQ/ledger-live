import Transport from "@ledgerhq/hw-transport";
import {
  DeviceModelId,
  getDeviceModel,
  identifyTargetId,
} from "@ledgerhq/devices";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { concat, of, EMPTY, from, Observable, throwError, defer } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { App, AppType, DeviceInfo } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { LatestFirmwareVersionRequired, NoSuchAppOnProvider } from "../errors";
import type { Exec, AppOp, ListAppsEvent, ListAppsResult } from "./types";
import manager, { getProviderId } from "../manager";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";
import staxFetchImageSize from "../hw/staxFetchImageSize";
import getDeviceInfo from "../hw/getDeviceInfo";
import {
  listCryptoCurrencies,
  currenciesByMarketcap,
  findCryptoCurrencyById,
} from "../currencies";
import ManagerAPI from "../api/Manager";
import { getEnv } from "../env";
import hwListApps from "../hw/listApps";
import {
  calculateDependencies,
  polyfillApp,
  polyfillApplication,
} from "./polyfill";
import {
  reducer,
  isOutOfMemoryState,
  initState,
  predictOptimisticState,
} from "../apps/logic";
import { runAllWithProgress } from "../apps/runner";
import type { ConnectAppEvent } from "../hw/connectApp";

export const execWithTransport =
  (transport: Transport): Exec =>
  (appOp: AppOp, targetId: string | number, app: App) => {
    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };

const appsThatKeepChangingHashes = ["Fido U2F"];

export type StreamAppInstallEvent =
  | {
      type: "device-permission-requested";
      wording: string;
    }
  | {
      type: "listing-apps";
    }
  | {
      type: "device-permission-granted";
    }
  | {
      type: "app-not-installed";
      appName: string;
      appNames: string[];
    }
  | {
      type: "stream-install";
      progress: number;
      itemProgress: number;
      currentAppOp: AppOp;
      installQueue: string[];
    };

/**
 * Tries to install a list of apps
 *
 * @param transport Transport instance
 * @param appNames List of app names to install
 * @param onSuccessObs Optional observable to run after the installation
 * @param skipAppInstallIfNotFound If true, skip the installation of any app that were not found from the provider. Default to false.
 * @returns Observable of StreamAppInstallEvent or ConnectAppEvent
 * - Event "stream-install" contains a global progress of the installation
 */
export const streamAppInstall = ({
  transport,
  appNames,
  onSuccessObs,
  skipAppInstallIfNotFound = false,
}: {
  transport: Transport;
  appNames: string[];
  onSuccessObs?: () => Observable<any>;
  skipAppInstallIfNotFound?: boolean;
}): Observable<StreamAppInstallEvent | ConnectAppEvent> =>
  concat(
    of({
      type: "listing-apps",
    }),
    from(getDeviceInfo(transport)).pipe(
      mergeMap((deviceInfo) => listApps(transport, deviceInfo)),
      mergeMap((e) => {
        if (
          e.type === "device-permission-granted" ||
          e.type === "device-permission-requested"
        ) {
          // pass in events we need
          return of(e);
        }

        if (e.type === "result") {
          // stream install with the result of list apps
          const state = appNames.reduce((state, name) => {
            try {
              return reducer(state, {
                type: "install",
                name,
              });
            } catch (e: unknown) {
              if (
                e instanceof NoSuchAppOnProvider ||
                e instanceof LatestFirmwareVersionRequired
              ) {
                log(
                  "hw",
                  `failed to install app: ${name}. Skipping: ${skipAppInstallIfNotFound}`
                );

                // Continues installing the next apps
                if (skipAppInstallIfNotFound) {
                  return state;
                }
              }

              throw e;
            }
          }, initState(e.result));

          if (!state.installQueue.length) {
            return defer(onSuccessObs || (() => EMPTY));
          }

          if (isOutOfMemoryState(predictOptimisticState(state))) {
            // In this case we can't install either by lack of storage, or permissions,
            // we fallback to the error case listing the missing apps.
            const missingAppNames: string[] = state.installQueue;
            return of({
              type: "app-not-installed",
              appNames: missingAppNames,
              appName: missingAppNames[0] || appNames[0], // TODO remove when LLD/LLM integrate appNames
            });
          }

          const exec = execWithTransport(transport);
          return concat(
            runAllWithProgress(state, exec).pipe(
              map(
                ({
                  globalProgress,
                  itemProgress,
                  installQueue,
                  currentAppOp,
                }) => ({
                  type: "stream-install",
                  progress: globalProgress,
                  itemProgress,
                  installQueue,
                  currentAppOp,
                })
              )
            ),
            defer(onSuccessObs || (() => EMPTY))
          );
        }

        return EMPTY;
      })
    )
  );
const emptyHashData =
  "0000000000000000000000000000000000000000000000000000000000000000";
export const listApps = (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<ListAppsEvent> => {
  if (deviceInfo.isOSU || deviceInfo.isBootloader) {
    return throwError(new UnexpectedBootloader(""));
  }

  const deviceModelId =
    (transport.deviceModel && transport.deviceModel.id) ||
    (deviceInfo && identifyTargetId(deviceInfo.targetId as number))?.id ||
    getEnv("DEVICE_PROXY_MODEL");

  return new Observable((o) => {
    let sub;

    async function main() {
      const installedP: Promise<[{ name: string; hash: string }[], boolean]> =
        new Promise<{ name: string; hash: string; hash_code_data: string }[]>(
          (resolve, reject) => {
            sub = ManagerAPI.listInstalledApps(transport, {
              targetId: deviceInfo.targetId,
              perso: "perso_11",
            }).subscribe({
              next: (e) => {
                if (e.type === "result") {
                  resolve(e.payload);
                } else if (
                  e.type === "device-permission-granted" ||
                  e.type === "device-permission-requested"
                ) {
                  o.next(e);
                }
              },
              error: reject,
            });
          }
        )
          .then((apps) =>
            apps
              .filter(({ hash_code_data }) => hash_code_data !== emptyHashData)
              .map(({ name, hash }) => ({
                name,
                hash,
                blocks: 0,
              }))
          )
          .catch((e) => {
            log("hw", "failed to HSM list apps " + String(e) + "\n" + e.stack);

            if (getEnv("EXPERIMENTAL_FALLBACK_APDU_LISTAPPS")) {
              return hwListApps(transport)
                .then((apps) =>
                  apps.map(({ name, hash, blocks }) => ({
                    name,
                    hash,
                    blocks,
                  }))
                )
                .catch((e) => {
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
          .then((apps) => [apps, true]);

      const provider = getProviderId(deviceInfo);
      const deviceVersionP = ManagerAPI.getDeviceVersion(
        deviceInfo.targetId,
        provider
      );

      const firmwareDataP = deviceVersionP.then((deviceVersion) =>
        ManagerAPI.getCurrentFirmware({
          deviceId: deviceVersion.id,
          version: deviceInfo.version,
          provider,
        })
      );

      const latestFirmwareForDeviceP =
        manager.getLatestFirmwareForDevice(deviceInfo);

      const firmwareP = Promise.all([
        firmwareDataP,
        latestFirmwareForDeviceP,
      ]).then(([firmwareData, updateAvailable]) => ({
        ...firmwareData,
        updateAvailable,
      }));

      const applicationsByDeviceP = Promise.all([
        deviceVersionP,
        firmwareDataP,
      ]).then(([deviceVersion, firmwareData]) =>
        ManagerAPI.applicationsByDevice({
          provider,
          current_se_firmware_final_version: firmwareData.id,
          device_version: deviceVersion.id,
        })
      );

      const [
        [partialInstalledList, installedAvailable],
        applicationsList,
        compatibleAppVersionsList,
        firmware,
        sortedCryptoCurrencies,
      ] = await Promise.all([
        installedP,
        ManagerAPI.listApps().then((apps) => apps.map(polyfillApplication)),
        applicationsByDeviceP,
        firmwareP,
        currenciesByMarketcap(
          listCryptoCurrencies(getEnv("MANAGER_DEV_MODE"), true)
        ),
      ]);
      calculateDependencies();

      // unfortunately we sometimes (nano s 1.3.1) miss app.name (it's set as "" from list apps)
      // the fallback strategy is to look it up in applications list
      // for performance we might eventually only load applications in case one name is missing
      let installedList: {
        name: string;
        hash: string;
        blocks?: number;
      }[] = partialInstalledList;

      const shouldCompleteInstalledList = partialInstalledList.some(
        (a) => !a.name
      );

      if (shouldCompleteInstalledList) {
        installedList = installedList.map((a) => {
          if (a.name) return a; // already present

          const application = applicationsList.find((e) =>
            e.application_versions.some((v) => v.hash === a.hash)
          );
          if (!application) return a; // still no luck with our api

          return { ...a, name: application.name };
        });
      }

      const apps = compatibleAppVersionsList
        .map((version) => {
          const application = applicationsList.find(
            (e) => e.id === version.app
          );
          if (!application) return;
          const isDevTools = application.category === 2;
          let currencyId = application.currencyId;
          const crypto = currencyId && findCryptoCurrencyById(currencyId);

          if (!crypto) {
            currencyId = undefined;
          }

          const indexOfMarketCap = crypto
            ? sortedCryptoCurrencies.indexOf(crypto)
            : -1;
          const compatibleWallets: { name: string; url: string }[] = [];

          if (application.compatibleWalletsJSON) {
            try {
              const parsed = JSON.parse(application.compatibleWalletsJSON);

              if (parsed && Array.isArray(parsed)) {
                parsed.forEach((w) => {
                  if (w && typeof w === "object" && w.name) {
                    compatibleWallets.push({
                      name: w.name,
                      url: w.url,
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

          const type =
            application.description &&
            Object.values(AppType).includes(application.description as AppType)
              ? AppType[application.description]
              : AppType.app;

          const app: App = polyfillApp({
            id: version.id,
            name: version.name,
            displayName: version.display_name,
            version: version.version,
            currencyId,
            description: version.description,
            type,
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
            indexOfMarketCap,
            isDevTools,
          });
          return app;
        })
        .filter(Boolean);

      log(
        "list-apps",
        `${installedList.length} apps installed. ${applicationsList.length} apps store total. ${apps.length} available.`,
        {
          installedList,
        }
      );
      const deviceModel = getDeviceModel(deviceModelId);
      const bytesPerBlock = deviceModel.getBlockSize(deviceInfo.version);

      const appByName = {};
      apps.forEach((app) => {
        if (app) appByName[app.name] = app;
      });
      // Infer more data on the app installed
      const installed = installedList.map(({ name, hash, blocks }) => {
        const app = applicationsList.find((a) => a.name === name);
        const installedAppVersion =
          app && hash
            ? app.application_versions.find((v) => v.hash === hash)
            : null;
        const availableAppVersion = appByName[name];
        const blocksSize =
          blocks ||
          Math.ceil(
            ((
              installedAppVersion ||
              availableAppVersion || {
                bytes: 0,
              }
            ).bytes || 0) / bytesPerBlock
          );
        const updated =
          appsThatKeepChangingHashes.includes(name) ||
          (availableAppVersion ? availableAppVersion.hash === hash : false);
        const version = installedAppVersion ? installedAppVersion.version : "";
        const availableVersion = availableAppVersion
          ? availableAppVersion.version
          : "";
        return {
          name,
          updated,
          blocks: blocksSize,
          hash,
          version,
          availableVersion,
        };
      });
      const appsListNames = (
        getEnv("MANAGER_DEV_MODE")
          ? apps
          : apps.filter(
              (a) =>
                !a?.isDevTools || installed.some(({ name }) => name === a.name)
            )
      )
        .map((a) => a?.name ?? "")
        .filter(Boolean);

      let customImageBlocks = 0;
      if (deviceModelId === DeviceModelId.stax) {
        const customImageSize = await staxFetchImageSize(transport);
        if (customImageSize) {
          customImageBlocks = Math.ceil(customImageSize / bytesPerBlock);
        }
      }

      const result: ListAppsResult = {
        appByName,
        appsListNames,
        installed,
        installedAvailable,
        deviceInfo,
        deviceModelId,
        firmware,
        customImageBlocks,
      };
      o.next({
        type: "result",
        result,
      });
    }

    main().then(
      () => {
        o.complete();
      },
      (e) => {
        o.error(e);
      }
    );
    return () => {
      if (sub) sub.unsubscribe();
    };
  });
};

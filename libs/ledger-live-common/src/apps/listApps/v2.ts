import Transport from "@ledgerhq/hw-transport";
import {
  DeviceModelId,
  getDeviceModel,
  identifyTargetId,
} from "@ledgerhq/devices";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { Observable, throwError, Subscription } from "rxjs";
import { DeviceInfo } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import type { ListAppsEvent, ListAppsResult, ListAppResponse } from "../types";
import manager, { getProviderId } from "../../manager";
import hwListApps from "../../hw/listApps";
import staxFetchImageSize from "../../hw/staxFetchImageSize";
import {
  listCryptoCurrencies,
  currenciesByMarketcap,
  findCryptoCurrencyById,
} from "../../currencies";
import ManagerAPI from "../../manager/api";
import { getEnv } from "../../env";

import getDeviceName from "../../hw/getDeviceName";

// Hash discrepancies for these apps do NOT indicate a potential update,
// these apps have a mechanism that makes their hash change every time.
const appsWithDynamicHashes = ["Fido U2F", "Security Key"];

// Empty hash data means we won't have information on the app.
const emptyHashData = "0".repeat(64);

const listApps = (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<ListAppsEvent> => {
  log("list-apps", "using new version");

  if (deviceInfo.isOSU || deviceInfo.isBootloader) {
    return throwError(new UnexpectedBootloader(""));
  }

  const deviceModelId =
    (transport.deviceModel && transport.deviceModel.id) ||
    (deviceInfo && identifyTargetId(deviceInfo.targetId as number))?.id ||
    getEnv("DEVICE_PROXY_MODEL");

  return new Observable((o) => {
    let sub: Subscription;
    async function main() {
      const isDevMode = getEnv("MANAGER_DEV_MODE");
      const provider = getProviderId(deviceInfo);
      const deviceModel = getDeviceModel(deviceModelId);
      const bytesPerBlock = deviceModel.getBlockSize(deviceInfo.version);

      let installedAppHashesPromise: Promise<ListAppResponse>;

      if (deviceInfo.managerAllowed) {
        // If the user has already allowed a secure channel during this session we can directly
        // ask the device for the installed applications instead of going through a scriptrunner,
        // this is a performance optimization, part of a larger rework with Manager API v2.
        log("hw", "using direct apdu listapps");
        installedAppHashesPromise = hwListApps(transport);
      } else {
        // Fallback to original web-socket list apps
        log("hw", "using scriptrunner listapps");
        installedAppHashesPromise = new Promise<ListAppResponse>(
          (resolve, reject) => {
            sub = ManagerAPI.listInstalledApps(transport, {
              targetId: deviceInfo.targetId,
              perso: "perso_11",
            }).subscribe({
              next: (e) => {
                switch (e.type) {
                  case "result":
                    resolve(e.payload);
                    break;
                  case "device-permission-granted":
                  case "device-permission-requested":
                    o.next(e);
                    break;
                }
              },
              error: reject,
            });
          }
        );
      }

      const deviceVersionPromise = ManagerAPI.getDeviceVersion(
        deviceInfo.targetId,
        provider
      );

      const currentFirmwarePromise = deviceVersionPromise.then(
        (deviceVersion) =>
          ManagerAPI.getCurrentFirmware({
            deviceId: deviceVersion.id,
            version: deviceInfo.version,
            provider,
          })
      );

      const latestFirmwarePromise = currentFirmwarePromise.then(
        (currentFirmware) =>
          manager
            .getLatestFirmwareForDevice(deviceInfo)
            .then((updateAvailable) => ({
              ...currentFirmware,
              updateAvailable,
            }))
      );

      const catalogForDevicesPromise = ManagerAPI.catalogForDevice({
        provider,
        targetId: deviceInfo.targetId,
        firmwareVersion: deviceInfo.version,
      });

      const sortedCryptoCurrenciesPromise = currenciesByMarketcap(
        listCryptoCurrencies(isDevMode, true)
      );

      const installedAppsPromise = installedAppHashesPromise.then((hashes) => {
        // Empty HashData can come from apps that are not real apps (such as langauge packs)
        // or custom applications that have been sideloaded.
        const filteredHashes = hashes
          .filter(({ hash_code_data }) => hash_code_data !== emptyHashData)
          .map(({ hash }) => hash);

        return filteredHashes.length
          ? ManagerAPI.getAppsByHash(filteredHashes)
          : [];
      });

      const [
        installedList,
        catalogForDevice,
        firmware,
        sortedCryptoCurrencies,
      ] = await Promise.all([
        installedAppsPromise,
        catalogForDevicesPromise,
        latestFirmwarePromise,
        sortedCryptoCurrenciesPromise,
      ]);

      catalogForDevice.forEach((app) => {
        const crypto = app.currencyId && findCryptoCurrencyById(app.currencyId);
        if (crypto) {
          app.indexOfMarketCap = sortedCryptoCurrencies.indexOf(crypto);
        }
      });

      log("list-apps", `${installedList.length} apps installed.`);
      log("list-apps", `${catalogForDevice.length} apps in catalog.`);

      // Abused somewhere else
      const appByName = catalogForDevice.reduce((result, app) => {
        result[app.name] = app;
        return result;
      }, {});

      const installedAppNames = {};
      // Polyfill more data on the app installed
      const installed = installedList.map(({ name, hash, bytes, version }) => {
        installedAppNames[name] = true;
        const appInCatalog = appByName[name];
        const updateAvailable = appInCatalog?.hash !== hash;
        const ignoreUpdate = appsWithDynamicHashes.includes(name);
        const updated = ignoreUpdate || !updateAvailable;
        const availableVersion = appInCatalog?.version || "";

        const blocks = Math.ceil(
          (bytes || appInCatalog.bytes || 0) / bytesPerBlock
        );

        return {
          name,
          updated,
          blocks,
          hash,
          version,
          availableVersion,
        };
      });

      // Used to hide apps that are dev tools if user didn't opt-in.
      const appsListNames = catalogForDevice
        .filter(
          ({ isDevTools, name }) =>
            isDevMode || !isDevTools || name in installedAppNames
        )
        .map(({ name }) => name);

      // Stax specific, account for the size of the CLS for the storage bar.
      let customImageBlocks = 0;
      if (deviceModelId === DeviceModelId.stax && !deviceInfo.isRecoveryMode) {
        const customImageSize = await staxFetchImageSize(transport);
        if (customImageSize) {
          customImageBlocks = Math.ceil(customImageSize / bytesPerBlock);
        }
      }

      // Will not prompt user since we've allowed secure channel already.
      const deviceName = await getDeviceName(transport);

      const result: ListAppsResult = {
        appByName,
        appsListNames,
        deviceInfo,
        deviceModelId,
        installed,
        installedAvailable: !!installedList,

        // Not strictly listApps content.
        firmware,
        customImageBlocks,
        deviceName,
      };

      o.next({
        type: "result",
        result,
      });
    }

    main().then(
      function onfulfilled() {
        o.complete();
      },
      function onrejected(e) {
        o.error(e);
      }
    );

    return () => {
      if (sub) sub.unsubscribe();
    };
  });
};

export default listApps;

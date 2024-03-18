import Transport from "@ledgerhq/hw-transport";
import { DeviceModelId, getDeviceModel, identifyTargetId } from "@ledgerhq/devices";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { Observable, throwError, Subscription } from "rxjs";
import { App, DeviceInfo, idsToLanguage, languageIds } from "@ledgerhq/types-live";
import { LocalTracer } from "@ledgerhq/logs";
import type { ListAppsEvent, ListAppsResult, ListAppResponse } from "../types";
import hwListApps from "../../hw/listApps";
import staxFetchImageSize from "../../hw/staxFetchImageSize";
import {
  listCryptoCurrencies,
  currenciesByMarketcap,
  findCryptoCurrencyById,
} from "../../currencies";
import ManagerAPI from "../../manager/api";

import { getDeviceName } from "../../device/use-cases/getDeviceNameUseCase";
import { getLatestFirmwareForDeviceUseCase } from "../../device/use-cases/getLatestFirmwareForDeviceUseCase";
import { getProviderIdUseCase } from "../../device-core/managerApi/use-cases/getProviderIdUseCase";
import { ManagerApiRepository } from "../../device-core/managerApi/repositories/ManagerApiRepository";
import { mapApplicationV2ToApp } from "../polyfill";

// Hash discrepancies for these apps do NOT indicate a potential update,
// these apps have a mechanism that makes their hash change every time.
const appsWithDynamicHashes = ["Fido U2F", "Security Key"];

// Empty hash data means we won't have information on the app.
const emptyHashData = "0".repeat(64);

type ListAppsParams = {
  transport: Transport;
  deviceInfo: DeviceInfo;
  deviceProxyModel?: DeviceModelId;
  managerDevModeEnabled?: boolean;
  forceProvider: number;
  managerApiRepository: ManagerApiRepository;
};

export const listApps = ({
  transport,
  deviceInfo,
  deviceProxyModel,
  managerDevModeEnabled,
  forceProvider,
  managerApiRepository,
}: ListAppsParams): Observable<ListAppsEvent> => {
  const tracer = new LocalTracer("list-apps", { transport: transport.getTraceContext() });
  tracer.trace("Using new version", { deviceInfo });

  if (deviceInfo.isOSU || deviceInfo.isBootloader) {
    return throwError(() => new UnexpectedBootloader(""));
  }

  const deviceModelId =
    transport?.deviceModel?.id ||
    identifyTargetId(deviceInfo.targetId as number)?.id ||
    deviceProxyModel;

  return new Observable(o => {
    let sub: Subscription;
    async function main() {
      const provider = getProviderIdUseCase({ deviceInfo, forceProvider });

      if (!deviceModelId) throw new Error("Bad usage of listAppsV2: missing deviceModelId");
      const deviceModel = getDeviceModel(deviceModelId);
      const bytesPerBlock = deviceModel.getBlockSize(deviceInfo.version);

      /** The following are several asynchronous sequences running in parallel */

      /**
       * Sequence 1: obtain the full data regarding apps installed on the device
       *  -> list raw data of apps installed on device
       *  -> then filter apps (eliminate language packs and such)
       *  -> then fetch matching app metadata using apps' hashes
       */

      let listAppsResponsePromise: Promise<ListAppResponse>;
      if (deviceInfo.managerAllowed) {
        // If the user has already allowed a secure channel during this session we can directly
        // ask the device for the installed applications instead of going through a scriptrunner,
        // this is a performance optimization, part of a larger rework with Manager API v2.
        tracer.trace("Using direct apdu listapps");
        listAppsResponsePromise = hwListApps(transport);
      } else {
        // Fallback to original web-socket list apps
        tracer.trace("Using scriptrunner listapps");

        listAppsResponsePromise = new Promise<ListAppResponse>((resolve, reject) => {
          // TODO: migrate this ManagerAPI call to ManagerApiRepository
          sub = ManagerAPI.listInstalledApps(transport, {
            targetId: deviceInfo.targetId,
            perso: "perso_11",
          }).subscribe({
            next: e => {
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
        });
      }

      const filteredListAppsPromise = listAppsResponsePromise.then(result => {
        // Empty HashData can come from apps that are not real apps (such as language packs)
        // or custom applications that have been sideloaded.
        return result
          .filter(({ hash_code_data }) => hash_code_data !== emptyHashData)
          .map(({ hash, name }) => ({ hash, name }));
      });

      const listAppsAndMatchesPromise = filteredListAppsPromise.then(result => {
        const hashes = result.map(({ hash }) => hash);
        const matches = result.length
          ? managerApiRepository
              .getAppsByHash(hashes)
              .then(matches => matches.map(appV2 => (appV2 ? mapApplicationV2ToApp(appV2) : null)))
          : [];
        return Promise.all([result, matches]);
      });

      /**
       * Sequence 2: get information about current and latest firmware available
       * for the device
       */

      const deviceVersionPromise = managerApiRepository.getDeviceVersion({
        targetId: deviceInfo.targetId,
        providerId: provider,
      });

      const currentFirmwarePromise = deviceVersionPromise.then(deviceVersion =>
        managerApiRepository.getCurrentFirmware({
          deviceId: deviceVersion.id,
          version: deviceInfo.version,
          providerId: provider,
        }),
      );

      const latestFirmwarePromise = currentFirmwarePromise.then(currentFirmware =>
        getLatestFirmwareForDeviceUseCase(deviceInfo, managerApiRepository).then(
          updateAvailable => ({
            ...currentFirmware,
            updateAvailable,
          }),
        ),
      );

      /**
       * Sequence 3: get catalog of apps available for the device
       */

      const catalogForDevicesPromise = managerApiRepository
        .catalogForDevice({
          provider,
          targetId: deviceInfo.targetId,
          firmwareVersion: deviceInfo.version,
        })
        .then(apps => apps.map(mapApplicationV2ToApp));

      /**
       * Sequence 4: list all currencies, sorted by market cp
       */

      const sortedCryptoCurrenciesPromise = currenciesByMarketcap(
        listCryptoCurrencies(managerDevModeEnabled, true),
      );

      /**
       * Sequence 5: get language pack available for the device
       */

      const languagePackForDevicePromise = managerApiRepository.getLanguagePackagesForDevice(
        deviceInfo,
        forceProvider,
      );

      /* Running all sequences 1 2 3 4 5 defined above in parallel */
      const [[listApps, matches], catalogForDevice, firmware, sortedCryptoCurrencies, languages] =
        await Promise.all([
          listAppsAndMatchesPromise,
          catalogForDevicesPromise,
          latestFirmwarePromise,
          sortedCryptoCurrenciesPromise,
          languagePackForDevicePromise,
        ]);

      /**
       * Associate a market cap sorting index to each app of the catalog of
       * available apps.
       */

      catalogForDevice.forEach(app => {
        const crypto = app.currencyId && findCryptoCurrencyById(app.currencyId);
        if (crypto) {
          app.indexOfMarketCap = sortedCryptoCurrencies.indexOf(crypto);
        }
      });

      /**
       * Aggregate the data obtained above to build the list of installed apps
       * with their full metadata.
       */

      const installedList: App[] = [];

      listApps.forEach(({ name: localName, hash: localHash }, index) => {
        const matchFromHash = matches[index];
        if (matchFromHash && matchFromHash.hash === localHash) {
          installedList.push(matchFromHash);
          return;
        }

        // If the hash is not static (ex: Fido app) we need to find the app by its name using the catalog
        const matchFromCatalog = catalogForDevice.find(({ name }) => name === localName);
        tracer.trace(`Falling back to catalog for ${localName}`, {
          localName,
          matchFromCatalog: Boolean(matchFromCatalog),
        });
        if (matchFromCatalog) {
          installedList.push(matchFromCatalog);
        }
      });

      tracer.trace("Installed and in catalog apps", {
        installedApps: installedList.length,
        inCatalogApps: catalogForDevice.length,
      });

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

        const blocks = Math.ceil((bytes || appInCatalog.bytes || 0) / bytesPerBlock);

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
            managerDevModeEnabled || !isDevTools || name in installedAppNames,
        )
        .map(({ name }) => name);

      /**
       * Obtain remaining metadata:
       * - Ledger Stax custom picture: number of blocks taken in storage
       * - Installed language pack
       * - Device name
       * */

      // Stax specific, account for the size of the CLS for the storage bar.
      let customImageBlocks = 0;
      if (deviceModelId === DeviceModelId.stax && !deviceInfo.isRecoveryMode) {
        const customImageSize = await staxFetchImageSize(transport);
        if (customImageSize) {
          customImageBlocks = Math.ceil(customImageSize / bytesPerBlock);
        }
      }

      const languageId: number = deviceInfo.languageId || languageIds.english;
      const installedLanguagePack = languages.find(
        lang => lang.language === idsToLanguage[languageId],
      );

      // Will not prompt user since we've allowed secure channel already.
      const deviceName = await getDeviceName(transport);

      const result: ListAppsResult = {
        appByName,
        appsListNames,
        deviceInfo,
        deviceModelId,
        installed,
        installedAvailable: !!installedList,
        installedLanguagePack,

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
      },
    );

    return () => {
      if (sub) sub.unsubscribe();
    };
  });
};

/* eslint-disable camelcase */
// Higher level cache on top of Manager
import semver from "semver";
import chunk from "lodash/chunk";
import type { DeviceModelId } from "@ledgerhq/devices";
import { UnknownMCU } from "@ledgerhq/errors";
import type {
  ApplicationVersion,
  DeviceInfo,
  OsuFirmware,
  FirmwareUpdateContext,
} from "../types/manager";
import { listCryptoCurrencies } from "../currencies";
import ManagerAPI from "../api/Manager";
import { getProviderId } from "./provider";
import { Language } from "../types/languages";
export { getProviderId };
const ICONS_FALLBACK = {
  bitcoin_testnet: "bitcoin",
};
const oldAppsInstallDisabled = [
  "Crypto.com Chain",
  "ZenCash",
  "Ripple",
  "Ontology",
  "Zcoin",
];

const canHandleInstall = (app: ApplicationVersion) =>
  !oldAppsInstallDisabled.includes(app.name) &&
  !listCryptoCurrencies(true, true).some(
    (coin) =>
      coin.managerAppName &&
      coin.terminated &&
      coin.managerAppName.toLowerCase() === app.name.toLowerCase()
  );

const CacheAPI = {
  // TODO: Move to new ManagerAPI
  // When ready, the manager api will return an icon url instead of a name
  getIconUrl: (icon: string): string => {
    const icn = ICONS_FALLBACK[icon] || icon;
    return `https://cdn.live.ledger.com/icons/${icn}.png`;
  },
  getFirmwareVersion: (firmware: OsuFirmware): string =>
    firmware.name.replace("-osu", ""),
  // TO BE CONFIRMED – LL-2568
  firmwareUpdateNeedsLegacyBlueResetInstructions: (
    deviceInfo: DeviceInfo,
    deviceModelId: DeviceModelId
  ) =>
    deviceModelId === "blue" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "2.1.1"),
  // TO BE CONFIRMED – LL-2564
  firmwareUpdateWillResetSeed: (
    deviceInfo: DeviceInfo,
    deviceModelId: DeviceModelId,
    _firmware: FirmwareUpdateContext
  ) =>
    deviceModelId === "blue" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "2.1.1"),
  firmwareUpdateWillUninstallApps: (
    _deviceInfo: DeviceInfo,
    _deviceModelId: DeviceModelId
  ) => true,
  // true for all? TO BE CONFIRMED – LL-2710
  firmwareUpdateRequiresUserToUninstallApps: (
    deviceModel: DeviceModelId,
    deviceInfo: DeviceInfo
  ): boolean =>
    deviceModel === "nanoS" &&
    semver.lte(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.4.2"),
  firmwareUnsupported: (
    deviceModel: DeviceModelId,
    deviceInfo: DeviceInfo
  ): boolean =>
    deviceModel === "nanoS" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.3.0"),
  formatHashName: (
    input: string,
    deviceModel?: DeviceModelId,
    deviceInfo?: DeviceInfo
  ): string[] => {
    const shouldEllipsis =
      deviceModel && deviceInfo
        ? deviceModel === "blue" ||
          (deviceModel === "nanoS" &&
            semver.lt(
              semver.valid(semver.coerce(deviceInfo.version)) || "",
              "1.6.0"
            ))
        : true;
    const shouldSplit =
      deviceInfo && deviceModel
        ? (deviceModel === "nanoS" &&
            semver.gte(
              semver.valid(semver.coerce(deviceInfo.version)) || "",
              "1.6.0"
            )) ||
          deviceModel === "nanoX"
        : false;
    const hash = (input || "").toUpperCase();
    const splitLength = deviceModel === "nanoS" ? 16 : 17;
    return shouldSplit
      ? chunk(hash.split(""), splitLength).map((item) => item.join(""))
      : hash.length > 8 && shouldEllipsis
      ? [`${hash.slice(0, 4)}...${hash.substr(-4)}`]
      : [hash];
  },
  canHandleInstall,
  getLatestFirmwareForDevice: async (
    deviceInfo: DeviceInfo
  ): Promise<FirmwareUpdateContext | null | undefined> => {
    const mcusPromise = ManagerAPI.getMcus();
    // Get device infos from targetId
    const deviceVersion = await ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      getProviderId(deviceInfo)
    );
    let osu;

    if (deviceInfo.isOSU) {
      osu = await ManagerAPI.getCurrentOSU({
        deviceId: deviceVersion.id,
        provider: getProviderId(deviceInfo),
        version: deviceInfo.version,
      });
    } else {
      // Get firmware infos with firmware name and device version
      const seFirmwareVersion = await ManagerAPI.getCurrentFirmware({
        version: deviceInfo.version,
        deviceId: deviceVersion.id,
        provider: getProviderId(deviceInfo),
      });
      // Fetch next possible firmware
      osu = await ManagerAPI.getLatestFirmware({
        current_se_firmware_final_version: seFirmwareVersion.id,
        device_version: deviceVersion.id,
        provider: getProviderId(deviceInfo),
      });
    }

    if (!osu) {
      return null;
    }

    const final = await ManagerAPI.getFinalFirmwareById(
      osu.next_se_firmware_final_version
    );
    const mcus = await mcusPromise;
    const currentMcuVersion = mcus.find(
      (mcu) => mcu.name === deviceInfo.mcuVersion
    );
    if (!currentMcuVersion) throw new UnknownMCU();
    const shouldFlashMCU = !final.mcu_versions.includes(currentMcuVersion.id);
    return {
      final,
      osu,
      shouldFlashMCU,
    };
  },
  // get list of available languages for a given deviceInfo
  getAvailableLanguagesDevice: async (deviceInfo: DeviceInfo): Promise<Language[]> => {
    const languagePackages = await ManagerAPI.getLanguagePackagesForDevice(deviceInfo);
    const languages = languagePackages.map((pack) => pack.language);
    
    if(!languages.includes("english")) {
      languages.push("english"); // english is always available
    }

    return languages;
  },
  // get list of apps for a given deviceInfo
  getAppsList: async (
    deviceInfo: DeviceInfo,
    isDevMode = false, // TODO getFullListSortedCryptoCurrencies can be a local function.. too much dep for now
    getFullListSortedCryptoCurrencies: any = () => Promise.resolve([])
  ): Promise<ApplicationVersion[]> => {
    console.warn("deprecated: use @ledgerhq/live-common/src/apps/* instead");
    if (deviceInfo.isOSU || deviceInfo.isBootloader) return Promise.resolve([]);
    const deviceVersionP = ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      getProviderId(deviceInfo)
    );
    const firmwareDataP = deviceVersionP.then((deviceVersion) =>
      ManagerAPI.getCurrentFirmware({
        deviceId: deviceVersion.id,
        version: deviceInfo.version,
        provider: getProviderId(deviceInfo),
      })
    );
    const applicationsByDeviceP = Promise.all([
      deviceVersionP,
      firmwareDataP,
    ]).then(([deviceVersion, firmwareData]) =>
      ManagerAPI.applicationsByDevice({
        provider: getProviderId(deviceInfo),
        current_se_firmware_final_version: firmwareData.id,
        device_version: deviceVersion.id,
      })
    );
    const [
      applicationsList,
      compatibleAppVersionsList,
      sortedCryptoCurrencies,
    ] = await Promise.all([
      ManagerAPI.listApps(),
      applicationsByDeviceP,
      getFullListSortedCryptoCurrencies(),
    ]);
    const filtered = isDevMode
      ? compatibleAppVersionsList.slice(0)
      : compatibleAppVersionsList.filter((version) => {
          const app = applicationsList.find((e) => e.id === version.app);

          if (app) {
            return app.category !== 2;
          }

          return false;
        });
    const sortedCryptoApps: ApplicationVersion[] = [];
    // sort by crypto first
    sortedCryptoCurrencies.forEach((crypto) => {
      const app = filtered.find(
        (item) =>
          item.name.toLowerCase() === crypto.managerAppName.toLowerCase()
      );

      if (app) {
        filtered.splice(filtered.indexOf(app), 1);
        sortedCryptoApps.push({ ...app, currency: crypto });
      }
    });
    return sortedCryptoApps.concat(filtered);
  },
};
export default CacheAPI;

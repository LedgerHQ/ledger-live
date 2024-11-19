/* eslint-disable camelcase */
// Higher level cache on top of Manager
import semver from "semver";
import chunk from "lodash/chunk";
import type { DeviceModelId } from "@ledgerhq/devices";
import ManagerAPI from "./api";
import { getProviderId } from "./provider";
import type {
  Language,
  DeviceInfo,
  FirmwareUpdateContext,
  OsuFirmware,
} from "@ledgerhq/types-live";
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
  "Elrond",
];

const canHandleInstall = (app: { name: string }): boolean =>
  !oldAppsInstallDisabled.includes(app.name);

const CacheAPI = {
  // TODO: Move to new ManagerAPI
  // When ready, the manager api will return an icon url instead of a name
  getIconUrl: (icon: string): string => {
    const icn = ICONS_FALLBACK[icon] || icon;
    return `https://cdn.live.ledger.com/icons/${icn}.png`;
  },
  getFirmwareVersion: (firmware: OsuFirmware): string => firmware.name.replace("-osu", ""),
  // TO BE CONFIRMED – LL-2568
  firmwareUpdateNeedsLegacyBlueResetInstructions: (
    deviceInfo: DeviceInfo,
    deviceModelId: DeviceModelId,
  ) =>
    deviceModelId === "blue" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "2.1.1"),
  // TO BE CONFIRMED – LL-2564
  firmwareUpdateWillResetSeed: (
    deviceInfo: DeviceInfo,
    deviceModelId: DeviceModelId,
    _firmware: FirmwareUpdateContext,
  ) =>
    deviceModelId === "blue" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "2.1.1"),
  firmwareUpdateWillUninstallApps: (_deviceInfo: DeviceInfo, _deviceModelId: DeviceModelId) => true,
  // true for all? TO BE CONFIRMED – LL-2710
  firmwareUpdateRequiresUserToUninstallApps: (
    deviceModel: DeviceModelId,
    deviceInfo: DeviceInfo,
  ): boolean =>
    deviceModel === "nanoS" &&
    semver.lte(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.4.2"),
  firmwareUnsupported: (deviceModel: DeviceModelId, deviceInfo: DeviceInfo): boolean =>
    deviceModel === "nanoS" &&
    semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.3.0"),
  formatHashName: (
    input: string,
    deviceModel?: DeviceModelId,
    deviceInfo?: DeviceInfo,
  ): string[] => {
    const shouldEllipsis =
      deviceModel && deviceInfo
        ? deviceModel === "blue" ||
          (deviceModel === "nanoS" &&
            semver.lt(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.6.0"))
        : true;
    const shouldSplit =
      deviceInfo && deviceModel
        ? (deviceModel === "nanoS" &&
            semver.gte(semver.valid(semver.coerce(deviceInfo.version)) || "", "1.6.0")) ||
          deviceModel === "nanoX"
        : false;
    const hash = (input || "").toUpperCase();
    const splitLength = deviceModel === "nanoS" ? 16 : 17;
    return shouldSplit
      ? chunk(hash.split(""), splitLength).map(item => item.join(""))
      : hash.length > 8 && shouldEllipsis
        ? [`${hash.slice(0, 4)}...${hash.substr(-4)}`]
        : [hash];
  },
  canHandleInstall,

  // get list of available languages for a given deviceInfo
  getAvailableLanguagesDevice: async (deviceInfo: DeviceInfo): Promise<Language[]> => {
    const languagePackages = await ManagerAPI.getLanguagePackagesForDevice(deviceInfo);
    const languages = languagePackages.map(pack => pack.language);

    if (!languages.includes("english")) {
      languages.push("english"); // english is always available
    }

    return languages;
  },
};
export default CacheAPI;

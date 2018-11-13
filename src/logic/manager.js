// @flow
/* eslint-disable camelcase */
// Higher level cache on top of Manager

import type {
  ApplicationVersion,
  DeviceInfo,
  Firmware,
} from "../types/manager";
import { getFullListSortedCryptoCurrencies } from "../countervalues";
import ManagerAPI from "../api/Manager";

const ICONS_FALLBACK = {
  bitcoin_testnet: "bitcoin",
};

const CacheAPI = {
  // TODO: Move to new ManagerAPI
  // When ready, the manager api will return an icon url instead of a name
  getIconUrl: (icon: string): string => {
    const icn = ICONS_FALLBACK[icon] || icon;
    return `https://api.ledgerwallet.com/update/assets/icons/${icn}`;
  },

  getFirmwareVersion: (firmware: Firmware): string =>
    firmware.name.replace("-osu", ""),

  formatHashName: (hash: string): string => hash,

  // to check with firmware team if full hash is displayed or we need this:
  /*
    hash = (hash || "").toUpperCase();
    return hash.length > 8 ? `${hash.slice(0, 4)}...${hash.substr(-4)}` : hash;
    */

  getLatestFirmwareForDevice: async (
    deviceInfo: DeviceInfo,
  ): Promise<?Firmware> => {
    // Get device infos from targetId
    const deviceVersion = await ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      deviceInfo.providerId,
    );

    // Get firmware infos with firmware name and device version
    const seFirmwareVersion = await ManagerAPI.getCurrentFirmware({
      fullVersion: deviceInfo.fullVersion,
      deviceId: deviceVersion.id,
      provider: deviceInfo.providerId,
    });

    // Fetch next possible firmware
    const se_firmware_osu_version = await ManagerAPI.getLatestFirmware({
      current_se_firmware_final_version: seFirmwareVersion.id,
      device_version: deviceVersion.id,
      provider: deviceInfo.providerId,
    });

    if (!se_firmware_osu_version) {
      return null;
    }

    const { next_se_firmware_final_version } = se_firmware_osu_version;
    const seFirmwareFinalVersion = await ManagerAPI.getFinalFirmwareById(
      next_se_firmware_final_version,
    );

    const mcus = await ManagerAPI.getMcus();

    const currentMcuVersionId: Array<number> = mcus
      .filter(mcu => mcu.name === deviceInfo.mcuVersion)
      .map(mcu => mcu.id);

    if (!seFirmwareFinalVersion.mcu_versions.includes(...currentMcuVersionId)) {
      return {
        ...se_firmware_osu_version,
        shouldFlashMcu: true,
      };
    }

    return { ...se_firmware_osu_version, shouldFlashMcu: false };
  },

  shouldFlashMcu: async (deviceInfo: DeviceInfo): Promise<boolean> => {
    if (!deviceInfo.isOSU) return false;
    const res = await CacheAPI.getLatestFirmwareForDevice(deviceInfo);
    return res ? res.shouldFlashMcu : false;
  },

  // get list of apps for a given deviceInfo
  getAppsList: async (
    deviceInfo: DeviceInfo,
    isDevMode: boolean = false,
  ): Promise<ApplicationVersion[]> => {
    if (deviceInfo.isOSU || deviceInfo.isBootloader) return Promise.resolve([]);

    const deviceVersionP = ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      deviceInfo.providerId,
    );

    const firmwareDataP = deviceVersionP.then(deviceVersion =>
      ManagerAPI.getCurrentFirmware({
        deviceId: deviceVersion.id,
        fullVersion: deviceInfo.fullVersion,
        provider: deviceInfo.providerId,
      }),
    );

    const applicationsByDeviceP = Promise.all([
      deviceVersionP,
      firmwareDataP,
    ]).then(([deviceVersion, firmwareData]) =>
      ManagerAPI.applicationsByDevice({
        provider: deviceInfo.providerId,
        current_se_firmware_final_version: firmwareData.id,
        device_version: deviceVersion.id,
      }),
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
      : compatibleAppVersionsList.filter(version => {
          const app = applicationsList.find(e => e.id === version.app);
          if (app) {
            return app.category !== 2;
          }
          return false;
        });
    const sortedCryptoApps = [];
    // sort by crypto first
    sortedCryptoCurrencies.forEach(crypto => {
      const app = filtered.find(
        item => item.name.toLowerCase() === crypto.managerAppName.toLowerCase(),
      );
      if (app) {
        filtered.splice(filtered.indexOf(app), 1);
        sortedCryptoApps.push(app);
      }
    });

    return sortedCryptoApps.concat(filtered);
  },
};

export default CacheAPI;

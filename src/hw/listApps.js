// @flow

import { log } from "@ledgerhq/logs";
import type { ApplicationVersion, DeviceInfo } from "../types/manager";
import { listCryptoCurrencies } from "../currencies";
import ManagerAPI from "../api/Manager";
import { getEnv } from "../env";
import { currenciesByMarketcap } from "../currencies";
import Transport from "@ledgerhq/hw-transport";

export const listInstalledApps = (
  transport: Transport<*>,
  deviceInfo: DeviceInfo
): Promise<*> =>
  ManagerAPI.listInstalledApps(transport, {
    targetId: deviceInfo.targetId,
    perso: "perso_11"
  }).toPromise();

const listApps = async (
  transport: Transport<*>,
  deviceInfo: DeviceInfo,
  _sortBy?: "marketcap" | "name" // TODO use
): Promise<ApplicationVersion[]> => {
  if (deviceInfo.isOSU || deviceInfo.isBootloader) return Promise.resolve([]);

  const installedP = listInstalledApps(transport, deviceInfo).catch(e => {
    log("hw", "failed to get installed apps: " + e);
    return [];
  });

  const deviceVersionP = ManagerAPI.getDeviceVersion(
    deviceInfo.targetId,
    deviceInfo.providerId
  );

  const firmwareDataP = deviceVersionP.then(deviceVersion =>
    ManagerAPI.getCurrentFirmware({
      deviceId: deviceVersion.id,
      version: deviceInfo.version,
      provider: deviceInfo.providerId
    })
  );

  const applicationsByDeviceP = Promise.all([
    deviceVersionP,
    firmwareDataP
  ]).then(([deviceVersion, firmwareData]) =>
    ManagerAPI.applicationsByDevice({
      provider: deviceInfo.providerId,
      current_se_firmware_final_version: firmwareData.id,
      device_version: deviceVersion.id
    })
  );

  const [
    installed,
    applicationsList,
    compatibleAppVersionsList,
    sortedCryptoCurrencies
  ] = await Promise.all([
    installedP,
    ManagerAPI.listApps(),
    applicationsByDeviceP,
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

  const sortedCryptoApps = [];
  // sort by crypto first
  sortedCryptoCurrencies.forEach(crypto => {
    const app = filtered.find(
      item => item.name.toLowerCase() === crypto.managerAppName.toLowerCase()
    );
    if (app) {
      filtered.splice(filtered.indexOf(app), 1);
      sortedCryptoApps.push({ ...app, currency: crypto });
    }
  });

  return sortedCryptoApps.concat(filtered).map(app => {
    const ins = installed.find(i => app.name === i.name);
    return {
      ...app,
      installed: !!ins,
      updated: ins ? ins.hash === app.hash : false
    };
  });
};

export default listApps;

// @flow

import { log } from "@ledgerhq/logs";
import type { DeviceInfo, ApplicationVersion } from "../types/manager";
import type { ListAppsResult } from "./types";
import { listCryptoCurrencies } from "../currencies";
import ManagerAPI from "../api/Manager";
import { getEnv } from "../env";
import { currenciesByMarketcap } from "../currencies";
import hwListApps from "../hw/listApps";
import Transport from "@ledgerhq/hw-transport";

const defaults: {
  inferAppSize: ({ key?: string, hash?: string }) => number,
  lenseAppHash: ApplicationVersion => string
} = {
  inferAppSize: () => 0,
  lenseAppHash: app => app.hash
};

export const listInstalledApps = (
  transport: Transport<*>,
  deviceInfo: DeviceInfo
): Promise<Array<{ name: string, hash: string }>> =>
  ManagerAPI.listInstalledApps(transport, {
    targetId: deviceInfo.targetId,
    perso: "perso_11"
  }).toPromise();

export const listApps = async (
  transport: Transport<*>,
  deviceInfo: DeviceInfo,
  opts?: $Shape<typeof defaults>
): Promise<ListAppsResult> => {
  if (deviceInfo.isOSU || deviceInfo.isBootloader) {
    return Promise.resolve({
      blocksByKey: {},
      hashesByKey: {},
      appByName: {},
      apps: [],
      installedAvailable: false,
      installed: [],
      deviceInfo
    });
  }

  const { lenseAppHash, inferAppSize } = { ...defaults, ...opts };

  const installedP = listInstalledApps(transport, deviceInfo)
    .then(apps =>
      apps.map(({ name, hash }) => ({
        name,
        hash,
        blocks: inferAppSize({ hash })
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
    [installedList, installedAvailable],
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

  log(
    "list-apps",
    `${installedList.length} apps installed. ${applicationsList.length} apps store total. ${filtered.length} available.`,
    { installedList }
  );

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

  const apps = sortedCryptoApps.concat(filtered);

  const installed = installedList.map(({ name, hash, blocks }) => {
    const ins = apps.find(i => name === i.name);
    return {
      name,
      updated: ins ? lenseAppHash(ins) === hash : false,
      blocks,
      hash
    };
  });

  const appByName = {};
  const blocksByKey = {};
  const hashesByKey = {};
  compatibleAppVersionsList.concat(apps).forEach(app => {
    appByName[app.name] = app;
    blocksByKey[app.firmware] = inferAppSize({ key: app.firmware });
    hashesByKey[app.firmware] = lenseAppHash(app);
  });

  return {
    blocksByKey,
    hashesByKey,
    appByName,
    apps,
    installed,
    deviceInfo,
    installedAvailable
  };
};

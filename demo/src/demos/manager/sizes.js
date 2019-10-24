// @flow

import type {
  DeviceInfo,
  ApplicationVersion
} from "@ledgerhq/live-common/lib/types/manager";
import type { InstalledItem } from "@ledgerhq/live-common/lib/apps/types";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { findCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import type { DeviceModel } from "@ledgerhq/devices";
import appInfos from "./app_infos.json";
import firmwareBlocks from "./firmware_blocks.json";

const blockSize = 4 * 1024;

export const formatSize = (size: number) =>
  !size ? "" : Math.round(100 * (size / 1024)) / 100 + "Kb";

export const lenseAppHash = (app: ApplicationVersion) => {
  const entry = appInfos.find(i => i.key === app.firmware);
  return entry ? entry.hash : "";
};

const inferAppBytes = ({ key, hash }: *) => {
  const entry = appInfos.find(
    a => (key && a.key === key) || (hash && a.hash === hash)
  );
  if (entry) {
    return entry.size;
  }
  return 0;
};

// we should just use bytes in the data to keep that precision in when possible.
export const inferAppSize = (search: *) =>
  Math.ceil(inferAppBytes(search) / blockSize);

export const blockToBytes = block => block * blockSize;

export const getOsBlocks = (
  deviceModel: DeviceModel,
  deviceInfo: DeviceInfo
): number =>
  firmwareBlocks[deviceModel.id.toLowerCase() + "/" + deviceInfo.version] || 0;

export type AppData = {
  currency: ?CryptoCurrency,
  name: string,
  blocks: number,
  bytes: number
};

export type AppsDistribution = {
  totalBlocks: number,
  totalBytes: number,
  osBlocks: number,
  osBytes: number,
  apps: Array<AppData>,
  appsSpaceBlocks: number,
  appsSpaceBytes: number,
  totalAppsBlocks: number,
  totalAppsBytes: number,
  freeSpaceBlocks: number,
  freeSpaceBytes: number
};

export const distribute = (a: {
  deviceModel: DeviceModel,
  deviceInfo: DeviceInfo,
  installed: InstalledItem[]
}): AppsDistribution => {
  const totalBytes = a.deviceModel.memorySize;
  const totalBlocks = Math.floor(totalBytes / blockSize);
  const osBlocks = getOsBlocks(a.deviceModel, a.deviceInfo);
  const osBytes = blockSize * osBlocks;
  const appsSpaceBlocks = totalBlocks - osBlocks;
  const appsSpaceBytes = appsSpaceBlocks * blockSize;
  let totalAppsBlocks = 0;
  const apps: AppData[] = a.installed.map(app => {
    const { name, blocks } = app;
    totalAppsBlocks += blocks;
    const currency = findCryptoCurrency(c => c.managerAppName === name);
    return { currency, name, blocks, bytes: blocks * blockSize };
  });
  // .sort((a: AppData, b: AppData) => b.blocks - a.blocks);
  const totalAppsBytes = totalAppsBlocks * blockSize;
  const freeSpaceBlocks = appsSpaceBlocks - totalAppsBlocks;
  const freeSpaceBytes = freeSpaceBlocks * blockSize;
  return {
    totalBlocks,
    totalBytes,
    osBlocks,
    osBytes,
    apps,
    appsSpaceBlocks,
    appsSpaceBytes,
    totalAppsBlocks,
    totalAppsBytes,
    freeSpaceBlocks,
    freeSpaceBytes
  };
};

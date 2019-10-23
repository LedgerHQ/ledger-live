// @flow

import type {
  DeviceInfo,
  ApplicationVersion
} from "@ledgerhq/live-common/lib/types/manager";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import type { DeviceModel } from "@ledgerhq/devices";
import appSizeInfo from "./app_size_info.json";
import firmwareSize from "./firmware_size.json";

export const formatSize = (size: number) =>
  !size ? "" : Math.round(100 * (size / 1024)) / 100 + "Kb";

export const getAppSize = (app: ApplicationVersion): number =>
  appSizeInfo[app.firmware] || 0;

export const getOsSize = (
  deviceModel: DeviceModel,
  deviceInfo: DeviceInfo
): number =>
  firmwareSize[deviceModel.id.toLowerCase() + "/" + deviceInfo.version] || 0;

const blockSize = 4 * 1024;

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
  apps: Array<AppData>
};

export const distribute = (a: {
  deviceModel: DeviceModel,
  deviceInfo: DeviceInfo,
  apps: ApplicationVersion[]
}): AppsDistribution => {
  const totalBytes = a.deviceModel.memorySize;
  const totalBlocks = Math.floor(totalBytes / blockSize);
  const osBytes = getOsSize(a.deviceModel, a.deviceInfo);
  const osBlocks = Math.ceil(osBytes / blockSize);
  const apps: AppData[] = a.apps
    .map(app => {
      const { currency, name } = app;
      const bytes = getAppSize(app);
      const blocks = Math.ceil(bytes / blockSize);
      return { currency, name, blocks, bytes };
    })
    .sort((a: AppData, b: AppData) => a.blocks - b.blocks);
  return { totalBlocks, totalBytes, osBlocks, osBytes, apps };
};

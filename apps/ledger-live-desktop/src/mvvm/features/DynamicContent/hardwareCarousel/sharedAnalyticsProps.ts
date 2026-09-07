import { DeviceModelId } from "@ledgerhq/types-devices";

import type {
  HardwareCarouselDeviceModel,
  HardwareCarouselSharedAnalyticsProps,
} from "./analytics";

export function resolveHardwareCarouselDeviceModel(
  devicesModelList: readonly DeviceModelId[],
): HardwareCarouselDeviceModel | undefined {
  if (devicesModelList.includes(DeviceModelId.nanoX)) {
    return "lnx";
  }

  if (devicesModelList.includes(DeviceModelId.nanoSP)) {
    return "lnsp";
  }

  return undefined;
}

export function buildHardwareCarouselSharedAnalyticsProps(
  devicesModelList: readonly DeviceModelId[],
  personalRecoOptIn: boolean,
): HardwareCarouselSharedAnalyticsProps | undefined {
  const deviceModel = resolveHardwareCarouselDeviceModel(devicesModelList);
  if (!deviceModel) {
    return undefined;
  }

  return {
    deviceModel,
    personalRecoOptIn,
    offerType: personalRecoOptIn ? "discount" : "none",
    platform: "lwd",
  };
}

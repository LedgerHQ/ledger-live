import { useEffect, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "LLD/hooks/redux";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import {
  trackHardwareCarouselShown,
  type HardwareCarouselDeviceModel,
  type HardwareCarouselSharedAnalyticsProps,
} from "./analytics";

const EMPTY_DEVICES_MODEL_LIST: DeviceModelId[] = [];

function resolveHardwareCarouselDeviceModel(
  devicesModelList: DeviceModelId[],
): HardwareCarouselDeviceModel | undefined {
  if (devicesModelList.includes(DeviceModelId.nanoX)) {
    return "lnx";
  }

  if (devicesModelList.includes(DeviceModelId.nanoSP)) {
    return "lnsp";
  }

  return undefined;
}

export function useHardwareCarouselPageTracking(shouldTrack: boolean) {
  const devicesModelList = useSelector(devicesModelListSelector) ?? EMPTY_DEVICES_MODEL_LIST;
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);

  const sharedAnalyticsProps: HardwareCarouselSharedAnalyticsProps | undefined = useMemo(() => {
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
  }, [devicesModelList, personalRecoOptIn]);

  useEffect(() => {
    if (shouldTrack && sharedAnalyticsProps) {
      trackHardwareCarouselShown(sharedAnalyticsProps);
    }
  }, [shouldTrack, sharedAnalyticsProps]);

  return sharedAnalyticsProps;
}

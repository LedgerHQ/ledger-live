import { useEffect, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "~/context/hooks";
import {
  knownDeviceModelIdsSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import {
  trackHardwareCarouselShown,
  type HardwareCarouselDeviceModel,
  type HardwareCarouselSharedAnalyticsProps,
} from "./analytics";

function resolveHardwareCarouselDeviceModel(
  knownDeviceModelIds: Record<DeviceModelId, boolean>,
): HardwareCarouselDeviceModel | undefined {
  if (knownDeviceModelIds[DeviceModelId.nanoX]) {
    return "lnx";
  }

  if (knownDeviceModelIds[DeviceModelId.nanoSP]) {
    return "lnsp";
  }

  return undefined;
}

export function useHardwareCarouselPageTracking(shouldTrack: boolean) {
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const personalRecoOptIn = useSelector(personalizedRecommendationsEnabledSelector);

  const sharedAnalyticsProps: HardwareCarouselSharedAnalyticsProps | undefined = useMemo(() => {
    const deviceModel = resolveHardwareCarouselDeviceModel(knownDeviceModelIds);
    if (!deviceModel) {
      return undefined;
    }

    return {
      deviceModel,
      personalRecoOptIn,
      offerType: personalRecoOptIn ? "discount" : "none",
      platform: "lwm",
    };
  }, [knownDeviceModelIds, personalRecoOptIn]);

  useEffect(() => {
    if (shouldTrack && sharedAnalyticsProps) {
      trackHardwareCarouselShown(sharedAnalyticsProps);
    }
  }, [shouldTrack, sharedAnalyticsProps]);

  return sharedAnalyticsProps;
}

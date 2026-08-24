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
): HardwareCarouselDeviceModel {
  if (knownDeviceModelIds[DeviceModelId.nanoX]) {
    return "lnx";
  }

  return "lnsp";
}

export function useHardwareCarouselPageTracking(shouldTrack: boolean) {
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const personalRecoOptIn = useSelector(personalizedRecommendationsEnabledSelector);

  const sharedAnalyticsProps: HardwareCarouselSharedAnalyticsProps = useMemo(
    () => ({
      deviceModel: resolveHardwareCarouselDeviceModel(knownDeviceModelIds),
      personalRecoOptIn,
      offerType: personalRecoOptIn ? "discount" : "none",
      platform: "llm",
    }),
    [knownDeviceModelIds, personalRecoOptIn],
  );

  useEffect(() => {
    if (shouldTrack) {
      trackHardwareCarouselShown(sharedAnalyticsProps);
    }
  }, [shouldTrack, sharedAnalyticsProps]);

  return sharedAnalyticsProps;
}

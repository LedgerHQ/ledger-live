import { useEffect, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { trackHardwareCarouselShown, type HardwareCarouselSharedAnalyticsProps } from "./analytics";
import { buildHardwareCarouselSharedAnalyticsProps } from "./sharedAnalyticsProps";

const EMPTY_DEVICES_MODEL_LIST: [] = [];

export function useHardwareCarouselPageTracking(shouldTrack: boolean) {
  const devicesModelList = useSelector(devicesModelListSelector) ?? EMPTY_DEVICES_MODEL_LIST;
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);

  const sharedAnalyticsProps: HardwareCarouselSharedAnalyticsProps | undefined = useMemo(
    () => buildHardwareCarouselSharedAnalyticsProps(devicesModelList, personalRecoOptIn),
    [devicesModelList, personalRecoOptIn],
  );

  useEffect(() => {
    if (shouldTrack && sharedAnalyticsProps) {
      trackHardwareCarouselShown(sharedAnalyticsProps);
    }
  }, [shouldTrack, sharedAnalyticsProps]);

  return sharedAnalyticsProps;
}

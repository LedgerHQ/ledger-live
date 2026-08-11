import { useCallback, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "~/context/hooks";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import {
  knownDeviceModelIdsSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import {
  trackHardwareCarouselCloseAll,
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

export function useHardwareCarouselCloseAll(cardIds: readonly string[]) {
  const { dismissCards } = useDynamicContent();
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

  const handleCloseAll = useCallback(() => {
    if (!dismissCards(cardIds)) {
      return;
    }

    trackHardwareCarouselCloseAll(sharedAnalyticsProps);
  }, [cardIds, dismissCards, sharedAnalyticsProps]);

  return handleCloseAll;
}

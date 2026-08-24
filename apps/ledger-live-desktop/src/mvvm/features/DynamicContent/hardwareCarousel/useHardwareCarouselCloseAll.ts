import { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { DeviceModelId } from "@ledgerhq/types-devices";

import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { useDynamicContent } from "../hooks/useDynamicContent";
import {
  trackHardwareCarouselCloseAll,
  type HardwareCarouselDeviceModel,
  type HardwareCarouselSharedAnalyticsProps,
} from "./analytics";

const EMPTY_DEVICES_MODEL_LIST: DeviceModelId[] = [];

function resolveHardwareCarouselDeviceModel(
  devicesModelList: DeviceModelId[],
): HardwareCarouselDeviceModel {
  if (devicesModelList.includes(DeviceModelId.nanoX)) {
    return "lnx";
  }

  return "lnsp";
}

export function useHardwareCarouselCloseAll(cardIds: readonly string[]) {
  const { dismissCards } = useDynamicContent();
  const devicesModelList = useSelector(devicesModelListSelector) ?? EMPTY_DEVICES_MODEL_LIST;
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);

  const sharedAnalyticsProps: HardwareCarouselSharedAnalyticsProps = useMemo(
    () => ({
      deviceModel: resolveHardwareCarouselDeviceModel(devicesModelList),
      personalRecoOptIn,
      offerType: personalRecoOptIn ? "discount" : "none",
      platform: "lld",
    }),
    [devicesModelList, personalRecoOptIn],
  );

  const handleCloseAll = useCallback(() => {
    if (!dismissCards(cardIds)) {
      return;
    }

    trackHardwareCarouselCloseAll(sharedAnalyticsProps);
  }, [cardIds, dismissCards, sharedAnalyticsProps]);

  return handleCloseAll;
}

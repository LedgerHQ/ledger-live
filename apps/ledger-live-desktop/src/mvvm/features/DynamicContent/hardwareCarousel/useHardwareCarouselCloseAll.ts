import { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { useDynamicContent } from "../hooks/useDynamicContent";
import { trackHardwareCarouselCloseAll } from "./analytics";
import { buildHardwareCarouselSharedAnalyticsProps } from "./sharedAnalyticsProps";

const EMPTY_DEVICES_MODEL_LIST: [] = [];

export function useHardwareCarouselCloseAll(cardIds: readonly string[]) {
  const { dismissCards } = useDynamicContent();
  const devicesModelList = useSelector(devicesModelListSelector) ?? EMPTY_DEVICES_MODEL_LIST;
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);

  const sharedAnalyticsProps = useMemo(
    () => buildHardwareCarouselSharedAnalyticsProps(devicesModelList, personalRecoOptIn),
    [devicesModelList, personalRecoOptIn],
  );

  const handleCloseAll = useCallback(() => {
    if (!dismissCards(cardIds) || !sharedAnalyticsProps) {
      return;
    }

    trackHardwareCarouselCloseAll(sharedAnalyticsProps);
  }, [cardIds, dismissCards, sharedAnalyticsProps]);

  return handleCloseAll;
}

import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { desktopContentCardSelector } from "~/renderer/reducers/dynamicContent";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import type { LNSBannerLocation, LNSBannerState } from "../types";

const LNS_UPSELL_HIGH_TIER = "LNS_UPSELL_HIGH_TIER";

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSBannerState {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const ff = useFeature("lldNanoSUpsellBanners");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];

  const devicesModelList = useSelector(devicesModelListSelector);
  const hasOnlySeenLNS =
    devicesModelList.length === 1 && devicesModelList[0] === DeviceModelId.nanoS;

  const desktopCards = useSelector(desktopContentCardSelector);
  const isExcluded = isOptIn && desktopCards.some(c => c.extras.campaign === LNS_UPSELL_HIGH_TIER);

  const isEnabled = Boolean(ff?.enabled && params?.[location as keyof LNSBannerState["params"]]);
  const isShown = isEnabled && hasOnlySeenLNS && !isExcluded;

  return { isShown, params, tracking };
}

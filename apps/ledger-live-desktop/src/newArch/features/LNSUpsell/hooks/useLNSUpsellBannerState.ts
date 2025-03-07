import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import type { LNSBannerLocation, LNSBannerState } from "../types";

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSBannerState {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const ff = useFeature("lldNanoSUpsellBanners");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];

  const devicesModelList = useSelector(devicesModelListSelector);
  const hasOnlySeenLNS =
    devicesModelList.length === 1 && devicesModelList[0] === DeviceModelId.nanoS;

  type KeyOfParams = keyof LNSBannerState["params"];
  const isShown = Boolean(ff?.enabled && params?.[location as KeyOfParams] && hasOnlySeenLNS);

  return { isShown, params, tracking };
}

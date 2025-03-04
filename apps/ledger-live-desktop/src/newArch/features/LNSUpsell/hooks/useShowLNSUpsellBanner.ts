import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import type { LNSBannerLocation } from "../types";

export function useShowLNSUpsellBanner(location: LNSBannerLocation): boolean {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const ff = useFeature("lldNanoSUpsellBanners");
  const params = ff?.params?.[isOptIn ? "opted_in" : "opted_out"];

  const devicesModelList = useSelector(devicesModelListSelector);
  const hasOnlySeenLNS =
    devicesModelList.length === 1 && devicesModelList[0] === DeviceModelId.nanoS;

  return Boolean(ff?.enabled && params?.[location as keyof typeof params] && hasOnlySeenLNS);
}

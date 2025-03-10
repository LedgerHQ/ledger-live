import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
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

  const accounts = useSelector(accountsSelector);
  const swapCount = accounts.reduce((count, account) => count + account.swapHistory.length, 0);

  const enabled = ff?.enabled && params?.[location as keyof LNSBannerState["params"]];
  const isShown = Boolean(enabled && hasOnlySeenLNS && swapCount < 2);

  return { isShown, params, tracking };
}

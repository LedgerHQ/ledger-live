import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lib/lnsUpsell";
import { accountsSelector } from "~/reducers/accounts";
import {
  knownDeviceModelIdsSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import type { LNSBannerLocation } from "../types";

type LNSUpsellBannerState = {
  isShown: boolean;
  params?: LlmNanoSUpsellBannersConfig;
  tracking: "opted_in" | "opted_out";
};

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSUpsellBannerState {
  const isOptIn = useSelector(personalizedRecommendationsEnabledSelector);
  const ff = useFeature("llmNanoSUpsellBanners");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasOnlySeenOneModel = Object.values(knownDeviceModelIds).filter(Boolean).length === 1;
  const hasOnlySeenLNS = hasOnlySeenOneModel && knownDeviceModelIds.nanoS;

  const accounts = useSelector(accountsSelector);
  const swapCount = accounts.reduce((count, account) => count + account.swapHistory.length, 0);

  const isEnabled = ff?.enabled && params?.[location];
  const isShown = Boolean(isEnabled && hasOnlySeenLNS && swapCount < 2);

  return { isShown, params, tracking };
}

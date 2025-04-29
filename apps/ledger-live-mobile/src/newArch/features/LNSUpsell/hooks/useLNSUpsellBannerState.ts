import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import type { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lib/lnsUpsell";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
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

const LNS_UPSELL_HIGH_TIER = "LNS_UPSELL_HIGH_TIER";

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSUpsellBannerState {
  const isOptIn = useSelector(personalizedRecommendationsEnabledSelector);
  const ff = useFeature("llmNanoSUpsellBanners");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasOnlySeenOneModel = Object.values(knownDeviceModelIds).filter(Boolean).length === 1;
  const hasOnlySeenLNS = hasOnlySeenOneModel && knownDeviceModelIds.nanoS;

  const { mobileCards } = useDynamicContent();
  const isExcluded = isOptIn && mobileCards.some(c => c.extras.campaign === LNS_UPSELL_HIGH_TIER);

  const isEnabled = Boolean(ff?.enabled && params?.[location]);
  const isShown = isEnabled && hasOnlySeenLNS && !isExcluded;

  return { isShown, params, tracking };
}

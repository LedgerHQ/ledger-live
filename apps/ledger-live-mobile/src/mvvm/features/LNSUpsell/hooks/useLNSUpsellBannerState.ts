import { useSelector } from "~/context/hooks";
import { useFeature } from "@features/platform-feature-flags";
import type { LlmNanoSUpsellBannersConfig } from "@ledgerhq/types-live/lnsUpsell";
import type { Features } from "@shared/feature-flags";
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

type LargeScreenUpsellParams = NonNullable<Features["largeScreenUpsell"]["params"]>;
type LargeScreenUpsellBannerPlacement = keyof LargeScreenUpsellParams["banners"];

const LARGE_SCREEN_UPSELL_BANNER_PLACEMENT_BY_LOCATION = {
  manager: "my-ledger",
  accounts: "accounts",
  notification_center: "notification-center",
  wallet: "homepage",
} as const satisfies Record<LNSBannerLocation, LargeScreenUpsellBannerPlacement>;

const LNS_UPSELL_HIGH_TIER = "LNS_UPSELL_HIGH_TIER";

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSUpsellBannerState {
  const isOptIn = useSelector(personalizedRecommendationsEnabledSelector);
  const ff = useFeature("llmNanoSUpsellBanners");
  const largeScreenUpsell = useFeature("largeScreenUpsell");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];
  const placement = LARGE_SCREEN_UPSELL_BANNER_PLACEMENT_BY_LOCATION[location];
  const isPlacementEnabled = largeScreenUpsell?.params?.banners?.[placement] ?? true;

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasOnlySeenOneModel = Object.values(knownDeviceModelIds).filter(Boolean).length === 1;
  const hasOnlySeenLNS = hasOnlySeenOneModel && knownDeviceModelIds.nanoS;

  const { mobileCards } = useDynamicContent();
  const isExcluded = isOptIn && mobileCards.some(c => c.extras.campaign === LNS_UPSELL_HIGH_TIER);

  const isEnabled = Boolean(ff?.enabled && params?.[location] && isPlacementEnabled);
  const isShown = isEnabled && hasOnlySeenLNS && !isExcluded;

  return { isShown, params, tracking };
}

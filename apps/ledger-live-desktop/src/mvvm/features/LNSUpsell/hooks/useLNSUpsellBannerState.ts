import { useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  getLargeScreenUpsellEligibility,
  mapDevicesModelListToUpsellInputs,
} from "@features/flow-large-screen-upsell";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { desktopContentCardSelector } from "~/renderer/reducers/dynamicContent";
import {
  devicesModelListSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import {
  BANNER_PLACEMENT_BY_LOCATION,
  type LNSBannerLocation,
  type LNSBannerState,
} from "../types";

const LNS_UPSELL_HIGH_TIER = "LNS_UPSELL_HIGH_TIER";
const DEFAULT_UPGRADE_LINK =
  FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params?.opted_in.link ??
  "https://shop.ledger.com/pages/ledger-nano-upgrade-program";

export function useLNSUpsellBannerState(location: LNSBannerLocation): LNSBannerState {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const largeScreenUpsell = useFeature("largeScreenUpsell");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const isProfile = location === "profile";

  const placement = BANNER_PLACEMENT_BY_LOCATION[location];
  const isPlacementEnabled = largeScreenUpsell?.params?.banners?.[placement] ?? false;
  const ctaConfig = largeScreenUpsell?.params?.[tracking];
  const isCTAEnabled = isProfile || (ctaConfig?.enabled ?? false);
  const ctaLink =
    ctaConfig?.link?.trim() ||
    (isProfile
      ? largeScreenUpsell?.params?.opted_in.link?.trim() || DEFAULT_UPGRADE_LINK
      : undefined);
  const discountPercent = Math.round((largeScreenUpsell?.params?.discount ?? 0) * 100);

  const devicesModelList = useSelector(devicesModelListSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const eligibility = getLargeScreenUpsellEligibility(
    {
      ...mapDevicesModelListToUpsellInputs(devicesModelList),
      onboardingDate,
    },
    {
      audienceModels: largeScreenUpsell?.params?.audience?.models ?? {
        nanoS: false,
        nanoSP: false,
        nanoX: false,
      },
      cooldownDays: largeScreenUpsell?.params?.cooldownDays ?? { default: Infinity },
      now: new Date(),
    },
  );

  const desktopCards = useSelector(desktopContentCardSelector);
  const isExcluded = isOptIn && desktopCards.some(c => c.extras.campaign === LNS_UPSELL_HIGH_TIER);

  const isEnabled = Boolean(
    largeScreenUpsell?.enabled && isCTAEnabled && isPlacementEnabled && ctaLink,
  );
  const isShown = isEnabled && eligibility.isEligible && !isExcluded;
  const deviceModelId = eligibility.isEligible ? eligibility.deviceModelId : undefined;

  return { isShown, tracking, ctaLink, discountPercent, deviceModelId };
}

import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell/hooks/useLNSUpsellBannerState";
import type { LNSBannerLocation, LNSBannerState } from "LLD/features/LNSUpsell/types";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import lnsUpsellFallbackImageUrl from "~/renderer/images/lns-upsell-banner.webp";
import type { LNSBannerModel } from "./types";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");

  const { "%": discount, link: ctaLink, img } = state.params ?? {};
  const analyticsPage = AnalyticsPageMap[location];

  const imageUrl =
    typeof img === "string" && img.length > 0 ? img : lnsUpsellFallbackImageUrl;

  const handleCTAClick = () => {
    track("button_clicked", {
      button: ANALYTICS_BUTTON_CLICK,
      link: ctaLink,
      page: analyticsPage,
    });
    if (ctaLink) openURL(ctaLink);
  };

  const tracking = state.tracking;
  const variant = getVariant(location, state);

  return {
    location,
    variant,
    discount,
    tracking,
    handleCTAClick,
    imageUrl,
    shouldUseLumenMediaBanner: shouldDisplayBrazePlacement,
  };
}

const ANALYTICS_BUTTON_CLICK = "Level up wallet";

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  portfolio: "Portfolio",
  notification_center: "NotificationPanel",
} as const satisfies Record<LNSBannerLocation, unknown>;

function getVariant(location: LNSBannerLocation, state: LNSBannerState): LNSBannerModel["variant"] {
  if (!state.isShown) return { type: "none" };

  if (state.tracking === "opted_out" || location === "notification_center") {
    const icon = state.tracking === "opted_in" ? "SparksFill" : "Nano";
    return { type: "notification", icon };
  }

  return { type: "banner", image: state.params?.img };
}

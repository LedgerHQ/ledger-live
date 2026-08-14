import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell/hooks/useLNSUpsellBannerState";
import type { LNSBannerLocation, LNSBannerState } from "LLD/features/LNSUpsell/types";
import { toLargeScreenUpsellDeviceModelAnalyticsValue } from "LLD/features/LargeScreenUpsell/analytics";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import lnsUpsellPortfolioImageUrl from "~/renderer/images/lns-upsell-banner-portfolio.webp";
import lnsUpsellManagerImageUrl from "~/renderer/images/lns-upsell-banner-manager.webp";
import lnsUpsellNotificationCenterImageUrl from "~/renderer/images/lns-upsell-banner-notification-center.webp";
import type { LNSBannerModel } from "./types";

// Accounts reuses the Notification Center illustration (same audience, no dedicated asset).
const lnsUpsellImageByLocation: Record<LNSBannerLocation, string> = {
  portfolio: lnsUpsellPortfolioImageUrl,
  manager: lnsUpsellManagerImageUrl,
  notification_center: lnsUpsellNotificationCenterImageUrl,
  accounts: lnsUpsellNotificationCenterImageUrl,
};

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");

  const { ctaLink, discountPercent: discount, deviceModelId } = state;
  const analyticsPage = AnalyticsPageMap[location];
  const imageUrl = lnsUpsellImageByLocation[location];
  const deviceModel = deviceModelId
    ? toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId)
    : undefined;

  const handleCTAClick = () => {
    track("button_clicked", {
      button: ANALYTICS_BUTTON_CLICK,
      ...(deviceModel ? { deviceModel } : {}),
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

  return { type: "banner" };
}

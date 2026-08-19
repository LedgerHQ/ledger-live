import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
} from "@features/flow-large-screen-upsell";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell/hooks/useLNSUpsellBannerState";
import type { LNSBannerLocation, LNSBannerState } from "LLD/features/LNSUpsell/types";
import { toLargeScreenUpsellDeviceModelAnalyticsValue } from "LLD/features/LargeScreenUpsell/analytics";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import lnsUpsellPortfolioImageUrl from "~/renderer/images/lns-upsell-banner-portfolio.webp";
import lnsUpsellManagerImageUrl from "~/renderer/images/lns-upsell-banner-manager.webp";
import lnsUpsellNotificationCenterImageUrl from "~/renderer/images/lns-upsell-banner-notification-center.webp";
import type { LNSBannerModel } from "./types";

// Accounts and profile reuse the Notification Center illustration (no dedicated asset).
const lnsUpsellImageByLocation: Record<LNSBannerLocation, string> = {
  portfolio: lnsUpsellPortfolioImageUrl,
  manager: lnsUpsellManagerImageUrl,
  notification_center: lnsUpsellNotificationCenterImageUrl,
  accounts: lnsUpsellNotificationCenterImageUrl,
  profile: lnsUpsellNotificationCenterImageUrl,
};

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");

  const { ctaLink, discountPercent: discount, deviceModelId, tracking } = state;
  const analyticsPage = AnalyticsPageMap[location];
  const imageUrl = lnsUpsellImageByLocation[location];
  const deviceModel = deviceModelId
    ? toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId)
    : undefined;
  const resolvedCtaLink = resolveCtaLink(location, ctaLink);

  const handleCTAClick = () => {
    if (location === "profile") {
      const personalRecoOptIn = tracking === "opted_in";
      const sharedProps = {
        ...(deviceModel ? { deviceModel } : {}),
        personalRecoOptIn,
        offerType: personalRecoOptIn ? ("discount" as const) : ("none" as const),
        platform: "lwd" as const,
      };

      track("button_clicked", {
        button: PROFILE_ANALYTICS_BUTTON,
        page: analyticsPage,
        ...sharedProps,
      });
      track("deeplink_clicked", {
        page: analyticsPage,
        deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
        deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
        deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
        ...sharedProps,
      });
    } else {
      track("button_clicked", {
        button: ANALYTICS_BUTTON_CLICK,
        ...(deviceModel ? { deviceModel } : {}),
        link: resolvedCtaLink,
        page: analyticsPage,
      });
    }

    if (resolvedCtaLink) openURL(resolvedCtaLink);
  };

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
const PROFILE_ANALYTICS_BUTTON = "upgrade";

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  portfolio: "Portfolio",
  notification_center: "NotificationPanel",
  profile: "Profile",
} as const satisfies Record<LNSBannerLocation, unknown>;

function resolveCtaLink(location: LNSBannerLocation, ctaLink?: string): string | undefined {
  if (!ctaLink) return undefined;
  if (location !== "profile") return ctaLink;

  return buildLargeScreenUpsellCtaLink(
    ctaLink,
    "desktop",
    LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
  );
}

function getVariant(location: LNSBannerLocation, state: LNSBannerState): LNSBannerModel["variant"] {
  if (!state.isShown) return { type: "none" };

  if (state.tracking === "opted_out" || location === "notification_center") {
    const icon = state.tracking === "opted_in" ? "SparksFill" : "Nano";
    return { type: "notification", icon };
  }

  return { type: "banner" };
}

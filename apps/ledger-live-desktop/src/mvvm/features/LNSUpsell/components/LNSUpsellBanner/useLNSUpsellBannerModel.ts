import { useCallback, useEffect, useMemo } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
  type LargeScreenUpsellUtmContent,
} from "@features/flow-large-screen-upsell";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell/hooks/useLNSUpsellBannerState";
import type { LNSBannerLocation, LNSBannerState } from "LLD/features/LNSUpsell/types";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  type LargeScreenUpsellDeviceModelAnalyticsValue,
} from "LLD/features/LargeScreenUpsell/analytics";
import { track, trackPage } from "~/renderer/analytics/segment";
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

const PROFILE_PAGE = "Profile";

type SharedAnalyticsProps = Readonly<{
  deviceModel: LargeScreenUpsellDeviceModelAnalyticsValue;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwd";
}>;

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");

  const { ctaLink, discountPercent: discount, deviceModelId, tracking } = state;
  const analyticsPage = AnalyticsPageMap[location];
  const imageUrl = lnsUpsellImageByLocation[location];
  const deviceModel = deviceModelId
    ? toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId)
    : undefined;
  const personalRecoOptIn = tracking === "opted_in";
  const sharedAnalyticsProps = useMemo(
    () =>
      deviceModel
        ? {
            deviceModel,
            personalRecoOptIn,
            offerType: personalRecoOptIn ? ("discount" as const) : ("none" as const),
            platform: "lwd" as const,
          }
        : undefined,
    [deviceModel, personalRecoOptIn],
  );

  useEffect(() => {
    if (!state.isShown || !sharedAnalyticsProps) {
      return;
    }

    if (location === "profile") {
      trackProfilePageViewed(sharedAnalyticsProps);
      return;
    }

    const bannerPageName = BannerPageEventNameMap[location];
    if (bannerPageName) {
      trackBannerPageViewed(bannerPageName, sharedAnalyticsProps);
    }
  }, [location, sharedAnalyticsProps, state.isShown]);

  const handleCTAClick = useCallback(() => {
    if (!ctaLink || !sharedAnalyticsProps) {
      return;
    }

    const utmContent = UTMContentMap[location];
    const upsellLink = buildLargeScreenUpsellCtaLink(ctaLink, "desktop", utmContent);
    const pageName = BannerPageEventNameMap[location] || analyticsPage;

    track("button_clicked", {
      button: "upgrade",
      page: pageName,
      ...sharedAnalyticsProps,
    });

    track("deeplink_clicked", {
      page: pageName,
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...sharedAnalyticsProps,
    });

    if (upsellLink) {
      openURL(upsellLink);
    }
  }, [analyticsPage, ctaLink, location, sharedAnalyticsProps]);

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

function trackProfilePageViewed(sharedProps: SharedAnalyticsProps) {
  trackPage(PROFILE_PAGE, undefined, { name: PROFILE_PAGE, ...sharedProps }, true, false);
}

function trackBannerPageViewed(pageName: string, sharedProps: SharedAnalyticsProps) {
  trackPage(pageName, undefined, { name: pageName, ...sharedProps }, true, false);
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  portfolio: "Portfolio",
  notification_center: "NotificationPanel",
  profile: PROFILE_PAGE,
} as const satisfies Record<LNSBannerLocation, unknown>;

const BannerPageEventNameMap: Partial<Record<LNSBannerLocation, string>> = {
  portfolio: "banner upsell portfolio",
  notification_center: "banner upsell notification center",
  manager: "banner upsell my ledger",
  accounts: "banner upsell portfolio",
} as const;

const UTMContentMap: Record<LNSBannerLocation, LargeScreenUpsellUtmContent> = {
  portfolio: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
  notification_center: LARGE_SCREEN_UPSELL_UTM.content.notif_banner,
  manager: LARGE_SCREEN_UPSELL_UTM.content.my_ledger_banner,
  accounts: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
  profile: LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
} as const;

function getVariant(location: LNSBannerLocation, state: LNSBannerState): LNSBannerModel["variant"] {
  if (!state.isShown) return { type: "none" };

  if (state.tracking === "opted_out" || location === "notification_center") {
    const icon = state.tracking === "opted_in" ? "SparksFill" : "Nano";
    return { type: "notification", icon };
  }

  return { type: "banner" };
}

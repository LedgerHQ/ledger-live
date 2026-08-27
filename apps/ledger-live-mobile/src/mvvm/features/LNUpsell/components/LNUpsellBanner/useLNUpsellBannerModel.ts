import { useCallback, useEffect, useMemo } from "react";
import { Image, Linking } from "react-native";
import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
  type LargeScreenUpsellUtmContent,
} from "@features/flow-large-screen-upsell/utils/upsellCta";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  type LargeScreenUpsellDeviceModelAnalyticsValue,
} from "LLM/features/LargeScreenUpsell/analytics";
import { screen, track } from "~/analytics";
import type { LNBannerLocation, LNBannerModel } from "../../types";
import { useLNUpsellBannerState } from "../../hooks/useLNUpsellBannerState";

/* eslint-disable @typescript-eslint/no-require-imports */
// Accounts and Profile reuse the Notification Center illustration (same audience, no dedicated asset).
const lnsUpsellNotificationCenterImageUri = Image.resolveAssetSource(
  require("~/images/lns-upsell-banner-notification-center.webp"),
).uri;

const lnUpsellImageByLocation: Record<LNBannerLocation, string> = {
  wallet: Image.resolveAssetSource(require("~/images/lns-upsell-banner-wallet.webp")).uri,
  manager: Image.resolveAssetSource(require("~/images/lns-upsell-banner-manager.webp")).uri,
  notification_center: lnsUpsellNotificationCenterImageUri,
  accounts: lnsUpsellNotificationCenterImageUri,
  profile: lnsUpsellNotificationCenterImageUri,
};
/* eslint-enable @typescript-eslint/no-require-imports */

const PROFILE_PAGE = "Profile";

type SharedAnalyticsProps = Readonly<{
  deviceModel: LargeScreenUpsellDeviceModelAnalyticsValue;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwm";
}>;

type ProfileSharedAnalyticsProps = SharedAnalyticsProps;

export function useLNUpsellBannerModel(location: LNBannerLocation): LNBannerModel {
  const { isShown, ctaLink, discount, deviceModelId, tracking } = useLNUpsellBannerState(location);
  const analyticsPage = AnalyticsPageMap[location];
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
            platform: "lwm" as const,
          }
        : undefined,
    [deviceModel, personalRecoOptIn],
  );

  useEffect(() => {
    if (!isShown || !sharedAnalyticsProps) return;

    if (location === "profile") {
      trackProfilePageViewed(sharedAnalyticsProps);
    } else {
      const bannerPageName = BannerPageEventNameMap[location];
      if (bannerPageName) {
        trackBannerPageViewed(bannerPageName, sharedAnalyticsProps);
      }
    }
  }, [isShown, location, sharedAnalyticsProps]);

  const handleCTAPress = useCallback(() => {
    if (!ctaLink || !sharedAnalyticsProps) return;

    const utmContent = UTMContentMap[location];
    const upsellLink = buildLargeScreenUpsellCtaLink(ctaLink, "mobile", utmContent);
    const pageName = BannerPageEventNameMap[location] || analyticsPage;

    track("button_clicked", {
      button: "upgrade",
      page: pageName,
      ...sharedAnalyticsProps,
    });

    track("deeplink_clicked", {
      page: pageName,
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.mobile,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...sharedAnalyticsProps,
    });

    Linking.openURL(upsellLink);
  }, [analyticsPage, ctaLink, location, sharedAnalyticsProps]);

  return {
    location,
    isShown,
    discount,
    tracking,
    handleCTAPress,
    imageUrl: lnUpsellImageByLocation[location],
  };
}

function trackProfilePageViewed(sharedProps: ProfileSharedAnalyticsProps) {
  screen(PROFILE_PAGE, undefined, { name: PROFILE_PAGE, ...sharedProps }, false);
}

function trackBannerPageViewed(pageName: string, sharedProps: SharedAnalyticsProps) {
  screen(pageName, undefined, { name: pageName, ...sharedProps }, false);
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
  profile: PROFILE_PAGE,
} as const satisfies Record<LNBannerLocation, unknown>;

const BannerPageEventNameMap: Partial<Record<LNBannerLocation, string>> = {
  wallet: "banner upsell portfolio",
  notification_center: "banner upsell notification center",
  manager: "banner upsell my ledger",
  accounts: "banner upsell portfolio",
} as const;

const UTMContentMap: Record<LNBannerLocation, LargeScreenUpsellUtmContent> = {
  wallet: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
  notification_center: LARGE_SCREEN_UPSELL_UTM.content.notif_banner,
  manager: LARGE_SCREEN_UPSELL_UTM.content.my_ledger_banner,
  accounts: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
  profile: LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
} as const;

import { useCallback, useEffect, useMemo } from "react";
import { Image, Linking } from "react-native";
import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
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
const PROFILE_UPGRADE_BUTTON = "upgrade";

type ProfileSharedAnalyticsProps = Readonly<{
  deviceModel: LargeScreenUpsellDeviceModelAnalyticsValue;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwm";
}>;

export function useLNUpsellBannerModel(location: LNBannerLocation): LNBannerModel {
  const { isShown, ctaLink, discount, deviceModelId, tracking } = useLNUpsellBannerState(location);
  const analyticsPage = AnalyticsPageMap[location];
  const deviceModel = deviceModelId
    ? toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId)
    : undefined;
  const personalRecoOptIn = tracking === "opted_in";
  const profileAnalyticsProps = useMemo(
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
    if (location !== "profile" || !isShown || !profileAnalyticsProps) return;
    trackProfilePageViewed(profileAnalyticsProps);
  }, [isShown, location, profileAnalyticsProps]);

  const handleCTAPress = useCallback(() => {
    if (!ctaLink) return;

    if (location === "profile") {
      if (!profileAnalyticsProps) return;
      openProfileUpsell(ctaLink, profileAnalyticsProps);
      return;
    }

    track("button_clicked", {
      button: "Level up wallet",
      ...(deviceModel ? { deviceModel } : {}),
      link: ctaLink,
      page: analyticsPage,
    });
    Linking.openURL(ctaLink);
  }, [analyticsPage, ctaLink, deviceModel, location, profileAnalyticsProps]);

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

function openProfileUpsell(ctaLink: string, sharedProps: ProfileSharedAnalyticsProps) {
  const upsellLink = buildLargeScreenUpsellCtaLink(
    ctaLink,
    "mobile",
    LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
  );

  track("button_clicked", {
    button: PROFILE_UPGRADE_BUTTON,
    page: PROFILE_PAGE,
    ...sharedProps,
  });
  track("deeplink_clicked", {
    page: PROFILE_PAGE,
    deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.mobile,
    deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
    deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
    ...sharedProps,
  });

  Linking.openURL(upsellLink);
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
  profile: PROFILE_PAGE,
} as const satisfies Record<LNBannerLocation, unknown>;

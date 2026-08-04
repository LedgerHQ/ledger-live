import { Image, Linking } from "react-native";
import { toLargeScreenUpsellDeviceModelAnalyticsValue } from "LLM/features/LargeScreenUpsell";
import { track } from "~/analytics";
import type { LNBannerLocation, LNBannerModel } from "../../types";
import { useLNUpsellBannerState } from "../../hooks/useLNUpsellBannerState";

/* eslint-disable @typescript-eslint/no-require-imports */
// Accounts reuses the Notification Center illustration (same audience, no dedicated asset).
const lnsUpsellNotificationCenterImageUri = Image.resolveAssetSource(
  require("~/images/lns-upsell-banner-notification-center.webp"),
).uri;

const lnUpsellImageByLocation: Record<LNBannerLocation, string> = {
  wallet: Image.resolveAssetSource(require("~/images/lns-upsell-banner-wallet.webp")).uri,
  manager: Image.resolveAssetSource(require("~/images/lns-upsell-banner-manager.webp")).uri,
  notification_center: lnsUpsellNotificationCenterImageUri,
  accounts: lnsUpsellNotificationCenterImageUri,
};
/* eslint-enable @typescript-eslint/no-require-imports */

export function useLNUpsellBannerModel(location: LNBannerLocation): LNBannerModel {
  const { isShown, ctaLink, discount, deviceModelId, tracking } = useLNUpsellBannerState(location);
  const analyticsPage = AnalyticsPageMap[location];
  const deviceModel = deviceModelId
    ? toLargeScreenUpsellDeviceModelAnalyticsValue(deviceModelId)
    : undefined;

  const handleCTAPress = () => {
    if (!ctaLink) return;

    track("button_clicked", {
      button: "Level up wallet",
      ...(deviceModel ? { deviceModel } : {}),
      link: ctaLink,
      page: analyticsPage,
    });
    Linking.openURL(ctaLink);
  };

  return {
    location,
    isShown,
    discount,
    tracking,
    handleCTAPress,
    imageUrl: lnUpsellImageByLocation[location],
  };
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
} as const satisfies Record<LNBannerLocation, unknown>;

import { Image, Linking } from "react-native";
import { toLargeScreenUpsellDeviceModelAnalyticsValue } from "LLM/features/LargeScreenUpsell";
import { track } from "~/analytics";
import type { LNBannerLocation, LNBannerModel } from "../../types";
import { useLNUpsellBannerState } from "../../hooks/useLNUpsellBannerState";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lnUpsellImageUri = Image.resolveAssetSource(require("~/images/lns-upsell-banner.webp")).uri;

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
    imageUrl: lnUpsellImageUri,
  };
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
} as const satisfies Record<LNBannerLocation, unknown>;

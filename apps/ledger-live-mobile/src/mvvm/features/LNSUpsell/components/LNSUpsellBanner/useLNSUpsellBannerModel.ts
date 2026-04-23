import { Image, Linking } from "react-native";
import { track } from "~/analytics";
import type { LNSBannerLocation, LNSBannerModel } from "../../types";
import { useLNSUpsellBannerState } from "../../hooks/useLNSUpsellBannerState";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lnsUpsellFallbackImageUri = Image.resolveAssetSource(
  require("~/images/lns-upsell-banner.webp"),
).uri;

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const { isShown, params, tracking } = useLNSUpsellBannerState(location);

  const discount = params?.["%"];
  const ctaLink = params?.link;
  const img = params?.img;
  const analyticsPage = AnalyticsPageMap[location];

  const imageUrl = typeof img === "string" && img.length > 0 ? img : lnsUpsellFallbackImageUri;

  const handleCTAPress = () => {
    track("button_clicked", {
      button: "Level up wallet",
      link: ctaLink,
      page: analyticsPage,
    });
    if (ctaLink) Linking.openURL(ctaLink);
  };

  return { location, isShown, discount, tracking, handleCTAPress, imageUrl };
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
} as const satisfies Record<LNSBannerLocation, unknown>;

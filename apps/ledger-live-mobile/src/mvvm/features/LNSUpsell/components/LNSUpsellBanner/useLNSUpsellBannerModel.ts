import { Linking } from "react-native";
import { track } from "~/analytics";
import type { LNSBannerLocation, LNSBannerModel } from "./types";
import { useLNSUpsellBannerState } from "../../hooks/useLNSUpsellBannerState";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const { isShown, params, tracking } = useLNSUpsellBannerState(location);

  const { "%": discount, link: ctaLink } = params ?? {};
  const analyticsPage = AnalyticsPageMap[location];

  const handleCTAPress = () => {
    track("button_clicked", {
      button: "Level up wallet",
      link: ctaLink,
      page: analyticsPage,
    });
    if (ctaLink) Linking.openURL(ctaLink);
  };

  return { isShown, discount, tracking, handleCTAPress };
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
} as const satisfies Record<LNSBannerLocation, unknown>;

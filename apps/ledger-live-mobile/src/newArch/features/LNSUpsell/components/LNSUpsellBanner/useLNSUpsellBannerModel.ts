import { Linking } from "react-native";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/analytics";
import { accountsSelector } from "~/reducers/accounts";
import {
  knownDeviceModelIdsSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import type { LNSBannerLocation, LNSBannerModel } from "./types";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const isOptIn = useSelector(personalizedRecommendationsEnabledSelector);
  const ff = useFeature("llmNanoSUpsellBanners");
  const tracking = isOptIn ? "opted_in" : "opted_out";
  const params = ff?.params?.[tracking];

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const hasOnlySeenOneModel = Object.values(knownDeviceModelIds).filter(Boolean).length === 1;
  const hasOnlySeenLNS = hasOnlySeenOneModel && knownDeviceModelIds.nanoS;

  const accounts = useSelector(accountsSelector);
  const swapCount = accounts.reduce((count, account) => count + account.swapHistory.length, 0);

  const isEnabled = ff?.enabled && params?.[location];
  const isShown = Boolean(isEnabled && hasOnlySeenLNS && swapCount < 2);

  const { "%": discount, link: ctaLink } = params ?? {};
  const analitycsPage = AnalyticsPageMap[location];

  const handleCTAPress = () => {
    track("button_clicked", {
      button: "Level up wallet",
      link: ctaLink,
      page: analitycsPage,
    });
    ctaLink && Linking.openURL(ctaLink);
  };

  return { isShown, discount, tracking, handleCTAPress };
}

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  notification_center: "NotificationPanel",
  wallet: "Wallet",
} as const satisfies Record<LNSBannerLocation, unknown>;

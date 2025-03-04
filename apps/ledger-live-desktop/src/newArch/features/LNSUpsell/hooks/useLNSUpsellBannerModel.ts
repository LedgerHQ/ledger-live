import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import {
  AnalyticsButton,
  AnalyticsPage,
  type LNSBannerModel,
  type LNSBannerLocation,
} from "../types";
import { useShowLNSUpsellBanner } from "./useShowLNSUpsellBanner";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const ff = useFeature("lldNanoSUpsellBanners");
  const params = ff?.params?.[isOptIn ? "opted_in" : "opted_out"];

  const { "%": discount, img: image, link: ctaLink } = params ?? {};
  const analitycsPage = AnalyticsPageMap[location];

  const handleCTAClick = () => {
    track("button_clicked", {
      button: AnalyticsButton.CTA,
      link: ctaLink,
      page: analitycsPage,
    });
    ctaLink && openURL(ctaLink);
  };

  const tracking = isOptIn ? "optIn" : "optOut";
  const variant = useGetVariant(location, tracking);

  return { variant, discount, image, tracking, handleCTAClick };
}

const AnalyticsPageMap: Record<LNSBannerLocation, AnalyticsPage> = {
  manager: AnalyticsPage.Manager,
  accounts: AnalyticsPage.Accounts,
  portfolio: AnalyticsPage.Portfolio,
  notification_center: AnalyticsPage.NotificationPanel,
};

function useGetVariant(
  location: LNSBannerLocation,
  tracking: LNSBannerModel["tracking"],
): LNSBannerModel["variant"] {
  const isShown = useShowLNSUpsellBanner(location);

  if (!isShown) return "none";
  if (tracking === "optOut" || location === "notification_center") return "notification";
  return "banner";
}

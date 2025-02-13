import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import { AnalyticsButton, AnalyticsPage, type LNSBannerLocation } from "../types";

export function useLNSBanner(location: LNSBannerLocation) {
  const isOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const ff = useFeature("lldNanoSUpsellBanners");
  const params = ff?.params?.[isOptIn ? "opted_in" : "opted_out"];

  // TODO add the LNS only users filtering logic

  if (!ff?.enabled || !params?.[location as keyof typeof params]) {
    return null;
  }

  const tracking = isOptIn ? "optIn" : "optOut";
  const { "%": discount, img: image, link: ctaLink, learn_more: learnMoreLink } = params;
  const analitycsPage = AnalyticsPageMap[location];

  const handleCTAClick = () => {
    track("button_clicked", {
      button: AnalyticsButton.CTA,
      link: ctaLink,
      page: analitycsPage,
    });
    openURL(ctaLink);
  };
  const handleLearnMoreLink = () => {
    track("button_clicked", {
      button: AnalyticsButton.LearnMore,
      link: learnMoreLink,
      page: analitycsPage,
    });
    openURL(learnMoreLink);
  };

  return { discount, image, tracking, handleCTAClick, handleLearnMoreLink };
}

const AnalyticsPageMap: Record<LNSBannerLocation, AnalyticsPage> = {
  manager: AnalyticsPage.Manager,
  accounts: AnalyticsPage.Accounts,
  portfolio: AnalyticsPage.Portfolio,
  notification_center: AnalyticsPage.NotificationPanel,
};

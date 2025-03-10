import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import {
  AnalyticsButton,
  AnalyticsPage,
  type LNSBannerLocation,
  type LNSBannerModel,
  type LNSBannerState,
} from "../types";
import { useLNSUpsellBannerState } from "./useLNSUpsellBannerState";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);

  const { "%": discount, img: image, link: ctaLink } = state.params ?? {};
  const analitycsPage = AnalyticsPageMap[location];

  const handleCTAClick = () => {
    track("button_clicked", {
      button: AnalyticsButton.CTA,
      link: ctaLink,
      page: analitycsPage,
    });
    ctaLink && openURL(ctaLink);
  };

  const tracking = state.tracking;
  const variant = getVariant(location, state);

  return { variant, discount, image, tracking, handleCTAClick };
}

const AnalyticsPageMap: Record<LNSBannerLocation, AnalyticsPage> = {
  manager: AnalyticsPage.Manager,
  accounts: AnalyticsPage.Accounts,
  portfolio: AnalyticsPage.Portfolio,
  notification_center: AnalyticsPage.NotificationPanel,
};

function getVariant(location: LNSBannerLocation, state: LNSBannerState): LNSBannerModel["variant"] {
  if (!state.isShown) return "none";
  if (state.tracking === "opted_out" || location === "notification_center") return "notification";
  return "banner";
}

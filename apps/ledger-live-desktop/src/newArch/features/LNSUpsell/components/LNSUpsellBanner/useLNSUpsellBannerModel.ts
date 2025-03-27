import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell/hooks/useLNSUpsellBannerState";
import type { LNSBannerLocation, LNSBannerState } from "LLD/features/LNSUpsell/types";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { LNSBannerModel } from "./types";

export function useLNSUpsellBannerModel(location: LNSBannerLocation): LNSBannerModel {
  const state = useLNSUpsellBannerState(location);

  const { "%": discount, link: ctaLink } = state.params ?? {};
  const analitycsPage = AnalyticsPageMap[location];

  const handleCTAClick = () => {
    track("button_clicked", {
      button: ANALYTICS_BUTTON_CLICK,
      link: ctaLink,
      page: analitycsPage,
    });
    ctaLink && openURL(ctaLink);
  };

  const tracking = state.tracking;
  const variant = getVariant(location, state);

  return { variant, discount, tracking, handleCTAClick };
}

const ANALYTICS_BUTTON_CLICK = "Level up wallet";

const AnalyticsPageMap = {
  manager: "Manager",
  accounts: "Accounts",
  portfolio: "Portfolio",
  notification_center: "NotificationPanel",
} as const satisfies Record<LNSBannerLocation, unknown>;

function getVariant(location: LNSBannerLocation, state: LNSBannerState): LNSBannerModel["variant"] {
  if (!state.isShown) return { type: "none" };

  if (state.tracking === "opted_out" || location === "notification_center") {
    const icon = state.tracking === "opted_in" ? "SparksFill" : "Nano";
    return { type: "notification", icon };
  }

  return { type: "banner", image: state.params?.img };
}

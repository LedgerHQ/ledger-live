import type { DevLayoutMode, DevTriggerMode } from "./types";

/** Fixed campaign ids used by the QA dev tool (must match saved preview cards). */
export const DEV_CAMPAIGN_IDS = {
  appStartFeatureIntro: "APP_START_generic_awareness_modal_feature_intro",
  appStartCarousel: "APP_START_generic_awareness_modal_carousel",
  bannerFeatureIntro: "debug_generic_awareness_modal_feature_intro",
  bannerCarousel: "debug_generic_awareness_modal_carousel",
} as const;

export const resolveCampaignId = (layout: DevLayoutMode, trigger: DevTriggerMode): string => {
  if (trigger === "appStart") {
    return layout === "carousel"
      ? DEV_CAMPAIGN_IDS.appStartCarousel
      : DEV_CAMPAIGN_IDS.appStartFeatureIntro;
  }
  return layout === "carousel"
    ? DEV_CAMPAIGN_IDS.bannerCarousel
    : DEV_CAMPAIGN_IDS.bannerFeatureIntro;
};

export const campaignIdDeeplinkHint = (campaignId: string): string =>
  `ledgerwallet://generic-awareness-modal?id=${encodeURIComponent(campaignId)}`;

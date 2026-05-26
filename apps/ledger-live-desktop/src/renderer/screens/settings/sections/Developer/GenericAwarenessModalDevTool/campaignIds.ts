import type { DevLayoutMode, DevTriggerMode } from "./types";

/** Fixed campaign ids used by the QA dev tool (must match saved preview cards). */
export const DEV_CAMPAIGN_IDS = {
  appStartFeatureIntro: "APP_START_generic_awareness_modal_feature_intro",
  appStartCarousel: "APP_START_generic_awareness_modal_carousel",
  appStartPrompt: "APP_START_generic_awareness_modal_prompt",
  bannerFeatureIntro: "debug_generic_awareness_modal_feature_intro",
  bannerCarousel: "debug_generic_awareness_modal_carousel",
  bannerPrompt: "debug_generic_awareness_modal_prompt",
} as const;

export const resolveCampaignId = (layout: DevLayoutMode, trigger: DevTriggerMode): string => {
  if (trigger === "appStart") {
    if (layout === "carousel") {
      return DEV_CAMPAIGN_IDS.appStartCarousel;
    }
    if (layout === "prompt") {
      return DEV_CAMPAIGN_IDS.appStartPrompt;
    }
    return DEV_CAMPAIGN_IDS.appStartFeatureIntro;
  }
  if (layout === "carousel") {
    return DEV_CAMPAIGN_IDS.bannerCarousel;
  }
  if (layout === "prompt") {
    return DEV_CAMPAIGN_IDS.bannerPrompt;
  }
  return DEV_CAMPAIGN_IDS.bannerFeatureIntro;
};

export const campaignIdDeeplinkHint = (campaignId: string): string =>
  `ledgerwallet://generic-awareness-modal?id=${encodeURIComponent(campaignId)}`;

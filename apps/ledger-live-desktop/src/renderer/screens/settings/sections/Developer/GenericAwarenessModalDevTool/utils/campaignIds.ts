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

const CAMPAIGN_IDS_BY_TRIGGER = {
  appStart: {
    carousel: DEV_CAMPAIGN_IDS.appStartCarousel,
    featureIntro: DEV_CAMPAIGN_IDS.appStartFeatureIntro,
    prompt: DEV_CAMPAIGN_IDS.appStartPrompt,
  },
  bannerClick: {
    carousel: DEV_CAMPAIGN_IDS.bannerCarousel,
    featureIntro: DEV_CAMPAIGN_IDS.bannerFeatureIntro,
    prompt: DEV_CAMPAIGN_IDS.bannerPrompt,
  },
} as const satisfies Record<DevTriggerMode, Record<DevLayoutMode, string>>;

export const resolveCampaignId = (layout: DevLayoutMode, trigger: DevTriggerMode): string =>
  CAMPAIGN_IDS_BY_TRIGGER[trigger][layout];

export const campaignIdDeeplinkHint = (campaignId: string): string =>
  `ledgerwallet://generic-awareness-modal?id=${encodeURIComponent(campaignId)}`;

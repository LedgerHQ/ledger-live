export const GENERIC_AWARENESS_MODAL_DEV_TOOL_COPY = {
  title: "Generic Awareness Modal",
  description:
    "Build carousel and feature intro content cards, inject them into the store, and open the modal for QA.",
  show: "Show",
  hide: "Hide",
  primaryCtaLink: "Primary CTA link",
  campaignId: "Campaign id (optional)",
  appStart: "APP_START card",
  appStartDesc:
    "When enabled, the card id is prefixed with APP_START so app launch can pick it up.",
  carousel: {
    title: "Carousel layout",
    slideCount: "Number of slides",
    add: "Add carousel card",
  },
  featureIntro: {
    title: "Feature intro layout",
    itemCount: "Number of items",
    add: "Add feature intro card",
  },
  actions: {
    title: "Preview",
    empty: "No content cards in the store.",
    openAppStart: "Open modal (APP_START)",
    openCampaignId: "Campaign id to open",
    openById: "Open by campaign id",
    removeCreated: "Remove created cards",
  },
} as const;

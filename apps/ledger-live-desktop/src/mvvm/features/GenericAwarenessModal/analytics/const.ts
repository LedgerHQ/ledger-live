export const PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL = "Awareness Modal Carousel" as const;

export const PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO = "Awareness Modal Feature Intro" as const;

export const CAROUSEL_NAVIGATION_METHOD = {
  initial: "initial",
  nextButton: "next_button",
} as const;

export const AWARENESS_MODAL_DISMISS_METHOD = {
  backdropTap: "backdrop_tap",
  backButton: "back_button",
  swipeDown: "swipe_down",
} as const;

export type AwarenessModalDismissMethod =
  (typeof AWARENESS_MODAL_DISMISS_METHOD)[keyof typeof AWARENESS_MODAL_DISMISS_METHOD];

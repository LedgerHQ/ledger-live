export { processGenericAwarenessModalBrazeCards } from "./buildContentCards";
export {
  getExpectedItemCount,
  getExpectedSlideCount,
  hasReceivedAllCarouselSlides,
  hasReceivedAllFeatureIntroCards,
  isGenericAwarenessModalContentCardReady,
} from "./campaignCompleteness";
export { getGenericAwarenessModalContentCard } from "./getGenericAwarenessModalContentCard";

export { FeatureIntroRole, GenericAwarenessModalLayout } from "./types";
export type {
  GenericAwarenessModalBrazeCard,
  GenericAwarenessModalContentCard,
  GenericAwarenessModalInputExtras,
  GenericAwarenessModalOutput,
  GenericAwarenessModalCarousel,
  GenericAwarenessModalCarouselSlide,
  GenericAwarenessModalPrompt,
  GenericAwarenessModalFeatureIntro,
  GenericAwarenessModalFeatureIntroItem,
} from "./types";

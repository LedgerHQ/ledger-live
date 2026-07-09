export { processGenericAwarenessModalBrazeCards } from "./build";
export {
  getExpectedItemCount,
  getExpectedSlideCount,
  hasReceivedAllCarouselSlides,
  hasReceivedAllFeatureIntroCards,
  isGenericAwarenessModalContentCardReady,
} from "./build/campaignCompleteness";
export {
  createThemedImageUrls,
  getGenericAwarenessModalContentCard,
  hasAwarenessModalActionButton,
  hasAwarenessModalActionLink,
  hasThemedImage,
  resolveAwarenessModalActionLink,
  resolveCarouselNavigationButtonLabel,
  resolveThemedImageUrl,
  type ThemedImageUrls,
  type ThemeVariant,
} from "./utils";

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

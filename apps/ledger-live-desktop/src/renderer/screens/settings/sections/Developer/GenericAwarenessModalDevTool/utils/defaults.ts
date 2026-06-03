import { getDevToolCarouselImageUrl, getDevToolPlaceholderImageUrl } from "./placeholderImages";
import type {
  CarouselSlideForm,
  DevLayoutMode,
  DevTriggerMode,
  FeatureIntroItemForm,
  GenericAwarenessModalDevFormState,
} from "./types";

export const createDevFormListKeys = (count: number) =>
  Array.from({ length: count }, () => crypto.randomUUID());

const CAROUSEL_PRIMARY_BUTTON_LABELS = ["Learn more", "Discover", "Explore"] as const;

const defaultCarouselSlide = (index: number): CarouselSlideForm => ({
  title: `Slide ${index + 1} title`,
  subtitle: `Slide ${index + 1} subtitle`,
  imageUrl: getDevToolCarouselImageUrl(index),
  primaryButtonLabel: CAROUSEL_PRIMARY_BUTTON_LABELS[index % CAROUSEL_PRIMARY_BUTTON_LABELS.length],
  primaryButtonLink: "https://www.ledger.com",
});

const defaultFeatureIntroItem = (index: number): FeatureIntroItemForm => ({
  icon: index === 0 ? "HandCoins" : "Shield",
  title: `Item ${index + 1} title`,
  subtitle: `Item ${index + 1} subtitle`,
});

export const DEFAULT_CAROUSEL_SLIDE_COUNT = 3;
export const MIN_CAROUSEL_SLIDES = 1;
export const MIN_FEATURE_INTRO_ITEMS = 1;
export const MAX_FEATURE_INTRO_ITEMS = 3;

export const createDefaultCarouselSlides = (): CarouselSlideForm[] =>
  Array.from({ length: DEFAULT_CAROUSEL_SLIDE_COUNT }, (_, i) => defaultCarouselSlide(i));

export const createDefaultFeatureIntroItems = (): FeatureIntroItemForm[] => [
  defaultFeatureIntroItem(0),
  defaultFeatureIntroItem(1),
];

const featureIntroDefaults = {
  title: "Connect a Ledger device",
  subtitle: "Pair a signer to unlock the full Ledger Wallet experience.",
  primaryButtonLabel: "Got it",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "Learn more",
  secondaryButtonLink: "https://www.ledger.com",
};

const promptDefaults = {
  title: "Stay in control",
  subtitle: "Move assets to a hardware signer for true self-custody.",
  primaryButtonLabel: "Learn more",
  primaryButtonLink: "https://www.ledger.com/academy",
  secondaryButtonLabel: "Maybe later",
  secondaryButtonLink: "https://www.ledger.com",
};

const layoutContentDefaults: Record<
  Exclude<DevLayoutMode, "carousel">,
  typeof featureIntroDefaults
> = {
  featureIntro: featureIntroDefaults,
  prompt: promptDefaults,
};

export const createInitialFormState = (
  layout: DevLayoutMode = "carousel",
  trigger: DevTriggerMode = "appStart",
): GenericAwarenessModalDevFormState => ({
  layout,
  trigger,
  slides: createDefaultCarouselSlides(),
  items: createDefaultFeatureIntroItems(),
  ...(layout === "carousel" ? featureIntroDefaults : layoutContentDefaults[layout]),
  imageUrl: getDevToolPlaceholderImageUrl(),
});

export const createDefaultCarouselSlideAt = (index: number): CarouselSlideForm =>
  defaultCarouselSlide(index);

export const createDefaultFeatureIntroItemAt = (index: number): FeatureIntroItemForm =>
  defaultFeatureIntroItem(index);

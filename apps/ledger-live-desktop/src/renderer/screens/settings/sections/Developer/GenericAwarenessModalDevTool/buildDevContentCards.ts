import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalFeatureIntroItem,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { getMockGenericAwarenessModalContentCards } from "~/renderer/hooks/genericAwarenessModal/getMockGenericAwarenessModalContentCards";

const DEV_PLACEHOLDER_IMAGE =
  "https://cdn.shopify.com/s/files/1/2974/4858/files/carrousel_flex_graphite_1_4.webp";

const FEATURE_INTRO_ITEM_ICONS = ["Shield", "Lock", "Key", "HandCoins"] as const;

const DEFAULT_SECONDARY_LINK = "https://www.ledger.com";

export type BuildDevCarouselCardOptions = {
  slideCount: number;
  primaryButtonLink: string;
  isAppStart: boolean;
  campaignId?: string;
};

export type BuildDevFeatureIntroCardOptions = {
  itemCount: number;
  primaryButtonLink: string;
  isAppStart: boolean;
  campaignId?: string;
};

const resolveCampaignId = (
  isAppStart: boolean,
  layout: GenericAwarenessModalLayout,
  campaignId?: string,
) => {
  const trimmed = campaignId?.trim();
  if (trimmed) {
    return isAppStart && !trimmed.startsWith("APP_START") ? `APP_START_${trimmed}` : trimmed;
  }
  const suffix = Date.now();
  if (isAppStart) {
    return layout === GenericAwarenessModalLayout.Carousel
      ? `APP_START_carousel_${suffix}`
      : `APP_START_feature_intro_${suffix}`;
  }
  return layout === GenericAwarenessModalLayout.Carousel
    ? `dev-carousel-${suffix}`
    : `dev-feature-intro-${suffix}`;
};

const buildCarouselSlide = (
  index: number,
  primaryButtonLink: string,
): GenericAwarenessModalCarouselSlide => ({
  title: `Carousel slide ${index + 1}`,
  subtitle: `Dev carousel subtitle ${index + 1}`,
  imageUrl: DEV_PLACEHOLDER_IMAGE,
  primaryButtonLabel: `CTA ${index + 1}`,
  primaryButtonLink,
});

const buildFeatureIntroItem = (index: number): GenericAwarenessModalFeatureIntroItem => ({
  icon: FEATURE_INTRO_ITEM_ICONS[index % FEATURE_INTRO_ITEM_ICONS.length] ?? "Shield",
  title: `Feature item ${index + 1}`,
  subtitle: `Dev feature intro item ${index + 1}`,
});

export const buildDevCarouselCard = ({
  slideCount,
  primaryButtonLink,
  isAppStart,
  campaignId,
}: BuildDevCarouselCardOptions): GenericAwarenessModalCarousel => ({
  layout: GenericAwarenessModalLayout.Carousel,
  id: resolveCampaignId(isAppStart, GenericAwarenessModalLayout.Carousel, campaignId),
  data: Array.from({ length: slideCount }, (_, index) =>
    buildCarouselSlide(index, primaryButtonLink),
  ),
});

export const buildDevFeatureIntroCard = ({
  itemCount,
  primaryButtonLink,
  isAppStart,
  campaignId,
}: BuildDevFeatureIntroCardOptions): GenericAwarenessModalFeatureIntro => ({
  layout: GenericAwarenessModalLayout.FeatureIntro,
  id: resolveCampaignId(isAppStart, GenericAwarenessModalLayout.FeatureIntro, campaignId),
  title: "Dev feature intro title",
  subtitle: "Dev feature intro subtitle",
  imageUrl: DEV_PLACEHOLDER_IMAGE,
  primaryButtonLabel: "Primary CTA",
  primaryButtonLink,
  secondaryButtonLabel: "Secondary CTA",
  secondaryButtonLink: DEFAULT_SECONDARY_LINK,
  items: Array.from({ length: itemCount }, (_, index) => buildFeatureIntroItem(index)),
});

export const parsePositiveCount = (value: string, fallback: number, max = 20): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const DEV_CARD_ID_PREFIXES = [
  "dev-carousel-",
  "dev-feature-intro-",
  "APP_START_carousel_",
  "APP_START_feature_intro_",
] as const;

export const isDevGenericAwarenessModalCardId = (id: string): boolean =>
  DEV_CARD_ID_PREFIXES.some(prefix => id.startsWith(prefix));

/** Removes dev-created cards and restores mock content cards from code. */
export const removeDevContentCards = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  additionalDevCardIds: ReadonlySet<string> = new Set(),
): GenericAwarenessModalContentCard[] => {
  const mockCards = getMockGenericAwarenessModalContentCards();
  const mockIds = new Set(mockCards.map(card => card.id));
  const isDevCard = (id: string) =>
    isDevGenericAwarenessModalCardId(id) || additionalDevCardIds.has(id);

  const preserved = contentCards.filter(card => !isDevCard(card.id));
  const preservedNonMock = preserved.filter(card => !mockIds.has(card.id));

  return [...mockCards, ...preservedNonMock];
};

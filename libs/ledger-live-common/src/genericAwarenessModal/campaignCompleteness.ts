import {
  GenericAwarenessModalCampaignCountSchema,
  GenericAwarenessModalCarouselInputSchema,
  GenericAwarenessModalFeatureIntroItemInputSchema,
  GenericAwarenessModalFeatureIntroMainInputSchema,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalContentCard,
} from "./types";

export const parseCampaignCount = (value: string | number | undefined): number | undefined => {
  const result = GenericAwarenessModalCampaignCountSchema.safeParse(value);
  return result.success ? result.data : undefined;
};

const getConsistentCampaignCount = (
  cards: readonly GenericAwarenessModalBrazeCard[],
  field: "slideCount" | "itemCount",
): number | undefined => {
  if (cards.length === 0) {
    return undefined;
  }

  let expectedCount: number | undefined;

  for (const card of cards) {
    const count = parseCampaignCount(card.extras?.[field]);
    if (count === undefined) {
      return undefined;
    }

    if (expectedCount === undefined) {
      expectedCount = count;
      continue;
    }

    if (expectedCount !== count) {
      return undefined;
    }
  }

  return expectedCount;
};

export const getExpectedSlideCount = (
  cards: readonly GenericAwarenessModalBrazeCard[],
): number | undefined => getConsistentCampaignCount(cards, "slideCount");

export const getExpectedItemCount = (
  cards: readonly GenericAwarenessModalBrazeCard[],
): number | undefined => getConsistentCampaignCount(cards, "itemCount");

export const countValidCarouselCards = (cards: readonly GenericAwarenessModalBrazeCard[]) =>
  cards.filter(card => GenericAwarenessModalCarouselInputSchema.safeParse(card.extras).success)
    .length;

export const countValidFeatureIntroCards = (cards: readonly GenericAwarenessModalBrazeCard[]) =>
  cards.filter(
    card =>
      GenericAwarenessModalFeatureIntroMainInputSchema.safeParse(card.extras).success ||
      GenericAwarenessModalFeatureIntroItemInputSchema.safeParse(card.extras).success,
  ).length;

export const hasReceivedAllCarouselSlides = (
  cards: readonly GenericAwarenessModalBrazeCard[],
): boolean | undefined => {
  const slideCount = getExpectedSlideCount(cards);
  if (slideCount === undefined) {
    return undefined;
  }
  return countValidCarouselCards(cards) === slideCount;
};

export const hasReceivedAllFeatureIntroCards = (
  cards: readonly GenericAwarenessModalBrazeCard[],
): boolean | undefined => {
  const itemCount = getExpectedItemCount(cards);
  if (itemCount === undefined) {
    return undefined;
  }
  return countValidFeatureIntroCards(cards) === itemCount;
};

export const isGenericAwarenessModalContentCardReady = (
  contentCard: GenericAwarenessModalContentCard,
): boolean => {
  if (contentCard.layout === GenericAwarenessModalLayout.Prompt) {
    return true;
  }
  return contentCard.isReady;
};

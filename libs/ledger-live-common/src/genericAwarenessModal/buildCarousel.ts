import {
  GenericAwarenessModalCarouselInputSchema,
  GenericAwarenessModalCarouselSlideSchema,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalParsedCarouselInput,
} from "./types";

const buildCarouselSlide = (
  input: GenericAwarenessModalParsedCarouselInput,
): GenericAwarenessModalCarouselSlide => GenericAwarenessModalCarouselSlideSchema.parse(input);

const parseCarouselInput = (
  card: GenericAwarenessModalBrazeCard,
): GenericAwarenessModalParsedCarouselInput | undefined => {
  const result = GenericAwarenessModalCarouselInputSchema.safeParse(card.extras);
  return result.success ? result.data : undefined;
};

export const buildCarousel = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalCarousel | undefined => {
  const data = cards
    .flatMap(card => {
      const input = parseCarouselInput(card);
      return input ? [input] : [];
    })
    .sort((a, b) => a.index - b.index)
    .map(buildCarouselSlide);

  if (!data || data.length === 0) {
    return undefined;
  }

  return { layout: GenericAwarenessModalLayout.Carousel, id: campaignId, data };
};

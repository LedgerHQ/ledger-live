import {
  FeatureIntroRole,
  GenericAwarenessModalContentCard,
  GenericAwarenessModalCarousel,
  GenericAwarenessModalCarouselSlide,
  GenericAwarenessModalFeatureIntro,
  GenericAwarenessModalLayout,
} from "./types";

/** Braze content card reduced to id + extras (platform-agnostic). */
export type GenericAwarenessModalBrazeCard = {
  id: string;
  extras?: Record<string, string>;
};

const parseIndex = (value: string | number | undefined) => {
  if (typeof value === "number") {
    return value;
  }
  return Number.parseInt(value ?? "", 10) || 0;
};

export const groupByCampaignId = (
  cards: GenericAwarenessModalBrazeCard[],
): Map<string, GenericAwarenessModalBrazeCard[]> => {
  return cards.reduce((acc, card) => {
    const campaignId = card.extras?.campaignId;
    if (campaignId !== undefined && campaignId !== "") {
      acc.set(campaignId, [...(acc.get(campaignId) || []), card]);
    }
    return acc;
  }, new Map<string, GenericAwarenessModalBrazeCard[]>());
};

export const hasUniqueLayout = (cards: GenericAwarenessModalBrazeCard[]) => {
  return new Set(cards.map(card => card.extras?.layout)).size === 1;
};

export const getValidGenericAwarenessModalCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
) => {
  const invalidCampaignIds: string[] = [];
  groupedCards.forEach((cards, campaignId) => {
    if (!hasUniqueLayout(cards)) {
      invalidCampaignIds.push(campaignId);
    }
  });
  return new Map<string, GenericAwarenessModalBrazeCard[]>(
    Array.from(groupedCards.entries()).filter(
      ([campaignId]) => !invalidCampaignIds.includes(campaignId),
    ),
  );
};

const buildCarouselSlide = (extras: Record<string, string>): GenericAwarenessModalCarouselSlide => ({
  title: extras.title ?? "",
  subtitle: extras.subtitle ?? "",
  imageUrl: extras.imageUrl ?? "",
  primaryButtonLabel: extras.primaryButtonLabel ?? "",
  primaryButtonLink: extras.primaryButtonLink ?? "",
});

const buildCarousel = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalCarousel => ({
  layout: GenericAwarenessModalLayout.Carousel,
  id: campaignId,
  data: [...cards]
    .sort((a, b) => parseIndex(a.extras?.index) - parseIndex(b.extras?.index))
    .map(card => buildCarouselSlide(card.extras ?? {})),
});

const buildFeatureIntro = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalFeatureIntro | undefined => {
  const main = cards.find(card => card.extras?.role === FeatureIntroRole.Main);
  if (!main) {
    return undefined;
  }

  const mainExtras = main.extras ?? {};
  const items = cards
    .filter(card => card.extras?.role === FeatureIntroRole.Item)
    .sort((a, b) => parseIndex(a.extras?.index) - parseIndex(b.extras?.index))
    .map(card => {
      const extras = card.extras ?? {};
      return {
        icon: extras.icon ?? "",
        title: extras.title ?? "",
        subtitle: extras.subtitle ?? "",
      };
    });

  return {
    layout: GenericAwarenessModalLayout.FeatureIntro,
    id: campaignId,
    title: mainExtras.title ?? "",
    subtitle: mainExtras.subtitle ?? "",
    imageUrl: mainExtras.imageUrl ?? "",
    primaryButtonLabel: mainExtras.primaryButtonLabel ?? "",
    primaryButtonLink: mainExtras.primaryButtonLink ?? "",
    secondaryButtonLabel: mainExtras.secondaryButtonLabel ?? "",
    secondaryButtonLink: mainExtras.secondaryButtonLink ?? "",
    items,
  };
};

export const buildGenericAwarenessModalContentCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
): GenericAwarenessModalContentCard[] => {
  const contentCards: GenericAwarenessModalContentCard[] = [];

  groupedCards.forEach((cards, campaignId) => {
    const layout = cards[0]?.extras?.layout;
    if (layout === GenericAwarenessModalLayout.Carousel) {
      contentCards.push(buildCarousel(campaignId, cards));
      return;
    }
    if (layout === GenericAwarenessModalLayout.FeatureIntro) {
      const featureIntro = buildFeatureIntro(campaignId, cards);
      if (featureIntro) {
        contentCards.push(featureIntro);
      }
    }
  });

  return contentCards;
};

export const processGenericAwarenessModalBrazeCards = (
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalContentCard[] =>
  buildGenericAwarenessModalContentCards(
    getValidGenericAwarenessModalCards(groupByCampaignId(cards)),
  );

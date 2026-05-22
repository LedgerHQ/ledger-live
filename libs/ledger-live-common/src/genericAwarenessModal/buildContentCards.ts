import { buildCarousel } from "./buildCarousel";
import { buildFeatureIntro } from "./buildFeatureIntro";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalContentCard,
} from "./types";

export type { GenericAwarenessModalBrazeCard } from "./types";

export const groupByCampaignId = (
  cards: GenericAwarenessModalBrazeCard[],
): Map<string, GenericAwarenessModalBrazeCard[]> => {
  const cardsByCampaignId = new Map<string, GenericAwarenessModalBrazeCard[]>();

  cards.forEach(card => {
    const campaignId = card.extras?.campaignId;
    if (campaignId !== undefined && campaignId !== "") {
      const campaignCards = cardsByCampaignId.get(campaignId);
      if (campaignCards) {
        campaignCards.push(card);
      } else {
        cardsByCampaignId.set(campaignId, [card]);
      }
    }
  });

  return cardsByCampaignId;
};

export const hasUniqueLayout = (cards: GenericAwarenessModalBrazeCard[]) => {
  return new Set(cards.map(card => card.extras?.layout)).size === 1;
};

export const getValidGenericAwarenessModalCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
) => {
  return new Map<string, GenericAwarenessModalBrazeCard[]>(
    Array.from(groupedCards.entries()).filter(([, cards]) => hasUniqueLayout(cards)),
  );
};

const buildContentCard = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalContentCard | undefined => {
  const layout = cards[0]?.extras?.layout;

  if (layout === GenericAwarenessModalLayout.Carousel) {
    return buildCarousel(campaignId, cards);
  }

  if (layout === GenericAwarenessModalLayout.FeatureIntro) {
    return buildFeatureIntro(campaignId, cards);
  }

  return undefined;
};

export const buildGenericAwarenessModalContentCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
): GenericAwarenessModalContentCard[] => {
  return Array.from(groupedCards.entries()).flatMap(([campaignId, cards]) => {
    const contentCard = buildContentCard(campaignId, cards);
    return contentCard ? [contentCard] : [];
  });
};

export const processGenericAwarenessModalBrazeCards = (
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalContentCard[] => {
  const cardsByCampaignId = groupByCampaignId(cards);
  const validCards = getValidGenericAwarenessModalCards(cardsByCampaignId);

  return buildGenericAwarenessModalContentCards(validCards);
};

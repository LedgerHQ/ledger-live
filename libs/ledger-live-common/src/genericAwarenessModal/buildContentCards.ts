import { buildCarousel } from "./buildCarousel";
import { buildFeatureIntro } from "./buildFeatureIntro";
import { buildPrompt } from "./buildPrompt";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalContentCard,
} from "./types";

export type { GenericAwarenessModalBrazeCard } from "./types";

type ContentCardBuilder = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
) => GenericAwarenessModalContentCard | undefined;

const CONTENT_CARD_BUILDERS: Record<GenericAwarenessModalLayout, ContentCardBuilder> = {
  [GenericAwarenessModalLayout.Carousel]: buildCarousel,
  [GenericAwarenessModalLayout.FeatureIntro]: buildFeatureIntro,
  [GenericAwarenessModalLayout.Prompt]: buildPrompt,
};

const isGenericAwarenessModalLayout = (
  layout: string | undefined,
): layout is GenericAwarenessModalLayout =>
  layout !== undefined && layout in CONTENT_CARD_BUILDERS;

export const groupByCampaignId = (
  cards: GenericAwarenessModalBrazeCard[],
): Map<string, GenericAwarenessModalBrazeCard[]> => {
  const cardsByCampaignId = new Map<string, GenericAwarenessModalBrazeCard[]>();

  for (const card of cards) {
    const campaignId = card.extras?.campaignId;
    if (!campaignId) {
      continue;
    }

    const campaignCards = cardsByCampaignId.get(campaignId);
    if (campaignCards) {
      campaignCards.push(card);
    } else {
      cardsByCampaignId.set(campaignId, [card]);
    }
  }

  return cardsByCampaignId;
};

export const hasUniqueLayout = (cards: GenericAwarenessModalBrazeCard[]) =>
  new Set(cards.map(card => card.extras?.layout)).size === 1;

export const getValidGenericAwarenessModalCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
) =>
  new Map(
    Array.from(groupedCards.entries()).filter(([, campaignCards]) =>
      hasUniqueLayout(campaignCards),
    ),
  );

const buildContentCard = (
  campaignId: string,
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalContentCard | undefined => {
  const layout = cards[0]?.extras?.layout;
  if (!isGenericAwarenessModalLayout(layout)) {
    return undefined;
  }

  const builder = CONTENT_CARD_BUILDERS[layout];
  if (!builder) {
    return undefined;
  }

  return builder(campaignId, cards);
};

export const buildGenericAwarenessModalContentCards = (
  groupedCards: Map<string, GenericAwarenessModalBrazeCard[]>,
): GenericAwarenessModalContentCard[] =>
  Array.from(groupedCards.entries()).flatMap(([campaignId, cards]) => {
    const contentCard = buildContentCard(campaignId, cards);
    return contentCard ? [contentCard] : [];
  });

export const processGenericAwarenessModalBrazeCards = (
  cards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalContentCard[] => {
  const cardsByCampaignId = groupByCampaignId(cards);
  const validCards = getValidGenericAwarenessModalCards(cardsByCampaignId);

  return buildGenericAwarenessModalContentCards(validCards);
};

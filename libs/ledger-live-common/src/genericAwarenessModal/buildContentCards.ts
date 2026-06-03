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

const normalizeGenericAwarenessModalLayout = (
  layout: string | undefined,
): GenericAwarenessModalLayout | undefined => {
  const trimmedLayout = layout?.trim();
  if (!trimmedLayout) {
    return undefined;
  }

  return Object.values(GenericAwarenessModalLayout).find(
    value => value.toLowerCase() === trimmedLayout.toLowerCase(),
  );
};

export const groupByCampaignId = (
  cards: GenericAwarenessModalBrazeCard[],
): Map<string, GenericAwarenessModalBrazeCard[]> => {
  const cardsByNormalizedCampaignId = new Map<string, GenericAwarenessModalBrazeCard[]>();

  for (const card of cards) {
    const campaignId = card.extras?.campaignId?.trim();
    if (!campaignId) {
      continue;
    }

    const normalizedCampaignId = campaignId.toLowerCase();
    const campaignCards = cardsByNormalizedCampaignId.get(normalizedCampaignId);
    if (campaignCards) {
      campaignCards.push(card);
    } else {
      cardsByNormalizedCampaignId.set(normalizedCampaignId, [card]);
    }
  }

  const cardsByCampaignId = new Map<string, GenericAwarenessModalBrazeCard[]>();
  for (const campaignCards of cardsByNormalizedCampaignId.values()) {
    const canonicalCampaignId = campaignCards[0]?.extras?.campaignId?.trim();
    if (canonicalCampaignId) {
      cardsByCampaignId.set(canonicalCampaignId, campaignCards);
    }
  }

  return cardsByCampaignId;
};

export const hasUniqueLayout = (cards: GenericAwarenessModalBrazeCard[]) =>
  new Set(
    cards.map(card => normalizeGenericAwarenessModalLayout(card.extras?.layout)?.toLowerCase()),
  ).size === 1;

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
  const layout = normalizeGenericAwarenessModalLayout(cards[0]?.extras?.layout);
  if (!layout) {
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

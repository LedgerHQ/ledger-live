import type { Card as BrazeCard } from "@braze/web-sdk";

import { compareCards } from "~/renderer/hooks/useBraze";
import type { CategoryContentCard, ContentCard } from "~/types/dynamicContent";
import { ContentCardsLayout, ContentCardsType } from "~/types/dynamicContent";
import {
  mapSmallSquareContentCard,
  type SmallSquareContentCard,
} from "./mapSmallSquareContentCard";

function toComparableContentCard(card: SmallSquareContentCard): ContentCard {
  return {
    id: card.id,
    title: card.title ?? "",
    description: "",
    order: card.order,
    created: card.created,
    location: card.location,
    extras: card.extras,
  };
}

function isSmallSquareCardRenderable(card: SmallSquareContentCard): boolean {
  return Boolean(card.media || card.title || card.subDescription || card.tag);
}

export function getRenderableSmallSquareSlides(
  category: CategoryContentCard,
  categoryContentCards: BrazeCard[],
): SmallSquareContentCard[] {
  if (
    category.cardsType !== ContentCardsType.smallSquare ||
    category.cardsLayout !== ContentCardsLayout.carousel
  ) {
    return [];
  }

  return categoryContentCards
    .map(card => mapSmallSquareContentCard(card, category.location))
    .filter((card): card is SmallSquareContentCard => card !== null)
    .filter(isSmallSquareCardRenderable)
    .sort((a, b) => compareCards(toComparableContentCard(a), toComparableContentCard(b)));
}

export function hasRenderableCategorySlides(
  category: CategoryContentCard,
  cards: BrazeCard[],
): boolean {
  return getRenderableSmallSquareSlides(category, cards).length > 0;
}

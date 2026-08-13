import type { Card as BrazeCard } from "@braze/web-sdk";
import { compareCards } from "~/renderer/hooks/useBraze";
import { CategoryContentCard, LocationContentCard } from "~/types/dynamicContent";

export type FormattedCategory = {
  category: CategoryContentCard;
  cards: BrazeCard[];
};

export const filterCategoriesByLocation = (
  categories: CategoryContentCard[],
  locationId: LocationContentCard,
) => categories.filter(category => category.location === locationId);

export const dedupeCategoriesByCategoryId = (categories: CategoryContentCard[]) => {
  const seenCategoryIds = new Set<string>();
  const uniqueCategories: CategoryContentCard[] = [];

  for (const category of categories) {
    if (!category.categoryId) continue;
    if (seenCategoryIds.has(category.categoryId)) continue;
    seenCategoryIds.add(category.categoryId);
    uniqueCategories.push(category);
  }

  return uniqueCategories;
};

/**
 * Rebuilds the parent/child tree Braze flattens: each category is paired with the
 * raw cards declaring its `categoryId`. Categories without any child are dropped.
 */
export const formatCategories = (
  categories: CategoryContentCard[],
  childCards: BrazeCard[],
): FormattedCategory[] =>
  dedupeCategoriesByCategoryId([...categories].sort(compareCards))
    .map(category => ({
      category,
      cards: childCards.filter(childCard => childCard.extras?.categoryId === category.categoryId),
    }))
    .filter(({ cards }) => cards.length > 0);

import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import { usePortfolioCarouselCards } from "../../hooks/usePortfolioCarouselCards";
import type { CarouselActions } from "../../types";

/** Desktop Braze placement grid: max 2 cards in the row (LN upsell counts as one when present). */
export const MAX_DESKTOP_BRAZE_PLACEMENT_CARDS = 2;

export type BrazeCarouselEntry = {
  card: PortfolioContentCard;
  portfolioIndex: number;
};

export type PortfolioContentCardsLayout =
  | "braze-grid"
  | "stacked-leading"
  | "carousel"
  | "leading-only"
  | "empty";

export type UsePortfolioContentCardsViewModelArgs = {
  hasLeadingSlide: boolean;
};

export type UsePortfolioContentCardsViewModelResult = {
  layout: PortfolioContentCardsLayout;
  brazeCarouselEntries: BrazeCarouselEntry[];
  /** Offset applied to Braze `displayedPosition` when a leading upsell is present. */
  positionOffset: number;
} & CarouselActions;

/** Braze placement grid: only cards with at least one of these (extras) are shown when FF is on. */
export function isPortfolioCardEligibleForLumenGrid(card: PortfolioContentCard): boolean {
  return Boolean(card.image_background?.trim()) || Boolean(card.icon?.trim());
}

export function usePortfolioContentCardsViewModel({
  hasLeadingSlide,
}: UsePortfolioContentCardsViewModelArgs): UsePortfolioContentCardsViewModelResult {
  const { portfolioCards, logSlideClick, dismissCard } = usePortfolioCarouselCards("top");
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");
  const positionOffset = hasLeadingSlide ? 1 : 0;

  const brazeCarouselEntries = useMemo(() => {
    const entries = portfolioCards.map((card, portfolioIndex) => ({ card, portfolioIndex }));
    if (shouldDisplayBrazePlacement) {
      const maxBraze = hasLeadingSlide
        ? MAX_DESKTOP_BRAZE_PLACEMENT_CARDS - 1
        : MAX_DESKTOP_BRAZE_PLACEMENT_CARDS;
      return entries
        .filter(({ card }) => isPortfolioCardEligibleForLumenGrid(card))
        .slice(0, maxBraze);
    }
    return entries;
  }, [hasLeadingSlide, portfolioCards, shouldDisplayBrazePlacement]);

  const layout = useMemo((): PortfolioContentCardsLayout => {
    if (shouldDisplayBrazePlacement) {
      if (brazeCarouselEntries.length === 0) {
        return hasLeadingSlide ? "leading-only" : "empty";
      }
      return "braze-grid";
    }
    if (hasLeadingSlide) {
      return brazeCarouselEntries.length === 0 ? "leading-only" : "stacked-leading";
    }
    if (portfolioCards.length === 0) return "empty";
    return "carousel";
  }, [
    brazeCarouselEntries.length,
    hasLeadingSlide,
    portfolioCards.length,
    shouldDisplayBrazePlacement,
  ]);

  return {
    layout,
    brazeCarouselEntries,
    positionOffset,
    logSlideClick,
    dismissCard,
  };
}

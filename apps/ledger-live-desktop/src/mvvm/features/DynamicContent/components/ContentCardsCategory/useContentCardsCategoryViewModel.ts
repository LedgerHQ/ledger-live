import type { Card as BrazeCard } from "@braze/web-sdk";
import { useCallback, useMemo } from "react";
import { useNavigate, type NavigateFunction } from "react-router";

import {
  buildContentCardTrackingProperties,
  ContentCardEvent,
  type ContentCardInteractionEvent,
  type ContentCardEventProperties,
} from "@ledgerhq/live-common/braze/contentCardExtras";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { openURL } from "~/renderer/linking";
import type { CategoryContentCard } from "~/types/dynamicContent";
import { LocationContentCard } from "~/types/dynamicContent";
import { useDynamicContent } from "../../hooks/useDynamicContent";
import { getRenderableSmallSquareSlides } from "../../utils/getRenderableSmallSquareSlides";
import type { SmallSquareContentCard } from "../../utils/mapSmallSquareContentCard";

function openContentCardLink(link: string, navigate: NavigateFunction): void {
  if (link.startsWith("ledger-live:")) {
    const path = link
      .replace(/^ledger-live:\/\//, "/")
      .replace(/^ledger-live:\//, "/")
      .replace(/^ledger-live:/, "/");
    navigate(path, { state: { source: "banner" } });
    return;
  }
  openURL(link);
}

export type MappedCategorySlide = {
  card: SmallSquareContentCard;
  displayedPosition: number;
};

export type UseContentCardsCategoryViewModelArgs = Readonly<{
  category: CategoryContentCard;
  categoryContentCards: BrazeCard[];
  leadingSlide?: React.ReactNode;
}>;

export type UseContentCardsCategoryViewModelResult = Readonly<{
  title?: string;
  cta?: string;
  link?: string;
  centered?: boolean;
  leadingSlide?: React.ReactNode;
  slides: MappedCategorySlide[];
  isDismissable: boolean;
  onHeaderCtaPress?: () => void;
  onCardClick: (card: SmallSquareContentCard, displayedPosition: number) => void;
  onCardDismiss: (card: SmallSquareContentCard, displayedPosition: number) => void;
}>;

export function useContentCardsCategoryViewModel({
  category,
  categoryContentCards,
  leadingSlide,
}: UseContentCardsCategoryViewModelArgs): UseContentCardsCategoryViewModelResult {
  const navigate = useNavigate();
  const { dismissCard, logClickCard, trackContentCardEvent } = useDynamicContent();

  const positionOffset = leadingSlide ? 1 : 0;
  const categoryLink = category.link;
  const showHeaderCta = Boolean(categoryLink && category.cta && !category.centeredText);

  const slides = useMemo((): MappedCategorySlide[] => {
    const mapped = getRenderableSmallSquareSlides(category, categoryContentCards);

    return mapped.map((card, index) => ({
      card: { ...card, location: card.location ?? category.location },
      displayedPosition: index + positionOffset,
    }));
  }, [category, categoryContentCards, positionOffset]);

  const trackCategoryEvent = useCallback(
    (event: ContentCardInteractionEvent, card: SmallSquareContentCard, displayedPosition: number) => {
      const properties: ContentCardEventProperties = {
        ...buildContentCardTrackingProperties({
          cardExtras: card.extras,
          categoryExtras: category.extras,
          categoryLocation: category.location,
        }),
        campaign: card.id,
        contentcard: card.title ?? "",
        type: category.cardsType,
        layout: category.cardsLayout,
        displayedPosition,
        page: currentRouteNameRef.current ?? "Portfolio",
        location: category.location ?? LocationContentCard.Portfolio,
      };
      trackContentCardEvent(event, properties);
    },
    [category, trackContentCardEvent],
  );

  const onHeaderCtaPress = useCallback(() => {
    if (categoryLink) {
      openContentCardLink(categoryLink, navigate);
    }
  }, [categoryLink, navigate]);

  const onCardClick = useCallback(
    (card: SmallSquareContentCard, displayedPosition: number) => {
      if (!card.link) {
        return;
      }
      trackCategoryEvent(ContentCardEvent.Clicked, card, displayedPosition);
      logClickCard(card.id);
      openContentCardLink(card.link, navigate);
    },
    [logClickCard, navigate, trackCategoryEvent],
  );

  const onCardDismiss = useCallback(
    (card: SmallSquareContentCard, displayedPosition: number) => {
      if (dismissCard(card.id)) {
        trackCategoryEvent(ContentCardEvent.Dismissed, card, displayedPosition);
      }
    },
    [dismissCard, trackCategoryEvent],
  );

  return {
    title: category.title,
    cta: category.cta,
    link: category.link,
    centered: category.centeredText,
    leadingSlide,
    slides,
    isDismissable: Boolean(category.isDismissable),
    onHeaderCtaPress: showHeaderCta ? onHeaderCtaPress : undefined,
    onCardClick,
    onCardDismiss,
  };
}

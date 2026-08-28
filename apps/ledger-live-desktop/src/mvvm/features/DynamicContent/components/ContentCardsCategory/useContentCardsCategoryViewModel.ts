import type { Card as BrazeCard } from "@braze/web-sdk";
import { useCallback, useMemo } from "react";
import { useNavigate, type NavigateFunction } from "react-router";

import {
  LARGE_SCREEN_UPSELL_UTM,
  buildLargeScreenUpsellCtaLink,
} from "@features/flow-large-screen-upsell";
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
import {
  trackHardwareCarouselCardDismiss,
  trackHardwareCarouselDeviceClick,
  type HardwareCarouselSharedAnalyticsProps,
} from "../../hardwareCarousel/analytics";
import { extractHardwareCarouselDevice } from "../../hardwareCarousel/extractHardwareCarouselDevice";
import { shouldShowHardwareCarouselCloseAll } from "../../hardwareCarousel/shouldShowHardwareCarouselCloseAll";
import { getRenderableSmallSquareSlides } from "../../utils/getRenderableSmallSquareSlides";
import type { SmallSquareContentCard } from "../../utils/mapSmallSquareContentCard";

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

function isWebLink(link: string): boolean {
  try {
    return WEB_PROTOCOLS.has(new URL(link).protocol);
  } catch {
    return false;
  }
}

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

function resolveHardwareCarouselCardLink(link: string): string {
  if (!isWebLink(link)) {
    return link;
  }

  return buildLargeScreenUpsellCtaLink(
    link,
    "desktop",
    LARGE_SCREEN_UPSELL_UTM.content.hardware_carousel,
  );
}

export type MappedCategorySlide = {
  card: SmallSquareContentCard;
  displayedPosition: number;
};

export type UseContentCardsCategoryViewModelArgs = Readonly<{
  category: CategoryContentCard;
  categoryContentCards: BrazeCard[];
  leadingSlide?: React.ReactNode;
  hardwareCarouselSharedProps?: HardwareCarouselSharedAnalyticsProps;
}>;

export type UseContentCardsCategoryViewModelResult = Readonly<{
  title?: string;
  cta?: string;
  link?: string;
  centered?: boolean;
  leadingSlide?: React.ReactNode;
  slides: MappedCategorySlide[];
  isDismissable: boolean;
  closeAllCardIds?: readonly string[];
  onHeaderCtaPress?: () => void;
  onCardClick: (card: SmallSquareContentCard, displayedPosition: number) => void;
  onCardDismiss: (card: SmallSquareContentCard, displayedPosition: number) => void;
}>;

export function useContentCardsCategoryViewModel({
  category,
  categoryContentCards,
  leadingSlide,
  hardwareCarouselSharedProps,
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

  const closeAllCardIds = useMemo(() => {
    if (!shouldShowHardwareCarouselCloseAll(category)) {
      return undefined;
    }

    return categoryContentCards.map(card => String(card.id));
  }, [category, categoryContentCards]);

  const trackCategoryEvent = useCallback(
    (
      event: ContentCardInteractionEvent,
      card: SmallSquareContentCard,
      displayedPosition: number,
    ) => {
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

      if (hardwareCarouselSharedProps) {
        const deviceType = extractHardwareCarouselDevice(card.title);
        if (deviceType) {
          trackHardwareCarouselDeviceClick(deviceType, hardwareCarouselSharedProps);
        }
      }

      trackCategoryEvent(ContentCardEvent.Clicked, card, displayedPosition);
      logClickCard(card.id);
      openContentCardLink(
        shouldShowHardwareCarouselCloseAll(category)
          ? resolveHardwareCarouselCardLink(card.link)
          : card.link,
        navigate,
      );
    },
    [category, hardwareCarouselSharedProps, logClickCard, navigate, trackCategoryEvent],
  );

  const onCardDismiss = useCallback(
    (card: SmallSquareContentCard, displayedPosition: number) => {
      if (dismissCard(card.id)) {
        if (hardwareCarouselSharedProps) {
          trackHardwareCarouselCardDismiss(hardwareCarouselSharedProps);
        }

        trackCategoryEvent(ContentCardEvent.Dismissed, card, displayedPosition);
      }
    },
    [dismissCard, hardwareCarouselSharedProps, trackCategoryEvent],
  );

  return {
    title: category.title,
    cta: category.cta,
    link: category.link,
    centered: category.centeredText,
    leadingSlide,
    slides,
    isDismissable: Boolean(category.isDismissable),
    closeAllCardIds,
    onHeaderCtaPress: showHeaderCta ? onHeaderCtaPress : undefined,
    onCardClick,
    onCardDismiss,
  };
}

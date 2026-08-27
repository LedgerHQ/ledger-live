import React from "react";
import { Linking } from "react-native";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import HorizontalCard from "../../contentCards/cards/horizontal";
import { ContentBannerActionCard } from "../../contentCards/cards/contentBannerAction";
import {
  AnyContentCard,
  BrazeContentCard,
  CategoryContentCard,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
} from "../types";
import { Flex } from "@ledgerhq/native-ui";
import { ContentCardMetadata, ContentCardProps } from "~/contentCards/cards/types";
import {
  buildContentCardTrackingProperties,
  ContentCardEvent,
} from "@ledgerhq/live-common/braze/contentCardExtras";
import { contentCardItem } from "~/contentCards/cards/utils";
import {
  compareCards,
  mapAsHorizontalContentCard,
  mapAsSmallSquareContentCard,
  mapAsMediumSquareContentCard,
  mapAsBigSquareContentCard,
  mapAsHeroContentCard,
} from "~/dynamicContent/utils";
import Carousel from "../../contentCards/layouts/carousel";
import { WidthFactor } from "~/contentCards/layouts/types";
import useDynamicContent from "../useDynamicContent";
import Grid from "~/contentCards/layouts/grid";
import VerticalCard from "~/contentCards/cards/vertical";
import HeroCard from "~/contentCards/cards/hero";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";
import {
  trackHardwareCarouselDeviceClick,
  trackHardwareCarouselCardDismiss,
  type HardwareCarouselDevice,
  type HardwareCarouselSharedAnalyticsProps,
} from "~/dynamicContent/hardwareCarousel/analytics";

function extractDeviceType(title?: string): HardwareCarouselDevice | null {
  if (!title) return null;

  const titleLower = title.toLowerCase();
  if (titleLower.includes("gen5") || titleLower.includes("gen 5")) {
    return "ledger gen5";
  }
  if (titleLower.includes("flex")) {
    return "ledger flex";
  }
  if (titleLower.includes("stax")) {
    return "ledger stax";
  }

  return null;
}

// TODO : Better type to remove any (maybe use AnyContentCard)
/* eslint-disable @typescript-eslint/no-explicit-any */
const contentCardsTypes: {
  [key in ContentCardsType]: {
    contentCardComponent: (comp: any & ContentCardMetadata) => React.JSX.Element | null;
    mappingFunction: (card: BrazeContentCard) => AnyContentCard | null;
  };
} = {
  [ContentCardsType.smallSquare]: {
    contentCardComponent: VerticalCard,
    mappingFunction: mapAsSmallSquareContentCard,
  },
  [ContentCardsType.mediumSquare]: {
    contentCardComponent: VerticalCard,
    mappingFunction: mapAsMediumSquareContentCard,
  },
  [ContentCardsType.bigSquare]: {
    contentCardComponent: VerticalCard,
    mappingFunction: mapAsBigSquareContentCard,
  },
  [ContentCardsType.action]: {
    contentCardComponent: HorizontalCard,
    mappingFunction: mapAsHorizontalContentCard,
  },
  [ContentCardsType.hero]: {
    contentCardComponent: HeroCard,
    mappingFunction: mapAsHeroContentCard,
  },
  // TODO : To remove once we extract category from ContentCardsType
  [ContentCardsType.category]: {
    contentCardComponent: () => null,
    mappingFunction: () => null,
  },
};

type LayoutProps = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
  leadingSlide?: React.ReactNode;
  hardwareCarouselSharedProps?: HardwareCarouselSharedAnalyticsProps;
};

type LayoutCardItemProps = ContentCardProps & { widthFactor?: number };

const Layout = ({ category, cards, leadingSlide, hardwareCarouselSharedProps }: LayoutProps) => {
  const { logClickCard, dismissCard, trackContentCardEvent } = useDynamicContent();
  const isTopWallet = category.location === ContentCardLocation.TopWallet;
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("mobile");
  const isContentBannerVariant =
    shouldDisplayBrazePlacement &&
    category.location === ContentCardLocation.TopWallet &&
    category.cardsType === ContentCardsType.action;

  const contentCardsType = contentCardsTypes[category.cardsType];
  const contentCardComponent = isContentBannerVariant
    ? ContentBannerActionCard
    : contentCardsType.contentCardComponent;

  const onCardClick = async (card: AnyContentCard, displayedPosition: number) => {
    if (hardwareCarouselSharedProps) {
      const deviceType = extractDeviceType(card.title);
      if (deviceType) {
        trackHardwareCarouselDeviceClick(deviceType, hardwareCarouselSharedProps);
      }
    }

    await trackContentCardEvent(ContentCardEvent.Clicked, {
      ...buildContentCardTrackingProperties({
        cardExtras: card.extras,
        categoryExtras: category.extras,
        categoryLocation: category.location,
      }),
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      displayedPosition,
    });

    logClickCard(card.id);
    if (card.link) {
      const canOpenLink = await Linking.canOpenURL(card.link);
      if (canOpenLink) {
        await Linking.openURL(card.link as string);
      }
    }
  };

  const onCardDismiss = (card: AnyContentCard, displayedPosition: number) => {
    if (hardwareCarouselSharedProps) {
      trackHardwareCarouselCardDismiss(hardwareCarouselSharedProps);
    }

    trackContentCardEvent(ContentCardEvent.Dismissed, {
      ...buildContentCardTrackingProperties({
        cardExtras: card.extras,
        categoryExtras: category.extras,
        categoryLocation: category.location,
      }),
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      displayedPosition,
    });
    dismissCard(card.id);
  };

  const cardsMapped = cards
    .map(card => {
      const mapped = contentCardsType.mappingFunction(card);
      if (!mapped) return null;
      return { ...mapped, location: mapped.location ?? category.location };
    })
    .filter(card => card);

  const cardsSorted = (cardsMapped as AnyContentCard[]).sort(compareCards);
  const positionOffset = leadingSlide ? 1 : 0;

  const items = cardsSorted.map((card, index) =>
    contentCardItem(contentCardComponent, {
      ...card,
      type: category.cardsType,
      widthFactor:
        category.cardsLayout === ContentCardsLayout.carousel
          ? card.carouselWidthFactor
          : card.gridWidthFactor,

      metadata: {
        id: card.id,
        displayedPosition: index + positionOffset,

        actions: {
          onClick: card.link ? () => onCardClick(card, index + positionOffset) : undefined,
          onDismiss: category.isDismissable
            ? () => onCardDismiss(card, index + positionOffset)
            : undefined,
        },
      },
    } as LayoutCardItemProps),
  );

  const renderCarousel = (carouselItems: typeof items) => {
    const widthFactorSource = cardsSorted[0];
    const showLumenDots =
      (isContentBannerVariant || Boolean(leadingSlide)) &&
      carouselItems.length + (leadingSlide ? 1 : 0) > 1;
    return (
      <Carousel
        items={carouselItems}
        leadingSlide={leadingSlide}
        showLumenPageIndicator={showLumenDots}
        disableVerticalStretch={isTopWallet}
        styles={{
          widthFactor: widthFactorSource?.carouselWidthFactor || WidthFactor.Full,
          pagination: isTopWallet ? false : category.hasPagination,
          gap: widthFactorSource?.gridWidthFactor === WidthFactor.Full ? 6 : 8,
        }}
      />
    );
  };

  // Upsell + Braze share one carousel; keep `unique` semantics (one Braze card only).
  if (leadingSlide) {
    const carouselItems =
      category.cardsLayout === ContentCardsLayout.unique ? items.slice(0, 1) : items;
    return renderCarousel(carouselItems);
  }

  switch (category.cardsLayout) {
    case ContentCardsLayout.carousel: {
      return renderCarousel(items);
    }

    case ContentCardsLayout.grid:
      return <Grid items={items} styles={{ widthFactor: cardsSorted[0].gridWidthFactor }} />;

    case ContentCardsLayout.unique:
    default: {
      const item = items[0];
      const card = cardsSorted[0];
      return (
        <LogContentCardWrapper
          id={item.props.metadata.id}
          displayedPosition={item.props.metadata.displayedPosition}
          location={category.location ?? card?.location}
        >
          <Flex mx={6}>{item.component(item.props)}</Flex>
        </LogContentCardWrapper>
      );
    }
  }
};

export default Layout;

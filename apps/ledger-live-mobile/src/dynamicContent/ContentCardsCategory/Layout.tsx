import React from "react";
import { Linking } from "react-native";
import HorizontalCard from "../../contentCards/cards/horizontal";
import {
  AnyContentCard,
  BrazeContentCard,
  CategoryContentCard,
  ContentCardsLayout,
} from "../types";
import { Flex } from "@ledgerhq/native-ui";
import { ContentCardMetadata } from "~/contentCards/cards/types";
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
import { ContentCardsType } from "../types";
import Grid from "~/contentCards/layouts/grid";
import VerticalCard from "~/contentCards/cards/vertical";
import HeroCard from "~/contentCards/cards/hero";
import LogContentCardWrapper from "LLM/features/DynamicContent/components/LogContentCardWrapper";

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
};

const Layout = ({ category, cards }: LayoutProps) => {
  const { logClickCard, dismissCard, trackContentCardEvent } = useDynamicContent();

  const onCardCick = (card: AnyContentCard, displayedPosition?: number) => {
    trackContentCardEvent("contentcard_clicked", {
      ...card.extras,
      page: card.location,
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      displayedPosition,
    });

    logClickCard(card.id);
    if (card.link) {
      Linking.canOpenURL(card.link).then(() => Linking.openURL(card.link as string));
    }
  };

  const onCardDismiss = (card: AnyContentCard, displayedPosition?: number) => {
    trackContentCardEvent("contentcard_dismissed", {
      ...card.extras,
      page: card.location,
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      displayedPosition,
    });
    dismissCard(card.id);
  };

  const contentCardsType = contentCardsTypes[category.cardsType];
  const cardsMapped = cards
    .map(card => contentCardsType.mappingFunction(card))
    .filter(card => card);

  const cardsSorted = (cardsMapped as AnyContentCard[]).sort(compareCards);

  const items = cardsSorted.map((card, index) =>
    contentCardItem(contentCardsType.contentCardComponent, {
      ...card,
      widthFactor:
        category.cardsLayout === ContentCardsLayout.carousel
          ? card.carouselWidthFactor
          : card.gridWidthFactor,

      metadata: {
        id: card.id,
        displayedPosition: index,

        actions: {
          onClick: card.link ? () => onCardCick(card, index) : undefined,
          onDismiss: category.isDismissable ? () => onCardDismiss(card, index) : undefined,
        },
      },
    }),
  );

  switch (category.cardsLayout) {
    case ContentCardsLayout.carousel:
      return (
        <Carousel
          items={items}
          styles={{
            widthFactor: cardsSorted[0].carouselWidthFactor || WidthFactor.Full,
            pagination: category.hasPagination,
            gap: cardsSorted[0].gridWidthFactor === WidthFactor.Full ? 6 : 8,
          }}
        />
      );

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
          location={card?.location}
        >
          <Flex mx={6}>{item.component(item.props)}</Flex>
        </LogContentCardWrapper>
      );
    }
  }
};

export default Layout;

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
  // TODO : handle cards impressions with logImpressionCard
  const { logClickCard, dismissCard, trackContentCardEvent } = useDynamicContent();

  const onCardCick = (card: AnyContentCard) => {
    trackContentCardEvent("contentcard_clicked", {
      page: card.location,
      link: card.link,
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      location: category.location,
    });

    logClickCard(card.id);
    if (card.link) {
      Linking.canOpenURL(card.link).then(() => Linking.openURL(card.link as string));
    }
  };

  const onCardDismiss = (card: AnyContentCard) => {
    trackContentCardEvent("contentcard_dismissed", {
      page: card.location,
      link: card.link || undefined,
      campaign: card.id,
      contentcard: card.title,
      type: category.cardsType,
      layout: category.cardsLayout,
      location: category.location,
    });
    dismissCard(card.id);
  };

  const contentCardsType = contentCardsTypes[category.cardsType];
  const cardsMapped = cards.map(card => contentCardsType.mappingFunction(card));
  const cardsSorted = (cardsMapped as AnyContentCard[]).sort(compareCards);

  const items = cardsSorted.map(card =>
    contentCardItem(contentCardsType.contentCardComponent, {
      ...card,
      widthFactor:
        category.cardsLayout === ContentCardsLayout.carousel
          ? card.carouselWidthFactor
          : card.gridWidthFactor,

      metadata: {
        id: card.id,

        actions: {
          onClick: card.link ? () => onCardCick(card) : undefined,
          onDismiss: category.isDismissable ? () => onCardDismiss(card) : undefined,
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
    default:
      return <Flex mx={6}>{items[0].component(items[0].props)}</Flex>;
  }
};

export default Layout;

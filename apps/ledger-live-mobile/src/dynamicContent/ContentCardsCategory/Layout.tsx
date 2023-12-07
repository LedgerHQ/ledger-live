import React from "react";
import { BrazeContentCard, CategoryContentCard, ContentCardsLayout } from "../types";
import HorizontalCard from "../../contentCards/cards/horizontal";
import { Linking } from "react-native";
import { contentCardItem } from "../../contentCards/layouts/utils";
import Carousel from "../../contentCards/layouts/carousel";
import useDynamicContent from "../dynamicContent";
import { Flex } from "@ledgerhq/native-ui";
import { ContentCardsType } from "../types";
import { mapAsHorizontalContentCard } from "~/contentCards/cards/utils";

type LayoutProps = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
};

const Layout = ({ category, cards }: LayoutProps) => {
  // TODO : handle cards impressions with logImpressionCard
  const { logClickCard, dismissCard, trackContentCardEvent } = useDynamicContent();

  const onCardCick = (card: BrazeContentCard) => {
    trackContentCardEvent("contentcard_clicked", {
      screen: card.extras.location,
      link: card.extras.link,
      campaign: card.id,
    });

    logClickCard(card.id);
    Linking.canOpenURL(card.extras.link).then(() => Linking.openURL(card.extras.link));
  };

  const onCardDismiss = (card: BrazeContentCard) => {
    trackContentCardEvent("contentcard_dismissed", {
      screen: card.extras.location,
      link: card.extras.link || undefined,
      campaign: card.id,
    });
    dismissCard(card.id);
  };

  // TODO : Better type to remove any
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const contentCardsTypes: Record<
    ContentCardsType,
    {
      contentCardComponent: (
        _: any & {
          onClick: (card: BrazeContentCard) => void;
          onDismiss: (card: BrazeContentCard) => void;
        },
      ) => React.JSX.Element | null;
      mappingFunction: (card: BrazeContentCard) => any;
    }
  > = {
    [ContentCardsType.action]: {
      contentCardComponent: HorizontalCard,
      mappingFunction: mapAsHorizontalContentCard,
    },
    // TODO : To remove once we extract category from ContentCardsType
    [ContentCardsType.category]: {
      contentCardComponent: () => null,
      mappingFunction: () => { },
    },
  };

  const contentCardsType = contentCardsTypes[category.cardsType];
  const items = cards.map(card =>
    contentCardItem(contentCardsType.contentCardComponent, {
      ...contentCardsType.mappingFunction(card),
      onClick: card.extras.link ? () => onCardCick(card) : undefined,
      onDismiss: category.isDismissable ? () => onCardDismiss(card) : undefined,
    }),
  );

  switch (category.cardsLayout) {
    case ContentCardsLayout.carousel:
      return <Carousel items={items} />;
    // TODO
    // case ContentCardsLayout.grid:
    // return
    case ContentCardsLayout.unique:
    default:
      return <Flex mx={6}>{items[0].component(items[0].props)}</Flex>;
  }
};

export default Layout;

import React, { useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import useDynamicContent from "./dynamicContent";
import { CategoryContentCard, ContentCard } from "./types";

type HeaderProps = {
  title?: string;
  description?: string;
  cta?: string;
  link?: string;
}

const CategoryHeader = ({ title, description, cta, link }: HeaderProps) => {
  // TODO : Display properly
  return (
    <Flex>
      <Text>
        {title}
      </Text>
      <Text>
        {description}
      </Text>
      <Text>
        {cta}
      </Text>
      <Text>
        {link}
      </Text>
    </Flex>
  );
};

type CategoryLayoutProps = {
  category: CategoryContentCard,
  cards: ContentCard[],
};

const CategoryLayout = ({ category, cards }: CategoryLayoutProps) => {
  const renderContentCard: ListRenderItem<ContentCard> = useCallback(
    ({ item }) => (
      <ContentCardsCategory category={item} />
    ),
    [],
  );

  /* TODO : Handle the display depending on the category.layout */
  return (
    <FlatList
      data={cards}
      renderItem={renderContentCard}
      keyExtractor={(contentCard: ContentCard) => contentCard.id}
    // contentContainerStyle={{
    //   paddingHorizontal: 16,
    //   paddingBottom: TAB_BAR_SAFE_HEIGHT,
    // }}
    />
  );
};

type Props = {
  category: CategoryContentCard;
};

const ContentCardsCategory = ({ category }: Props) => {
  const { mobileCards } = useDynamicContent();
  const categoryContentCards = mobileCards.filter(mobileCard => mobileCard.categoryId === category.id);

  return (
    <Flex>
      <CategoryHeader
        title={category.title}
        description={category.description}
        cta={category.cta}
        link={category.link}
      />
      <CategoryLayout category={category} cards={categoryContentCards} />
    </Flex>
  );
};

export default ContentCardsCategory;

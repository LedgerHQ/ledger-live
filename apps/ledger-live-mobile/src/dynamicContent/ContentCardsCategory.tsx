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

type Props = {
  category: CategoryContentCard;
};

const ContentCardsCategory = ({ category }: Props) => {
  const { walletCards } = useDynamicContent();
  const categoryContentCards = walletCards; // TODO : Get all content cards with the categoryId === category.id; Here the walletCards is just a placeholder

  const renderContentCard: ListRenderItem<CategoryContentCard> = useCallback(
    ({ item }) => (
      <ContentCardsCategory category={item} />
    ),
    [],
  );

  return (
    <Flex>
      <CategoryHeader
        title={category.title}
        description={category.description}
        cta={category.cta}
        link={category.link}
      />
      {/* TODO : Handle the display depending on the category.layout */}
      <FlatList
        data={categoryContentCards}
        renderItem={renderContentCard}
        keyExtractor={(contentCard: ContentCard) => contentCard.id}
      // contentContainerStyle={{
      //   paddingHorizontal: 16,
      //   paddingBottom: TAB_BAR_SAFE_HEIGHT,
      // }}
      />
    </Flex>
  );
};

export default ContentCardsCategory;

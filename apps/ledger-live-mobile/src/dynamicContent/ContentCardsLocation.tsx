import React, { useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import useDynamicContent from "./dynamicContent";
import { CategoryContentCard } from "./types";
import ContentCardsCategory from "./ContentCardsCategory";

type Props = {
  locationId: string;
};

const ContentCardsLocation = ({ locationId }: Props) => {
  const flexibleContentCardsFeature = useFeature("flexibleContentCards");

  if (!flexibleContentCardsFeature?.enabled) return null;

  const { categoriesCards } = useDynamicContent();
  const categoriesToDisplay = categoriesCards.filter(categoryCard => categoryCard.location === locationId);

  const renderCategory: ListRenderItem<CategoryContentCard> = useCallback(
    ({ item }) => (
      <ContentCardsCategory category={item} />
    ),
    [],
  );

  return (
    <Flex>
      <FlatList
        data={categoriesToDisplay}
        renderItem={renderCategory}
        keyExtractor={(category: CategoryContentCard) => category.id}
      // contentContainerStyle={{
      //   paddingHorizontal: 16,
      //   paddingBottom: TAB_BAR_SAFE_HEIGHT,
      // }}
      />
    </Flex>
  );
};

export default ContentCardsLocation;

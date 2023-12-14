import React, { useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import useDynamicContent from "./dynamicContent";
import { BrazeContentCard, CategoryContentCard, LocationContentCard } from "./types";
import ContentCardsCategory from "./ContentCardsCategory";
import { FeatureToggle } from "@ledgerhq/live-config/lib/featureFlags/index";
import { compareCards } from "./utils";

type Props = FlexBoxProps & {
  locationId: LocationContentCard;
};

type CategoriesWithCards = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
};

const ContentCardsLocation = ({ locationId, ...containerProps }: Props) => {
  const { categoriesCards, mobileCards } = useDynamicContent();

  // TODO : extract in a component above
  const renderCategory: ListRenderItem<CategoriesWithCards> = useCallback(
    ({ item }) => (
      <ContentCardsCategory category={item.category} categoryContentCards={item.cards} />
    ),
    [],
  );

  const categoriesToDisplay = categoriesCards.filter(
    categoryCard => categoryCard.location === locationId,
  );

  if (categoriesToDisplay.length === 0) return null;

  const categoriesSorted = categoriesToDisplay.sort(compareCards);
  const categoriesWithCards = categoriesSorted.map(category => ({
    category,
    cards: mobileCards.filter(mobileCard => mobileCard.extras.categoryId === category.categoryId),
  }));
  const categoriesWithAtLeastOneCard = categoriesWithCards.filter(
    categoryWithCards => categoryWithCards.cards.length > 0,
  );

  return (
    <Flex {...containerProps}>
      <FlatList
        data={categoriesWithAtLeastOneCard}
        renderItem={renderCategory}
        keyExtractor={(item: CategoriesWithCards) => item.category.id}
        ItemSeparatorComponent={() => <Flex height={8} />}
      />
    </Flex>
  );
};

const ContentCardsLocationFeatureFlagged = (props: Props) => (
  <FeatureToggle featureId="flexibleContentCards">
    <ContentCardsLocation {...props} />
  </FeatureToggle>
);

export default ContentCardsLocationFeatureFlagged;

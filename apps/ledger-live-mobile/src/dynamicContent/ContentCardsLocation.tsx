import React from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import useDynamicContent from "./useDynamicContent";
import { BrazeContentCard, CategoryContentCard, ContentCardLocation } from "./types";
import ContentCardsCategory from "./ContentCardsCategory";
import { FeatureToggle } from "@ledgerhq/live-config/lib/featureFlags/index";
import { filterCategoriesByLocation, formatCategories } from "./utils";

const Category: ListRenderItem<CategoriesWithCards> = ({ item }) => (
  <ContentCardsCategory category={item.category} categoryContentCards={item.cards} />
);

type Props = FlexBoxProps & {
  locationId: ContentCardLocation;
};

type CategoriesWithCards = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
};

const ContentCardsLocation = ({ locationId, ...containerProps }: Props) => {
  const { categoriesCards, mobileCards } = useDynamicContent();

  const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, locationId);

  if (categoriesToDisplay.length === 0) return null;

  const categoriesFormatted = formatCategories(categoriesToDisplay, mobileCards);

  return (
    <Flex {...containerProps}>
      <FlatList
        data={categoriesFormatted}
        renderItem={Category}
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

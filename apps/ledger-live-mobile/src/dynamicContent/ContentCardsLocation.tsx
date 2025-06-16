import React from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import useDynamicContent from "./useDynamicContent";
import { AllLocations, BrazeContentCard, CategoryContentCard } from "./types";
import ContentCardsCategory from "./ContentCardsCategory";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { filterCategoriesByLocation, formatCategories } from "./utils";

const Category: ListRenderItem<CategoriesWithCards> = ({ item }) => (
  <ContentCardsCategory category={item.category} categoryContentCards={item.cards} />
);

type Props = FlexBoxProps & {
  locationId: AllLocations;
  hasStickyCta?: boolean;
  bottomSpacing?: number;
};

type CategoriesWithCards = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
};

const ContentCardsLocationComponent = ({
  locationId,
  hasStickyCta,
  bottomSpacing,
  ...containerProps
}: Props) => {
  const { categoriesCards, mobileCards } = useDynamicContent();
  const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, locationId);
  const categoriesFormatted = formatCategories(categoriesToDisplay, mobileCards);

  if (categoriesFormatted.length === 0) return null;

  return (
    <Flex {...containerProps}>
      <FlatList
        testID="flat-list-container"
        data={categoriesFormatted}
        renderItem={Category}
        keyExtractor={(item: CategoriesWithCards) => item.category.id}
        ItemSeparatorComponent={() => <Flex height={32} />}
        ListFooterComponent={
          hasStickyCta ? (
            <Flex height={116} />
          ) : bottomSpacing ? (
            <Flex height={bottomSpacing} />
          ) : null
        }
      />
    </Flex>
  );
};

const ContentCardsLocation = (props: Props) => (
  <FeatureToggle featureId="flexibleContentCards">
    <ContentCardsLocationComponent {...props} />
  </FeatureToggle>
);

export default ContentCardsLocation;

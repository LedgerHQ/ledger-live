import React from "react";
import { FlatList, ListRenderItem } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import useDynamicContent from "./useDynamicContent";
import { AllLocations, BrazeContentCard, CategoryContentCard } from "./types";
import ContentCardsCategory from "./ContentCardsCategory";
import { filterCategoriesByLocation, formatCategories } from "./utils";

type Props = FlexBoxProps & {
  locationId: AllLocations;
  hasStickyCta?: boolean;
  bottomSpacing?: number;
  leadingSlide?: React.ReactNode;
};

type CategoriesWithCards = {
  category: CategoryContentCard;
  cards: BrazeContentCard[];
};

const ContentCardsLocation = ({
  locationId,
  hasStickyCta,
  bottomSpacing,
  leadingSlide,
  ...containerProps
}: Props) => {
  const { categoriesCards, mobileCards } = useDynamicContent();
  const categoriesToDisplay = filterCategoriesByLocation(categoriesCards, locationId);
  const categoriesFormatted = formatCategories(categoriesToDisplay, mobileCards);

  if (categoriesFormatted.length === 0) return null;

  const renderCategory: ListRenderItem<CategoriesWithCards> = ({ item, index }) => (
    <ContentCardsCategory
      category={item.category}
      categoryContentCards={item.cards}
      leadingSlide={index === 0 ? leadingSlide : undefined}
    />
  );

  return (
    <Flex {...containerProps}>
      <FlatList
        testID="flat-list-container"
        data={categoriesFormatted}
        renderItem={renderCategory}
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

export default ContentCardsLocation;

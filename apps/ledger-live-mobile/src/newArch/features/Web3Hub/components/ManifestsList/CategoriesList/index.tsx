import React from "react";
import { FlashList } from "@shopify/flash-list";
import { Box } from "@ledgerhq/native-ui";
import useCategoriesListViewModel, {
  type useCategoriesListViewModelProps,
} from "./useCategoriesListViewModel";
import Badge from "./Badge";

const identityFn = (item: string) => item;

type Props = useCategoriesListViewModelProps;

export default function CategoriesList({ selectedCategory, selectCategory }: Props) {
  const { data, extraData } = useCategoriesListViewModel({ selectedCategory, selectCategory });

  return (
    <FlashList
      testID="web3hub-categories-scroll"
      horizontal
      contentContainerStyle={{
        paddingHorizontal: 5,
      }}
      keyExtractor={identityFn}
      renderItem={({ item, extraData }) => {
        return (
          <Badge
            onPress={() => extraData.selectCategory(item)}
            label={item}
            selected={extraData.selectedCategory === item}
          />
        );
      }}
      ListEmptyComponent={<Box height={32} />} // Empty box for first height calculation, could be improved
      estimatedItemSize={50}
      data={data}
      showsHorizontalScrollIndicator={false}
      extraData={extraData}
    />
  );
}

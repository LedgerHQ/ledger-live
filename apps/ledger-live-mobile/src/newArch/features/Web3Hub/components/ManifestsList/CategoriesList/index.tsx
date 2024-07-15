import React, { useMemo } from "react";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@ledgerhq/native-ui";
import Badge from "./Badge";

const categories = [
  "games",
  "defi",
  "collectibles",
  "marketplaces",
  "high-risk",
  "gambling",
  "exchanges",
  "social",
  "other",
];

// TODO move this to an api folder or utils for hooks
const fetchCategoriesMock = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return categories;
};

const selectCategories = (data: string[]) => {
  return ["all", ...data];
};

const identityFn = (item: string) => item;

type Props = {
  selectedCategory: string;
  selectCategory: (category: string) => void;
};

export default function CategoriesList({ selectedCategory, selectCategory }: Props) {
  const categoriesQuery = useQuery({
    queryKey: ["web3hub/categories"],
    queryFn: fetchCategoriesMock,
    select: selectCategories,
  });

  const categoriesExtraData = useMemo(() => {
    return {
      selectedCategory,
      selectCategory,
    };
  }, [selectCategory, selectedCategory]);

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
      data={categoriesQuery.data}
      showsHorizontalScrollIndicator={false}
      extraData={categoriesExtraData}
    />
  );
}

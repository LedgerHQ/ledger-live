import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoriesMock, selectCategories } from "LLM/features/Web3Hub/utils/api/categories";

export type useCategoriesListViewModelProps = {
  selectedCategory: string;
  selectCategory: (category: string) => void;
};

export const queryKey = ["web3hub/categories"];

export default function useCategoriesListViewModel({
  selectedCategory,
  selectCategory,
}: useCategoriesListViewModelProps) {
  const categoriesQuery = useQuery({
    queryKey,
    queryFn: fetchCategoriesMock,
    select: selectCategories,
  });

  const extraData = useMemo(() => {
    return {
      selectedCategory,
      selectCategory,
    };
  }, [selectCategory, selectedCategory]);

  return {
    data: categoriesQuery.data,
    extraData,
  };
}

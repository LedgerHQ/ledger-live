import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchCategoriesMock,
  selectCategories,
} from "LLM/features/Web3Hub/utils/api/categories";

export type useCategoriesListViewModelProps = {
  selectedCategory: string;
  selectCategory: (category: string) => void;
};

export const queryKey = ["web3hub/categories"];

const isInTest = process.env.NODE_ENV === "test" || !!process.env.MOCK_WEB3HUB;
const queryFn = isInTest ? fetchCategoriesMock : fetchCategories;

export default function useCategoriesListViewModel({
  selectedCategory,
  selectCategory,
}: useCategoriesListViewModelProps) {
  const categoriesQuery = useQuery({
    queryKey,
    queryFn: queryFn,
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

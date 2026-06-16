import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useGetTrendingCategoriesQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { track } from "~/analytics";
import type { MarketListCategory } from "~/reducers/types";

export type MarketCategoryTab = {
  value: MarketListCategory;
  labelKey?: string;
  label?: string;
};

export type MarketCategories = {
  selectedCategory: MarketListCategory;
  tabs: MarketCategoryTab[];
  onSelectCategory: (category: MarketListCategory) => void;
};

const DEFAULT_CATEGORY: MarketListCategory = "all";

const BUILT_IN_CATEGORY_TABS: MarketCategoryTab[] = [
  { value: "all", labelKey: "market.assets.categories.all" },
  { value: "starred", labelKey: "market.assets.categories.favorites" },
  { value: "stocks", labelKey: "market.assets.categories.stocks" },
];

function trackCategoryTap(category: MarketListCategory) {
  track("button_clicked", {
    button: "category",
    category,
    page: "Market",
  });
}

export function useMarketCategories({
  routeCategory,
}: {
  routeCategory?: MarketListCategory;
} = {}): MarketCategories {
  const { data: trendingCategories } = useGetTrendingCategoriesQuery();
  const entryCategory = routeCategory ?? DEFAULT_CATEGORY;
  const [selectedCategory, setSelectedCategory] = useState<MarketListCategory>(entryCategory);

  const tabs = useMemo<MarketCategoryTab[]>(
    () => [
      ...BUILT_IN_CATEGORY_TABS,
      ...(trendingCategories?.map(category => ({
        value: category.id,
        label: category.name,
      })) ?? []),
    ],
    [trendingCategories],
  );

  const selectableCategories = useMemo(() => new Set(tabs.map(tab => tab.value)), [tabs]);

  useFocusEffect(
    useCallback(() => {
      setSelectedCategory(entryCategory);
    }, [entryCategory]),
  );

  const effectiveCategory = selectableCategories.has(selectedCategory)
    ? selectedCategory
    : DEFAULT_CATEGORY;

  const onSelectCategory = useCallback(
    (category: MarketListCategory) => {
      trackCategoryTap(category);

      if (!selectableCategories.has(category)) {
        return;
      }

      setSelectedCategory(category);
    },
    [selectableCategories],
  );

  return useMemo(
    () => ({
      selectedCategory: effectiveCategory,
      tabs,
      onSelectCategory,
    }),
    [onSelectCategory, effectiveCategory, tabs],
  );
}

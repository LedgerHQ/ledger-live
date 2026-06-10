import { useCallback, useMemo } from "react";
import { useGetTrendingCategoriesQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { track } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import { selectMarketListCategory, setMarketListCategory } from "~/reducers/market";
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

const BUILT_IN_CATEGORY_TABS: MarketCategoryTab[] = [
  { value: "all", labelKey: "market.assets.categories.all" },
  { value: "stocks", labelKey: "market.assets.categories.stocks" },
  { value: "starred", labelKey: "market.assets.categories.favorites" },
];

function trackCategoryTap(category: MarketListCategory) {
  track("button_clicked", {
    button: "category",
    category,
    page: "Market",
  });
}

export function useMarketCategories(): MarketCategories {
  const dispatch = useDispatch();
  const persistedCategory = useSelector(selectMarketListCategory);
  const { data: trendingCategories } = useGetTrendingCategoriesQuery();

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

  // Persisted trending ids may no longer be trending after a refresh: fall back to "all".
  const selectedCategory = selectableCategories.has(persistedCategory) ? persistedCategory : "all";

  const onSelectCategory = useCallback(
    (category: MarketListCategory) => {
      trackCategoryTap(category);

      if (!selectableCategories.has(category)) {
        return;
      }

      dispatch(setMarketListCategory(category));
    },
    [dispatch, selectableCategories],
  );

  return useMemo(
    () => ({
      selectedCategory,
      tabs,
      onSelectCategory,
    }),
    [onSelectCategory, selectedCategory, tabs],
  );
}

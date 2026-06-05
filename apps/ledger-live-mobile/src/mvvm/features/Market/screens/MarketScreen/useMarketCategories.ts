import { useCallback, useMemo } from "react";
import { track } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import { selectMarketListCategory, setMarketListCategory } from "~/reducers/market";
import type { MarketListCategory } from "~/reducers/types";

const SELECTABLE_MARKET_CATEGORIES = new Set<MarketListCategory>(["all", "starred"]);

export type MarketCategoryTab = {
  value: MarketListCategory;
  labelKey: string;
};

export type MarketCategories = {
  selectedCategory: MarketListCategory;
  tabs: MarketCategoryTab[];
  onSelectCategory: (category: MarketListCategory) => void;
};

const categoryTabs: MarketCategoryTab[] = [
  { value: "all", labelKey: "market.assets.categories.all" },
  { value: "stocks", labelKey: "market.assets.categories.stocks" },
  { value: "starred", labelKey: "market.assets.categories.favorites" },
];

function isSelectableMarketCategory(category: MarketListCategory): boolean {
  return SELECTABLE_MARKET_CATEGORIES.has(category);
}

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
  const selectedCategory = isSelectableMarketCategory(persistedCategory)
    ? persistedCategory
    : "all";

  const onSelectCategory = useCallback(
    (category: MarketListCategory) => {
      trackCategoryTap(category);

      if (!isSelectableMarketCategory(category)) {
        return;
      }

      dispatch(setMarketListCategory(category));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      selectedCategory,
      tabs: categoryTabs,
      onSelectCategory,
    }),
    [onSelectCategory, selectedCategory],
  );
}

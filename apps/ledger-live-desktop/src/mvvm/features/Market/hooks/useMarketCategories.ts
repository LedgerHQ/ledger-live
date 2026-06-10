import { useCallback, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setMarketCategory,
  setMarketCurrentPage,
  setMarketOptions,
} from "~/renderer/actions/market";
import { marketCategorySelector, type MarketListCategory } from "~/renderer/reducers/market";

const SELECTABLE_MARKET_CATEGORIES = new Set<MarketListCategory>(["all", "stocks", "starred"]);

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
  const persistedCategory = useSelector(marketCategorySelector);
  const selectedCategory = isSelectableMarketCategory(persistedCategory)
    ? persistedCategory
    : "all";

  const onSelectCategory = useCallback(
    (category: MarketListCategory) => {
      trackCategoryTap(category);

      if (!isSelectableMarketCategory(category) || category === persistedCategory) {
        return;
      }

      dispatch(setMarketCategory(category));
      // Switching categories changes the underlying list, so restart pagination.
      dispatch(setMarketOptions({ page: 1 }));
      dispatch(setMarketCurrentPage(1));
    },
    [dispatch, persistedCategory],
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

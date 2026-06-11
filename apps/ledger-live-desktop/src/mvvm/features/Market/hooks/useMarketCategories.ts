import { useCallback, useMemo } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useGetTrendingCategoriesQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { isBuiltInMarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { track } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setMarketCategory,
  setMarketCurrentPage,
  setMarketOptions,
} from "~/renderer/actions/market";
import { marketCategorySelector, type MarketListCategory } from "~/renderer/reducers/market";

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
  const persistedCategory = useSelector(marketCategorySelector);
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("desktop");

  const { data: trendingCategories } = useGetTrendingCategoriesQuery(undefined, {
    skip: !shouldDisplayAssetDiscoverability,
  });

  const tabs = useMemo<MarketCategoryTab[]>(
    () => [
      ...BUILT_IN_CATEGORY_TABS,
      ...(trendingCategories
        ?.filter(category => !isBuiltInMarketListCategory(category.id))
        .map(category => ({ value: category.id, label: category.name })) ?? []),
    ],
    [trendingCategories],
  );

  const selectableCategories = useMemo(() => new Set(tabs.map(tab => tab.value)), [tabs]);

  // Persisted trending ids may no longer be trending after a refresh: fall back to "all".
  const selectedCategory = selectableCategories.has(persistedCategory) ? persistedCategory : "all";

  const onSelectCategory = useCallback(
    (category: MarketListCategory) => {
      trackCategoryTap(category);

      if (!selectableCategories.has(category) || category === persistedCategory) {
        return;
      }

      dispatch(setMarketCategory(category));
      // Switching categories changes the underlying list, so restart pagination.
      dispatch(setMarketOptions({ page: 1 }));
      dispatch(setMarketCurrentPage(1));
    },
    [dispatch, persistedCategory, selectableCategories],
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

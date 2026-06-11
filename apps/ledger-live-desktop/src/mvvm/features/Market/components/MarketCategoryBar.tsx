import React, { useCallback } from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import { TFunction } from "i18next";
import type { MarketCategories } from "../hooks/useMarketCategories";
import type { MarketListCategory } from "@ledgerhq/live-common/market/utils/category";

type MarketCategoryBarProps = {
  categories: MarketCategories;
  t: TFunction;
};

export function MarketCategoryBar({ categories, t }: Readonly<MarketCategoryBarProps>) {
  const { selectedCategory, tabs, onSelectCategory } = categories;

  const onSelectedChange = useCallback(
    (value: string) => onSelectCategory(value as MarketListCategory),
    [onSelectCategory],
  );

  return (
    // Reserve the row's remaining space and scroll horizontally when the trending chips overflow.
    // Scrolling stays enabled, but the scrollbar itself is hidden across engines.
    <div className="min-w-0 flex-1 overflow-x-auto mr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SegmentedControl
        selectedValue={selectedCategory}
        onSelectedChange={onSelectedChange}
        tabLayout="fit"
        aria-label={t("market.assets.categories.accessibilityLabel")}
        data-testid="market-category-switcher"
        className="w-fit"
      >
        {tabs.map(tab => (
          <SegmentedControlButton
            key={tab.value}
            value={tab.value}
            data-testid={`market-category-switcher-${tab.value}`}
          >
            {tab.label ?? (tab.labelKey ? t(tab.labelKey) : tab.value)}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
    </div>
  );
}

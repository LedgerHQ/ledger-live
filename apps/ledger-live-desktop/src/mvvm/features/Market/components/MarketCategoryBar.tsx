import React, { useCallback } from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import { TFunction } from "i18next";
import type { MarketListCategory } from "~/renderer/reducers/market";
import type { MarketCategories } from "../hooks/useMarketCategories";

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
    <SegmentedControl
      selectedValue={selectedCategory}
      onSelectedChange={onSelectedChange}
      aria-label={t("market.assets.categories.accessibilityLabel")}
      data-testid="market-category-switcher"
      className="w-[50%] xl:w-[25%]"
    >
      {tabs.map(tab => (
        <SegmentedControlButton
          key={tab.value}
          className="shrink-1"
          value={tab.value}
          data-testid={`market-category-switcher-${tab.value}`}
        >
          {t(tab.labelKey)}
        </SegmentedControlButton>
      ))}
    </SegmentedControl>
  );
}

import React, { useCallback } from "react";
import { ScrollView, type ViewStyle } from "react-native";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { MarketListCategory } from "~/reducers/types";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";
import type { MarketCategoryTab } from "../../useMarketCategories";

const HORIZONTAL_PADDING = 16;
const BOTTOM_SPACING = 12;

type Props = Readonly<{
  selectedCategory: MarketListCategory;
  tabs: MarketCategoryTab[];
  onSelectCategory: (category: MarketListCategory) => void;
}>;

export function MarketCategorySwitcher({ selectedCategory, tabs, onSelectCategory }: Props) {
  const { t } = useTranslation();

  const onSelectedChange = useCallback(
    (value: string) => {
      onSelectCategory(value);
    },
    [onSelectCategory],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={scrollStyle}
      contentContainerStyle={contentStyle}
    >
      <SegmentedControl
        selectedValue={selectedCategory}
        onSelectedChange={onSelectedChange}
        accessibilityLabel={t("market.assets.categories.accessibilityLabel")}
        testID={MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}
        tabLayout="fit"
      >
        {tabs.map(tab => (
          <SegmentedControlButton
            key={tab.value}
            value={tab.value}
            testID={`${MARKET_SCREEN_TEST_IDS.assetsCategorySwitcher}-${tab.value}`}
          >
            {tab.label ?? (tab.labelKey ? t(tab.labelKey) : tab.value)}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
    </ScrollView>
  );
}

const scrollStyle: ViewStyle = {
  marginBottom: BOTTOM_SPACING,
};

const contentStyle: ViewStyle = {
  paddingHorizontal: HORIZONTAL_PADDING,
};

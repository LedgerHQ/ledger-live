import React, { useCallback, useMemo, type ReactNode } from "react";
import { SectionList, type SectionListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { MarketListCategory } from "~/reducers/types";
import AssetListItem, { type MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";
import type { MarketCategoryTab } from "../../useMarketCategories";
import type { MarketFilters } from "../../useMarketFilters";
import { MarketFiltersDrawer } from "../MarketFiltersDrawer";
import { MarketAssetsEmptyState } from "./MarketAssetsEmptyState";
import { MarketAssetsListHeader } from "./MarketAssetsListHeader";
import { MarketCategorySwitcher } from "./MarketCategorySwitcher";
import { useMarketAssetsList } from "./useMarketAssetsList";

const HORIZONTAL_PADDING = 16;

type Props = Readonly<{
  assets: MarketAssetDisplayData[];
  loading: boolean;
  error: boolean;
  emptyState: "favorites" | "stocks" | undefined;
  selectedCategory: MarketListCategory;
  categoryTabs: MarketCategoryTab[];
  onSelectCategory: (category: MarketListCategory) => void;
  filters: MarketFilters;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onEndReached: () => void;
  showSubheader: boolean;
  header?: ReactNode;
}>;

export function MarketAssetsList({
  assets,
  loading,
  error,
  emptyState,
  selectedCategory,
  categoryTabs,
  onSelectCategory,
  filters,
  onAssetPress,
  onEndReached,
  showSubheader,
  header,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const {
    listRef,
    sections,
    contentMinHeight,
    footerMinHeight,
    handleScrollEnd,
    handleListLayout,
    handleHeaderLayout,
    keyExtractor,
  } = useMarketAssetsList({ assets, selectedCategory, showSubheader });

  const contentContainerStyle = useMemo(
    () => ({
      flexGrow: assets.length === 0 ? 1 : undefined,
      minHeight: contentMinHeight,
      paddingHorizontal: HORIZONTAL_PADDING,
      paddingBottom: GRADIENT_HEIGHT + bottom,
    }),
    [assets.length, contentMinHeight, bottom],
  );

  const renderRow = useCallback(
    ({ item }: SectionListRenderItemInfo<MarketAssetDisplayData>) => (
      <AssetListItem variant="market" market={item} onPress={onAssetPress} lx={rowStyle} />
    ),
    [onAssetPress],
  );

  const renderCategorySwitcher = useCallback(
    () => (
      <Box lx={stickyCategorySwitcherStyle}>
        <MarketCategorySwitcher
          selectedCategory={selectedCategory}
          tabs={categoryTabs}
          onSelectCategory={onSelectCategory}
        />
      </Box>
    ),
    [selectedCategory, categoryTabs, onSelectCategory],
  );

  const listFooter =
    assets.length === 0 ? (
      <Box style={{ minHeight: footerMinHeight }}>
        <MarketAssetsEmptyState
          loading={loading}
          error={error}
          emptyState={emptyState}
          showEmptySearchState={!showSubheader}
        />
      </Box>
    ) : null;

  return (
    <>
      <SectionList
        ref={listRef}
        testID={MARKET_SCREEN_TEST_IDS.list}
        sections={sections}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onLayout={handleListLayout}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        renderSectionHeader={showSubheader ? renderCategorySwitcher : undefined}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <MarketAssetsListHeader
            header={header}
            showSubheader={showSubheader}
            onOpenFilters={filters.onOpen}
            onLayout={handleHeaderLayout}
          />
        }
        ListFooterComponent={listFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={contentContainerStyle}
      />
      {assets.length > 0 && <BottomFadeGradient />}
      <MarketFiltersDrawer filters={filters} />
    </>
  );
}

const stickyCategorySwitcherStyle: LumenViewStyle = {
  marginHorizontal: "-s16",
  backgroundColor: "canvas",
};

const rowStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
};

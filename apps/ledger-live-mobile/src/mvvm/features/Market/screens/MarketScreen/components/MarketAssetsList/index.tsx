import React, { useCallback, type ReactNode } from "react";
import { FlatList, ListRenderItemInfo, ScrollView, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Box,
  IconButton,
  SegmentedControl,
  SegmentedControlButton,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Search, SettingsAlt2, StarFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { MarketListCategory } from "~/reducers/types";
import AssetListItem, {
  AssetLoadingState,
  type MarketAssetDisplayData,
} from "LLM/components/AssetListItem";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";
import type { MarketCategoryTab } from "../../useMarketCategories";
import type { MarketFilters } from "../../useMarketFilters";
import { MarketFiltersDrawer } from "../MarketFiltersDrawer";

const HORIZONTAL_PADDING = 16;
const TOP_PADDING = 24;
const SKELETON_COUNT = 3;
const CATEGORY_SWITCHER_BOTTOM_SPACING = 12;

function MarketAssetsEmptyState({
  loading,
  error,
  emptyState,
  showEmptySearchState,
}: Readonly<{
  loading: boolean;
  error: boolean;
  emptyState: "favorites" | "stocks" | undefined;
  showEmptySearchState: boolean;
}>) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <AssetLoadingState
        count={SKELETON_COUNT}
        lx={skeletonStyle}
        skeletonTestID={MARKET_SCREEN_TEST_IDS.assetsSkeleton}
      />
    );
  }

  if (error) {
    return (
      <Banner
        appearance="error"
        title={t("market.assets.error.title")}
        description={t("market.assets.error.description")}
        testID={MARKET_SCREEN_TEST_IDS.assetsError}
      />
    );
  }

  if (emptyState === "favorites") {
    return (
      <Box lx={emptyStateStyle} style={emptyStateSize}>
        <Spot
          appearance="icon"
          icon={StarFill}
          size={72}
          testID={MARKET_SCREEN_TEST_IDS.assetsFavoritesEmptyIcon}
        />
        <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("market.assets.emptyFavorites")}
        </Text>
      </Box>
    );
  }

  if (emptyState === "stocks") {
    return (
      <Box
        lx={emptyStateStyle}
        style={emptyStateSize}
        testID={MARKET_SCREEN_TEST_IDS.assetsStocksEmpty}
      >
        <Spot appearance="icon" icon={Search} size={72} />
        <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("market.assets.emptyStocks")}
        </Text>
      </Box>
    );
  }

  if (showEmptySearchState) {
    return (
      <Box
        lx={emptyStateStyle}
        style={emptyStateSize}
        testID={MARKET_SCREEN_TEST_IDS.assetsEmptySearch}
      >
        <Spot appearance="icon" icon={Search} size={72} />
        <Text typography="heading4SemiBold" lx={{ textAlign: "center", color: "base" }}>
          {t("modularDrawer.emptyAssetList")}
        </Text>
      </Box>
    );
  }

  return null;
}

type MarketCategorySwitcherProps = Readonly<{
  selectedCategory: MarketListCategory;
  tabs: MarketCategoryTab[];
  onSelectCategory: (category: MarketListCategory) => void;
}>;

function MarketCategorySwitcher({
  selectedCategory,
  tabs,
  onSelectCategory,
}: MarketCategorySwitcherProps) {
  const { t } = useTranslation();

  const onSelectedChange = useCallback(
    (value: string) => {
      onSelectCategory(value as MarketListCategory);
    },
    [onSelectCategory],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={categorySwitcherScrollStyle}
      contentContainerStyle={categorySwitcherContentStyle}
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
  const { t } = useTranslation();

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<MarketAssetDisplayData>) => (
      <AssetListItem variant="market" market={item} onPress={onAssetPress} lx={rowStyle} />
    ),
    [onAssetPress],
  );

  const listHeader =
    header || showSubheader ? (
      <Box lx={headerStyle}>
        {header}
        {showSubheader ? (
          <>
            <Subheader lx={subHeaderStyle} testID={MARKET_SCREEN_TEST_IDS.assetsSubHeader}>
              <SubheaderRow lx={subHeaderRowStyle}>
                <SubheaderTitle>{t("market.assets.title")}</SubheaderTitle>
                <IconButton
                  accessibilityLabel={t("market.assets.filters.accessibilityLabel")}
                  appearance="no-background"
                  icon={SettingsAlt2}
                  onPress={filters.onOpen}
                  size="sm"
                  testID={MARKET_SCREEN_TEST_IDS.assetsFilterButton}
                />
              </SubheaderRow>
            </Subheader>
            <MarketCategorySwitcher
              selectedCategory={selectedCategory}
              tabs={categoryTabs}
              onSelectCategory={onSelectCategory}
            />
          </>
        ) : null}
      </Box>
    ) : null;

  return (
    <>
      <FlatList
        testID={MARKET_SCREEN_TEST_IDS.list}
        data={assets}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <MarketAssetsEmptyState
            loading={loading}
            error={error}
            emptyState={emptyState}
            showEmptySearchState={!showSubheader}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{
          flexGrow: assets.length === 0 ? 1 : undefined,
          paddingTop: listHeader ? 0 : TOP_PADDING,
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: GRADIENT_HEIGHT + bottom,
        }}
      />
      {assets.length > 0 && <BottomFadeGradient />}
      <MarketFiltersDrawer filters={filters} />
    </>
  );
}

const headerStyle: LumenViewStyle = {
  marginHorizontal: "-s16",
  paddingTop: "s24",
  gap: "s12",
};

const subHeaderStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

const subHeaderRowStyle: LumenViewStyle = {
  alignItems: "center",
  justifyContent: "space-between",
};

const categorySwitcherScrollStyle: ViewStyle = {
  marginBottom: CATEGORY_SWITCHER_BOTTOM_SPACING,
};

const categorySwitcherContentStyle: ViewStyle = {
  paddingHorizontal: HORIZONTAL_PADDING,
};

const rowStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
};

const skeletonStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
  paddingHorizontal: "s8",
};

const emptyStateStyle: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: "s24",
};

const emptyStateSize = { minHeight: 328 };

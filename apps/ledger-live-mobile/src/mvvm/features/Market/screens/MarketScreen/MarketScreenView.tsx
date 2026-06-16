import React from "react";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { MarketAssetsList } from "./components/MarketAssetsList";
import { MarketHighlights } from "./components/MarketHighlights";
import { MARKET_SCREEN_TEST_IDS } from "./testIds";
import type { MarketScreenViewModel } from "./useMarketScreenViewModel";

type Props = Readonly<MarketScreenViewModel>;

export function MarketScreenView({ search, highlights, assetsList, isSearchActive }: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={MARKET_SCREEN_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen category="Page" name="Market" access />
      <Box lx={searchBarStyle}>
        <SearchInput
          testID={MARKET_SCREEN_TEST_IDS.searchBar}
          appearance="plain"
          value={search.value}
          onChangeText={search.onChangeText}
          onClear={search.onClear}
          placeholder={t("market.searchPlaceholder")}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </Box>
      <MarketAssetsList
        assets={assetsList.assets}
        loading={assetsList.assetsLoading}
        error={assetsList.assetsError}
        emptyState={assetsList.assetsEmptyState}
        selectedCategory={assetsList.categories.selectedCategory}
        categoryTabs={assetsList.categories.tabs}
        onSelectCategory={assetsList.categories.onSelectCategory}
        filters={assetsList.filters}
        onAssetPress={assetsList.onAssetPress}
        onEndReached={assetsList.onEndReached}
        showSubheader={!isSearchActive}
        header={
          !isSearchActive ? (
            <MarketHighlights
              cardWidth={highlights.cardWidth}
              snapToInterval={highlights.snapToInterval}
              highlightCards={highlights.highlightCards}
            />
          ) : undefined
        }
      />
    </Box>
  );
}

const screenStyle: LumenViewStyle = {
  flex: 1,
};

const searchBarStyle: LumenViewStyle = {
  marginTop: "s16",
  marginHorizontal: "s16",
  marginBottom: "s12",
};

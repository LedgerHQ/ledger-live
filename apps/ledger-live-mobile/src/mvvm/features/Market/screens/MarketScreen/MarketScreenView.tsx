import React, { useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { screen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { MarketAssetsList } from "./components/MarketAssetsList";
import { MarketHighlights } from "./components/MarketHighlights";
import { MARKET_SCREEN_TEST_IDS } from "./testIds";
import type { MarketScreenViewModel } from "./useMarketScreenViewModel";

type Props = Readonly<MarketScreenViewModel>;

export function MarketScreenView({
  search,
  highlights,
  assetsList,
  isSearchActive,
  pageTracking,
}: Props) {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const wasFocused = useRef(false);

  useEffect(() => {
    if (wasFocused.current === isFocused) return;
    wasFocused.current = isFocused;
    if (isFocused) {
      screen("Market", undefined, pageTracking, true, true);
    }
  }, [isFocused, pageTracking]);

  return (
    <Box testID={MARKET_SCREEN_TEST_IDS.screen} lx={screenStyle}>
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
        fetchingNextPage={assetsList.assetsFetchingNextPage}
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

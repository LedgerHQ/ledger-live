import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import { MarketAssetsList } from "./components/MarketAssetsList";
import { MarketHighlights } from "./components/MarketHighlights";
import { MARKET_SCREEN_TEST_IDS } from "./testIds";
import type { MarketScreenViewModel } from "./useMarketScreenViewModel";

const SEARCH_BAR_HEIGHT = 48;

type Props = Readonly<MarketScreenViewModel>;

export function MarketScreenView({
  cardWidth,
  snapToInterval,
  highlightCards,
  assets,
  assetsLoading,
  assetsLoadingMore,
  assetsError,
  onAssetPress,
  onEndReached,
}: Props) {
  return (
    <Box testID={MARKET_SCREEN_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen category="Page" name="Market" access />
      <Box testID={MARKET_SCREEN_TEST_IDS.searchBar} lx={searchBarStyle} style={searchBarSize} />
      <MarketAssetsList
        assets={assets}
        loading={assetsLoading}
        loadingMore={assetsLoadingMore}
        error={assetsError}
        onAssetPress={onAssetPress}
        onEndReached={onEndReached}
        header={
          <MarketHighlights
            cardWidth={cardWidth}
            snapToInterval={snapToInterval}
            highlightCards={highlightCards}
          />
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
  backgroundColor: "muted",
  borderRadius: "md",
};

const searchBarSize = { height: SEARCH_BAR_HEIGHT };

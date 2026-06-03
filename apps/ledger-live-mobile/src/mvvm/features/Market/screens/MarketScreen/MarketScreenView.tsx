import React, { useCallback } from "react";
import { FlatList, ListRenderItemInfo, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import { MARKET_SCREEN_TEST_IDS } from "./testIds";
import type { MarketScreenHighlightCard, MarketScreenViewModel } from "./useMarketScreenViewModel";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;
const SECTION_GAP = 24;
const HIGHLIGHT_CARD_HEIGHT = 160;
const LIST_PLACEHOLDER_HEIGHT = 320;
const SEARCH_BAR_HEIGHT = 48;

type Props = Readonly<MarketScreenViewModel>;

function HighlightCardSeparator() {
  return <Box style={{ width: CARD_GAP }} />;
}

export function MarketScreenView({ cardWidth, snapToInterval, highlightCards }: Props) {
  const { bottom } = useSafeAreaInsets();

  const renderHighlightCard = useCallback(
    ({ item }: ListRenderItemInfo<MarketScreenHighlightCard>) => (
      <Box
        key={item.key}
        testID={MARKET_SCREEN_TEST_IDS.highlightCard}
        lx={highlightCardStyle}
        style={{ width: cardWidth, height: HIGHLIGHT_CARD_HEIGHT }}
      />
    ),
    [cardWidth],
  );

  return (
    <Box testID={MARKET_SCREEN_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen category="Page" name="Market" access />
      <Box testID={MARKET_SCREEN_TEST_IDS.searchBar} lx={searchBarStyle} style={searchBarSize} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + SECTION_GAP }}
      >
        <Box lx={contentStyle}>
          <FlatList
            horizontal
            testID={MARKET_SCREEN_TEST_IDS.highlights}
            data={highlightCards}
            keyExtractor={item => item.key}
            renderItem={renderHighlightCard}
            ItemSeparatorComponent={HighlightCardSeparator}
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapToInterval}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          />
          <Box testID={MARKET_SCREEN_TEST_IDS.list} lx={listStyle} style={listSize} />
        </Box>
      </ScrollView>
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

const contentStyle: LumenViewStyle = {
  paddingTop: "s24",
  gap: "s24",
};

const highlightCardStyle: LumenViewStyle = {
  backgroundColor: "accent",
  borderRadius: "md",
};

const listStyle: LumenViewStyle = {
  marginHorizontal: "s16",
  backgroundColor: "interactive",
  borderRadius: "md",
};

const listSize = { height: LIST_PLACEHOLDER_HEIGHT };

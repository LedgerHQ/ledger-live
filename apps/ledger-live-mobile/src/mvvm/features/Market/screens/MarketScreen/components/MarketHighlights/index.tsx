import React, { useCallback } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AltcoinSeason } from "LLM/components/AltcoinSeason";
import { FearAndGreed } from "LLM/components/FearAndGreed";
import type { MarketHighlightCard } from "../../useMarketHighlights";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;

type Props = Readonly<{
  cardWidth: number;
  snapToInterval: number;
  highlightCards: MarketHighlightCard[];
}>;

function CardSeparator() {
  return <Box style={{ width: CARD_GAP }} />;
}

export function MarketHighlights({ cardWidth, snapToInterval, highlightCards }: Props) {
  const renderCard = useCallback(
    ({ item }: ListRenderItemInfo<MarketHighlightCard>) => (
      <Box testID={MARKET_SCREEN_TEST_IDS.highlightCard} style={{ width: cardWidth }}>
        {item.type === "fearAndGreed" ? (
          <FearAndGreed appearance="expanded" width={cardWidth} />
        ) : null}
        {item.type === "altcoinSeason" ? <AltcoinSeason width={cardWidth} /> : null}
      </Box>
    ),
    [cardWidth],
  );

  return (
    <FlatList
      horizontal
      testID={MARKET_SCREEN_TEST_IDS.highlights}
      data={highlightCards}
      keyExtractor={item => item.key}
      renderItem={renderCard}
      ItemSeparatorComponent={CardSeparator}
      showsHorizontalScrollIndicator={false}
      snapToInterval={snapToInterval}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
    />
  );
}

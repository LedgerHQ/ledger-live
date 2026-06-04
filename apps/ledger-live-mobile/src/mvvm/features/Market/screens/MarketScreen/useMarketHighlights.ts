import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;

export type MarketHighlightCard = {
  key: string;
  type: "fearAndGreed" | "altcoinSeason";
};

export interface MarketHighlights {
  cardWidth: number;
  cardGap: number;
  snapToInterval: number;
  highlightCards: MarketHighlightCard[];
}

export function useMarketHighlights(): MarketHighlights {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const cardWidth = (width - HORIZONTAL_PADDING * 2) / 2 - CARD_GAP;

    return {
      cardWidth,
      cardGap: CARD_GAP,
      snapToInterval: cardWidth + CARD_GAP,
      highlightCards: [
        { key: "market-highlight-fear-and-greed", type: "fearAndGreed" },
        { key: "market-highlight-altcoin-season", type: "altcoinSeason" },
      ],
    };
  }, [width]);
}

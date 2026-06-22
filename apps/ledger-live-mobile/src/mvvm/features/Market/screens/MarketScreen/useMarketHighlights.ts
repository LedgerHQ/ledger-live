import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useMoodIndexAvailability } from "LLM/components/FearAndGreed/useMoodIndexAvailability";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;

export type MarketHighlightCard = {
  key: string;
  type: "marketCap" | "fearAndGreed" | "altcoinSeason";
};

export interface MarketHighlights {
  cardWidth: number;
  cardGap: number;
  snapToInterval: number;
  highlightCards: MarketHighlightCard[];
}

export function useMarketHighlights(): MarketHighlights {
  const { width } = useWindowDimensions();
  const isMoodIndexAvailable = useMoodIndexAvailability();

  return useMemo(() => {
    const cardWidth = (width - HORIZONTAL_PADDING * 2) / 2 - CARD_GAP;

    const highlightCards: MarketHighlightCard[] = [
      { key: "market-highlight-market-cap", type: "marketCap" },
      ...(isMoodIndexAvailable
        ? [{ key: "market-highlight-fear-and-greed", type: "fearAndGreed" } as const]
        : []),
      { key: "market-highlight-altcoin-season", type: "altcoinSeason" },
    ];

    return {
      cardWidth,
      cardGap: CARD_GAP,
      snapToInterval: cardWidth + CARD_GAP,
      highlightCards,
    };
  }, [width, isMoodIndexAvailable]);
}

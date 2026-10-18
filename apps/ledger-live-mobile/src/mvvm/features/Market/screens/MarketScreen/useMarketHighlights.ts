import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { isMoodIndexAvailable } from "@features/flow-fear-and-greed";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";

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
  const moodIndexAvailable = isMoodIndexAvailable(getCountryLocale());

  return useMemo(() => {
    const cardWidth = (width - HORIZONTAL_PADDING * 2) / 2 - CARD_GAP;

    const highlightCards: MarketHighlightCard[] = [
      { key: "market-highlight-market-cap", type: "marketCap" },
      ...(moodIndexAvailable
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
  }, [width, moodIndexAvailable]);
}

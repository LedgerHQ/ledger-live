import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  useGetFearAndGreedLatestQuery,
  FIFTEEN_MINUTES_IN_MS,
} from "@ledgerhq/live-common/cmc-client/state-manager/api";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 8;
const PLACEHOLDER_CARD_COUNT = 3;

export type MarketScreenHighlightCardType = "fearAndGreed" | "placeholder";

export type MarketScreenHighlightCard = {
  key: string;
  type: MarketScreenHighlightCardType;
};

export type MarketScreenViewModel = {
  cardWidth: number;
  cardGap: number;
  snapToInterval: number;
  highlightCards: MarketScreenHighlightCard[];
  isHighlightsLoading: boolean;
};

/**
 * View model for the Market screen shell.
 *
 * Card sizing follows the design spec: two cards plus a peek of the third must
 * fit within the horizontal padding, so the width is half of the available row
 * minus half of the inter-card gap.
 *
 * Block 2 opens with the Fear & Greed card, followed by placeholder cards. The
 * whole block is gated behind a single loading flag so it can be replaced by a
 * generic skeleton while its data is fetched.
 */
export function useMarketScreenViewModel(): MarketScreenViewModel {
  const { width } = useWindowDimensions();
  const { isLoading } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FIFTEEN_MINUTES_IN_MS,
  });

  return useMemo(() => {
    const cardWidth = (width - HORIZONTAL_PADDING * 2) / 2 - CARD_GAP;

    const placeholderCards: MarketScreenHighlightCard[] = Array.from(
      { length: PLACEHOLDER_CARD_COUNT },
      (_, index) => ({ key: `market-highlight-${index}`, type: "placeholder" }),
    );

    return {
      cardWidth,
      cardGap: CARD_GAP,
      snapToInterval: cardWidth + CARD_GAP,
      highlightCards: [{ key: "fear-and-greed", type: "fearAndGreed" }, ...placeholderCards],
      isHighlightsLoading: isLoading,
    };
  }, [width, isLoading]);
}

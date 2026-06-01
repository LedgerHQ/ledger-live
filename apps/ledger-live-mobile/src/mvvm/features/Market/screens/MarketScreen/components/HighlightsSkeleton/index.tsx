import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

const CARD_HEIGHT = 160;
const SKELETON_CARD_COUNT = 3;

const SKELETON_CARD_KEYS = Array.from(
  { length: SKELETON_CARD_COUNT },
  (_, index) => `market-highlights-skeleton-${index}`,
);

type HighlightsSkeletonProps = Readonly<{
  cardWidth: number;
}>;

/**
 * Generic loading state for Block 2: it takes the place of the whole highlights
 * carousel while the cards' data is being fetched, so it is shared by every card.
 */
export function HighlightsSkeleton({ cardWidth }: HighlightsSkeletonProps) {
  return (
    <Box testID={MARKET_SCREEN_TEST_IDS.highlightsSkeleton} lx={rowStyle}>
      {SKELETON_CARD_KEYS.map(key => (
        <Skeleton
          key={key}
          lx={{ borderRadius: "md" }}
          style={{ width: cardWidth, height: CARD_HEIGHT }}
        />
      ))}
    </Box>
  );
}

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
  paddingHorizontal: "s16",
  overflow: "hidden",
};

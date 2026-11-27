import React from "react";
import { Box, MediaImage, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import type { OrderSummaryProps } from "./PredictionsOrderSheet.types";
import { outcomeTagAppearance } from "./orderCopy";

// The tag doesn't shrink on its own: a long outcome would push the market's title out of the row.
const HALF_THE_ROW = { maxWidth: "50%" } as const;

export function OrderSummary({ display }: OrderSummaryProps) {
  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}
      testID="predictions-order-summary"
    >
      <MediaImage
        {...(display.imageUrl !== undefined && { src: display.imageUrl })}
        alt=""
        fallback={display.marketTitle}
        size={40}
      />
      <Box lx={{ flex: 1 }}>
        {display.eventTitle !== undefined ? (
          <Text typography="body3" lx={{ color: "muted" }}>
            {display.eventTitle}
          </Text>
        ) : null}
        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "s8",
          }}
        >
          <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
            {display.marketTitle}
          </Text>
          <Tag
            size="md"
            appearance={outcomeTagAppearance(display)}
            label={display.outcomeLabel}
            style={HALF_THE_ROW}
            testID="predictions-order-outcome"
          />
        </Box>
      </Box>
    </Box>
  );
}

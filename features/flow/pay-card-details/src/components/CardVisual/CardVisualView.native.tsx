import React from "react";
import { AmountDisplay, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenStyleSheetProvider } from "@ledgerhq/lumen-ui-rnative/styles";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import type { CardVisualViewProps } from "../../types";

/**
 * The card face with the balance overlay. The card is always dark, so the overlay runs on the dark
 * color scheme to keep the caption and amount legible whatever the app theme is.
 */
export function CardVisualView({
  balance,
  formatCountervalue,
  balanceLabel,
  isLoading = false,
}: CardVisualViewProps) {
  return (
    <LumenStyleSheetProvider themes={ledgerLiveThemes} colorScheme="dark">
      <Box lx={{ width: "full" }} testID="card-visual">
        <CardArtwork />
        <Box
          lx={{
            position: "absolute",
            top: "s0",
            left: "s0",
            right: "s0",
            gap: "s4",
            padding: "s20",
          }}
        >
          <Text typography="body3" lx={{ color: "muted" }}>
            {balanceLabel}
          </Text>
          <AmountDisplay
            value={balance}
            formatter={formatCountervalue}
            loading={isLoading}
            size="sm"
            testID="card-visual-amount"
          />
        </Box>
      </Box>
    </LumenStyleSheetProvider>
  );
}

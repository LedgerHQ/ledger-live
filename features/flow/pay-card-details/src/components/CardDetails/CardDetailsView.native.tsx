import React from "react";
import { Box, Button, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardDetailsSheet } from "./CardDetailsSheet";
import type { CardDetailsViewProps } from "../../types";

const CARD_FADE_HEIGHT = "55%";

const CARD_FADE_STOPS = [
  { color: "#000000", offset: 0, opacity: 0 },
  { color: "#000000", offset: 1, opacity: 1 },
];

export function CardDetailsView({
  cardVisual,
  placeholderLabel,
  detailsLabel,
  isSheetOpen,
  onDetailsPress,
  onSheetClose,
}: CardDetailsViewProps) {
  return (
    <Box testID="card-details">
      <Box style={{ position: "relative" }}>
        {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}

        <LinearGradient
          direction="to-bottom"
          stops={CARD_FADE_STOPS}
          pointerEvents="none"
          testID="card-details-fade"
          lx={{ borderBottomLeftRadius: "lg", borderBottomRightRadius: "lg" }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: CARD_FADE_HEIGHT,
          }}
        />

        <Box
          lx={{ flexDirection: "row", gap: "s8", padding: "s16" }}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
        >
          <Button
            appearance="base"
            size="lg"
            isFull
            lx={{ flex: 1 }}
            accessibilityLabel={placeholderLabel}
            testID="card-details-placeholder"
          >
            {placeholderLabel}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            isFull
            lx={{ flex: 1 }}
            onPress={onDetailsPress}
            accessibilityLabel={detailsLabel}
            testID="card-details-open"
          >
            {detailsLabel}
          </Button>
        </Box>
      </Box>

      <CardDetailsSheet isOpen={isSheetOpen} cardVisual={cardVisual} onClose={onSheetClose} />
    </Box>
  );
}

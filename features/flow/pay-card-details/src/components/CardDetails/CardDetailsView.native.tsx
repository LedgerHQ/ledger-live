import React from "react";
import { Box, Button, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardDetailsSheet } from "./CardDetailsSheet";
import type { CardDetailsViewProps } from "../../types";

const CARD_FADE_HEIGHT = "55%";
const CARD_FADE_COLOR = "#000000";

const CARD_FADE_STOPS = [
  { color: CARD_FADE_COLOR, offset: 0, opacity: 0 },
  { color: CARD_FADE_COLOR, offset: 1, opacity: 1 },
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
    <Box>
      <Box lx={{ position: "relative" }}>
        {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}

        <LinearGradient
          direction="to-bottom"
          stops={CARD_FADE_STOPS}
          pointerEvents="none"
          lx={{
            position: "absolute",
            borderBottomLeftRadius: "lg",
            borderBottomRightRadius: "lg",
          }}
          style={{ bottom: 0, left: 0, right: 0, height: CARD_FADE_HEIGHT }}
        />

        <Box
          lx={{ flexDirection: "row", gap: "s8", padding: "s16", position: "absolute" }}
          style={{ bottom: 0, left: 0, right: 0 }}
        >
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled
            lx={{ flex: 1 }}
            accessibilityLabel={placeholderLabel}
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
          >
            {detailsLabel}
          </Button>
        </Box>
      </Box>

      <CardDetailsSheet isOpen={isSheetOpen} cardVisual={cardVisual} onClose={onSheetClose} />
    </Box>
  );
}

import React from "react";
import { Box, Button, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardTopUpButton } from "../CardTopUp";
import { CardDetailsSheet } from "./CardDetailsSheet";
import { CARD_FADE } from "../CardArtwork/cardColors";
import type { CardDetailsViewProps } from "../../types";

const CARD_FADE_HEIGHT = "55%";

const CARD_FADE_STOPS = [
  { color: CARD_FADE, offset: 0, opacity: 0 },
  { color: CARD_FADE, offset: 1, opacity: 1 },
];

export function CardDetailsView({
  cardVisual,
  detailsLabel,
  isSheetOpen,
  scene,
  onTopUp,
  onDetailsPress,
  onSheetClose,
  onSceneBack,
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
          {onTopUp ? (
            <Box lx={{ flex: 1 }}>
              <CardTopUpButton onTopUp={onTopUp} />
            </Box>
          ) : null}
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

      <CardDetailsSheet
        isOpen={isSheetOpen}
        scene={scene}
        onTopUp={onTopUp}
        onClose={onSheetClose}
        onBack={onSceneBack}
      />
    </Box>
  );
}

import React from "react";
import { Box, Button, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { PayTrackPage } from "@features/platform-pay-analytics";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardFade } from "../CardArtwork/CardFade";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardTopUpButton } from "../CardTopUp";
import { CardDetailsSheet } from "./CardDetailsSheet";
import type { CardDetailsViewProps } from "../../types";

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
  const { theme } = useTheme();
  const fadeColor = theme.colors.bg?.base ?? ledgerLiveThemes.light.colors.bg.base;

  return (
    <Box>
      {isSheetOpen ? <PayTrackPage page="Card details" /> : null}
      <Box lx={{ position: "relative" }}>
        {cardVisual ? (
          <CardVisual {...cardVisual} fadeColor={fadeColor} />
        ) : (
          <Box lx={{ borderRadius: "lg" }} style={{ overflow: "hidden" }}>
            <CardArtwork />
            <CardFade color={fadeColor} />
          </Box>
        )}

        <Box
          lx={{ flexDirection: "row", gap: "s8", position: "absolute" }}
          style={{ bottom: 0, left: 0, right: 0 }}
        >
          {onTopUp ? (
            <Box lx={{ flex: 1 }}>
              <CardTopUpButton onTopUp={onTopUp} />
            </Box>
          ) : null}
          <Button
            appearance="gray"
            size="md"
            isFull
            lx={{ flex: 1 }}
            onPress={onDetailsPress}
            accessibilityLabel={detailsLabel}
            testID="card-details-button"
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

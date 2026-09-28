import React from "react";
import { Box, Button, Pressable, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { PayTrackPage } from "@features/platform-pay-analytics";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardFade } from "../CardArtwork/CardFade";
import { CardVisual } from "../CardVisual/CardVisual";
import { CardDetailsSheet } from "./CardDetailsSheet";
import type { CardDetailsViewProps } from "../../types";

const FACE_ACTIONS_INSET = { bottom: 0, left: 0, right: 0 };

export function CardDetailsView({
  cardVisual,
  isSheetOpen,
  scene,
  faceActions,
  onFacePress,
  onTopUp,
  onSheetClose,
  onSceneBack,
}: CardDetailsViewProps) {
  const { theme } = useTheme();
  const fadeColor = theme.colors.bg?.base ?? ledgerLiveThemes.light.colors.bg.base;

  return (
    <Box>
      {isSheetOpen ? <PayTrackPage page="Card details" /> : null}
      <Box lx={{ position: "relative" }}>
        <Pressable
          accessible={false}
          disabled={!onFacePress}
          onPress={onFacePress}
          testID="card-details-face"
        >
          {cardVisual ? (
            <CardVisual {...cardVisual} fadeColor={fadeColor} />
          ) : (
            <Box lx={{ borderRadius: "lg" }} style={{ overflow: "hidden" }}>
              <CardArtwork />
              <CardFade color={fadeColor} />
            </Box>
          )}
        </Pressable>

        <Box
          pointerEvents="box-none"
          lx={{ flexDirection: "row", gap: "s8", position: "absolute" }}
          style={FACE_ACTIONS_INSET}
        >
          {faceActions.map(action => (
            <Box key={action.key} lx={{ flex: 1 }}>
              <Button
                appearance={action.appearance}
                size="md"
                isFull
                onPress={action.onPress}
                accessibilityLabel={action.label}
                testID={action.testID}
              >
                {action.label}
              </Button>
            </Box>
          ))}
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

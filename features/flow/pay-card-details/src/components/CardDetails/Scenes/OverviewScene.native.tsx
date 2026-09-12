import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { CardArtwork } from "../../CardArtwork/CardArtwork";
import { CardVisual } from "../../CardVisual/CardVisual";
import { FreezeAction } from "../../Freeze/Tile/FreezeAction";
import { MoreAction } from "../../More/Tile/MoreAction";
import type { CardVisualProps } from "../../../types";
import type { OverviewSceneProps } from "./types";

const FLIP_TRANSITION = {
  transitionProperty: "transform",
  transitionDuration: 500,
  transitionTimingFunction: "ease-in-out",
} as const;

type OverviewActionsProps = Omit<OverviewSceneProps, "cardVisual"> &
  Readonly<{
    isRevealed: boolean;
    onToggleReveal: () => void;
  }>;

function CardFace({ cardVisual }: { readonly cardVisual?: CardVisualProps }) {
  return cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;
}

function FlipCard({
  isRevealed,
  cardVisual,
}: {
  readonly isRevealed: boolean;
  readonly cardVisual?: CardVisualProps;
}) {
  return (
    <View testID="card-numbers-flip">
      <Animated.View
        style={{
          ...FLIP_TRANSITION,
          backfaceVisibility: "hidden",
          transform: [{ perspective: 1000 }, { rotateY: isRevealed ? "-180deg" : "0deg" }],
        }}
      >
        <CardFace cardVisual={cardVisual} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.back,
          {
            ...FLIP_TRANSITION,
            backfaceVisibility: "hidden",
            transform: [{ perspective: 1000 }, { rotateY: isRevealed ? "0deg" : "180deg" }],
          },
        ]}
      >
        <CardFace cardVisual={cardVisual} />
      </Animated.View>
    </View>
  );
}

function OverviewActions({
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
  isRevealed,
  onToggleReveal,
}: OverviewActionsProps) {
  const { t } = useTranslation();
  const viewLabel = isRevealed ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal");

  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }}>
      <Box lx={{ flex: 1 }}>
        <TileButton
          icon={isRevealed ? EyeCross : Eye}
          isFull
          onPress={onToggleReveal}
          accessibilityLabel={viewLabel}
        >
          {viewLabel}
        </TileButton>
      </Box>
      <Box lx={{ flex: 1 }}>
        <FreezeAction
          status={freezeViewModel.status}
          isActionDisabled={freezeViewModel.isActionDisabled}
          onOpenConfirm={onFreezePress}
        />
      </Box>
      <Box lx={{ flex: 1 }}>
        {moreViewModel ? (
          <MoreAction moreLabel={moreViewModel.moreLabel} onMorePress={onMorePress} />
        ) : null}
      </Box>
    </Box>
  );
}

export function OverviewScene({
  cardVisual,
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
}: OverviewSceneProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <Box lx={{ gap: "s16" }} testID="card-details-overview">
      <FlipCard isRevealed={isRevealed} cardVisual={cardVisual} />

      <OverviewActions
        freezeViewModel={freezeViewModel}
        moreViewModel={moreViewModel}
        onFreezePress={onFreezePress}
        onMorePress={onMorePress}
        isRevealed={isRevealed}
        onToggleReveal={() => setIsRevealed(open => !open)}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  back: { ...StyleSheet.absoluteFillObject },
});

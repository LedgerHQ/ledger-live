import React from "react";
import { StyleSheet, View } from "react-native";
import { Box, Text, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardArtwork } from "../../CardArtwork/CardArtwork";
import { CardVisual } from "../../CardVisual/CardVisual";
import { FreezeAction } from "../../Freeze/Tile/FreezeAction";
import { MoreAction } from "../../More/Tile/MoreAction";
import { CardNumbersView } from "../../CardNumbers/CardNumbersView";
import { useCardNumbersViewModel } from "../../CardNumbers/useCardNumbersViewModel";
import type { CardNumbersViewProps, UnlockForCardNumbers } from "../../../types";
import type { OverviewSceneProps } from "./types";

type OverviewActionsProps = Omit<OverviewSceneProps, "cardVisual" | "unlock"> &
  Readonly<{
    cardNumbersViewModel?: CardNumbersViewProps;
  }>;

function CardFace({ cardVisual }: Pick<OverviewSceneProps, "cardVisual">) {
  return cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;
}

function OverviewActions({
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
  cardNumbersViewModel,
}: OverviewActionsProps) {
  const { t } = useTranslation();
  const isRevealed = Boolean(cardNumbersViewModel?.isRevealed);
  const viewLabel = isRevealed ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal");

  return (
    <Box lx={{ gap: "s8" }}>
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        {cardNumbersViewModel ? (
          <View style={styles.action}>
            <TileButton
              icon={isRevealed ? EyeCross : Eye}
              isFull
              disabled={cardNumbersViewModel.status === "loading"}
              onPress={isRevealed ? cardNumbersViewModel.onHide : cardNumbersViewModel.onReveal}
              accessibilityLabel={viewLabel}
            >
              {viewLabel}
            </TileButton>
          </View>
        ) : null}
        <View style={styles.action}>
          <FreezeAction
            status={freezeViewModel.status}
            isActionDisabled={freezeViewModel.isActionDisabled}
            onOpenConfirm={onFreezePress}
          />
        </View>
        <View style={styles.action}>
          {moreViewModel ? (
            <MoreAction moreLabel={moreViewModel.moreLabel} onMorePress={onMorePress} />
          ) : null}
        </View>
      </Box>
      {cardNumbersViewModel?.status === "failed" ? (
        <Text typography="body2">{t("payTab.card.numbers.failed")}</Text>
      ) : null}
    </Box>
  );
}

function OverviewLayout({
  cardVisual,
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
  formatters,
  cardNumbersViewModel,
}: OverviewSceneProps & { readonly cardNumbersViewModel?: CardNumbersViewProps }) {
  const cardFace = <CardFace cardVisual={cardVisual} />;

  return (
    <Box lx={{ gap: "s16" }} testID="card-details-overview">
      {cardNumbersViewModel ? (
        <CardNumbersView {...cardNumbersViewModel} cardFace={cardFace} />
      ) : (
        cardFace
      )}

      <OverviewActions
        freezeViewModel={freezeViewModel}
        moreViewModel={moreViewModel}
        onFreezePress={onFreezePress}
        onMorePress={onMorePress}
        cardNumbersViewModel={cardNumbersViewModel}
      />

      <CardTransactions formatters={formatters} />
    </Box>
  );
}

function OverviewWithNumbers({
  unlock,
  ...props
}: OverviewSceneProps & { readonly unlock: UnlockForCardNumbers }) {
  const cardNumbersViewModel = useCardNumbersViewModel({ unlock });
  return <OverviewLayout {...props} unlock={unlock} cardNumbersViewModel={cardNumbersViewModel} />;
}

export function OverviewScene(props: OverviewSceneProps) {
  return props.unlock ? (
    <OverviewWithNumbers {...props} unlock={props.unlock} />
  ) : (
    <OverviewLayout {...props} />
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, minWidth: 0 },
});

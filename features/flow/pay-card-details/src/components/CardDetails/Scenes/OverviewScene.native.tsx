import React from "react";
import { Box, Text, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { CardTransactions } from "@features/flow-pay-card-transactions";
import { CardArtwork } from "../../CardArtwork/CardArtwork";
import { CardVisual } from "../../CardVisual/CardVisual";
import { FreezeAction } from "../../Freeze/Tile/FreezeAction";
import { MoreAction } from "../../More/Tile/MoreAction";
import { CardFlip } from "../../CardFlip/CardFlip";
import { useRevealViewModel } from "../../Reveal/useRevealViewModel";
import type { RevealViewModel } from "../../../types";
import { Reward } from "../../Reward/Reward";
import type { OverviewSceneProps } from "./types";

type OverviewActionsProps = Omit<
  OverviewSceneProps,
  "cardVisual" | "onTransactionPress" | "formatters"
> &
  Readonly<{
    reveal: RevealViewModel;
  }>;

function CardFace({ cardVisual }: Pick<OverviewSceneProps, "cardVisual">) {
  return cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />;
}

function OverviewActions({
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
  reveal,
}: OverviewActionsProps) {
  const { t } = useTranslation();
  const canHide = reveal.canHide;
  const viewLabel = canHide ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal");

  return (
    <Box lx={{ gap: "s8" }}>
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        <Box lx={{ flex: 1, minWidth: "s0" }}>
          <TileButton
            icon={canHide ? EyeCross : Eye}
            isFull
            disabled={reveal.status === "loading" || reveal.status === "flipping"}
            onPress={canHide ? reveal.onHide : reveal.onReveal}
            accessibilityLabel={viewLabel}
          >
            {viewLabel}
          </TileButton>
        </Box>
        <Box lx={{ flex: 1, minWidth: "s0" }}>
          <FreezeAction
            status={freezeViewModel.status}
            isActionDisabled={freezeViewModel.isActionDisabled}
            onOpenConfirm={onFreezePress}
          />
        </Box>
        <Box lx={{ flex: 1, minWidth: "s0" }}>
          {moreViewModel ? (
            <MoreAction moreLabel={moreViewModel.moreLabel} onMorePress={onMorePress} />
          ) : null}
        </Box>
      </Box>
      {reveal.status === "failed" ? (
        <Text typography="body2">{t("payTab.card.numbers.failed")}</Text>
      ) : null}
    </Box>
  );
}

export function OverviewScene({
  cardVisual,
  assets,
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
  onTransactionPress,
  onShowMore,
  formatters,
}: OverviewSceneProps) {
  const reveal = useRevealViewModel();

  return (
    <Box lx={{ gap: "s16" }} testID="card-details-overview">
      <CardFlip reveal={reveal} cardFace={<CardFace cardVisual={cardVisual} />} />

      <OverviewActions
        freezeViewModel={freezeViewModel}
        moreViewModel={moreViewModel}
        onFreezePress={onFreezePress}
        onMorePress={onMorePress}
        reveal={reveal}
      />

      {assets}
      <Reward formatters={formatters} />

      <CardTransactions
        formatters={formatters}
        onTransactionPress={item => onTransactionPress(item.transaction)}
        onShowMore={onShowMore}
      />
    </Box>
  );
}

import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CardArtwork } from "../../CardArtwork/CardArtwork";
import { CardVisual } from "../../CardVisual/CardVisual";
import { FreezeAction } from "../../Freeze/Tile/FreezeAction";
import { MoreAction } from "../../More/Tile/MoreAction";
import type { OverviewSceneProps } from "./types";

type OverviewActionsProps = Omit<OverviewSceneProps, "cardVisual">;

function OverviewActions({
  freezeViewModel,
  moreViewModel,
  onFreezePress,
  onMorePress,
}: OverviewActionsProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s8" }}>
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
  return (
    <Box lx={{ gap: "s16" }} testID="card-details-overview">
      {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}

      <OverviewActions
        freezeViewModel={freezeViewModel}
        moreViewModel={moreViewModel}
        onFreezePress={onFreezePress}
        onMorePress={onMorePress}
      />
    </Box>
  );
}

import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { Snow } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import { freezeCopy } from "../freezeCopy";
import { ConfirmSheet } from "../Confirm/ConfirmSheet";
import type { FreezeViewModel } from "../../../types";

export function Tile({ isActionDisabled, onOpenConfirm, ...confirm }: FreezeViewModel) {
  const { t } = useTranslation();

  return (
    <>
      <TileButton
        icon={Snow}
        onClick={onOpenConfirm}
        disabled={isActionDisabled}
        isFull
        data-testid="card-details-freeze-tile"
      >
        {t(freezeCopy(confirm.status).tile)}
      </TileButton>

      <ConfirmSheet {...confirm} />
    </>
  );
}

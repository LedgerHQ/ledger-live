import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Snow } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { freezeCopy } from "../freezeCopy";
import { ConfirmSheet } from "../Confirm/ConfirmSheet";
import type { TileProps } from "../../../types";

export function Tile({ isActionDisabled, onOpenConfirm, ...confirm }: TileProps) {
  const { t } = useTranslation();

  return (
    <>
      <TileButton icon={Snow} onPress={onOpenConfirm} disabled={isActionDisabled} isFull>
        {t(freezeCopy(confirm.status).tile)}
      </TileButton>

      <ConfirmSheet {...confirm} />
    </>
  );
}

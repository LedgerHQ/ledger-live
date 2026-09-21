import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Snow } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { freezeCopy } from "../freezeCopy";
import type { FreezeViewModel } from "../../../types";

type FreezeActionProps = Pick<FreezeViewModel, "status" | "isActionDisabled" | "onOpenConfirm">;

export function FreezeAction({ status, isActionDisabled, onOpenConfirm }: FreezeActionProps) {
  const { t } = useTranslation();

  return (
    <TileButton icon={Snow} onPress={onOpenConfirm} disabled={isActionDisabled} isFull>
      {t(freezeCopy(status).tile)}
    </TileButton>
  );
}

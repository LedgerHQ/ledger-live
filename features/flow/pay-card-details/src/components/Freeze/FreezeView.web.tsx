import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { Snow } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import { FreezeConfirmSheet } from "./FreezeConfirmSheet";
import type { FreezeViewProps } from "../../types";

export function FreezeView({
  isFrozen,
  isUpdating,
  isActionDisabled,
  isConfirmOpen,
  onOpenConfirm,
  onCloseConfirm,
  onConfirm,
}: FreezeViewProps) {
  const { t } = useTranslation();

  return (
    <>
      <TileButton icon={Snow} onClick={onOpenConfirm} disabled={isActionDisabled} isFull>
        {isFrozen ? t("payTab.card.unfreeze") : t("payTab.card.freeze")}
      </TileButton>

      <FreezeConfirmSheet
        isOpen={isConfirmOpen}
        isFrozen={isFrozen}
        isLoading={isUpdating}
        onConfirm={onConfirm}
        onClose={onCloseConfirm}
      />
    </>
  );
}

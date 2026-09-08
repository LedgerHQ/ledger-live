import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Snow } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { FreezeViewProps } from "../../types";

export function FreezeView({
  isFrozen,
  isBlocked,
  isStatusLoading,
  isFreezeLoading,
  isUnfreezeLoading,
  onFreeze,
  onUnfreeze,
}: FreezeViewProps) {
  const { t } = useTranslation();

  return (
    <TileButton
      icon={Snow}
      onPress={isFrozen ? onUnfreeze : onFreeze}
      disabled={isBlocked || isStatusLoading || isFreezeLoading || isUnfreezeLoading}
      isFull
    >
      {isFrozen ? t("payTab.card.unfreeze") : t("payTab.card.freeze")}
    </TileButton>
  );
}

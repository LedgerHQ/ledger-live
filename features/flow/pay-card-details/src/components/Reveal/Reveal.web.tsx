import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { Eye } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { RevealTileProps } from "../../types";

export function Reveal({ status, onReveal, onHide }: RevealTileProps) {
  const { t } = useTranslation();
  const canHide = status === "revealed";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TileButton
        icon={Eye}
        onClick={canHide ? onHide : onReveal}
        disabled={status === "loading" || status === "flipping"}
        isFull
      >
        {canHide ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal")}
      </TileButton>
      {status === "failed" ? (
        <p className="body-3 text-muted">{t("payTab.card.numbers.failed")}</p>
      ) : null}
    </div>
  );
}

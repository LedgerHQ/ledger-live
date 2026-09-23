import React from "react";
import { Spinner, TileButton } from "@ledgerhq/lumen-ui-react";
import { Eye } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { RevealTileProps } from "../../types";

export function Reveal({ status, canHide, onReveal, onHide }: RevealTileProps) {
  const { t } = useTranslation();
  const isLoading = status === "loading";
  const label = canHide ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal");

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TileButton
        icon={isLoading ? Spinner : Eye}
        onClick={canHide ? onHide : onReveal}
        disabled={isLoading}
        aria-label={label}
        isFull
      >
        {label}
      </TileButton>
      {status === "failed" ? (
        <p className="body-3 text-muted">{t("payTab.card.numbers.failed")}</p>
      ) : null}
    </div>
  );
}

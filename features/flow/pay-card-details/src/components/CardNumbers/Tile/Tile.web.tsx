import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { CreditCard } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { CardNumbersViewProps } from "../../../types";

export function CardNumbersTile({
  status,
  imageUrl,
  onReveal,
  onHide,
}: Pick<CardNumbersViewProps, "status" | "imageUrl" | "onReveal" | "onHide">) {
  const { t } = useTranslation();
  const isRevealed = status === "revealed" && Boolean(imageUrl);

  return (
    <div className="flex flex-col">
      <TileButton
        icon={CreditCard}
        onClick={isRevealed ? onHide : onReveal}
        disabled={status === "loading"}
        isFull
      >
        {isRevealed ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal")}
      </TileButton>
      {status === "failed" ? (
        <p className="body-3 text-muted">{t("payTab.card.numbers.failed")}</p>
      ) : null}
    </div>
  );
}

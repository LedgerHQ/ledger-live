import React from "react";
import { TileButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { CreditCard } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { isCardNumbersRevealed } from "../isCardNumbersRevealed";
import type { CardNumbersViewProps } from "../../../types";

type TileProps = Pick<CardNumbersViewProps, "status" | "imageUrl" | "onReveal" | "onHide">;

export function CardNumbersTile({ status, imageUrl, onReveal, onHide }: TileProps) {
  const { t } = useTranslation();
  const isRevealed = isCardNumbersRevealed(status, imageUrl);

  return (
    <>
      <TileButton
        icon={CreditCard}
        onPress={isRevealed ? onHide : onReveal}
        disabled={status === "loading"}
        isFull
      >
        {isRevealed ? t("payTab.card.numbers.hide") : t("payTab.card.numbers.reveal")}
      </TileButton>
      {status === "failed" ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {t("payTab.card.numbers.failed")}
        </Text>
      ) : null}
    </>
  );
}
